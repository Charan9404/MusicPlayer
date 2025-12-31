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

  const queue = usePlayerStore((st: any) => st.queue ?? []);
  const currentIndex = usePlayerStore((st: any) => st.currentIndex ?? 0);

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

  // ---------- reorder helpers ----------
  const swap = (arr: any[], i: number, j: number) => {
    const next = arr.slice();
    const tmp = next[i];
    next[i] = next[j];
    next[j] = tmp;
    return next;
  };

  const applyQueueReorder = (nextQueue: any[], nextCurrentIndex: number) => {
    (usePlayerStore as any).setState({ queue: nextQueue, currentIndex: nextCurrentIndex });
  };

  const moveUpLocal = (i: number) => {
    if (i <= 0) return;
    const nextQueue = swap(queue, i, i - 1);

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
    if (setQueueAndPlay) return setQueueAndPlay(queue, i);
    setIndexOnly?.(i);
    play?.();
  };

  const keyFor = (item: any, idx: number) => {
    return (
      item?.id?.toString?.() ??
      item?.songId?.toString?.() ??
      item?.url ??
      `${item?.name ?? "song"}|${item?.artists ?? "artist"}|${item?.imageUrl ?? "img"}|${idx}`
    );
  };

  const ListHeader = () => (
    <View style={s.headerRow}>
      <Pressable onPress={() => nav.goBack()} style={s.iconBtn} hitSlop={10}>
        <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
      </Pressable>

      <Text style={s.headerTitle}>Queue</Text>

      <Pressable onPress={toggle} style={s.iconBtn} hitSlop={10}>
        <Text style={s.modeTxt}>{mode === "dark" ? "☀" : "🌙"}</Text>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={s.container}>
      <FlatList
        data={queue}
        keyExtractor={keyFor}
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 6 }}
        ListHeaderComponent={<ListHeader />}
        ItemSeparatorComponent={() => <View style={s.sep} />}
        renderItem={({ item, index }) => {
          const active = index === currentIndex;

          return (
            <Pressable onPress={() => onPressRow(index)} style={s.row}>
              {/* Active indicator bar */}
              <View style={[s.activeBar, active && s.activeBarOn]} />

              <Image source={{ uri: item.imageUrl }} style={s.art} />

              <View style={{ flex: 1 }}>
                {active ? <Text style={s.nowPlaying}>Now playing</Text> : null}

                <Text numberOfLines={1} style={s.songName}>
                  {item.name}
                </Text>

                <Text numberOfLines={1} style={s.artist}>
                  {item.artists}
                </Text>
              </View>

              <View style={s.actions}>
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    moveUpLocal(index);
                  }}
                  style={s.smallBtn}
                  hitSlop={10}
                >
                  <Ionicons name="chevron-up" size={18} color={theme.colors.text} />
                </Pressable>

                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    moveDownLocal(index);
                  }}
                  style={s.smallBtn}
                  hitSlop={10}
                >
                  <Ionicons name="chevron-down" size={18} color={theme.colors.text} />
                </Pressable>

                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    removeAt?.(index);
                  }}
                  style={s.deleteBtn}
                  hitSlop={10}
                >
                  <Ionicons name="close" size={18} color={"white"} />
                </Pressable>
              </View>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = (theme: any) => {
  const isDark = theme.mode === "dark";
  const rowBg = theme.colors.surface2 ?? theme.colors.surface;

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg, paddingHorizontal: 16 },

    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingBottom: 10,
    },
    headerTitle: { color: theme.colors.text, fontSize: 16, fontWeight: "900" },

    iconBtn: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "transparent",
    },
    modeTxt: { color: theme.colors.text, fontSize: 16, fontWeight: "900" },

    // subtle separators instead of shadows
    sep: {
      height: 10,
    },

    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: theme.radius.lg,
      backgroundColor: rowBg,
      overflow: "hidden",
    },

    // Active accent bar (cleaner than shaded highlight)
    activeBar: {
      width: 3,
      height: "100%",
      borderRadius: 2,
      backgroundColor: "transparent",
    },
    activeBarOn: {
      backgroundColor: theme.colors.accent,
    },

    art: { width: 54, height: 54, borderRadius: 16, backgroundColor: theme.colors.surface },

    nowPlaying: {
      color: theme.colors.accent,
      fontSize: 11,
      fontWeight: "900",
      marginBottom: 2,
    },

    songName: { color: theme.colors.text, fontSize: 14, fontWeight: "900" },
    artist: { color: theme.colors.muted, fontSize: 12, marginTop: 2, fontWeight: "700" },

    actions: { flexDirection: "row", alignItems: "center", gap: 8 },

    // flat small buttons (no borders/shadows)
    smallBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
    },

    // smaller + cleaner delete
    deleteBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? "#EF4444" : "#F43F5E",
    },
  });
};
