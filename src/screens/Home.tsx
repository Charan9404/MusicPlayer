import React, { useMemo, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { searchSongs, type SaavnSong } from "../api/saavn";
import { usePlayerStore } from "../store/playerStore";
import { useTheme } from "../theme/ThemeProvider";

export default function Home() {
  const { theme, mode, toggle } = useTheme();
  const s = styles(theme);

  const [q, setQ] = useState("Believer");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [songs, setSongs] = useState<SaavnSong[]>([]);
  const [err, setErr] = useState("");

  const { setQueueAndPlay, playSingle } = usePlayerStore();

  const canPrev = useMemo(() => page > 0, [page]);

  const runSearch = async (nextPage = 0) => {
    const query = q.trim();
    if (!query) return;

    try {
      setErr("");
      setLoading(true);
      const res = await searchSongs(query, nextPage, 10);
      setSongs(res);
      setPage(nextPage);
    } catch (e) {
      setErr("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    runSearch(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SafeAreaView style={s.container}>
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.brand}>Music Player</Text>

        <Pressable onPress={toggle} style={s.modeBtn}>
          <Text style={s.modeTxt}>{mode === "dark" ? "☀" : "🌙"}</Text>
        </Pressable>
      </View>

      <View style={s.searchRow}>
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search songs..."
          placeholderTextColor={theme.colors.muted}
          style={s.input}
        />
        <Pressable onPress={() => runSearch(0)} style={s.searchBtn}>
          <Text style={s.searchTxt}>Search</Text>
        </Pressable>
      </View>

      <View style={s.pager}>
        <Pressable
          disabled={!canPrev || loading}
          onPress={() => runSearch(page - 1)}
          style={[s.pillBtn, (!canPrev || loading) && s.disabled]}
        >
          <Text style={s.pillTxt}>Prev</Text>
        </Pressable>

        <Text style={s.pageTxt}>Page: {page}</Text>

        <Pressable
          disabled={loading}
          onPress={() => runSearch(page + 1)}
          style={[s.pillBtn, loading && s.disabled]}
        >
          <Text style={s.pillTxt}>Next</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={{ marginTop: 14 }}>
          <ActivityIndicator />
        </View>
      ) : err ? (
        <Text style={s.err}>{err}</Text>
      ) : null}

      <FlatList
        data={songs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 140 }}
        renderItem={({ item, index }) => (
          <View style={s.card}>
            <Image source={{ uri: item.imageUrl }} style={s.art} />
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={s.title}>
                {item.name}
              </Text>
              <Text numberOfLines={1} style={s.sub}>
                {item.artists}
              </Text>

              <View style={s.actions}>
                <Pressable onPress={() => setQueueAndPlay(songs, index)} style={s.playBtn}>
                  <Text style={s.playTxt}>Play</Text>
                </Pressable>

                <Pressable onPress={() => playSingle(item)} style={s.secondaryBtn}>
                  <Text style={s.secondaryTxt}>Play Single</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  </SafeAreaView>);
  
}

const styles = (theme: any) =>
  StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: theme.colors.bg },

    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    brand: { color: theme.colors.text, fontSize: 22, fontWeight: "900" },

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

    searchRow: { flexDirection: "row", gap: 10, alignItems: "center" },
    input: {
      flex: 1,
      height: 46,
      borderRadius: theme.radius.pill,
      paddingHorizontal: 14,
      backgroundColor: theme.colors.surface,
      color: theme.colors.text,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    searchBtn: {
      height: 46,
      paddingHorizontal: 18,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    searchTxt: { color: "white", fontWeight: "900" },

    pager: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 12,
    },
    pillBtn: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    pillTxt: { color: theme.colors.text, fontWeight: "800" },
    disabled: { opacity: 0.4 },
    pageTxt: { color: theme.colors.muted, fontWeight: "800" },
    err: { color: theme.colors.danger, marginTop: 12, fontWeight: "700" },

    card: {
      marginTop: 12,
      flexDirection: "row",
      gap: 12,
      padding: 12,
      borderRadius: theme.radius.lg,
      backgroundColor: theme.colors.surface2,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    art: { width: 58, height: 58, borderRadius: 16, backgroundColor: theme.colors.surface },
    title: { color: theme.colors.text, fontSize: 15, fontWeight: "900" },
    sub: { color: theme.colors.muted, fontSize: 12, marginTop: 2 },

    actions: { flexDirection: "row", gap: 10, marginTop: 10 },
    playBtn: {
      backgroundColor: theme.colors.accent,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: theme.radius.pill,
    },
    playTxt: { color: "white", fontWeight: "900" },

    secondaryBtn: {
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: theme.radius.pill,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    secondaryTxt: { color: theme.colors.text, fontWeight: "800" },
  });
