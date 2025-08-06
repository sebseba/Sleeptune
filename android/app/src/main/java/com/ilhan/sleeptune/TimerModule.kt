package com.ilhan.sleeptune

import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.content.ContextCompat
import androidx.localbroadcastmanager.content.LocalBroadcastManager
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class TimerModule(
    private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "TimerModule"

    @ReactMethod
    fun startTimer(durationMillis: Double) {
        // Bitirme zamanını kaydet
        val prefs = reactContext
            .getSharedPreferences("sleeptune_prefs", Context.MODE_PRIVATE)
        prefs.edit()
            .putLong("timer_end", System.currentTimeMillis() + durationMillis.toLong())
            .apply()

        // Servisi başlat
        val intent = Intent(reactContext, TimerService::class.java).apply {
            putExtra(TimerService.EXTRA_DURATION, durationMillis.toLong())
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            ContextCompat.startForegroundService(reactContext, intent)
        } else {
            reactContext.startService(intent)
        }
    }

    @ReactMethod
    fun stopTimer() {
        // Servisi durdur
        val intent = Intent(reactContext, TimerService::class.java)
        reactContext.stopService(intent)

        // İsteğe bağlı: kaydedilmiş bitiş zamanını sil
        val prefs = reactContext
            .getSharedPreferences("sleeptune_prefs", Context.MODE_PRIVATE)
        prefs.edit().remove("timer_end").apply()

        // LocalBroadcastManager ile JS'e de haber verebilirsin, örn. "TimerStopped" event'ı
        LocalBroadcastManager.getInstance(reactContext)
            .sendBroadcast(Intent("com.ilhan.sleeptune.TIMER_STOPPED"))
    }
}
