import React from "react";
import { View, Text, FlatList, Image, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import { usePlayerStore } from "../store/playerStore";
import { useTheme } from "../theme/ThemeProvider";

export default function Queue() {
  const nav = useNavigation<any>();
  const { theme, mode, toggle } = useTheme();
  const s = styles(theme);

  // subscribe properly
  const queue = usePlayerStore((st: any) => st.queue ?? []);
  const currentIndex = usePlayerStore((st: any) => st.currentIndex ?? 0);

  // These MAY exist in your store; if not, we fallback to zustand setState.
  const removeAt = usePlayerStore(
    (st: any) =>
      (st.removeAt ?? st.removeFromQueue ?? st.removeQueueItem ?? st.remove ?? null) as
        | null
        | ((i: number) => void)
  );

  const setQueueAndPlay = usePlayerStore(
    (st: any) =>
      (st.setQueueAndPlay ??
        st.playFromQueue ??
        st.playAt ??
        st.setCurrentIndexAndPlay ??
        st.setIndexAndPlay ??
        null) as null | ((songs: any[], i: number) => void)
  );

  const setIndexOnly = usePlayerStore(
    (st: any) => (st.setCurrentIndex ?? st.setIndex ?? st.setCurrent ?? null) as null | ((i: number) => void)
  );

  const play = usePlayerStore(
    (st: any) => (st.play ?? st.resume ?? st.start ?? st.playCurrent ?? null) as null | (() => void)
  );

  // --------- Reorder helpers (works even if store doesn't provide moveUp/moveDown) ----------
  const swap = (arr: any[], i: number, j: number) => {
    const next = arr.slice();
    const tmp = next[i];
    next[i] = next[j];
    next[j] = tmp;
    return next;
  };

  const applyQueueReorder = (nextQueue: any[], nextCurrentIndex: number) => {
    // Prefer any explicit setters if you have them, else fallback to zustand setState.
    // zustand hooks expose setState/getState
    (usePlayerStore as any).setState({ queue: nextQueue, currentIndex: nextCurrentIndex });
  };

  const moveUpLocal = (i: number) => {
    if (i <= 0) return;

    const nextQueue = swap(queue, i, i - 1);

    // adjust currentIndex so the currently-playing song remains consistent
    let nextIdx = currentIndex;
    if (currentIndex === i) nextIdx = i - 1;
    else if (currentIndex === i - 1) nextIdx = i;

    applyQueueReorder(nextQueue, nextIdx);
  };

  const moveDownLocal = (i: number) => {
    if (i >= queue.length - 1) return;

    const nextQueue = swap(queue, i, i + 1);

    let nextIdx = currentIndex;
    if (currentIndex === i) nextIdx = i + 1;
    else if (currentIndex === i + 1) nextIdx = i;

    applyQueueReorder(nextQueue, nextIdx);
  };

  const onPressRow = (i: number) => {
    // best: play immediately at index
    if (setQueueAndPlay) return setQueueAndPlay(queue, i);

    // fallback: set index then play
    setIndexOnly?.(i);
    play?.();
  };

  const keyFor = (item: any, idx: number) => {
    // IMPORTANT: never use index only for reorder lists
    return (
      item?.id?.toString?.() ??
      item?.songId?.toString?.() ??
      item?.url ??
      `${item?.name ?? "song"}|${item?.artists ?? "artist"}|${item?.imageUrl ?? "img"}|${idx}`
    );
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.topBar}>
        <Pressable onPress={() => nav.goBack()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
          <Text style={s.backTxt}>Back</Text>
        </Pressable>

        <Text style={s.title}>Queue</Text>

        <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
          <Pressable onPress={toggle} style={s.modeBtn}>
            <Text style={s.modeTxt}>{mode === "dark" ? "☀" : "🌙"}</Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={queue}
        keyExtractor={keyFor}
        contentContainerStyle={{ paddingBottom: 120 }}
        renderItem={({ item, index }) => {
          const active = index === currentIndex;

          return (
            <Pressable onPress={() => onPressRow(index)} style={[s.row, active && s.rowActive]}>
              <Image source={{ uri: item.imageUrl }} style={s.art} />

              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={s.songName}>
                  {item.name}
                </Text>
                <Text numberOfLines={1} style={s.artist}>
                  {item.artists}
                </Text>
              </View>

              <View style={s.actions}>
                <Pressable onPress={() => moveUpLocal(index)} style={s.iconPill}>
                  <Ionicons name="chevron-up" size={18} color={theme.colors.text} />
                </Pressable>

                <Pressable onPress={() => moveDownLocal(index)} style={s.iconPill}>
                  <Ionicons name="chevron-down" size={18} color={theme.colors.text} />
                </Pressable>

                <Pressable onPress={() => removeAt?.(index)} style={s.removePill}>
                  <Ionicons name="close" size={18} color="white" />
                </Pressable>
              </View>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = (theme: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg, paddingHorizontal: 16 },

    topBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: 6,
      paddingBottom: 10,
    },

    backBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 8 },
    backTxt: { color: theme.colors.text, fontWeight: "900" },

    title: { color: theme.colors.text, fontSize: 18, fontWeight: "900" },

    modeBtn: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    modeTxt: { color: theme.colors.text, fontSize: 18, fontWeight: "900" },

    row: {
      marginTop: 12,
      flexDirection: "row",
      gap: 12,
      alignItems: "center",
      padding: 12,
      borderRadius: theme.radius.lg,
      backgroundColor: theme.colors.surface2,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    rowActive: { borderColor: theme.colors.accent },

    art: { width: 52, height: 52, borderRadius: 16, backgroundColor: theme.colors.surface },
    songName: { color: theme.colors.text, fontSize: 14, fontWeight: "900" },
    artist: { color: theme.colors.muted, fontSize: 12, marginTop: 2, fontWeight: "700" },

    actions: { flexDirection: "row", alignItems: "center", gap: 8 },

    iconPill: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: "center",
      justifyContent: "center",
    },

    removePill: {
      width: 42,
      height: 38,
      borderRadius: 12,
      backgroundColor: "#B91C1C",
      alignItems: "center",
      justifyContent: "center",
    },
  });
