package com.ilhan.sleeptune

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class PermissionModule(
  private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

  override fun getName() = "PermissionModule"

  companion object {
    const val CHANNEL_ID = "sleeptune_perm_channel"
    const val NOTIF_ID   = 2001
    const val ACTION_OPEN_SETTINGS = "com.ilhan.sleeptune.OPEN_SETTINGS"
  }

  private fun createChannel() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val chan = NotificationChannel(
        CHANNEL_ID,
        "Bildirim İzni",
        NotificationManager.IMPORTANCE_HIGH
      ).apply {
        description = "Bildirim izni vermeden uygulamayı kullanamazsınız."
      }
      reactContext
        .getSystemService(NotificationManager::class.java)
        .createNotificationChannel(chan)
    }
  }

  @ReactMethod
  fun showPermissionNotification() {
    createChannel()

    // Ayarlar aksiyonu için broadcast intent
    val intent = Intent(ACTION_OPEN_SETTINGS).apply {
      setPackage(reactContext.packageName)
    }
    val pi = PendingIntent.getBroadcast(
      reactContext, 0, intent,
      PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
    )

    val notif = NotificationCompat.Builder(reactContext, CHANNEL_ID)
      .setSmallIcon(R.mipmap.ic_launcher_round)
      .setContentTitle("Bildirim İzni Gerekli")
      .setContentText("Uygulamayı kullanmak için bildirim iznini etkinleştirin.")
      .setOngoing(true)                   // Kapatılamaz
      .addAction(0, "Ayarlar", pi)        // “Ayarlar” butonu
      .build()

    NotificationManagerCompat.from(reactContext)
      .notify(NOTIF_ID, notif)
  }

  @ReactMethod
  fun cancelPermissionNotification() {
    NotificationManagerCompat.from(reactContext)
      .cancel(NOTIF_ID)
  }
}
