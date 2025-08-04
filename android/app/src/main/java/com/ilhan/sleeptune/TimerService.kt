package com.ilhan.sleeptune

import android.app.*
import android.content.Intent
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.facebook.react.ReactApplication
import com.facebook.react.modules.core.DeviceEventManagerModule

class TimerService : Service() {

    companion object {
        const val EXTRA_DURATION = "duration_ms"
        const val CHANNEL_ID     = "sleeptune_timer_channel"
        const val NOTIF_ID       = 1001
        const val EVENT_NAME     = "TimerFinished"
    }

    private var endTime: Long = 0L
    private val handler = Handler(Looper.getMainLooper())
    private lateinit var ticker: Runnable

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val duration = intent?.getLongExtra(EXTRA_DURATION, 0L) ?: 0L
        endTime = System.currentTimeMillis() + duration

        // İlk bildirimi gösterip servisi foreground'a al
        startForeground(NOTIF_ID, buildNotification(formatTime(duration / 1000)))

        // Her saniye bildirimi güncelleyen Runnable
        ticker = object : Runnable {
            override fun run() {
                val remaining = endTime - System.currentTimeMillis()
                if (remaining > 0) {
                    val sec = remaining / 1000
                    NotificationManagerCompat.from(this@TimerService)
                        .notify(NOTIF_ID, buildNotification(formatTime(sec)))
                    handler.postDelayed(this, 1000)
                } else {
                    // JS tarafına event yolla
                    sendTimerFinishedEvent()
                    // Son bildirimi gösterip servisi bitir
                    NotificationManagerCompat.from(this@TimerService)
                        .notify(NOTIF_ID, buildNotification("⏰ Zamanlayıcı bitti"))
                    stopForeground(true)
                    stopSelf()
                }
            }
        }
        handler.postDelayed(ticker, 1000)
        return START_NOT_STICKY
    }

    override fun onDestroy() {
        handler.removeCallbacks(ticker)
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun sendTimerFinishedEvent() {
        val reactContext = (application as ReactApplication)
            .reactNativeHost
            .reactInstanceManager
            .currentReactContext ?: return

        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(EVENT_NAME, null)
    }

    private fun buildNotification(content: String): Notification {
        val pending = PendingIntent.getActivity(
            this, 0,
            Intent(this, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
            },
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle("Sleeptune Zamanlayıcı")
            .setContentText(content)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(pending)
            .build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val chan = NotificationChannel(
                CHANNEL_ID,
                "Sleeptune Timer",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Zamanlayıcı durumu"
                setSound(null, null)
            }
            getSystemService(NotificationManager::class.java)
                .createNotificationChannel(chan)
        }
    }

    private fun formatTime(sec: Long): String =
        "%02d:%02d:%02d".format(sec/3600, (sec%3600)/60, sec%60)
}
