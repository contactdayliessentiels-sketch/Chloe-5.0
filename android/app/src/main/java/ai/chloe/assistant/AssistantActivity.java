package ai.chloe.assistant;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;

/**
 * Activité d'assistance Android native (ACTION_ASSIST & VOICE_COMMAND)
 * Permet à CHLOÉ AI d'être sélectionnée comme "Application d'assistance numérique" par défaut
 * sur Samsung Galaxy S24 (Android 14 / One UI 6.1).
 * 
 * Déclenchée lors de :
 * - L'appui prolongé sur le bouton latéral (Bouton d'alimentation configuré sur "Assistant numérique")
 * - Le balayage depuis le coin inférieur de l'écran
 * - L'appui long sur le bouton d'accueil
 */
public class AssistantActivity extends Activity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Relaye l'intention vers MainActivity en mode assistant compact avec micro prêt
        Intent launchIntent = new Intent(this, MainActivity.class);
        launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        launchIntent.putExtra("assistant_mode", "compact");
        launchIntent.putExtra("autolisten", true);
        launchIntent.putExtra("trigger_source", "side_button_assist");

        startActivity(launchIntent);
        finish();
    }
}
