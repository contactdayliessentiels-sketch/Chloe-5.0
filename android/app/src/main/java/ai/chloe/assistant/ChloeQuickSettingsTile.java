package ai.chloe.assistant;

import android.content.Intent;
import android.os.Build;
import android.service.quicksettings.Tile;
import android.service.quicksettings.TileService;
import androidx.annotation.RequiresApi;

/**
 * Tuile de paramètres rapides Android (Quick Settings Tile)
 * Permet d'invoquer instantanément CHLOÉ AI depuis le panneau de notifications Samsung One UI.
 */
@RequiresApi(api = Build.VERSION_CODES.N)
public class ChloeQuickSettingsTile extends TileService {

    @Override
    public void onStartListening() {
        super.onStartListening();
        Tile tile = getQsTile();
        if (tile != null) {
            tile.setState(Tile.STATE_ACTIVE);
            tile.setLabel("CHLOÉ AI");
            tile.setContentDescription("Ouvrir l'assistante CHLOÉ AI");
            tile.updateTile();
        }
    }

    @Override
    public void onClick() {
        super.onClick();
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        intent.putExtra("assistant_mode", "compact");
        intent.putExtra("autolisten", true);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            startActivityAndCollapse(PendingIntentCompatHelper.createLaunchPendingIntent(this, intent));
        } else {
            startActivityAndCollapse(intent);
        }
    }
}
