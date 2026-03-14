import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Stage1OrganSelection from "../components/stages/Stage1OrganSelection.jsx";
import Stage2Upload from "../components/stages/Stage2Upload.jsx";
import Stage3Detection from "../components/stages/Stage3Detection.jsx";
import Stage4Metrics from "../components/stages/Stage4Metrics.jsx";
import Stage5Severity from "../components/stages/Stage5Severity.jsx";
import Stage6MultiPanel from "../components/stages/Stage6MultiPanel.jsx";
import Stage7Interpretability from "../components/stages/Stage7Interpretability.jsx";
import Stage8Report from "../components/stages/Stage8Report.jsx";

const TOTAL_STAGES = 8;

const slideVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const CheckPoint = () => {
  const [currentStage, setCurrentStage] = useState(1);
  const [furthestStage, setFurthestStage] = useState(1);

  const [selectedOrgan, setSelectedOrgan] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [processing, setProcessing] = useState(false);

  const [detectedDiameter, setDetectedDiameter] = useState(0);
  const [pixelCount, setPixelCount] = useState(0);
  const [coverageArea, setCoverageArea] = useState(0);
  const [severityScore, setSeverityScore] = useState(0);
  const [diagnosisStage, setDiagnosisStage] = useState("—");
  const [severityTag, setSeverityTag] = useState("—");
  const [fetchError, setFetchError] = useState(null);

  const handleNext = () => {
    setCurrentStage((prev) => {
      const next = Math.min(prev + 1, TOTAL_STAGES);
      setFurthestStage((f) => Math.max(f, next));
      return next;
    });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setProcessing(true);
    setFetchError(null);

    const formData = new FormData();
    formData.append("organ", selectedOrgan || "Lung");
    formData.append("file", file, file.name);

    try {
      const response = await fetch("http://localhost:8000/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        let msg = "Request failed";
        if (data.detail) {
          msg = Array.isArray(data.detail) ? data.detail.map((d) => d.msg || d.loc?.join(".")).join(", ") : String(data.detail);
        } else {
          msg = response.statusText || msg;
        }
        setFetchError(msg);
        return;
      }

      setDetectedDiameter(typeof data.diameter_mm === "number" ? data.diameter_mm : 0);
      setPixelCount(typeof data.tumor_pixels === "number" ? data.tumor_pixels : 0);
      setCoverageArea(typeof data.coverage_area_cm2 === "number" ? data.coverage_area_cm2 : 0);
      setSeverityScore(typeof data.severity_score === "number" ? data.severity_score : 0);
      setDiagnosisStage(typeof data.stage === "string" ? data.stage : "—");
      setSeverityTag(typeof data.severity_tag === "string" ? data.severity_tag : "—");

      setFurthestStage((f) => Math.max(f, 3));
      setCurrentStage(3);
    } catch (err) {
      console.error("Error calling backend:", err);
      setFetchError(err.message || "Network error");
    } finally {
      setProcessing(false);
    }
  };

  const renderStageContent = () => {
    const commonProps = { onNext: handleNext };

    switch (currentStage) {
      case 1:
        return (
          <Stage1OrganSelection
            {...commonProps}
            onSelectOrgan={setSelectedOrgan}
          />
        );

      case 2:
        return (
          <Stage2Upload
            {...commonProps}
            uploadedFile={uploadedFile}
            processing={processing}
            onFileChange={handleFileChange}
            fetchError={fetchError}
          />
        );

      case 3:
        return (
          <Stage3Detection
            {...commonProps}
            diameter={detectedDiameter}
            organ={selectedOrgan}
          />
        );

      case 4:
        return (
          <Stage4Metrics
            {...commonProps}
            pixelCount={pixelCount}
            coverageArea={coverageArea}
          />
        );

      case 5:
        return (
          <Stage5Severity
            {...commonProps}
            score={severityScore}
            tag={severityTag}
            stage={diagnosisStage}
          />
        );

      case 6:
        return <Stage6MultiPanel {...commonProps} />;

      case 7:
        return <Stage7Interpretability {...commonProps} />;

      case 8:
        return (
          <Stage8Report
            {...commonProps}
            data={{
              selectedOrgan,
              detectedDiameter,
              pixelCount,
              coverageArea,
              severityScore,
              severityTag,
              stage: diagnosisStage,
            }}
          />
        );

      default:
        return <div className="text-center pt-40">Stage not found</div>;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col overflow-x-hidden">

      <div className="flex-1 relative">

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStage}
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.5 }}
            className="min-h-screen w-full"
          >
            {renderStageContent()}
          </motion.div>
        </AnimatePresence>

        {/* Progress Indicator */}
        <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none">
          <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 pointer-events-auto">

            {Array.from({ length: TOTAL_STAGES }).map((_, index) => {
              const stageNumber = index + 1;

              return (
                <div key={stageNumber} className="flex items-center">
                  {index !== 0 && (
                    <div className="h-px w-4 md:w-8 bg-white/20" />
                  )}

                  <button
                    onClick={() =>
                      stageNumber <= furthestStage &&
                      setCurrentStage(stageNumber)
                    }
                  >
                    <motion.div
                      className={`h-2 w-2 md:h-3 md:w-3 rounded-full
                      ${stageNumber < currentStage
                          ? "bg-[#23a559]"
                          : stageNumber === currentStage
                            ? "bg-white"
                            : "bg-white/20"
                        }`}
                      animate={
                        stageNumber === currentStage
                          ? {
                            scale: 1.4,
                            boxShadow:
                              "0 0 15px rgba(255,255,255,0.5)",
                          }
                          : { scale: 1 }
                      }
                    />
                  </button>
                </div>
              );
            })}

          </div>
        </div>

        {/* Navigation Buttons */}
        {currentStage > 1 && (
          <div className="fixed bottom-10 left-0 right-0 z-50 flex justify-between px-10 pointer-events-none">

            {/* BACK BUTTON */}
            <button
              onClick={() => setCurrentStage((p) => Math.max(1, p - 1))}
              className="group relative inline-block cursor-pointer pointer-events-auto"
            >
              <span className="absolute inset-0 translate-x-[5px] translate-y-[5px] bg-white/20 transition-transform group-hover:bg-[#ffffff]/40" />
              <span className="relative z-10 block border border-white/20 bg-black px-8 py-4 transition-transform group-hover:-translate-x-1 group-hover:-translate-y-1 group-hover:border-[#ffffff] active:translate-x-[3px] active:translate-y-[3px]">
                <div className="flex items-center gap-4">
                  <span className="text-white group-hover:text-[#ffffff] font-black tracking-[0.2em] text-sm uppercase">
                    ◀
                  </span>
                </div>
              </span>
            </button>

            {/* NEXT BUTTON */}
            {currentStage !== 2 && currentStage !== 8 && (
              <button
                onClick={handleNext}
                className="group relative inline-block cursor-pointer pointer-events-auto"
              >
                <span className="absolute inset-0 translate-x-[5px] translate-y-[5px] bg-white/20 transition-transform group-hover:bg-[#ffffff]/40" />
              <span className="relative z-10 block border border-white/20 bg-black px-8 py-4 transition-transform group-hover:-translate-x-1 group-hover:-translate-y-1 group-hover:border-[#ffffff] active:translate-x-[3px] active:translate-y-[3px]">
                  <div className="flex items-center gap-4">
                    <span className="text-white group-hover:text-[#ffffff] font-black tracking-[0.2em] text-sm uppercase">
                      ▶
                    </span>
                  </div>
                </span>
              </button>
            )}

          </div>
        )}

      </div>
    </div>
  );
};

export default CheckPoint;