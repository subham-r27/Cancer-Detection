from pathlib import Path
from typing import Optional

import numpy as np
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import tensorflow as tf


BASE_DIR = Path(__file__).resolve().parent.parent


app = FastAPI(title="Cancer Detection Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # you can restrict this to ["http://localhost:5173"] etc.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


_lung_model: Optional[tf.keras.Model] = None
_oral_model: Optional[tf.keras.Model] = None
_breast_model: Optional[tf.keras.Model] = None
_prostate_model: Optional[tf.keras.Model] = None


def dice_coef(y_true, y_pred, smooth=1):
    y_true_f = tf.cast(tf.reshape(y_true, [-1]), tf.float32)
    y_pred_f = tf.cast(tf.reshape(y_pred, [-1]), tf.float32)
    intersection = tf.reduce_sum(y_true_f * y_pred_f)
    return (2.0 * intersection + smooth) / (
        tf.reduce_sum(y_true_f) + tf.reduce_sum(y_pred_f) + smooth
    )


def iou_score(y_true, y_pred, smooth=1):
    y_true_f = tf.cast(tf.reshape(y_true, [-1]), tf.float32)
    y_pred_f = tf.cast(tf.reshape(y_pred, [-1]), tf.float32)
    intersection = tf.reduce_sum(y_true_f * y_pred_f)
    union = tf.reduce_sum(y_true_f) + tf.reduce_sum(y_pred_f) - intersection
    return (intersection + smooth) / (union + smooth)


def bce_dice_loss(y_true, y_pred):
    bce = tf.keras.losses.binary_crossentropy(y_true, y_pred)
    dice = 1.0 - dice_coef(y_true, y_pred)
    return bce + dice


def _load_lung_model() -> tf.keras.Model:
    global _lung_model
    if _lung_model is None:
        model_path = BASE_DIR / "lung-segmentation" / "trained-models" / "tumor_segmentation.keras"
        if not model_path.exists():
            raise FileNotFoundError(f"Lung segmentation model not found at {model_path}")
        _lung_model = tf.keras.models.load_model(
            model_path,
            custom_objects={
                "bce_dice_loss": bce_dice_loss,
                "dice_coef": dice_coef,
                "iou_score": iou_score,
            },
        )
    return _lung_model


def _load_oral_model() -> tf.keras.Model:
    global _oral_model
    if _oral_model is None:
        model_path = BASE_DIR / "models" / "oral_cancer_model.h5"
        if not model_path.exists():
            raise FileNotFoundError(f"Oral cancer model not found at {model_path}")
        _oral_model = tf.keras.models.load_model(model_path, compile=False)
    return _oral_model


def _load_breast_model() -> tf.keras.Model:
    global _breast_model
    if _breast_model is None:
        model_path = BASE_DIR / "breast_cancer_model" / "attention_unet_model.keras"
        if not model_path.exists():
            raise FileNotFoundError(f"Breast cancer model not found at {model_path}")
        _breast_model = tf.keras.models.load_model(model_path, compile=False)
    return _breast_model


def _load_prostate_model() -> tf.keras.Model:
    global _prostate_model
    if _prostate_model is None:
        # Expect a trained model saved via callbacks in prostate-analysis
        model_path = BASE_DIR / "prostate-analysis" / "best_prostate_model.h5"
        if not model_path.exists():
            raise FileNotFoundError(f"Prostate model not found at {model_path}")
        _prostate_model = tf.keras.models.load_model(model_path, compile=False)
    return _prostate_model


def _read_image_to_array(upload: UploadFile, target_size: Optional[tuple[int, int]] = None) -> np.ndarray:
    image = Image.open(upload.file).convert("RGB")
    if target_size is not None:
        image = image.resize(target_size)
    arr = np.array(image).astype("float32") / 255.0
    return np.expand_dims(arr, axis=0)


def _compute_tumor_stats_from_mask(mask: np.ndarray) -> dict:
    # mask is assumed to be float probabilities in [0,1] or already a binary mask
    if mask.ndim == 4:
        mask = mask[0]
    if mask.ndim == 3 and mask.shape[-1] == 1:
        mask = mask[..., 0]
    binary_mask = (mask > 0.5).astype(np.uint8)
    tumor_pixels = int(binary_mask.sum())
    total_pixels = int(binary_mask.size)
    tumor_percentage = (tumor_pixels / total_pixels) * 100 if total_pixels > 0 else 0.0

    # Approximate equivalent circular diameter in pixels, then treat 1 px ≈ 0.5 mm
    if tumor_pixels > 0:
        diameter_pixels = 2.0 * np.sqrt(tumor_pixels / np.pi)
        diameter_mm = float(diameter_pixels * 0.5)
    else:
        diameter_mm = 0.0

    # Simple coverage area heuristic in cm^2 (just for UI display)
    coverage_area = float(tumor_pixels / 1000.0)

    # Simple severity heuristic based on tumor percentage
    severity_score = float(min(100.0, tumor_percentage * 1.5))

    return {
        "tumor_pixels": tumor_pixels,
        "tumor_percentage": tumor_percentage,
        "diameter_mm": diameter_mm,
        "coverage_area_cm2": coverage_area,
        "severity_score": severity_score,
    }


def _severity_tag_from_score(score: float) -> str:
    if score >= 70:
        return "High"
    if score >= 40:
        return "Medium"
    return "Low"


def _stage_from_stats(organ: str, stats: dict) -> str:
    """
    Map model statistics to a coarse stage label: Normal / Benign / Malignant.
    This is a heuristic purely for UI purposes, not a clinical label.
    """
    organ = organ.lower()
    severity = float(stats.get("severity_score", 0.0))
    tumor_pct = float(stats.get("tumor_percentage", 0.0))

    # If there is essentially no tumor signal, treat as normal
    if tumor_pct < 0.5 and severity < 10:
        return "Normal"

    # Mild to moderate signal → benign
    if severity < 50:
        return "Benign"

    # Strong signal → malignant
    return "Malignant"


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/analyze")
async def analyze(
    organ: str = Form(..., description="Organ name: Lung, Prostate, Oral, Breast"),
    file: UploadFile = File(...),
) -> dict:
    organ_normalized = organ.strip().lower()

    try:
        if organ_normalized == "lung":
            model = _load_lung_model()
            # Assume lung model expects 512x512 RGB
            img = _read_image_to_array(file, target_size=(512, 512))
            pred = model.predict(img, verbose=0)
            stats = _compute_tumor_stats_from_mask(pred)

        elif organ_normalized == "oral":
            model = _load_oral_model()
            # Use model input shape if available
            h, w = model.input_shape[1], model.input_shape[2]
            img = _read_image_to_array(file, target_size=(w, h))
            pred = model.predict(img, verbose=0)
            stats = _compute_tumor_stats_from_mask(pred)

        elif organ_normalized == "breast":
            model = _load_breast_model()
            h, w = model.input_shape[1], model.input_shape[2]
            img = _read_image_to_array(file, target_size=(w, h))
            pred = model.predict(img, verbose=0)
            stats = _compute_tumor_stats_from_mask(pred)

        elif organ_normalized == "prostate":
            model = _load_prostate_model()
            # Prostate model is a classifier; we use probability as severity
            h, w = model.input_shape[1], model.input_shape[2]
            img = _read_image_to_array(file, target_size=(w, h))
            probs = model.predict(img, verbose=0)[0]
            if probs.size == 1:
                cancer_prob = float(probs[0])
            else:
                # assume index 1 is "cancer" class
                cancer_prob = float(probs[1])

            severity_score = cancer_prob * 100.0
            stats = {
                "tumor_pixels": 0,
                "tumor_percentage": 0.0,
                "diameter_mm": 0.0,
                "coverage_area_cm2": 0.0,
                "severity_score": severity_score,
            }
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported organ: {organ}")

    except HTTPException:
        raise
    except FileNotFoundError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:  # pragma: no cover - defensive
        raise HTTPException(status_code=500, detail=f"Model inference error: {e}")

    severity_tag = _severity_tag_from_score(stats["severity_score"])
    stage = _stage_from_stats(organ_normalized, stats)

    return {
        "organ": organ_normalized,
        "diameter_mm": stats["diameter_mm"],
        "tumor_pixels": stats["tumor_pixels"],
        "tumor_percentage": stats["tumor_percentage"],
        "coverage_area_cm2": stats["coverage_area_cm2"],
        "severity_score": stats["severity_score"],
        "severity_tag": severity_tag,
        "stage": stage,
    }


@app.post("/lung-segmentation")
async def lung_segmentation(file: UploadFile = File(...)) -> dict:
    return await analyze(organ="Lung", file=file)


@app.post("/oral-segmentation")
async def oral_segmentation(file: UploadFile = File(...)) -> dict:
    return await analyze(organ="Oral", file=file)


@app.post("/breast-cancer")
async def breast_cancer(file: UploadFile = File(...)) -> dict:
    return await analyze(organ="Breast", file=file)


@app.post("/prostate-analysis")
async def prostate_analysis(file: UploadFile = File(...)) -> dict:
    return await analyze(organ="Prostate", file=file)

