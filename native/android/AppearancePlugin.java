package com.wordconquest.app;

import android.content.Context;
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.view.View;
import android.view.Window;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "Appearance")
public class AppearancePlugin extends Plugin {
    private static final String PREFERENCES = "word-conquest-appearance";

    static void restore(BridgeActivity activity) {
        boolean dark = activity.getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE).getBoolean("dark", false);
        apply(activity, dark);
    }

    @SuppressWarnings("deprecation")
    private static void apply(BridgeActivity activity, boolean dark) {
        int colour = Color.parseColor(dark ? "#191d18" : "#f6f3eb");
        Window window = activity.getWindow();
        window.setBackgroundDrawable(new ColorDrawable(colour));
        window.setStatusBarColor(colour);
        window.setNavigationBarColor(colour);
        View content = activity.findViewById(android.R.id.content);
        if (content != null) content.setBackgroundColor(colour);
        if (activity.getBridge() != null) {
            View webView = activity.getBridge().getWebView();
            webView.setBackgroundColor(colour);
            // Capacitor uses margins for Android 15+ system bars. Paint behind them.
            if (webView.getParent() instanceof View) ((View) webView.getParent()).setBackgroundColor(colour);
        }
        WindowInsetsControllerCompat bars = WindowCompat.getInsetsController(window, window.getDecorView());
        bars.setAppearanceLightStatusBars(!dark);
        bars.setAppearanceLightNavigationBars(!dark);
    }

    @PluginMethod
    public void set(PluginCall call) {
        Boolean dark = call.getBoolean("dark");
        if (dark == null) { call.reject("A dark-mode preference is required."); return; }
        getActivity().runOnUiThread(() -> {
            getContext().getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE).edit().putBoolean("dark", dark).apply();
            apply((BridgeActivity) getActivity(), dark);
            call.resolve();
        });
    }
}
