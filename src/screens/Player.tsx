import React from "react";
import { View, Text, Image, Pressable, StyleSheet, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Slider from "@react-native-community/slider";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import { usePlayerStore } from "../store/playerStore";
import { useTheme } from "../theme/ThemeProvider";

function formatTime(ms: number) {
  const total = Math.max(0, Math.floor((ms || 0) / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

export default function Player() {
  const nav = useNavigation<any>();
  const { theme, mode, toggle } = useTheme();
  const s = styles(theme);

  const queue = usePlayerStore((st: any) => st.queue ?? []);
  const currentIndex = usePlayerStore((st: any) => st.currentIndex ?? 0);
  const song = queue?.[currentIndex];

  const isPlaying = usePlayerStore((st: any) => !!(st.isPlaying ?? st.playing ?? false));

  const positionMs = usePlayerStore(
    (st: any) => (st.positionMillis ?? st.positionMs ?? st.position ?? st.progressMs ?? 0) as number
  );

  const durationMs = usePlayerStore(
    (st: any) => (st.durationMillis ?? st.durationMs ?? st.duration ?? st.totalMs ?? 0) as number
  );

  const seekTo = usePlayerStore(
    (st: any) =>
      (st.seekTo ?? st.seek ?? st.setPosition ?? st.setProgress ?? null) as null | ((ms: number) => void)
  );

  const next = usePlayerStore(
    (st: any) => (st.next ?? st.playNext ?? st.nextTrack ?? st.skipNext ?? null) as null | (() => void)
  );

  const prev = usePlayerStore(
    (st: any) => (st.prev ?? st.previous ?? st.playPrev ?? st.prevTrack ?? st.skipPrev ?? null) as null | (() => void)
  );

  const togglePlayPause = usePlayerStore(
    (st: any) => (st.togglePlayPause ?? st.togglePlay ?? st.playPause ?? st.toggle ?? null) as null | (() => void)
  );

  const play = usePlayerStore(
    (st: any) => (st.play ?? st.resume ?? st.start ?? st.playCurrent ?? null) as null | (() => void)
  );

  const pause = usePlayerStore(
    (st: any) => (st.pause ?? st.stop ?? st.halt ?? st.pauseCurrent ?? null) as null | (() => void)
  );

  const setQueueAndPlay = usePlayerStore(
    (st: any) =>
      (st.setQueueAndPlay ??
        st.setQueueAndPlayAt ??
        st.playFromQueue ??
        st.playAt ??
        null) as null | ((q: any[], i?: number) => void)
  );

  const playSingle = usePlayerStore(
    (st: any) => (st.playSingle ?? st.playSong ?? null) as null | ((song: any) => void)
  );

  const shuffleOn = usePlayerStore((st: any) => !!(st.shuffleOn ?? st.isShuffle ?? st.shuffleEnabled ?? false));
  const toggleShuffle = usePlayerStore(
    (st: any) => (st.toggleShuffle ?? st.shuffleToggle ?? st.toggleIsShuffle ?? null) as null | (() => void)
  );

  const repeatMode = usePlayerStore((st: any) => st.repeatMode ?? st.repeat ?? "off");
  const cycleRepeat = usePlayerStore(
    (st: any) => (st.cycleRepeat ?? st.toggleRepeat ?? st.repeatToggle ?? null) as null | (() => void)
  );

  const safeDuration = Math.max(1, durationMs || 0);
  const [dragMs, setDragMs] = React.useState<number | null>(null);
  const shownPos = dragMs ?? positionMs;

  const startPlayback = () => {
    if (setQueueAndPlay && queue?.length) return setQueueAndPlay(queue, currentIndex);
    if (playSingle && song) return playSingle(song);
    if (play) return play();
    return togglePlayPause?.();
  };

  const onPlayPause = () => {
    if (isPlaying) {
      if (togglePlayPause) return togglePlayPause();
      return pause?.();
    }
    return startPlayback();
  };

  const jumpBy = (deltaMs: number) => {
    if (!seekTo) return;
    const nextPos = clamp((positionMs || 0) + deltaMs, 0, safeDuration);
    seekTo(nextPos);
  };

  const repeatActive = String(repeatMode) !== "off";

  if (!song) {
    return (
      <SafeAreaView style={[s.container, s.center]}>
        <Text style={s.emptyTxt}>No song playing</Text>
        <Pressable onPress={() => nav.goBack()} style={s.iconBtn}>
          <Ionicons name="chevron-back" size={20} color={theme.colors.text} />
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      {/* Top bar (flat) */}
      <View style={s.topBar}>
        <Pressable onPress={() => nav.goBack()} style={s.iconBtn} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
        </Pressable>

        <Text style={s.topTitle}>Now Playing</Text>

        <View style={s.topRight}>
          <Pressable onPress={() => nav.navigate("Queue")} style={s.iconBtn} hitSlop={10}>
            <Ionicons name="list" size={18} color={theme.colors.text} />
          </Pressable>

          <Pressable onPress={toggle} style={s.iconBtn} hitSlop={10}>
            <Text style={s.modeTxt}>{mode === "dark" ? "☀" : "🌙"}</Text>
          </Pressable>
        </View>
      </View>

      {/* Album Art (centered, big, flat) */}
      <View style={s.artArea}>
        <Image source={{ uri: song.imageUrl }} style={s.art} />
      </View>

      {/* Title / Artist (center aligned like reference) */}
      <View style={s.titleArea}>
        <Text numberOfLines={1} style={s.title}>
          {song.name}
        </Text>
        <Text numberOfLines={1} style={s.artist}>
          {song.artists}
        </Text>
      </View>

      {/* Slider (no card) */}
      <View style={s.sliderArea}>
        <Slider
          value={Math.min(shownPos, safeDuration)}
          minimumValue={0}
          maximumValue={safeDuration}
          onValueChange={(v) => setDragMs(v)}
          onSlidingComplete={(v) => {
            setDragMs(null);
            seekTo?.(Math.floor(v));
          }}
          minimumTrackTintColor={theme.colors.accent}
          maximumTrackTintColor={theme.mode === "dark" ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.15)"}
          thumbTintColor={theme.colors.accent}
        />

        <View style={s.timeRow}>
          <Text style={s.timeTxt}>{formatTime(shownPos)}</Text>
          <Text style={s.timeTxt}>{formatTime(safeDuration)}</Text>
        </View>
      </View>

      {/* Primary controls (flat row) */}
      <View style={s.primaryControls}>
        <Pressable onPress={() => prev?.()} style={s.ctrlBtn} hitSlop={12}>
          <Ionicons name="play-skip-back" size={26} color={theme.colors.text} />
        </Pressable>

        <Pressable onPress={() => jumpBy(-10_000)} style={s.ctrlBtn} hitSlop={12}>
          <Ionicons name="play-back" size={26} color={theme.colors.text} />
        </Pressable>

        <Pressable onPress={onPlayPause} style={s.playBtn} hitSlop={14}>
          <Ionicons
            name={isPlaying ? "pause" : "play"}
            size={30}
            color={"white"}
            style={!isPlaying ? { marginLeft: 2 } : undefined}
          />
        </Pressable>

        <Pressable onPress={() => jumpBy(10_000)} style={s.ctrlBtn} hitSlop={12}>
          <Ionicons name="play-forward" size={26} color={theme.colors.text} />
        </Pressable>

        <Pressable onPress={() => next?.()} style={s.ctrlBtn} hitSlop={12}>
          <Ionicons name="play-skip-forward" size={26} color={theme.colors.text} />
        </Pressable>
      </View>

      {/* Secondary controls row (like reference bottom icons) */}
      <View style={s.secondaryControls}>
        <Pressable onPress={() => toggleShuffle?.()} style={s.secondaryBtn} hitSlop={10}>
          <Ionicons
            name="shuffle"
            size={20}
            color={shuffleOn ? theme.colors.accent : theme.colors.muted}
          />
        </Pressable>

        <Pressable onPress={() => {}} style={s.secondaryBtn} hitSlop={10}>
          <Ionicons name="timer-outline" size={20} color={theme.colors.muted} />
        </Pressable>

        <Pressable onPress={() => {}} style={s.secondaryBtn} hitSlop={10}>
          <Ionicons name="radio-outline" size={20} color={theme.colors.muted} />
        </Pressable>

        {/* ✅ Repeat with "1" badge when repeatMode === "one" */}
        <Pressable
          onPress={() => cycleRepeat?.()}
          style={[s.secondaryBtn, { position: "relative" }]}
          hitSlop={10}
        >
          <Ionicons
            name="repeat"
            size={20}
            color={repeatActive ? theme.colors.accent : theme.colors.muted}
          />

          {String(repeatMode) === "one" ? (
            <View style={s.repeatOneBadge}>
              <Text style={s.repeatOneTxt}>1</Text>
            </View>
          ) : null}
        </Pressable>

        <Pressable onPress={() => {}} style={s.secondaryBtn} hitSlop={10}>
          <Ionicons name="ellipsis-horizontal" size={22} color={theme.colors.muted} />
        </Pressable>
      </View>

      {/* Lyrics handle */}
      <View style={s.lyricsArea}>
        <Ionicons name="chevron-up" size={16} color={theme.colors.muted} />
        <Text style={s.lyricsTxt}>Lyrics</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = (theme: any) => {
  const isDark = theme.mode === "dark";

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.bg,
      paddingHorizontal: 18,
    },
    center: { justifyContent: "center", alignItems: "center" },

    topBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 12,
    },
    topTitle: {
      color: theme.colors.text,
      fontWeight: "800",
      fontSize: 15,
    },
    topRight: { flexDirection: "row", alignItems: "center", gap: 10 },

    // flat icon buttons: no borders, no boxes
    iconBtn: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "transparent",
    },
    modeTxt: { color: theme.colors.text, fontSize: 16, fontWeight: "900" },

    artArea: {
      alignItems: "center",
      justifyContent: "center",
      marginTop: 12,
      marginBottom: 16,
    },
    art: {
      width: 300,
      height: 300,
      borderRadius: 28,
      backgroundColor: theme.colors.surface,
      ...(Platform.OS === "ios"
        ? {
            shadowColor: "#000",
            shadowOpacity: isDark ? 0.25 : 0.10,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 10 },
          }
        : { elevation: 6 }),
    },

    titleArea: {
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 10,
      paddingHorizontal: 8,
    },
    title: {
      color: theme.colors.text,
      fontSize: 24,
      fontWeight: "900",
      textAlign: "center",
    },
    artist: {
      color: theme.colors.muted,
      fontSize: 13,
      fontWeight: "700",
      marginTop: 6,
      textAlign: "center",
    },

    sliderArea: {
      marginTop: 4,
      marginBottom: 16,
    },
    timeRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 8,
      paddingHorizontal: 2,
    },
    timeTxt: {
      color: theme.colors.muted,
      fontWeight: "700",
      fontSize: 12,
    },

    primaryControls: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 18,
      marginTop: 2,
      marginBottom: 18,
    },
    ctrlBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
    },
    playBtn: {
      width: 74,
      height: 74,
      borderRadius: 37,
      backgroundColor: theme.colors.accent,
      alignItems: "center",
      justifyContent: "center",
      ...(Platform.OS === "ios"
        ? {
            shadowColor: "#000",
            shadowOpacity: isDark ? 0.28 : 0.18,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 10 },
          }
        : { elevation: 6 }),
    },

    secondaryControls: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 18,
      marginBottom: 18,
    },
    secondaryBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
    },

    // ✅ "Repeat One" badge
    repeatOneBadge: {
      position: "absolute",
      right: 10,
      top: 8,
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: theme.colors.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    repeatOneTxt: {
      color: "white",
      fontSize: 10,
      fontWeight: "900",
      lineHeight: 10,
    },

    lyricsArea: {
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingTop: 6,
    },
    lyricsTxt: {
      color: theme.colors.muted,
      fontWeight: "700",
      fontSize: 12,
    },

    emptyTxt: { color: theme.colors.text, fontWeight: "900" },
  });
};
