package ai.chloe.assistant;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.IBinder;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

/**
 * Service de premier plan Android pour la capture d'écran officielle (MediaProjection).
 * Requis par Android 14+ (Samsung Galaxy S24 / One UI 6.1) avec type foregroundServiceType="mediaProjection".
 * Affiche une notification persistante pendant la capture et permet son interruption contrôlée.
 */
public class ScreenCaptureService extends Service {

    public static final String ACTION_START = "ai.chloe.assistant.action.START_CAPTURE";
    public static final String ACTION_STOP = "ai.chloe.assistant.action.STOP_CAPTURE";
    public static final String CHANNEL_ID = "chloe_screen_capture_channel";
    public static final int NOTIFICATION_ID = 2401;

    private boolean isRunning = false;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            String action = intent.getAction();
            if (ACTION_STOP.equals(action)) {
                stopCapture();
                return START_NOT_STICKY;
            } else if (ACTION_START.equals(action)) {
                startCapture();
                return START_STICKY;
            }
        }
        return START_NOT_STICKY;
    }

    private void startCapture() {
        if (isRunning) return;

        Intent stopIntent = new Intent(this, ScreenCaptureService.class);
        stopIntent.setAction(ACTION_STOP);
        PendingIntent stopPendingIntent = PendingIntent.getService(
                this, 0, stopIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("CHLOÉ AI — Partage d'écran actif")
                .setContentText("Assistance visuelle en cours d'exécution sur votre Samsung Galaxy S24.")
                .setSmallIcon(R.mipmap.ic_launcher)
                .setOngoing(true)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Arrêter le partage", stopPendingIntent)
                .build();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION);
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }

        isRunning = true;
    }

    private void stopCapture() {
        if (!isRunning) return;
        isRunning = false;
        stopForeground(true);
        stopSelf();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "CHLOÉ AI — Capture et Partage d'écran",
                    NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Notification persistante de sécurité requise lors de l'utilisation de MediaProjection.");
            NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        stopCapture();
        super.onDestroy();
    }
}
