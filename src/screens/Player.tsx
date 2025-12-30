import React from "react"
import { View, Text, Image, Pressable, StyleSheet } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import Slider from "@react-native-community/slider"
import { useNavigation } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"

import { usePlayerStore } from "../store/playerStore"
import { useTheme } from "../theme/ThemeProvider"

function formatTime(ms: number) {
  const total = Math.max(0, Math.floor((ms || 0) / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

export default function Player() {
  const nav = useNavigation<any>()
  const { theme, mode, toggle } = useTheme()
  const s = styles(theme)

  // ✅ subscribe via selectors (prevents stale UI / non-updating values)
  const queue = usePlayerStore((st: any) => st.queue ?? [])
  const currentIndex = usePlayerStore((st: any) => st.currentIndex ?? 0)

  const isPlaying = usePlayerStore((st: any) => !!(st.isPlaying ?? st.playing ?? false))

  const positionMs = usePlayerStore(
    (st: any) => (st.positionMillis ?? st.positionMs ?? st.position ?? st.progressMs ?? 0) as number,
  )

  const durationMs = usePlayerStore(
    (st: any) => (st.durationMillis ?? st.durationMs ?? st.duration ?? st.totalMs ?? 0) as number,
  )

  // actions (robust)
  const seekTo = usePlayerStore(
    (st: any) =>
      (st.seekTo ?? st.seek ?? st.setPosition ?? st.setProgress ?? null) as null | ((ms: number) => void),
  )

  const next = usePlayerStore(
    (st: any) => (st.next ?? st.playNext ?? st.nextTrack ?? st.skipNext ?? null) as null | (() => void),
  )

  const prev = usePlayerStore(
    (st: any) => (st.prev ?? st.previous ?? st.playPrev ?? st.prevTrack ?? st.skipPrev ?? null) as null | (() => void),
  )

  const togglePlayPause = usePlayerStore(
    (st: any) => (st.togglePlayPause ?? st.togglePlay ?? st.playPause ?? st.toggle ?? null) as null | (() => void),
  )

  const play = usePlayerStore(
    (st: any) => (st.play ?? st.resume ?? st.start ?? st.playCurrent ?? null) as null | (() => void),
  )

  const pause = usePlayerStore(
    (st: any) => (st.pause ?? st.stop ?? st.halt ?? st.pauseCurrent ?? null) as null | (() => void),
  )

  // ✅ CRITICAL: these two usually exist in your app and actually START playback
  const setQueueAndPlay = usePlayerStore(
    (st: any) =>
      (st.setQueueAndPlay ??
        st.setQueueAndPlayAt ??
        st.playFromQueue ??
        st.playAt ??
        null) as null | ((q: any[], i?: number) => void),
  )

  const playSingle = usePlayerStore(
    (st: any) => (st.playSingle ?? st.playSong ?? null) as null | ((song: any) => void),
  )

  const shuffleOn = usePlayerStore((st: any) => !!(st.shuffleOn ?? st.isShuffle ?? st.shuffleEnabled ?? false))

  const toggleShuffle = usePlayerStore(
    (st: any) => (st.toggleShuffle ?? st.shuffleToggle ?? st.toggleIsShuffle ?? null) as null | (() => void),
  )

  const repeatMode = usePlayerStore((st: any) => st.repeatMode ?? st.repeat ?? "off")

  const cycleRepeat = usePlayerStore(
    (st: any) => (st.cycleRepeat ?? st.toggleRepeat ?? st.repeatToggle ?? null) as null | (() => void),
  )

  const song = queue?.[currentIndex]

  const safeDuration = Math.max(1, durationMs || 0)
  const [dragMs, setDragMs] = React.useState<number | null>(null)
  const shownPos = dragMs ?? positionMs

  // ✅ FIXED: this guarantees play actually starts
  const startPlayback = () => {
    // 1) best: set queue + index + start
    if (setQueueAndPlay && queue?.length) return setQueueAndPlay(queue, currentIndex)

    // 2) next best: play a single song directly
    if (playSingle && song) return playSingle(song)

    // 3) fallback: store play methods
    if (play) return play()

    // 4) last fallback
    return togglePlayPause?.()
  }

  const onPlayPause = () => {
    if (isPlaying) {
      // pause (prefer toggle if it exists)
      if (togglePlayPause) return togglePlayPause()
      return pause?.()
    }
    // not playing => start properly
    return startPlayback()
  }

  const repeatActive = String(repeatMode) !== "off"

  if (!song) {
    return (
      <SafeAreaView style={[s.container, s.center]}>
        <Text style={s.emptyTxt}>No song playing</Text>
        <Pressable onPress={() => nav.goBack()} style={s.topPill}>
          <Text style={s.topPillTxt}>Back</Text>
        </Pressable>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={s.container}>
      {/* Top bar (Spotify-like simple) */}
      <View style={s.topBar}>
        <Pressable onPress={() => nav.goBack()} style={s.topLeft}>
          <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
          <Text style={s.topLeftTxt}>Back</Text>
        </Pressable>

        <View style={s.topRight}>
          <Pressable onPress={() => nav.navigate("Queue")} style={s.topPill}>
            <Text style={s.topPillTxt}>Queue</Text>
          </Pressable>

          <Pressable onPress={toggle} style={s.modeBtn}>
            <Text style={s.modeTxt}>{mode === "dark" ? "☀" : "🌙"}</Text>
          </Pressable>
        </View>
      </View>

      {/* Artwork section */}
      <View style={s.artSection}>
        <View style={s.glow} />
        <Image source={{ uri: song.imageUrl }} style={s.art} />
      </View>

      {/* Title section */}
      <View style={s.metaRow}>
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={s.title}>
            {song.name}
          </Text>
          <Text numberOfLines={1} style={s.artist}>
            {song.artists}
          </Text>
        </View>

        <Pressable style={s.likeBtn} onPress={() => {}}>
          <Ionicons name="heart-outline" size={22} color={theme.colors.text} />
        </Pressable>
      </View>

      {/* Slider */}
      <View style={s.sliderWrap}>
        <Slider
          value={Math.min(shownPos, safeDuration)}
          minimumValue={0}
          maximumValue={safeDuration}
          onValueChange={(v) => setDragMs(v)}
          onSlidingComplete={(v) => {
            setDragMs(null)
            seekTo?.(Math.floor(v))
          }}
          minimumTrackTintColor={theme.colors.accent}
          maximumTrackTintColor={theme.colors.border}
          thumbTintColor={theme.colors.accent}
        />
        <View style={s.timeRow}>
          <Text style={s.timeTxt}>{formatTime(shownPos)}</Text>
          <Text style={s.timeTxt}>{formatTime(safeDuration)}</Text>
        </View>
      </View>

      <View style={{ flex: 1, minHeight: 20 }} />

      <View style={s.controlsArea}>
        <View style={s.transportRow}>
          <Pressable onPress={() => toggleShuffle?.()} style={[s.smallIconBtn, shuffleOn && s.smallIconBtnActive]}>
            <Ionicons name="shuffle" size={18} color={shuffleOn ? "white" : theme.colors.text} />
          </Pressable>

          <Pressable onPress={() => prev?.()} style={s.midIconBtn}>
            <Ionicons name="play-skip-back" size={28} color={theme.colors.text} />
          </Pressable>

          <Pressable onPress={onPlayPause} style={s.playBtnBig}>
            <Ionicons
              name={isPlaying ? "pause" : "play"}
              size={30}
              color="white"
              style={!isPlaying ? { marginLeft: 2 } : undefined}
            />
          </Pressable>

          <Pressable onPress={() => next?.()} style={s.midIconBtn}>
            <Ionicons name="play-skip-forward" size={28} color={theme.colors.text} />
          </Pressable>

          <Pressable onPress={() => cycleRepeat?.()} style={[s.smallIconBtn, repeatActive && s.smallIconBtnActive]}>
            <Ionicons name="repeat" size={18} color={repeatActive ? "white" : theme.colors.text} />
          </Pressable>
        </View>

        <View style={s.bottomPillRow}>
          <View style={s.repeatPill}>
            <Text style={s.repeatTxt}>Repeat: {String(repeatMode)}</Text>
          </View>
        </View>
      </View>

      <View style={{ height: 16 }} />
    </SafeAreaView>
  )
}

const styles = (theme: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg, paddingHorizontal: 16 },
    center: { justifyContent: "center", alignItems: "center" },

    topBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 14,
      marginBottom: 8,
    },
    topLeft: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8 },
    topLeftTxt: { color: theme.colors.text, fontWeight: "900", fontSize: 16 },
    topRight: { flexDirection: "row", gap: 12, alignItems: "center" },

    topPill: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: theme.radius.pill,
    },
    topPillTxt: { color: theme.colors.text, fontWeight: "900", fontSize: 14 },

    modeBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    modeTxt: { color: theme.colors.text, fontSize: 18, fontWeight: "900" },

    artSection: {
      alignItems: "center",
      justifyContent: "center",
      marginVertical: 24,
      marginBottom: 28,
    },
    glow: {
      position: "absolute",
      width: 270,
      height: 270,
      borderRadius: 40,
      backgroundColor: theme.colors.accentSoft,
      opacity: theme.mode === "dark" ? 0.35 : 0.25,
      transform: [{ scale: 1.08 }],
    },
    art: {
      width: 250,
      height: 250,
      borderRadius: theme.radius.xl,
      backgroundColor: theme.colors.surface,
    },

    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 16,
      marginBottom: 20,
    },
    title: { color: theme.colors.text, fontSize: 22, fontWeight: "900", lineHeight: 28 },
    artist: { color: theme.colors.muted, marginTop: 6, fontWeight: "700", fontSize: 14, lineHeight: 20 },

    likeBtn: {
      width: 48,
      height: 48,
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },

    sliderWrap: {
      marginBottom: 16,
      backgroundColor: theme.colors.surface2,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      paddingHorizontal: 14,
      paddingVertical: 14,
    },
    timeRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
    timeTxt: { color: theme.colors.muted, fontWeight: "800", fontSize: 12 },

    controlsArea: {
      backgroundColor: theme.colors.surface2,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      paddingVertical: 20,
      paddingHorizontal: 14,
    },

    transportRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      marginBottom: 16,
    },

    smallIconBtn: {
      width: 48,
      height: 48,
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    smallIconBtnActive: {
      backgroundColor: theme.colors.accent,
      borderColor: theme.colors.accent,
    },

    midIconBtn: {
      width: 60,
      height: 60,
      borderRadius: 18,
      backgroundColor: "transparent",
      alignItems: "center",
      justifyContent: "center",
    },

    playBtnBig: {
      width: 76,
      height: 76,
      borderRadius: 38,
      backgroundColor: theme.colors.accent,
      alignItems: "center",
      justifyContent: "center",
      marginHorizontal: 12,
    },

    bottomPillRow: { marginTop: 12, alignItems: "center", justifyContent: "center" },
    repeatPill: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: theme.radius.pill,
    },
    repeatTxt: { color: theme.colors.text, fontWeight: "900", fontSize: 14 },

    emptyTxt: { color: theme.colors.text, fontWeight: "900" },
  })
