package com.ilhan.sleeptune

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.core.content.ContextCompat

class TimerBootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            val prefs = context.getSharedPreferences("sleeptune_prefs", Context.MODE_PRIVATE)
            val endTime = prefs.getLong("timer_end", 0L)
            val now = System.currentTimeMillis()
            if (endTime > now) {
                val duration = endTime - now
                val serviceIntent = Intent(context, TimerService::class.java).apply {
                    putExtra("duration", duration)
                }
                ContextCompat.startForegroundService(context, serviceIntent)
            }
        }
    }
}