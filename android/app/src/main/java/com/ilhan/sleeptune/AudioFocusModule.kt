package com.ilhan.sleeptune

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class AudioFocusModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "AudioFocusModule"

    @ReactMethod
    fun requestAudioFocus() {
        AudioFocusManager.requestAudioFocus(reactContext)
    }
}
