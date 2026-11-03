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
