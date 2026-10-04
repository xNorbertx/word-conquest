package com.wordconquest.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.provider.Settings;
import androidx.core.app.NotificationManagerCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NotificationSettings")
public class NotificationSettingsPlugin extends Plugin {
    @PluginMethod
    public void status(PluginCall call) {
        JSObject result = new JSObject();
        result.put("enabled", NotificationManagerCompat.from(getContext()).areNotificationsEnabled());
        boolean blocked = false;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager manager = (NotificationManager) getContext().getSystemService(Context.NOTIFICATION_SERVICE);
            NotificationChannel channel = manager.getNotificationChannel("game_updates");
            blocked = channel != null && channel.getImportance() == NotificationManager.IMPORTANCE_NONE;
        }
        result.put("channelBlocked", blocked);
        call.resolve(result);
    }

    @PluginMethod
    public void open(PluginCall call) {
        try {
            Intent intent = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS);
            intent.putExtra(Settings.EXTRA_APP_PACKAGE, getContext().getPackageName());
            getActivity().startActivity(intent);
            call.resolve();
        } catch (Exception ignored) {
            call.reject("Android notification settings could not open.");
        }
    }
}
