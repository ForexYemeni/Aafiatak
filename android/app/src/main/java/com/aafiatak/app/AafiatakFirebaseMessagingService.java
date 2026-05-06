package com.aafiatak.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import java.util.Map;

public class AafiatakFirebaseMessagingService extends FirebaseMessagingService {

    private static final String TAG = "AafiatakFCM";

    // Notification channel IDs
    public static final String CHANNEL_DEFAULT = "aafiatak_default";
    public static final String CHANNEL_EMERGENCY = "aafiatak_emergency";
    public static final String CHANNEL_ASSIGNMENT = "aafiatak_assignment";
    public static final String CHANNEL_CHAT = "aafiatak_chat";
    public static final String CHANNEL_PAYMENT = "aafiatak_payment";

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannels();
    }

    @Override
    public void onNewToken(@NonNull String token) {
        super.onNewToken(token);
        Log.d(TAG, "New FCM token: " + token);
        // Token will be sent to server by the web app via Capacitor
    }

    @Override
    public void onMessageReceived(@NonNull RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);
        Log.d(TAG, "Message received from: " + remoteMessage.getFrom());

        String title = "عافيتك";
        String body = "";
        String type = "system";
        String url = "/";

        // ─── Handle DATA-ONLY messages (our server sends data-only for Android) ───
        // Data payload contains all notification info
        Map<String, String> data = remoteMessage.getData();
        if (data != null && !data.isEmpty()) {
            if (data.containsKey("title")) title = data.get("title");
            if (data.containsKey("body")) body = data.get("body");
            if (data.containsKey("type")) type = data.get("type");
            if (data.containsKey("url")) url = data.get("url");
        }

        // Also check notification payload (for backward compat / web messages)
        RemoteMessage.Notification notification = remoteMessage.getNotification();
        if (notification != null) {
            // Notification payload exists — use data values if available, else notification values
            if (title.equals("عافيتك") && notification.getTitle() != null) {
                title = notification.getTitle();
            }
            if (body.isEmpty() && notification.getBody() != null) {
                body = notification.getBody();
            }
        }

        // Skip empty notifications
        if (body.isEmpty() && title.equals("عافيتك")) {
            Log.d(TAG, "Skipping empty notification");
            return;
        }

        // Ensure channels exist before showing notification
        createNotificationChannels();

        // Show notification with sound
        showNotification(title, body, type, url, data);
    }

    private void showNotification(String title, String body, String type, String url, Map<String, String> data) {
        // Get the appropriate channel
        String channelId = getChannelForType(type);
        int priority = getPriorityForType(type);

        // Create intent for notification click
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        if (!url.equals("/")) {
            intent.setData(Uri.parse("aafiatak://" + url));
        }
        if (data != null) {
            for (Map.Entry<String, String> entry : data.entrySet()) {
                intent.putExtra(entry.getKey(), entry.getValue());
            }
        }

        int requestCode = (int) (System.currentTimeMillis() % Integer.MAX_VALUE);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this, requestCode, intent,
            PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
        );

        // Build notification with sound
        Uri soundUri = getSoundForType(type);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, channelId)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(title)
            .setContentText(body)
            .setAutoCancel(true)
            .setSound(soundUri)
            .setPriority(priority)
            .setContentIntent(pendingIntent)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
            .setDefaults(Notification.DEFAULT_VIBRATE | Notification.DEFAULT_LIGHTS);

        // Emergency notifications are more persistent
        if ("emergency".equals(type)) {
            builder.setOngoing(false)
                   .setAutoCancel(true)
                   .setTimeoutAfter(30000);
        }

        // Show the notification
        int notificationId = (int) (System.currentTimeMillis() % Integer.MAX_VALUE);
        try {
            NotificationManagerCompat notificationManager = NotificationManagerCompat.from(this);
            notificationManager.notify(notificationId, builder.build());
            Log.d(TAG, "Notification shown [" + type + "]: " + title + " - " + body);
        } catch (SecurityException e) {
            Log.e(TAG, "No notification permission: " + e.getMessage());
        }
    }

    private String getChannelForType(String type) {
        switch (type) {
            case "emergency":
                return CHANNEL_EMERGENCY;
            case "assignment":
                return CHANNEL_ASSIGNMENT;
            case "chat":
                return CHANNEL_CHAT;
            case "payment":
                return CHANNEL_PAYMENT;
            default:
                return CHANNEL_DEFAULT;
        }
    }

    private int getPriorityForType(String type) {
        switch (type) {
            case "emergency":
                return NotificationCompat.PRIORITY_MAX;
            case "assignment":
                return NotificationCompat.PRIORITY_HIGH;
            case "chat":
                return NotificationCompat.PRIORITY_DEFAULT;
            case "payment":
                return NotificationCompat.PRIORITY_HIGH;
            default:
                return NotificationCompat.PRIORITY_DEFAULT;
        }
    }

    private Uri getSoundForType(String type) {
        // Use default notification sound for all types
        // Android will use the channel's sound setting
        return RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
    }

    /**
     * Create notification channels. This is called from both this service and
     * MainActivity to ensure channels exist BEFORE any notification arrives.
     */
    public static void createNotificationChannelsStatic(android.content.Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager manager = (NotificationManager) context.getSystemService(NotificationManager.class);
            if (manager == null) return;

            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                .build();

            Uri defaultSound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            Uri alarmSound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);

            // Default channel
            NotificationChannel defaultChannel = new NotificationChannel(
                CHANNEL_DEFAULT, "الإشعارات العامة",
                NotificationManager.IMPORTANCE_DEFAULT
            );
            defaultChannel.setDescription("إشعارات عامة من تطبيق عافيتك");
            defaultChannel.enableLights(true);
            defaultChannel.setLightColor(0x7C3AED);
            defaultChannel.enableVibration(true);
            defaultChannel.setSound(defaultSound, audioAttributes);
            manager.createNotificationChannel(defaultChannel);

            // Emergency channel - HIGH importance with alarm sound
            NotificationChannel emergencyChannel = new NotificationChannel(
                CHANNEL_EMERGENCY, "إشعارات الطوارئ",
                NotificationManager.IMPORTANCE_HIGH
            );
            emergencyChannel.setDescription("إشعارات الطوارئ العاجلة");
            emergencyChannel.enableLights(true);
            emergencyChannel.setLightColor(0xFF0000);
            emergencyChannel.enableVibration(true);
            emergencyChannel.setVibrationPattern(new long[]{0, 300, 100, 300, 100, 300});
            emergencyChannel.setSound(alarmSound, audioAttributes);
            manager.createNotificationChannel(emergencyChannel);

            // Assignment channel
            NotificationChannel assignmentChannel = new NotificationChannel(
                CHANNEL_ASSIGNMENT, "إشعارات التعيينات",
                NotificationManager.IMPORTANCE_HIGH
            );
            assignmentChannel.setDescription("إشعارات تعيين الممرضين");
            assignmentChannel.enableLights(true);
            assignmentChannel.setLightColor(0x3B82F6);
            assignmentChannel.enableVibration(true);
            assignmentChannel.setSound(defaultSound, audioAttributes);
            manager.createNotificationChannel(assignmentChannel);

            // Chat channel
            NotificationChannel chatChannel = new NotificationChannel(
                CHANNEL_CHAT, "إشعارات المحادثات",
                NotificationManager.IMPORTANCE_DEFAULT
            );
            chatChannel.setDescription("رسائل المحادثة");
            chatChannel.enableLights(true);
            chatChannel.setLightColor(0x10B981);
            chatChannel.enableVibration(true);
            chatChannel.setSound(defaultSound, audioAttributes);
            manager.createNotificationChannel(chatChannel);

            // Payment channel
            NotificationChannel paymentChannel = new NotificationChannel(
                CHANNEL_PAYMENT, "إشعارات المدفوعات",
                NotificationManager.IMPORTANCE_HIGH
            );
            paymentChannel.setDescription("إشعارات المدفوعات والتحويلات");
            paymentChannel.enableLights(true);
            paymentChannel.setLightColor(0xF59E0B);
            paymentChannel.enableVibration(true);
            paymentChannel.setSound(defaultSound, audioAttributes);
            manager.createNotificationChannel(paymentChannel);

            Log.d("AafiatakFCM", "Notification channels created successfully");
        }
    }

    private void createNotificationChannels() {
        createNotificationChannelsStatic(this);
    }
}
