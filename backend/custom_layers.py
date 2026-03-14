"""
Custom Keras layers used by saved models (e.g. breast_model.keras).
Import and pass via custom_objects when calling load_model().
"""
import tensorflow as tf


class EncoderBlock(tf.keras.layers.Layer):
    """Encoder block: Conv -> Conv -> Dropout -> optional MaxPool. Used in U-Net–style models."""

    def __init__(self, filters, rate=0.1, pooling=True, **kwargs):
        super().__init__(**kwargs)
        self.filters = filters
        self.rate = rate
        self.pooling = pooling

    def get_config(self):
        config = super().get_config()
        config.update({
            "filters": self.filters,
            "rate": self.rate,
            "pooling": self.pooling,
        })
        return config

    def build(self, input_shape):
        self.conv1 = tf.keras.layers.Conv2D(
            self.filters, 3, padding="same", activation="relu"
        )
        self.conv2 = tf.keras.layers.Conv2D(
            self.filters, 3, padding="same", activation="relu"
        )
        self.dropout = tf.keras.layers.Dropout(self.rate)
        self.pool = (
            tf.keras.layers.MaxPooling2D(pool_size=2, strides=2)
            if self.pooling
            else None
        )
        super().build(input_shape)

    def call(self, inputs, training=None):
        x = self.conv1(inputs)
        x = self.conv2(x)
        x = self.dropout(x, training=training)
        if self.pool is not None:
            x = self.pool(x)
        return x


class DecoderBlock(tf.keras.layers.Layer):
    """Decoder block: UpSample -> Conv -> Conv. Used in U-Net–style models."""

    def __init__(self, filters, rate=0.1, **kwargs):
        super().__init__(**kwargs)
        self.filters = filters
        self.rate = rate

    def get_config(self):
        config = super().get_config()
        config.update({"filters": self.filters, "rate": self.rate})
        return config

    def build(self, input_shape):
        self.upsample = tf.keras.layers.UpSampling2D(size=2)
        self.conv1 = tf.keras.layers.Conv2D(
            self.filters, 3, padding="same", activation="relu"
        )
        self.conv2 = tf.keras.layers.Conv2D(
            self.filters, 3, padding="same", activation="relu"
        )
        super().build(input_shape)

    def call(self, inputs, training=None):
        x = self.upsample(inputs)
        x = self.conv1(x)
        x = self.conv2(x)
        return x


class AttentionGate(tf.keras.layers.Layer):
    """
    Attention gate: two inputs (gating signal g, skip connection x).
    config: filters (int), bn (bool). Used in Attention U-Net.
    """

    def __init__(self, filters, bn=True, **kwargs):
        super().__init__(**kwargs)
        self.filters = filters
        self.bn = bn

    def get_config(self):
        config = super().get_config()
        config.update({"filters": self.filters, "bn": self.bn})
        return config

    def build(self, input_shape):
        # input_shape: [g_shape, x_shape] e.g. [(None,16,16,512), (None,32,32,256)]
        self.w_g = tf.keras.layers.Conv2D(self.filters, 1, padding="same")
        self.w_x = tf.keras.layers.Conv2D(self.filters, 1, padding="same")
        if self.bn:
            self.bn_g = tf.keras.layers.BatchNormalization()
            self.bn_x = tf.keras.layers.BatchNormalization()
        self.psi = tf.keras.layers.Conv2D(1, 1, padding="same", activation="sigmoid")
        super().build(input_shape)

    def call(self, inputs, training=None):
        g, x = inputs
        w_g = self.w_g(g)
        w_x = self.w_x(x)
        if self.bn:
            w_g = self.bn_g(w_g, training=training)
            w_x = self.bn_x(w_x, training=training)
        # Upsample g to match x spatial size (e.g. 16->32)
        g_up = tf.keras.layers.UpSampling2D(size=2)(w_g)
        h, w = tf.shape(x)[1], tf.shape(x)[2]
        g_up = tf.image.resize(g_up, [h, w], method="bilinear")
        add = tf.keras.activations.relu(g_up + w_x)
        psi = self.psi(add)
        return x * psi
