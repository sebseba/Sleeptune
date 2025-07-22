package com.ilhan.sleeptune

import android.app.Service
import android.content.Intent
import android.os.IBinder
import android.os.CountDownTimer
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import android.content.pm.ServiceInfo
import com.ilhan.sleeptune.AudioFocusManager
import com.ilhan.sleeptune.DeviceAdminHelper

class TimerService : Service() {

    private var countDownTimer: CountDownTimer? = null
    private val CHANNEL_ID = "timer_channel"

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d("TimerService", "Service başlatıldı")

        val durationMillis = intent?.getLongExtra("duration", 0L) ?: 0L

        createNotificationChannel()

        val notification = buildNotification("Zamanlayıcı başlatıldı")

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            // API 29+ için 3. parametre: NONE veya ihtiyacınıza göre başka tür
            startForeground(
                1,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_NONE
            )
        } else {
            startForeground(1, notification)
        }

        startTimer(durationMillis)
        return START_NOT_STICKY
    }

    private fun startTimer(durationMillis: Long) {
        countDownTimer?.cancel()
        countDownTimer = object : CountDownTimer(durationMillis, 1000) {
            override fun onTick(millisUntilFinished: Long) {
                Log.d("TimerService", "Kalan süre: ${millisUntilFinished / 1000} saniye")
            }
            override fun onFinish() {
                Log.d("TimerService", "Zamanlayıcı tamamlandı")
                AudioFocusManager.fadeOutVolume(this@TimerService) {
                    DeviceAdminHelper.lockDeviceIfPermitted(this@TimerService)
                }
                stopSelf()
            }
        }.start()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val chan = NotificationChannel(
                CHANNEL_ID,
                "Zamanlayıcı Servisi",
                NotificationManager.IMPORTANCE_LOW
            )
            getSystemService(NotificationManager::class.java).createNotificationChannel(chan)
        }
    }

    private fun buildNotification(content: String): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Sleeptune")
            .setContentText(content)
            .setSmallIcon(R.drawable.ic_launcher_foreground)
            .setOngoing(true)
            .build()
    }

    override fun onDestroy() {
        super.onDestroy()
        countDownTimer?.cancel()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
