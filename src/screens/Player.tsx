import React, { useMemo, useState } from "react";
import { View, Text, Image, Pressable, StyleSheet, Modal, Alert } from "react-native";
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

/** Simple bottom sheet */
function ActionSheet({
  visible,
  onClose,
  theme,
  headerSong,
  items,
}: {
  visible: boolean;
  onClose: () => void;
  theme: any;
  headerSong: any | null;
  items: { icon: any; label: string; onPress: () => void; destructive?: boolean }[];
}) {
  if (!visible) return null;

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <Pressable style={sheetStyles.overlay} onPress={onClose}>
        <Pressable
          style={[
            sheetStyles.card,
            { backgroundColor: theme.colors.surface2, borderColor: theme.colors.border },
          ]}
          onPress={() => {}}
        >
          <View style={sheetStyles.grabberWrap}>
            <View style={[sheetStyles.grabber, { backgroundColor: theme.colors.border }]} />
          </View>

          {headerSong ? (
            <View style={sheetStyles.headerRow}>
              {headerSong?.imageUrl ? (
                <Image source={{ uri: headerSong.imageUrl }} style={sheetStyles.headerArt} />
              ) : (
                <View style={[sheetStyles.headerArt, { backgroundColor: theme.colors.surface }]} />
              )}
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={[sheetStyles.headerTitle, { color: theme.colors.text }]}>
                  {headerSong?.name ?? "Song"}
                </Text>
                <Text numberOfLines={1} style={[sheetStyles.headerSub, { color: theme.colors.muted }]}>
                  {headerSong?.artists ?? ""}
                </Text>
              </View>

              <Pressable style={[sheetStyles.heartBtn, { backgroundColor: theme.colors.surface }]} onPress={() => {}}>
                <Ionicons name="heart-outline" size={18} color={theme.colors.text} />
              </Pressable>
            </View>
          ) : null}

          <View style={{ marginTop: 6 }}>
            {items.map((it, idx) => (
              <Pressable
                key={`${it.label}-${idx}`}
                onPress={() => {
                  onClose();
                  it.onPress();
                }}
                style={sheetStyles.itemRow}
              >
                <View style={sheetStyles.itemIcon}>
                  <Ionicons
                    name={it.icon}
                    size={18}
                    color={it.destructive ? "#EF4444" : theme.colors.text}
                  />
                </View>
                <Text
                  style={[
                    sheetStyles.itemLabel,
                    { color: it.destructive ? "#EF4444" : theme.colors.text },
                  ]}
                >
                  {it.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const sheetStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  card: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    paddingBottom: 14,
    paddingTop: 8,
    paddingHorizontal: 14,
  },
  grabberWrap: { alignItems: "center", paddingBottom: 10 },
  grabber: { width: 44, height: 5, borderRadius: 999 },

  headerRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingBottom: 10 },
  headerArt: { width: 56, height: 56, borderRadius: 16, backgroundColor: "#111" },
  headerTitle: { fontSize: 14, fontWeight: "900" },
  headerSub: { fontSize: 12, fontWeight: "700", marginTop: 2 },
  heartBtn: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },

  itemRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  itemIcon: { width: 26, alignItems: "center" },
  itemLabel: { fontSize: 14, fontWeight: "800" },
});

export default function Player() {
  const nav = useNavigation<any>();
  const { theme, mode, toggle } = useTheme();
  const s = styles(theme);

  const queue = usePlayerStore((st: any) => st.queue ?? []);
  const currentIndex = usePlayerStore((st: any) => st.currentIndex ?? 0);
  const isPlaying = usePlayerStore((st: any) => !!st.isPlaying);
  const positionMs = usePlayerStore((st: any) => st.positionMs ?? 0);
  const durationMs = usePlayerStore((st: any) => st.durationMs ?? 0);
  const shuffleOn = usePlayerStore((st: any) => !!st.shuffleOn);
  const repeatMode = usePlayerStore((st: any) => st.repeatMode ?? "off");

  const togglePlayPause = usePlayerStore((st: any) => st.togglePlayPause);
  const next = usePlayerStore((st: any) => st.next);
  const prev = usePlayerStore((st: any) => st.prev);
  const seekTo = usePlayerStore((st: any) => st.seekTo);

  const toggleShuffle = usePlayerStore((st: any) => st.toggleShuffle);
  const cycleRepeat = usePlayerStore((st: any) => st.cycleRepeat);

  const song = queue?.[currentIndex] ?? null;

  const [sheetOpen, setSheetOpen] = useState(false);

  const menuItems = useMemo(() => {
    if (!song) return [];
    return [
      {
        icon: "play-skip-forward-outline",
        label: "Play Next",
        onPress: () => {
          const st = (usePlayerStore as any).getState?.();
          const q0 = st?.queue ?? queue ?? [];
          const idx0 = st?.currentIndex ?? currentIndex ?? 0;
          const nextQ = q0.slice();
          nextQ.splice(Math.min(idx0 + 1, nextQ.length), 0, song);
          (usePlayerStore as any).setState({ queue: nextQ });
        },
      },
      {
        icon: "list-outline",
        label: "Add to Playing Queue",
        onPress: () => {
          const st = (usePlayerStore as any).getState?.();
          const q0 = st?.queue ?? queue ?? [];
          (usePlayerStore as any).setState({ queue: q0.concat([song]) });
        },
      },
      {
        icon: "information-circle-outline",
        label: "Details",
        onPress: () => {
          Alert.alert("Now Playing", `${song?.name ?? ""}\n${song?.artists ?? ""}`);
        },
      },
    ];
  }, [song, queue, currentIndex]);

  if (!song) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.topBar}>
          <Pressable onPress={() => nav.goBack()} style={s.iconBtn}>
            <Ionicons name="chevron-back" size={20} color={theme.colors.text} />
          </Pressable>
          <Text style={s.topTitle}>Now Playing</Text>
          <View style={{ width: 42 }} />
        </View>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={s.emptyTxt}>No song playing</Text>
        </View>
      </SafeAreaView>
    );
  }

  const progress = durationMs > 0 ? Math.min(positionMs, durationMs) : 0;

  return (
    <SafeAreaView style={s.safe}>
      {/* Top bar */}
      <View style={s.topBar}>
        <Pressable onPress={() => nav.goBack()} style={s.iconBtn}>
          <Ionicons name="chevron-back" size={20} color={theme.colors.text} />
        </Pressable>

        <Text style={s.topTitle}>Now Playing</Text>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <Pressable onPress={() => nav.navigate("Queue")} style={s.iconBtn}>
            <Ionicons name="list" size={18} color={theme.colors.text} />
          </Pressable>
          <Pressable onPress={toggle} style={s.iconBtn}>
            <Text style={s.modeTxt}>{mode === "dark" ? "☀" : "○"}</Text>
          </Pressable>
        </View>
      </View>

      {/* Artwork */}
      <View style={s.artWrap}>
        {song.imageUrl ? (
          <Image source={{ uri: song.imageUrl }} style={s.art} />
        ) : (
          <View style={[s.art, { backgroundColor: theme.colors.surface }]} />
        )}
      </View>

      {/* Title + artist */}
      <View style={s.titleWrap}>
        <Text numberOfLines={2} style={s.songTitle}>
          {song.name}
        </Text>
        <Text numberOfLines={1} style={s.songSub}>
          {song.artists}
        </Text>
      </View>

      {/* Progress */}
      <View style={s.progressWrap}>
        <Slider
          style={{ width: "100%" }}
          minimumValue={0}
          maximumValue={Math.max(1, durationMs)}
          value={progress}
          minimumTrackTintColor={theme.colors.accent}
          maximumTrackTintColor={theme.colors.border}
          thumbTintColor={theme.colors.accent}
          onSlidingComplete={(v) => seekTo(Math.floor(v))}
        />

        <View style={s.timeRow}>
          <Text style={s.timeTxt}>{formatTime(progress)}</Text>
          <Text style={s.timeTxt}>{formatTime(durationMs)}</Text>
        </View>
      </View>

      {/* Controls */}
      <View style={s.controls}>
        <Pressable onPress={toggleShuffle} style={s.ctrlIcon}>
          <Ionicons
            name="shuffle"
            size={20}
            color={shuffleOn ? theme.colors.accent : theme.colors.muted}
          />
        </Pressable>

        <Pressable onPress={() => prev?.()} style={s.ctrlIcon}>
          <Ionicons name="play-skip-back" size={22} color={theme.colors.text} />
        </Pressable>

        <Pressable onPress={() => togglePlayPause?.()} style={s.playBig}>
          <Ionicons name={isPlaying ? "pause" : "play"} size={28} color={"white"} />
        </Pressable>

        <Pressable onPress={() => next?.()} style={s.ctrlIcon}>
          <Ionicons name="play-skip-forward" size={22} color={theme.colors.text} />
        </Pressable>

        <Pressable onPress={cycleRepeat} style={s.ctrlIcon}>
          <View style={{ alignItems: "center", justifyContent: "center" }}>
            <Ionicons
              name="repeat"
              size={20}
              color={repeatMode === "off" ? theme.colors.muted : theme.colors.accent}
            />
            {repeatMode === "one" ? (
              <View style={s.repeatOneBadge}>
                <Text style={s.repeatOneTxt}>1</Text>
              </View>
            ) : null}
          </View>
        </Pressable>
      </View>

      {/* Bottom mini row */}
      <View style={s.bottomRow}>
        <Text style={s.repeatLabel}>Repeat: {repeatMode}</Text>

        <Pressable onPress={() => setSheetOpen(true)} style={s.moreBtn}>
          <Ionicons name="ellipsis-horizontal" size={20} color={theme.colors.text} />
        </Pressable>
      </View>

      {/* Lyrics hint */}
      <View style={s.lyricsHint}>
        <Ionicons name="chevron-up" size={16} color={theme.colors.muted} />
        <Text style={s.lyricsTxt}>Lyrics</Text>
      </View>

      <ActionSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        theme={theme}
        headerSong={song}
        items={menuItems}
      />
    </SafeAreaView>
  );
}

const styles = (theme: any) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.colors.bg, paddingHorizontal: 16 },

    topBar: {
      paddingTop: 6,
      paddingBottom: 8,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    topTitle: { color: theme.colors.text, fontWeight: "900", fontSize: 15 },
    iconBtn: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    modeTxt: { color: theme.colors.text, fontWeight: "900" },

    artWrap: { alignItems: "center", paddingTop: 8 },
    art: {
      width: 280,
      height: 280,
      borderRadius: 28,
      backgroundColor: theme.colors.surface,
    },

    titleWrap: { alignItems: "center", paddingTop: 16 },
    songTitle: { color: theme.colors.text, fontWeight: "900", fontSize: 22, textAlign: "center" },
    songSub: { color: theme.colors.muted, fontWeight: "800", marginTop: 6 },

    progressWrap: { paddingTop: 16 },
    timeRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
    timeTxt: { color: theme.colors.muted, fontWeight: "800", fontSize: 12 },

    controls: {
      paddingTop: 18,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 10,
    },
    ctrlIcon: {
      width: 46,
      height: 46,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
    },

    playBig: {
      width: 74,
      height: 74,
      borderRadius: 37,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.accent,
    },

    repeatOneBadge: {
      position: "absolute",
      right: -2,
      top: -6,
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: theme.colors.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    repeatOneTxt: { color: "white", fontSize: 10, fontWeight: "900" },

    bottomRow: {
      marginTop: 18,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    repeatLabel: { color: theme.colors.muted, fontWeight: "900" },
    moreBtn: {
      width: 46,
      height: 46,
      borderRadius: 18,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: "center",
      justifyContent: "center",
    },

    lyricsHint: { alignItems: "center", justifyContent: "center", gap: 6, paddingTop: 10 },
    lyricsTxt: { color: theme.colors.muted, fontWeight: "700", fontSize: 12 },

    emptyTxt: { color: theme.colors.text, fontWeight: "900" },
  });
