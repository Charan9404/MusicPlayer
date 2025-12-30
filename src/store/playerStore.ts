import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import type { SaavnSong } from "../api/saavn";
import { audio } from "../player/audio";

type RepeatMode = "off" | "one" | "all";

type Persisted = {
  queue: SaavnSong[];
  currentIndex: number;
  repeat: RepeatMode;
  shuffle: boolean;
};

type PlayerState = Persisted & {
  isHydrated: boolean;

  isPlaying: boolean;
  positionMillis: number;
  durationMillis: number;

  // actions
  hydrate: () => Promise<void>;
  persist: () => Promise<void>;

  setQueueAndPlay: (queue: SaavnSong[], index: number) => Promise<void>;
  playSingle: (song: SaavnSong) => Promise<void>;

  togglePlayPause: () => Promise<void>;
  next: () => Promise<void>;
  prev: () => Promise<void>;
  seekTo: (ms: number) => Promise<void>;

  removeFromQueue: (index: number) => Promise<void>;
  moveQueueItem: (from: number, to: number) => Promise<void>;

  setRepeat: (mode: RepeatMode) => Promise<void>;
  toggleShuffle: () => Promise<void>;

  // internal status update
  _setPlaybackStatus: (
    positionMillis: number,
    durationMillis: number,
    isPlaying: boolean
  ) => void;
};

const KEY = "music_player_state_v1";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  queue: [],
  currentIndex: 0,
  repeat: "off",
  shuffle: false,

  isHydrated: false,

  isPlaying: false,
  positionMillis: 0,
  durationMillis: 0,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Persisted;
        set({
          queue: Array.isArray(parsed.queue) ? parsed.queue : [],
          currentIndex:
            typeof parsed.currentIndex === "number" ? parsed.currentIndex : 0,
          repeat: parsed.repeat ?? "off",
          shuffle: !!parsed.shuffle,
        });
      }
    } catch (e) {
      // ignore
    } finally {
      set({ isHydrated: true });
    }
  },

  persist: async () => {
    try {
      const { queue, currentIndex, repeat, shuffle } = get();
      const payload: Persisted = { queue, currentIndex, repeat, shuffle };
      await AsyncStorage.setItem(KEY, JSON.stringify(payload));
    } catch (e) {
      // ignore
    }
  },

  setQueueAndPlay: async (queue, index) => {
    const safeIndex = clamp(index, 0, Math.max(0, queue.length - 1));
    set({ queue, currentIndex: safeIndex });
    await get().persist();
    const song = queue[safeIndex];
    if (song?.audioUrl) await audio.loadAndPlay(song);
  },

  playSingle: async (song) => {
    set({ queue: [song], currentIndex: 0 });
    await get().persist();
    await audio.loadAndPlay(song);
  },

  togglePlayPause: async () => {
    const { isPlaying } = get();
    if (isPlaying) await audio.pause();
    else await audio.play();
  },

  next: async () => {
    const { queue, currentIndex, repeat, shuffle } = get();
    if (queue.length === 0) return;

    let nextIndex = currentIndex;

    if (shuffle && queue.length > 1) {
      do {
        nextIndex = Math.floor(Math.random() * queue.length);
      } while (nextIndex === currentIndex);
    } else {
      nextIndex = currentIndex + 1;
    }

    if (nextIndex >= queue.length) {
      if (repeat === "all") nextIndex = 0;
      else return;
    }

    set({ currentIndex: nextIndex, positionMillis: 0 });
    await get().persist();
    await audio.loadAndPlay(queue[nextIndex]);
  },

  prev: async () => {
    const { queue, currentIndex } = get();
    if (queue.length === 0) return;

    const prevIndex = clamp(currentIndex - 1, 0, queue.length - 1);
    set({ currentIndex: prevIndex, positionMillis: 0 });
    await get().persist();
    await audio.loadAndPlay(queue[prevIndex]);
  },

  seekTo: async (ms) => {
    await audio.seek(ms);
  },

  removeFromQueue: async (index) => {
    const { queue, currentIndex } = get();
    if (index < 0 || index >= queue.length) return;

    const newQueue = queue.filter((_, i) => i !== index);

    let newIndex = currentIndex;
    if (index < currentIndex) newIndex = currentIndex - 1;
    if (newIndex >= newQueue.length)
      newIndex = Math.max(0, newQueue.length - 1);

    set({ queue: newQueue, currentIndex: newIndex });

    await get().persist();

    if (newQueue.length === 0) {
      await audio.stopAndUnload();
      set({ isPlaying: false, positionMillis: 0, durationMillis: 0 });
    }
  },

  moveQueueItem: async (from, to) => {
    const { queue, currentIndex } = get();
    if (from < 0 || from >= queue.length) return;
    if (to < 0 || to >= queue.length) return;

    const newQueue = [...queue];
    const item = newQueue.splice(from, 1)[0];
    newQueue.splice(to, 0, item);

    let newIndex = currentIndex;
    if (from === currentIndex) newIndex = to;
    else {
      // adjust index if items moved around it
      if (from < currentIndex && to >= currentIndex)
        newIndex = currentIndex - 1;
      if (from > currentIndex && to <= currentIndex)
        newIndex = currentIndex + 1;
    }

    set({ queue: newQueue, currentIndex: newIndex });
    await get().persist();
  },

  setRepeat: async (mode) => {
    set({ repeat: mode });
    await get().persist();
  },

  toggleShuffle: async () => {
    set({ shuffle: !get().shuffle });
    await get().persist();
  },

  _setPlaybackStatus: (positionMillis, durationMillis, isPlaying) => {
    set({ positionMillis, durationMillis, isPlaying });
  },
}));
