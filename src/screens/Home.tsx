import React, { useMemo, useState } from "react";
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

export default function Home() {
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
    } catch (e: any) {
      setErr("Search failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    runSearch(0);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.h1}>Music Player</Text>

      <View style={styles.searchRow}>
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search songs..."
          placeholderTextColor="#9CA3AF"
          style={styles.input}
        />
        <Pressable onPress={() => runSearch(0)} style={styles.primaryBtn}>
          <Text style={styles.primaryBtnTxt}>Search</Text>
        </Pressable>
      </View>

      <View style={styles.pager}>
        <Pressable
          disabled={!canPrev || loading}
          onPress={() => runSearch(page - 1)}
          style={[styles.smallBtn, (!canPrev || loading) && styles.disabled]}
        >
          <Text style={styles.smallBtnTxt}>Prev</Text>
        </Pressable>

        <Text style={styles.pageTxt}>Page: {page}</Text>

        <Pressable
          disabled={loading}
          onPress={() => runSearch(page + 1)}
          style={[styles.smallBtn, loading && styles.disabled]}
        >
          <Text style={styles.smallBtnTxt}>Next</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={{ marginTop: 20 }}>
          <ActivityIndicator />
        </View>
      ) : err ? (
        <Text style={styles.err}>{err}</Text>
      ) : null}

      <FlatList
        data={songs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 90 }}
        renderItem={({ item, index }) => (
          <View style={styles.card}>
            <Image source={{ uri: item.imageUrl }} style={styles.art} />
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={styles.title}>
                {item.name}
              </Text>
              <Text numberOfLines={1} style={styles.sub}>
                {item.artists}
              </Text>

              <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
                <Pressable
                  onPress={() => setQueueAndPlay(songs, index)}
                  style={styles.playBtn}
                >
                  <Text style={styles.btnTxt}>Play</Text>
                </Pressable>
                <Pressable
                  onPress={() => playSingle(item)}
                  style={styles.secondaryBtn}
                >
                  <Text style={styles.secondaryBtnTxt}>Play Single</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#0B1220" },
  h1: { color: "white", fontSize: 22, fontWeight: "800", marginBottom: 12 },
  searchRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: "#111827",
    color: "white",
  },
  primaryBtn: {
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "#4F46E5",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnTxt: { color: "white", fontWeight: "800" },
  pager: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
  smallBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#111827",
    borderRadius: 12,
  },
  smallBtnTxt: { color: "white", fontWeight: "700" },
  disabled: { opacity: 0.4 },
  pageTxt: { color: "#9CA3AF", fontWeight: "700" },
  err: { color: "#FCA5A5", marginTop: 12 },
  card: {
    marginTop: 12,
    flexDirection: "row",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#111827",
  },
  art: { width: 56, height: 56, borderRadius: 12, backgroundColor: "#374151" },
  title: { color: "white", fontSize: 15, fontWeight: "800" },
  sub: { color: "#9CA3AF", fontSize: 12, marginTop: 2 },
  playBtn: {
    backgroundColor: "#22C55E",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  btnTxt: { color: "white", fontWeight: "800" },
  secondaryBtn: {
    backgroundColor: "#1F2937",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  secondaryBtnTxt: { color: "white", fontWeight: "700" },
});
