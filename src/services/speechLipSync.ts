/**
 * Speech and Lip-Sync Engine for CHLOÉ AI
 * Synchronizes real-time mouth visemes, speech amplitude, and facial expressions
 * with Web Speech API Synthesis and audio playback.
 */

export type VisemeType = 'rest' | 'smile' | 'A' | 'O' | 'E' | 'M' | 'F';

export interface VisemeState {
  viseme: VisemeType;
  openAmount: number; // 0 (closed) to 1 (wide open)
  widthSpread: number; // 0 (pursed) to 1 (wide smile/spread)
  jawDrop: number; // 0 to 1
  isSpeaking: boolean;
  amplitude: number;
}

type VisemeListener = (state: VisemeState) => void;

class SpeechLipSyncManager {
  private listeners: Set<VisemeListener> = new Set();
  private currentState: VisemeState = {
    viseme: 'rest',
    openAmount: 0,
    widthSpread: 0.5,
    jawDrop: 0,
    isSpeaking: false,
    amplitude: 0,
  };
  private animTimer: number | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private lastBoundaryTime: number = 0;

  public subscribe(listener: VisemeListener): () => void {
    this.listeners.add(listener);
    listener(this.currentState);
    return () => this.listeners.delete(listener);
  }

  public getState(): VisemeState {
    return this.currentState;
  }

  private notify() {
    this.listeners.forEach(fn => {
      try {
        fn(this.currentState);
      } catch (e) {
        console.error('Error in viseme listener', e);
      }
    });
  }

  /**
   * Starts lip-sync tracking for a given SpeechSynthesisUtterance
   */
  public attachUtterance(utterance: SpeechSynthesisUtterance, text: string) {
    this.currentUtterance = utterance;
    const words = text.split(/\s+/).filter(Boolean);
    let wordIndex = 0;

    utterance.addEventListener('start', () => {
      this.startSpeakingLoop();
    });

    utterance.addEventListener('boundary', (e: SpeechSynthesisEvent) => {
      this.lastBoundaryTime = performance.now();
      wordIndex++;
      // Analyze current phoneme/word context to modulate mouth shapes
      const word = words[wordIndex % words.length] || '';
      this.modulateFromWord(word);
    });

    utterance.addEventListener('end', () => {
      this.stopSpeaking();
    });

    utterance.addEventListener('error', () => {
      this.stopSpeaking();
    });
  }

  public startManualSpeaking() {
    this.startSpeakingLoop();
  }

  public stopSpeaking() {
    this.currentUtterance = null;
    if (this.animTimer) {
      clearInterval(this.animTimer);
      this.animTimer = null;
    }
    this.currentState = {
      viseme: 'rest',
      openAmount: 0,
      widthSpread: 0.5,
      jawDrop: 0,
      isSpeaking: false,
      amplitude: 0,
    };
    this.notify();
  }

  private modulateFromWord(word: string) {
    const lower = word.toLowerCase();
    let viseme: VisemeType = 'A';
    let open = 0.6;
    let spread = 0.5;

    if (/[ou|ô|eau|au|on]/i.test(lower)) {
      viseme = 'O';
      open = 0.75;
      spread = 0.2; // rounded lips
    } else if (/[é|è|ê|i|y|in]/i.test(lower)) {
      viseme = 'E';
      open = 0.45;
      spread = 0.9; // wide smile
    } else if (/[m|p|b]/i.test(lower)) {
      viseme = 'M';
      open = 0.05;
      spread = 0.5; // lips touching
    } else if (/[f|v]/i.test(lower)) {
      viseme = 'F';
      open = 0.2;
      spread = 0.6;
    } else {
      viseme = 'A';
      open = 0.8;
      spread = 0.6;
    }

    this.currentState = {
      viseme,
      openAmount: open,
      widthSpread: spread,
      jawDrop: open * 0.9,
      isSpeaking: true,
      amplitude: 0.7 + Math.random() * 0.3,
    };
    this.notify();
  }

  private startSpeakingLoop() {
    if (this.animTimer) clearInterval(this.animTimer);

    const visemes: VisemeType[] = ['A', 'E', 'O', 'rest', 'A', 'M', 'smile', 'E', 'O'];
    let step = 0;

    this.animTimer = window.setInterval(() => {
      step++;
      const now = performance.now();
      // If a boundary occurred very recently, keep that modulation momentarily
      if (now - this.lastBoundaryTime < 80) return;

      const currentViseme = visemes[step % visemes.length];
      let open = 0;
      let spread = 0.5;

      switch (currentViseme) {
        case 'A':
          open = 0.6 + Math.sin(step) * 0.25;
          spread = 0.6;
          break;
        case 'O':
          open = 0.7;
          spread = 0.2;
          break;
        case 'E':
          open = 0.4;
          spread = 0.85;
          break;
        case 'M':
          open = 0.08;
          spread = 0.5;
          break;
        case 'smile':
          open = 0.25;
          spread = 0.9;
          break;
        case 'rest':
        default:
          open = 0.1;
          spread = 0.5;
          break;
      }

      this.currentState = {
        viseme: currentViseme,
        openAmount: Math.max(0, Math.min(1, open)),
        widthSpread: Math.max(0, Math.min(1, spread)),
        jawDrop: Math.max(0, Math.min(1, open * 0.85)),
        isSpeaking: true,
        amplitude: 0.5 + Math.sin(step * 0.7) * 0.4,
      };
      this.notify();
    }, 75); // ~13Hz mouth flap updates for organic speech rhythm
  }
}

export const speechLipSync = new SpeechLipSyncManager();
