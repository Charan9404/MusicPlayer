import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import type { SaavnSong } from "../api/saavn";
import { usePlayerStore } from "../store/playerStore";

/**
 * Compatibility wrapper.
 *
 * Older iterations of the app used a separate AudioEngine (this file) to manage playback.
 * We now keep a *single* source of truth in `playerStore.ts` to avoid double-sound / 2x playback.
 *
 * If any screen still imports `audio`, it will safely delegate to the store.
 */
class AudioEngine {
  async initAudioMode() {
    // The store also sets audio mode, but doing it here keeps this wrapper usable independently.
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

  async loadAndPlay(song: SaavnSong) {
    if (!song) return;
    const st = usePlayerStore.getState();

    // Delegate to store playback (prevents overlapping sounds)
    await st.playSingle(song as any);
  }

  async play() {
    await usePlayerStore.getState().play();
  }

  async pause() {
    await usePlayerStore.getState().pause();
  }

  async seek(ms: number) {
    await usePlayerStore.getState().seekTo(ms);
  }

  async stopAndUnload() {
    // Stop audio but keep queue intact.
    await usePlayerStore.getState().stop();
  }
}

export const audio = new AudioEngine();
