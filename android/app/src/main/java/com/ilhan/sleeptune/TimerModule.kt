package com.ilhan.sleeptune

import android.content.Intent
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class TimerModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "TimerModule"

    @ReactMethod
    fun startTimer(durationMillis: Double) {
        val intent = Intent(reactContext, TimerService::class.java).apply {
            putExtra("duration", durationMillis.toLong())
        }
        val ctx = currentActivity ?: reactContext.applicationContext
        ContextCompat.startForegroundService(ctx, intent)
    }
}
