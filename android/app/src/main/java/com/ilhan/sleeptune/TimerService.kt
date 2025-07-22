// android/app/src/main/java/com/ilhan/sleeptune/TimerService.kt

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

class TimerService : Service() {
    private var countDownTimer: CountDownTimer? = null
    private val CHANNEL_ID = "timer_channel"
    private val NOTIF_ID = 1001

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val durationMillis = intent?.getLongExtra("duration", 0L) ?: 0L
        val notification = buildNotification("Zamanlayıcı başladı")

        startForeground(NOTIF_ID, notification)

        startTimer(durationMillis)
        return START_STICKY
    }


    private fun startTimer(durationMillis: Long) {
        countDownTimer?.cancel()
        countDownTimer = object : CountDownTimer(durationMillis, 1000) {
            override fun onTick(millisUntilFinished: Long) {
                val secondsLeft = millisUntilFinished / 1000
                Log.d("TimerService", "Kalan süre: $secondsLeft saniye")

                // Bildirimi her saniye güncelle
                val updatedNotif = buildNotification("Kalan süre: $secondsLeft s")
                (getSystemService(NotificationManager::class.java))
                    .notify(NOTIF_ID, updatedNotif)
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
                "Sleeptune Zamanlayıcı",
                NotificationManager.IMPORTANCE_HIGH  // <-- HIGH önem
            ).apply {
                description = "Arka planda çalışan zamanlayıcı"
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC  // <-- gözüksün kilit ekranında
            }
            getSystemService(NotificationManager::class.java)
                .createNotificationChannel(chan)
        }
    }

    private fun buildNotification(text: String): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Sleeptune Timer")
            .setContentText(text)
            .setSmallIcon(R.mipmap.ic_launcher)  // mipmap ikonu daha garantili
            .setPriority(NotificationCompat.PRIORITY_HIGH)              // <-- yüksek öncelik
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)       // <-- herkese açık
            .setOngoing(true)
            .build()
    }

    override fun onDestroy() {
        super.onDestroy()
        countDownTimer?.cancel()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
