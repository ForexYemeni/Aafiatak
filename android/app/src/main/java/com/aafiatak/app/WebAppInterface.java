package com.aafiatak.app;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.util.Log;
import android.webkit.JavascriptInterface;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;

import java.util.ArrayList;
import java.util.List;

public class WebAppInterface {
    private static final String TAG = "AafiatakWebInterface";
    private MainActivity activity;

    public WebAppInterface(MainActivity activity) {
        this.activity = activity;
    }

    /**
     * Request notification permission - called from JavaScript
     */
    @JavascriptInterface
    public void requestNotificationPermission() {
        Log.d(TAG, "requestNotificationPermission called from web");
        activity.runOnUiThread(() -> {
            activity.requestPermissionsFromWeb("notification");
        });
    }

    /**
     * Request location permission - called from JavaScript
     */
    @JavascriptInterface
    public void requestLocationPermission() {
        Log.d(TAG, "requestLocationPermission called from web");
        activity.runOnUiThread(() -> {
            activity.requestPermissionsFromWeb("location");
        });
    }

    /**
     * Request all permissions - called from JavaScript
     */
    @JavascriptInterface
    public void requestAllPermissions() {
        Log.d(TAG, "requestAllPermissions called from web");
        activity.runOnUiThread(() -> {
            activity.requestPermissionsFromWeb("all");
        });
    }

    /**
     * Check if notification permission is granted
     */
    @JavascriptInterface
    public boolean isNotificationPermissionGranted() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            return ContextCompat.checkSelfPermission(activity, Manifest.permission.POST_NOTIFICATIONS)
                    == PackageManager.PERMISSION_GRANTED;
        }
        return true; // Before Android 13, notifications are always allowed
    }

    /**
     * Check if location permission is granted
     */
    @JavascriptInterface
    public boolean isLocationPermissionGranted() {
        return ContextCompat.checkSelfPermission(activity, Manifest.permission.ACCESS_FINE_LOCATION)
                == PackageManager.PERMISSION_GRANTED;
    }

    /**
     * Open app settings page so user can manually enable permissions
     */
    @JavascriptInterface
    public void openAppSettings() {
        Log.d(TAG, "openAppSettings called from web");
        activity.runOnUiThread(() -> {
            try {
                Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                intent.setData(Uri.fromParts("package", activity.getPackageName(), null));
                activity.startActivity(intent);
            } catch (Exception e) {
                Log.e(TAG, "Failed to open settings", e);
            }
        });
    }

    /**
     * Play notification sound natively
     */
    @JavascriptInterface
    public void playNotificationSound() {
        Log.d(TAG, "playNotificationSound called from web");
        activity.runOnUiThread(() -> {
            try {
                android.media.RingtoneManager.getRingtone(
                    activity,
                    android.media.RingtoneManager.getDefaultUri(android.media.RingtoneManager.TYPE_NOTIFICATION)
                ).play();
            } catch (Exception e) {
                Log.e(TAG, "Failed to play sound", e);
            }
        });
    }
}
