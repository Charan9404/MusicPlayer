import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import type { SaavnSong } from "../api/saavn";
import { usePlayerStore } from "../store/playerStore";

class AudioEngine {
  private sound: Audio.Sound | null = null;
  private currentUrl: string | null = null;

  async initAudioMode() {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      interruptionModeIOS: InterruptionModeIOS.DuckOthers,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
  }

  private attachStatusUpdates() {
    if (!this.sound) return;

    this.sound.setOnPlaybackStatusUpdate((status) => {
      if (!status.isLoaded) return;

      usePlayerStore
        .getState()
        ._setPlaybackStatus(
          status.positionMillis ?? 0,
          status.durationMillis ?? 0,
          status.isPlaying ?? false
        );

      // auto-next / repeat-one handling
      if (status.didJustFinish) {
        const st = usePlayerStore.getState();
        const { repeat } = st;

        if (repeat === "one") {
          this.seek(0).then(() => this.play());
        } else {
          st.next();
        }
      }
    });
  }

  async loadAndPlay(song: SaavnSong) {
    if (!song?.audioUrl) return;

    // If same URL, just play
    if (this.currentUrl === song.audioUrl && this.sound) {
      await this.play();
      return;
    }

    await this.stopAndUnload();

    this.currentUrl = song.audioUrl;
    const { sound } = await Audio.Sound.createAsync(
      { uri: song.audioUrl },
      { shouldPlay: true, progressUpdateIntervalMillis: 500 }
    );

    this.sound = sound;
    this.attachStatusUpdates();
    await this.play();
  }

  async play() {
    if (!this.sound) return;
    const status = await this.sound.getStatusAsync();
    if (status.isLoaded && !status.isPlaying) {
      await this.sound.playAsync();
    }
  }

  async pause() {
    if (!this.sound) return;
    const status = await this.sound.getStatusAsync();
    if (status.isLoaded && status.isPlaying) {
      await this.sound.pauseAsync();
    }
  }

  async seek(ms: number) {
    if (!this.sound) return;
    const status = await this.sound.getStatusAsync();
    if (!status.isLoaded) return;
    await this.sound.setPositionAsync(Math.max(0, ms));
  }

  async stopAndUnload() {
    try {
      if (this.sound) {
        const status = await this.sound.getStatusAsync();
        if (status.isLoaded) {
          await this.sound.stopAsync();
        }
        await this.sound.unloadAsync();
      }
    } catch (e) {
      // ignore
    } finally {
      this.sound = null;
      this.currentUrl = null;
    }
  }
}

export const audio = new AudioEngine();
