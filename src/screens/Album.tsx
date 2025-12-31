import React, { useMemo } from "react";
import { View, Text, FlatList, Image, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTheme } from "../theme/ThemeProvider";
import { usePlayerStore } from "../store/playerStore";
import { SkeletonSongsList } from "../components/Skeleton";

function getAlbumRaw(s: any) {
  return s?.album?.name ?? s?.albumName ?? s?.album ?? s?.more_info?.album ?? "";
}
function getAlbumDisplayName(s: any) {
  const raw = String(getAlbumRaw(s) ?? "").trim();
  return raw || String(s?.name ?? "Single").trim(); // fallback for singles
}

export default function Album() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const { theme } = useTheme();
  const s = styles(theme);

  // Home/nav passes `songs`, older builds passed `sourceSongs`
  const { albumName, songs, sourceSongs, seedSong } = route.params ?? {};
  const allSongs = (songs ?? sourceSongs ?? (seedSong ? [seedSong] : [])) as any[];

  const albumSongs = useMemo(() => {
    // If caller already provided filtered songs, use them directly.
    if (Array.isArray(songs) && songs.length) return songs;
    const name = String(albumName ?? "").trim().toLowerCase();
    return (allSongs ?? []).filter((x: any) => getAlbumDisplayName(x).toLowerCase() === name);
  }, [albumName, allSongs, songs]);

  const { setQueueAndPlay } = usePlayerStore();

  return (
    <SafeAreaView style={s.container}>
      <View style={s.topBar}>
        <Pressable onPress={() => nav.goBack()} style={s.iconBtn} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
        </Pressable>
        <Text numberOfLines={1} style={s.title}>{albumName ?? "Album"}</Text>
        <View style={{ width: 42 }} />
      </View>

      <Text style={s.count}>{albumSongs.length} songs</Text>

      {albumSongs.length === 0 ? (
        <SkeletonSongsList count={10} />
      ) : (
        <FlatList
          data={albumSongs}
          keyExtractor={(it: any, idx: number) => it?.id?.toString?.() ?? `${it?.name}|${idx}`}
          contentContainerStyle={{ paddingBottom: 120 }}
          renderItem={({ item, index }) => (
            <Pressable onPress={() => setQueueAndPlay(albumSongs, index)} style={s.row}>
              <Image source={{ uri: item.imageUrl }} style={s.art} />
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={s.song}>{item.name}</Text>
                <Text numberOfLines={1} style={s.sub}>{item.artists}</Text>
              </View>
              <View style={s.playBtn}>
                <Ionicons name="play" size={16} color={"white"} />
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = (theme: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bg, paddingHorizontal: 14 },
    topBar: {
      paddingVertical: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    iconBtn: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "transparent",
    },
    title: { flex: 1, textAlign: "center", color: theme.colors.text, fontWeight: "900" },
    count: { color: theme.colors.muted, fontWeight: "800", marginBottom: 10 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 12,
      borderRadius: theme.radius.lg,
      backgroundColor: theme.colors.surface2 ?? theme.colors.surface,
      marginBottom: 10,
    },
    art: { width: 54, height: 54, borderRadius: 16, backgroundColor: theme.colors.surface },
    song: { color: theme.colors.text, fontWeight: "900" },
    sub: { color: theme.colors.muted, fontWeight: "700", fontSize: 12, marginTop: 2 },
    playBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: theme.colors.accent,
      alignItems: "center",
      justifyContent: "center",
    },
  });
