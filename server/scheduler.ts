import { db } from './db.ts';

export class ServerScheduler {
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;

  public start(): void {
    if (this.timer) return;
    console.log('[CHLOÉ SCHEDULER] Démarrage du planificateur de tâches serveur en arrière-plan...');
    
    // Heartbeat every 60 seconds
    this.timer = setInterval(() => {
      this.tick();
    }, 60000);

    // Initial tick after 5 seconds
    setTimeout(() => this.tick(), 5000);
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private tick(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      const automations = db.getAutomations().filter(a => a.status === 'active');
      const now = new Date();

      for (const auto of automations) {
        // Simple scheduled task evaluation
        const lastRun = auto.lastRun ? new Date(auto.lastRun) : null;
        const minutesSinceLastRun = lastRun ? (now.getTime() - lastRun.getTime()) / 60000 : Infinity;

        // Run if not executed in the last 60 minutes
        if (minutesSinceLastRun >= 60) {
          if (auto.accessLevel === 'LEVEL_3_EXECUTION') {
            // Level 3 cannot be silently executed by scheduler; requires approval creation
            db.log(
              auto.userId,
              'PLANIFICATEUR',
              `Tâche planifiée ${auto.name} en attente de validation Niveau 3`,
              'LEVEL_3_EXECUTION',
              'pending',
              `Action: ${auto.action}`
            );
          } else {
            db.runAutomation(auto.id);
          }
        }
      }
    } catch (err: any) {
      console.error('[CHLOÉ SCHEDULER] Erreur lors du cycle de planification :', err);
    } finally {
      this.isRunning = false;
    }
  }
}

export const serverScheduler = new ServerScheduler();
