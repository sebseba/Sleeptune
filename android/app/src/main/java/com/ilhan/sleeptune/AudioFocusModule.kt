package com.ilhan.sleeptune

import android.content.Intent
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

    @ReactMethod
    fun fadeOutVolume(promise: com.facebook.react.bridge.Promise) {
        try {
            AudioFocusManager.fadeOutVolume(reactContext) {
                promise.resolve(true)
            }
        } catch (e: Exception) {
            promise.reject("FADE_OUT_ERROR", "Sesi kademeli kısma başarısız", e)
        }
    }

    // BURASI EKLENDİ: Servisi başlatmak için
    @ReactMethod
    fun startTimerService(durationSeconds: Int) {
        val intent = Intent(reactContext, TimerService::class.java)
        intent.putExtra("duration", durationSeconds * 1000L)
        reactContext.startForegroundService(intent)
    }
}
