package com.wordconquest.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NotificationSettingsPlugin.class);
        registerPlugin(AppearancePlugin.class);
        super.onCreate(savedInstanceState);
        AppearancePlugin.restore(this);
    }
    @Override
    public void onResume() {
        super.onResume();
        AppearancePlugin.restore(this);
    }
}
