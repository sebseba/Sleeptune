package com.ilhan.sleeptune

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Settings

class PermissionActionReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action == PermissionModule.ACTION_OPEN_SETTINGS) {
      // Bildirim ayar sayfasını aç
      val i = Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).apply {
        putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName)
        flags = Intent.FLAG_ACTIVITY_NEW_TASK
      }
      context.startActivity(i)
    }
  }
}
