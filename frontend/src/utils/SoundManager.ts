class SoundManager {
  private static instance: SoundManager;
  private lastPlayed: number = 0;
  private readonly THROTTLE_MS = 2000; // 2 seconds between sounds

  private constructor() {
    // We'll use AudioContext for a generated "pleasant" beep if no file is provided
    // to ensure it works without external assets.
  }

  public static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  public playNotification() {
    const now = Date.now();
    if (now - this.lastPlayed < this.THROTTLE_MS) {
      return; // Throttle
    }

    this.lastPlayed = now;
    this.playSound();
  }

  private playSound() {
    try {
      // Use a custom sound file located in the public folder
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.5; // Set a reasonable default volume
      audio.play().catch(error => {
        console.warn("Autoplay prevented or file not found:", error);
      });
    } catch (error) {
      console.error("Failed to play notification sound:", error);
    }
  }
}

export default SoundManager.getInstance();
