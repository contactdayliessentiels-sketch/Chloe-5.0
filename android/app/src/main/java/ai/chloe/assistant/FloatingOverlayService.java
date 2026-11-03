package ai.chloe.assistant;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.graphics.PixelFormat;
import android.net.Uri;
import android.os.Build;
import android.os.IBinder;
import android.provider.Settings;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.ImageView;
import android.widget.TextView;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

/**
 * Service Android de fenêtre flottante au-dessus des autres applications (SYSTEM_ALERT_WINDOW).
 * Permet à Chloé de rester accessible sous forme de bulle interactive au-dessus de WhatsApp, Chrome, etc.
 * Contrôlé avec permission explicite Settings.canDrawOverlays(context).
 */
public class FloatingOverlayService extends Service {

    public static final String ACTION_START = "ai.chloe.assistant.action.START_FLOATING";
    public static final String ACTION_STOP = "ai.chloe.assistant.action.STOP_FLOATING";
    public static final String CHANNEL_ID = "chloe_floating_overlay_channel";
    public static final int NOTIFICATION_ID = 2402;

    private WindowManager windowManager;
    private View floatingView;
    private boolean isFloating = false;

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
                stopFloating();
                return START_NOT_STICKY;
            } else if (ACTION_START.equals(action)) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(this)) {
                    // La permission SYSTEM_ALERT_WINDOW n'est pas accordée
                    stopSelf();
                    return START_NOT_STICKY;
                }
                startFloating();
                return START_STICKY;
            }
        }
        return START_NOT_STICKY;
    }

    private void startFloating() {
        if (isFloating) return;

        // Notification de premier plan persistante
        Intent stopIntent = new Intent(this, FloatingOverlayService.class);
        stopIntent.setAction(ACTION_STOP);
        PendingIntent stopPendingIntent = PendingIntent.getService(
                this, 0, stopIntent, PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0));

        Intent openAppIntent = new Intent(this, MainActivity.class);
        openAppIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent openPendingIntent = PendingIntent.getActivity(
                this, 1, openAppIntent, PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0));

        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("CHLOÉ AI — Présence flottante active")
                .setContentText("Touchez la bulle pour dialoguer ou demander l'analyse d'écran.")
                .setSmallIcon(R.mipmap.ic_launcher)
                .setOngoing(true)
                .setContentIntent(openPendingIntent)
                .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Masquer la bulle", stopPendingIntent)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .build();

        startForeground(NOTIFICATION_ID, notification);

        // Construction de la vue flottante via WindowManager
        windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
        if (windowManager == null) return;

        int layoutType;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            layoutType = WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY;
        } else {
            layoutType = WindowManager.LayoutParams.TYPE_PHONE;
        }

        final WindowManager.LayoutParams params = new WindowManager.LayoutParams(
                WindowManager.LayoutParams.WRAP_CONTENT,
                WindowManager.LayoutParams.WRAP_CONTENT,
                layoutType,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
                PixelFormat.TRANSLUCENT
        );

        params.gravity = Gravity.TOP | Gravity.START;
        params.x = 60;
        params.y = 200;

        // Bulle interactive Chloé avec geste de déplacement (Drag & Drop)
        ImageView bubble = new ImageView(this);
        bubble.setImageResource(R.mipmap.ic_launcher_round);
        bubble.setBackgroundResource(android.R.drawable.dialog_holo_dark_frame);
        int size = (int) (64 * getResources().getDisplayMetrics().density);
        bubble.setLayoutParams(new WindowManager.LayoutParams(size, size));
        bubble.setPadding(8, 8, 8, 8);

        bubble.setOnTouchListener(new View.OnTouchListener() {
            private int initialX, initialY;
            private float initialTouchX, initialTouchY;
            private long touchStartTime;

            @Override
            public boolean onTouch(View v, MotionEvent event) {
                switch (event.getAction()) {
                    case MotionEvent.ACTION_DOWN:
                        touchStartTime = System.currentTimeMillis();
                        initialX = params.x;
                        initialY = params.y;
                        initialTouchX = event.getRawX();
                        initialTouchY = event.getRawY();
                        return true;

                    case MotionEvent.ACTION_MOVE:
                        params.x = initialX + (int) (event.getRawX() - initialTouchX);
                        params.y = initialY + (int) (event.getRawY() - initialTouchY);
                        if (floatingView != null && windowManager != null) {
                            windowManager.updateViewLayout(floatingView, params);
                        }
                        return true;

                    case MotionEvent.ACTION_UP:
                        long duration = System.currentTimeMillis() - touchStartTime;
                        float diffX = Math.abs(event.getRawX() - initialTouchX);
                        float diffY = Math.abs(event.getRawY() - initialTouchY);
                        // Clic simple (moins de 200ms et mouvement < 15px)
                        if (duration < 200 && diffX < 15 && diffY < 15) {
                            Intent openIntent = new Intent(FloatingOverlayService.this, MainActivity.class);
                            openIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
                            openIntent.putExtra("assistant_mode", "compact");
                            openIntent.putExtra("autolisten", true);
                            startActivity(openIntent);
                        }
                        return true;
                }
                return false;
            }
        });

        floatingView = bubble;
        try {
            windowManager.addView(floatingView, params);
            isFloating = true;
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void stopFloating() {
        if (!isFloating) return;
        isFloating = false;
        if (floatingView != null && windowManager != null) {
            try {
                windowManager.removeView(floatingView);
            } catch (Exception ignored) {}
            floatingView = null;
        }
        stopForeground(true);
        stopSelf();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "CHLOÉ AI — Fenêtre Flottante",
                    NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Maintient la présence de la bulle interactive CHLOÉ au-dessus des applications.");
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
        stopFloating();
        super.onDestroy();
    }
}
