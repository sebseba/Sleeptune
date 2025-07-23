package com.ilhan.sleeptune

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import androidx.core.content.ContextCompat
import androidx.localbroadcastmanager.content.LocalBroadcastManager
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class TimerModule(
    private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    private val finishedReceiver = object : BroadcastReceiver() {
        override fun onReceive(ctx: Context?, intent: Intent?) {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit("TimerFinished", null)
        }
    }

    init {
        LocalBroadcastManager.getInstance(reactContext)
            .registerReceiver(
                finishedReceiver,
                IntentFilter("com.ilhan.sleeptune.TIMER_FINISHED")
            )
    }

    @ReactMethod
    fun startTimer(durationMillis: Double) {
        val intent = Intent(reactContext, TimerService::class.java).apply {
            putExtra("duration", durationMillis.toLong())
        }
        val ctx = currentActivity ?: reactContext.applicationContext
        ContextCompat.startForegroundService(ctx, intent)
    }

    override fun getName(): String = "TimerModule"

    override fun onCatalystInstanceDestroy() {
        LocalBroadcastManager.getInstance(reactContext)
            .unregisterReceiver(finishedReceiver)
        super.onCatalystInstanceDestroy()
    }
}
