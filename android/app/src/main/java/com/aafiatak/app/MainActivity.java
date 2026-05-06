package com.aafiatak.app;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.util.Log;
import android.webkit.WebView;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;

import java.util.ArrayList;
import java.util.List;

public class MainActivity extends BridgeActivity {

    private static final String TAG = "AafiatakMain";
    private WebAppInterface webAppInterface;
    private ActivityResultLauncher<String[]> permissionLauncher;

    @Override
    protected void onCreate(android.os.Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Create notification channels early — before any FCM message arrives.
        // This ensures channels exist so our custom sounds and importance levels work.
        AafiatakFirebaseMessagingService.createNotificationChannelsStatic(this);

        // Create and register the JavaScript interface
        webAppInterface = new WebAppInterface(this);

        // Register permission launcher
        permissionLauncher = registerForActivityResult(
            new ActivityResultContracts.RequestMultiplePermissions(),
            results -> {
                StringBuilder jsCallback = new StringBuilder("window.onAndroidPermissionResult && window.onAndroidPermissionResult({");
                boolean first = true;
                for (java.util.Map.Entry<String, Boolean> entry : results.entrySet()) {
                    if (!first) jsCallback.append(",");
                    jsCallback.append("'").append(entry.getKey()).append("':").append(entry.getValue());
                    first = false;
                }
                jsCallback.append("})");

                // Notify the web app about permission results
                runOnUiThread(() -> {
                    try {
                        if (getBridge() != null && getBridge().getWebView() != null) {
                            getBridge().getWebView().evaluateJavascript(jsCallback.toString(), null);
                        }
                    } catch (Exception e) {
                        Log.e(TAG, "Failed to notify web of permission result", e);
                    }
                });
            }
        );

        // Add JavaScript interface to the WebView
        // Use a delayed post to ensure the bridge WebView is fully initialized
        runOnUiThread(() -> {
            try {
                if (getBridge() != null && getBridge().getWebView() != null) {
                    getBridge().getWebView().addJavascriptInterface(webAppInterface, "AndroidApp");
                    Log.d(TAG, "JavaScript interface added successfully (onCreate delayed)");
                } else {
                    // Retry after a short delay if bridge not ready
                    getWindow().getDecorView().postDelayed(() -> {
                        try {
                            if (getBridge() != null && getBridge().getWebView() != null) {
                                getBridge().getWebView().addJavascriptInterface(webAppInterface, "AndroidApp");
                                Log.d(TAG, "JavaScript interface added successfully (onCreate retry)");
                            }
                        } catch (Exception e) {
                            Log.e(TAG, "Failed to add JS interface (retry)", e);
                        }
                    }, 2000);
                }
            } catch (Exception e) {
                Log.e(TAG, "Failed to add JavaScript interface", e);
            }
        });

        // Request essential permissions on first launch
        requestAllPermissions();
    }

    @Override
    public void onResume() {
        super.onResume();
        // Re-add JavaScript interface in case WebView was reloaded
        try {
            if (getBridge() != null && getBridge().getWebView() != null) {
                getBridge().getWebView().addJavascriptInterface(webAppInterface, "AndroidApp");
                Log.d(TAG, "JavaScript interface re-added (onResume)");
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to re-add JavaScript interface", e);
        }
    }

    private void requestAllPermissions() {
        List<String> permissionsNeeded = new ArrayList<>();

        // Notification permission (Android 13+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                    != PackageManager.PERMISSION_GRANTED) {
                permissionsNeeded.add(Manifest.permission.POST_NOTIFICATIONS);
            }
        }

        // Location permissions
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION)
                != PackageManager.PERMISSION_GRANTED) {
            permissionsNeeded.add(Manifest.permission.ACCESS_FINE_LOCATION);
        }
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION)
                != PackageManager.PERMISSION_GRANTED) {
            permissionsNeeded.add(Manifest.permission.ACCESS_COARSE_LOCATION);
        }

        if (!permissionsNeeded.isEmpty()) {
            Log.d(TAG, "Requesting permissions on startup: " + permissionsNeeded);
            permissionLauncher.launch(permissionsNeeded.toArray(new String[0]));
        }
    }

    /**
     * Called from WebAppInterface when web requests permissions
     */
    public void requestPermissionsFromWeb(String type) {
        List<String> permissionsNeeded = new ArrayList<>();

        switch (type) {
            case "notification":
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                            == PackageManager.PERMISSION_GRANTED) {
                        // Already granted - notify web
                        notifyPermissionGranted("notification");
                        return;
                    }
                    // Check if permanently denied (user checked "Don't ask again")
                    // shouldShowRequestPermissionRationale returns false ONLY when:
                    // 1. First time asking (should still ask!)
                    // 2. Permanently denied (should open settings)
                    // We track first-time vs permanently denied with SharedPreferences
                    if (hasRequestedBefore("notification") &&
                        !shouldShowRequestPermissionRationale(Manifest.permission.POST_NOTIFICATIONS)) {
                        // Was requested before AND rationale returns false = permanently denied
                        openAppSettings();
                        return;
                    }
                    // First time or rationale returns true - request permission
                    permissionsNeeded.add(Manifest.permission.POST_NOTIFICATIONS);
                    markRequestedBefore("notification");
                } else {
                    // Before Android 13, notifications are auto-granted
                    notifyPermissionGranted("notification");
                    return;
                }
                break;

            case "location":
                boolean fineGranted = ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION)
                        == PackageManager.PERMISSION_GRANTED;
                boolean coarseGranted = ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION)
                        == PackageManager.PERMISSION_GRANTED;

                if (fineGranted && coarseGranted) {
                    notifyPermissionGranted("location");
                    return;
                }

                if (!fineGranted) {
                    if (hasRequestedBefore("location") &&
                        !shouldShowRequestPermissionRationale(Manifest.permission.ACCESS_FINE_LOCATION)) {
                        openAppSettings();
                        return;
                    }
                    permissionsNeeded.add(Manifest.permission.ACCESS_FINE_LOCATION);
                    markRequestedBefore("location");
                }
                if (!coarseGranted) {
                    permissionsNeeded.add(Manifest.permission.ACCESS_COARSE_LOCATION);
                }
                break;

            case "all":
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                            != PackageManager.PERMISSION_GRANTED) {
                        permissionsNeeded.add(Manifest.permission.POST_NOTIFICATIONS);
                    }
                }
                if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION)
                        != PackageManager.PERMISSION_GRANTED) {
                    permissionsNeeded.add(Manifest.permission.ACCESS_FINE_LOCATION);
                }
                if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION)
                        != PackageManager.PERMISSION_GRANTED) {
                    permissionsNeeded.add(Manifest.permission.ACCESS_COARSE_LOCATION);
                }
                break;
        }

        if (!permissionsNeeded.isEmpty()) {
            Log.d(TAG, "Requesting permissions from web: " + permissionsNeeded);
            permissionLauncher.launch(permissionsNeeded.toArray(new String[0]));
        } else {
            Log.d(TAG, "All permissions already granted");
        }
    }

    /**
     * Check if we've requested this permission type before (tracked in SharedPreferences)
     */
    private boolean hasRequestedBefore(String permissionType) {
        return !getSharedPreferences("permissions", MODE_PRIVATE)
                .getBoolean(permissionType + "_first_time", true);
    }

    /**
     * Mark that we've requested this permission type before
     */
    private void markRequestedBefore(String permissionType) {
        getSharedPreferences("permissions", MODE_PRIVATE)
                .edit()
                .putBoolean(permissionType + "_first_time", false)
                .apply();
    }

    private void openAppSettings() {
        try {
            Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
            intent.setData(Uri.fromParts("package", getPackageName(), null));
            startActivity(intent);
        } catch (Exception e) {
            Log.e(TAG, "Failed to open app settings", e);
        }
    }

    private void notifyPermissionGranted(String type) {
        runOnUiThread(() -> {
            try {
                String js = String.format(
                    "window.onAndroidPermissionResult && window.onAndroidPermissionResult({type:'%s', granted:true})",
                    type
                );
                if (getBridge() != null && getBridge().getWebView() != null) {
                    getBridge().getWebView().evaluateJavascript(js, null);
                }
            } catch (Exception e) {
                Log.e(TAG, "Failed to notify permission granted", e);
            }
        });
    }
}
