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
import androidx.localbroadcastmanager.content.LocalBroadcastManager

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
                val updated = buildNotification("Kalan süre: $secondsLeft s")
                getSystemService(NotificationManager::class.java)
                    .notify(NOTIF_ID, updated)
            }
            override fun onFinish() {
                Log.d("TimerService", "Zamanlayıcı tamamlandı")
                AudioFocusManager.fadeOutVolume(this@TimerService) {
                    DeviceAdminHelper.lockDeviceIfPermitted(this@TimerService)
                    // JS tarafına bitti bilgisini yayınla
                    LocalBroadcastManager.getInstance(this@TimerService)
                        .sendBroadcast(Intent("com.ilhan.sleeptune.TIMER_FINISHED"))
                    stopSelf()
                }
            }
        }.start()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val chan = NotificationChannel(
                CHANNEL_ID,
                "Sleeptune Zamanlayıcı",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Arka planda çalışan zamanlayıcı"
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            }
            getSystemService(NotificationManager::class.java)
                .createNotificationChannel(chan)
        }
    }

    private fun buildNotification(text: String): Notification =
        NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Sleeptune Timer")
            .setContentText(text)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setOngoing(true)
            .build()

    override fun onDestroy() {
        countDownTimer?.cancel()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
