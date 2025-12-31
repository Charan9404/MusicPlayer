// src/store/playerStore.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/** Repeat modes required by assignment */
export type RepeatMode = "off" | "one" | "all";

/** Song shape used across screens (we keep it flexible) */
export type Song = {
  id: string;
  name: string;
  artists: string;
  imageUrl: string;

  // possible audio URL fields from JioSaavn wrappers
  downloadUrl?: string | { url?: string } | Array<{ url?: string }>;
  url?: string;
  audioUrl?: string;
  mediaUrl?: string;

  // allow any other props
  [key: string]: any;
};

type PlayerState = {
  // persisted
  queue: Song[];
  currentIndex: number;
  shuffleOn: boolean;
  repeatMode: RepeatMode;

  // runtime (NOT persisted)
  isPlaying: boolean;
  positionMs: number;
  durationMs: number;
  isLoading: boolean;
  lastError: string | null;

  // runtime refs
  sound: Audio.Sound | null;
  _audioModeReady: boolean;

  // actions
  setQueueAndPlay: (songs: Song[], startIndex?: number) => Promise<void>;
  playSingle: (song: Song) => Promise<void>;

  togglePlayPause: () => Promise<void>;
  play: () => Promise<void>;
  pause: () => Promise<void>;

  next: () => Promise<void>;
  prev: () => Promise<void>;

  seekTo: (ms: number) => Promise<void>;

  removeAt: (index: number) => void;
  moveUp: (index: number) => void;
  moveDown: (index: number) => void;
  clearQueue: () => Promise<void>;

  toggleShuffle: () => void;
  cycleRepeat: () => void;

  // optional helper for UI/debug
  getCurrentSong: () => Song | null;
};

function getPlayableUrl(song: Song): string | null {
  // common keys
  if (typeof song?.audioUrl === "string") return song.audioUrl;
  if (typeof song?.mediaUrl === "string") return song.mediaUrl;
  if (typeof song?.url === "string") return song.url;

  const d = song?.downloadUrl;

  // downloadUrl: string
  if (typeof d === "string") return d;

  // downloadUrl: { url: string }
  if (d && typeof d === "object" && !Array.isArray(d) && typeof d.url === "string") {
    return d.url;
  }

  // downloadUrl: [{ url: string }, ...] -> pick best/last
  if (Array.isArray(d)) {
    const candidates = d.map((x) => x?.url).filter(Boolean) as string[];
    if (candidates.length) return candidates[candidates.length - 1];
  }

  // try a few other possible keys from wrappers
  let maybe: string | undefined;
  
  if (Array.isArray(d)) {
    // try first and last elements of array
    maybe = d[0]?.url ?? d[d.length - 1]?.url;
  }
  
  if (!maybe) {
    maybe = song?.songUrl ?? song?.streamUrl;
  }

  return typeof maybe === "string" ? maybe : null;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

async function ensureAudioModeOnce(get: () => PlayerState, set: (p: Partial<PlayerState>) => void) {
  if (get()._audioModeReady) return;
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      interruptionModeIOS: 1, // DO_NOT_MIX
      shouldDuckAndroid: true,
      interruptionModeAndroid: 1, // DO_NOT_MIX
      playThroughEarpieceAndroid: false,
    });
    set({ _audioModeReady: true });
  } catch (e: any) {
    // not fatal, but helps debug
    set({ lastError: e?.message ?? "Failed to set audio mode" });
  }
}

async function unloadSound(get: () => PlayerState, set: (p: Partial<PlayerState>) => void) {
  const s = get().sound;
  if (s) {
    try {
      await s.unloadAsync();
    } catch {
      // ignore
    }
  }
  set({ sound: null, isPlaying: false, positionMs: 0, durationMs: 0 });
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      // ---------------- persisted ----------------
      queue: [],
      currentIndex: 0,
      shuffleOn: false,
      repeatMode: "off",

      // ---------------- runtime ----------------
      isPlaying: false,
      positionMs: 0,
      durationMs: 0,
      isLoading: false,
      lastError: null,

      sound: null,
      _audioModeReady: false,

      // ---------------- helpers ----------------
      getCurrentSong: () => {
        const q = get().queue;
        const i = get().currentIndex;
        return q?.[i] ?? null;
      },

      // ---------------- core playback ----------------
      setQueueAndPlay: async (songs, startIndex = 0) => {
        const idx = clamp(startIndex ?? 0, 0, Math.max(0, songs.length - 1));
        set({ queue: songs, currentIndex: idx });
        await get().playSingle(songs[idx]);
      },

      playSingle: async (song) => {
        if (!song) return;

        set({ isLoading: true, lastError: null });

        await ensureAudioModeOnce(get, set);
        await unloadSound(get, set);

        const url = getPlayableUrl(song);
        if (!url) {
          set({ isLoading: false, lastError: "No playable URL found for this track." });
          return;
        }

        try {
          const sound = new Audio.Sound();

          sound.setOnPlaybackStatusUpdate((status) => {
            if (!status || !("isLoaded" in status) || !status.isLoaded) return;

            // update progress
            set({
              isPlaying: status.isPlaying,
              positionMs: status.positionMillis ?? 0,
              durationMs: status.durationMillis ?? 0,
            });

            // handle finish
            if (status.didJustFinish) {
              const { repeatMode } = get();

              if (repeatMode === "one") {
                // replay same
                get().seekTo(0).then(() => get().play()).catch(() => {});
                return;
              }

              // off or all -> go next, but if end and repeatMode=off stop
              const q = get().queue;
              const i = get().currentIndex;

              const atEnd = i >= q.length - 1;
              if (atEnd && repeatMode === "off") {
                // stop at end
                get().pause().catch(() => {});
                return;
              }

              // repeat all loops
              get().next().catch(() => {});
            }
          });

          const loopOne = get().repeatMode === "one";
          await sound.loadAsync(
            { uri: url },
            { shouldPlay: true, isLooping: loopOne },
            false
          );


          set({
            sound,
            isLoading: false,
            isPlaying: true,
          });
        } catch (e: any) {
          set({
            isLoading: false,
            lastError: e?.message ?? "Failed to start playback",
          });
        }
      },

      play: async () => {
        const s = get().sound;
        if (!s) {
          // if no sound loaded, try to start current
          const cur = get().getCurrentSong();
          if (cur) return get().playSingle(cur);
          return;
        }
        try {
          await s.playAsync();
          set({ isPlaying: true });
        } catch (e: any) {
          set({ lastError: e?.message ?? "Play failed" });
        }
      },

      pause: async () => {
        const s = get().sound;
        if (!s) return;
        try {
          await s.pauseAsync();
          set({ isPlaying: false });
        } catch (e: any) {
          set({ lastError: e?.message ?? "Pause failed" });
        }
      },

      togglePlayPause: async () => {
        const s = get().sound;
        if (!s) {
          // start current if nothing loaded
          const cur = get().getCurrentSong();
          if (cur) return get().playSingle(cur);
          return;
        }
        if (get().isPlaying) return get().pause();
        return get().play();
      },

      next: async () => {
        const { queue, currentIndex, shuffleOn, repeatMode } = get();
        if (!queue.length) return;

        let nextIndex = currentIndex;

        if (shuffleOn && queue.length > 1) {
          // pick random different index
          let tries = 0;
          while (tries < 10) {
            const r = Math.floor(Math.random() * queue.length);
            if (r !== currentIndex) {
              nextIndex = r;
              break;
            }
            tries++;
          }
        } else {
          nextIndex = currentIndex + 1;
          if (nextIndex >= queue.length) {
            nextIndex = repeatMode === "all" ? 0 : queue.length - 1;
          }
        }

        set({ currentIndex: nextIndex });
        await get().playSingle(queue[nextIndex]);
      },

      prev: async () => {
        const { queue, currentIndex } = get();
        if (!queue.length) return;

        // Spotify-like: if you've progressed > 3 seconds, restart track
        if (get().positionMs > 3000) {
          return get().seekTo(0);
        }

        let prevIndex = currentIndex - 1;
        if (prevIndex < 0) prevIndex = 0;

        set({ currentIndex: prevIndex });
        await get().playSingle(queue[prevIndex]);
      },

      seekTo: async (ms: number) => {
        const s = get().sound;
        if (!s) return;
        try {
          const dur = get().durationMs || 0;
          const target = clamp(Math.floor(ms), 0, Math.max(0, dur));
          await s.setPositionAsync(target);
          set({ positionMs: target });
        } catch (e: any) {
          set({ lastError: e?.message ?? "Seek failed" });
        }
      },

      // ---------------- queue ops ----------------
      removeAt: (index: number) => {
        const { queue, currentIndex } = get();
        if (index < 0 || index >= queue.length) return;

        const removedWasCurrent = index === currentIndex;

        const nextQueue = queue.slice();
        nextQueue.splice(index, 1);

        let nextIndex = currentIndex;

        // adjust current index if needed
        if (index < currentIndex) nextIndex = currentIndex - 1;
        if (nextIndex < 0) nextIndex = 0;
        if (nextIndex >= nextQueue.length) nextIndex = Math.max(0, nextQueue.length - 1);

        set({ queue: nextQueue, currentIndex: nextIndex });

        // if we removed currently playing, load the new current track (if exists)
        if (removedWasCurrent) {
          const nextSong = nextQueue[nextIndex];
          if (nextSong) {
            get().playSingle(nextSong).catch(() => {});
          } else {
            unloadSound(get, set).catch(() => {});
          }
        }
      },

      moveUp: (index: number) => {
        const { queue, currentIndex } = get();
        if (index <= 0 || index >= queue.length) return;

        const nextQueue = queue.slice();
        const tmp = nextQueue[index - 1];
        nextQueue[index - 1] = nextQueue[index];
        nextQueue[index] = tmp;

        let nextIndex = currentIndex;
        if (currentIndex === index) nextIndex = index - 1;
        else if (currentIndex === index - 1) nextIndex = index;

        set({ queue: nextQueue, currentIndex: nextIndex });
      },

      moveDown: (index: number) => {
        const { queue, currentIndex } = get();
        if (index < 0 || index >= queue.length - 1) return;

        const nextQueue = queue.slice();
        const tmp = nextQueue[index + 1];
        nextQueue[index + 1] = nextQueue[index];
        nextQueue[index] = tmp;

        let nextIndex = currentIndex;
        if (currentIndex === index) nextIndex = index + 1;
        else if (currentIndex === index + 1) nextIndex = index;

        set({ queue: nextQueue, currentIndex: nextIndex });
      },

      clearQueue: async () => {
        set({ queue: [], currentIndex: 0 });
        await unloadSound(get, set);
      },

      // ---------------- toggles ----------------
      toggleShuffle: () => {
        set({ shuffleOn: !get().shuffleOn });
      },

      cycleRepeat: () => {
      const cur = get().repeatMode;
      const next: RepeatMode = cur === "off" ? "one" : cur === "one" ? "all" : "off";
      set({ repeatMode: next });

      // ✅ make repeat-one actually loop at audio engine level
      const s = get().sound;
      if (s) {
        s.setIsLoopingAsync(next === "one").catch(() => {});
              }
      },

    }),
    {
      name: "music-player-store-v1",
      storage: createJSONStorage(() => AsyncStorage),

      // ✅ Only persist serializable fields
      partialize: (state: PlayerState) => ({
        queue: state.queue,
        currentIndex: state.currentIndex,
        shuffleOn: state.shuffleOn,
        repeatMode: state.repeatMode,
      }),

      version: 1,
    }
  )
);
