package ai.chloe.assistant;

import android.app.PictureInPictureParams;
import android.os.Build;
import android.os.Bundle;
import android.util.Rational;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        handleAssistantIntent(getIntent());
    }

    @Override
    protected void onNewIntent(android.content.Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleAssistantIntent(intent);
    }

    private void handleAssistantIntent(android.content.Intent intent) {
        if (intent == null) return;
        boolean isAssist = android.content.Intent.ACTION_ASSIST.equals(intent.getAction()) ||
                "compact".equals(intent.getStringExtra("assistant_mode"));
        boolean autolisten = intent.getBooleanExtra("autolisten", false) || isAssist;

        if (isAssist && getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().post(() -> {
                getBridge().getWebView().evaluateJavascript(
                        "window.dispatchEvent(new CustomEvent('chloe:trigger_assist', { detail: { autolisten: " + autolisten + " } }));",
                        null
                );
            });
        }
    }

    /**
     * Démarre le service de bulle flottante au-dessus des applications
     */
    public void startFloatingOverlayService() {
        android.content.Intent serviceIntent = new android.content.Intent(this, FloatingOverlayService.class);
        serviceIntent.setAction(FloatingOverlayService.ACTION_START);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent);
        } else {
            startService(serviceIntent);
        }
    }

    /**
     * Arrête le service de bulle flottante
     */
    public void stopFloatingOverlayService() {
        android.content.Intent serviceIntent = new android.content.Intent(this, FloatingOverlayService.class);
        serviceIntent.setAction(FloatingOverlayService.ACTION_STOP);
        startService(serviceIntent);
    }

    /**
     * Entre en mode Picture-in-Picture pour laisser CHLOÉ accessible en fenêtre flottante
     * sur Samsung Galaxy S24 pendant que l'utilisateur navigue dans d'autres applications.
     */
    public void enterFloatingCompanionMode() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            PictureInPictureParams params = new PictureInPictureParams.Builder()
                    .setAspectRatio(new Rational(9, 16))
                    .build();
            enterPictureInPictureMode(params);
        }
    }
}
