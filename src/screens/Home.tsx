import React, { useMemo, useRef, useState } from "react";
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
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { searchSongs, type SaavnSong } from "../api/saavn";
import { usePlayerStore } from "../store/playerStore";
import { useTheme } from "../theme/ThemeProvider";

type TabKey = "Suggested" | "Songs" | "Artists" | "Albums";

type SortKey =
  | "Ascending"
  | "Descending"
  | "Artist"
  | "Album"
  | "Year"
  | "Date Added"
  | "Date Modified"
  | "Composer";

function primaryArtist(artists: string) {
  if (!artists) return "";
  const a = artists.split(",")[0]?.trim();
  return a || artists.trim();
}

function getAlbumName(s: any) {
  return s?.album?.name ?? s?.albumName ?? s?.album ?? s?.more_info?.album ?? "";
}

function formatDuration(seconds?: number) {
  if (!seconds || Number.isNaN(seconds)) return "";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function Home() {
  const { theme, mode, toggle } = useTheme();
  const s = styles(theme);

  const [activeTab, setActiveTab] = useState<TabKey>("Suggested");

  // ✅ Search toggle state
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef<TextInput>(null);

  const [q, setQ] = useState("Believer");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [songs, setSongs] = useState<SaavnSong[]>([]);
  const [err, setErr] = useState("");

  const [sortOpen, setSortOpen] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("Ascending");

  const { setQueueAndPlay } = usePlayerStore();

  const runSearch = async (nextPage = 0) => {
    const query = q.trim();
    if (!query) return;

    try {
      setErr("");
      setLoading(true);
      const res = await searchSongs(query, nextPage, 10);
      setSongs(res);
      setPage(nextPage);
    } catch {
      setErr("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    runSearch(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canPrev = useMemo(() => page > 0, [page]);

  const artists = useMemo(() => {
    const map = new Map<string, string>(); // name -> imageUrl
    for (const item of songs) {
      const name = primaryArtist(item.artists);
      if (!name) continue;
      if (!map.has(name)) map.set(name, item.imageUrl);
    }
    return Array.from(map.entries()).map(([name, imageUrl]) => ({
      id: name,
      name,
      imageUrl,
    }));
  }, [songs]);

  const albums = useMemo(() => {
    const map = new Map<string, string>(); // album -> imageUrl
    for (const item of songs as any[]) {
      const album = getAlbumName(item);
      if (!album) continue;
      if (!map.has(album)) map.set(album, item.imageUrl);
    }
    return Array.from(map.entries()).map(([name, imageUrl]) => ({
      id: name,
      name,
      imageUrl,
    }));
  }, [songs]);

  const sortedSongs = useMemo(() => {
    const arr = [...songs] as any[];

    const byName = (a: any, b: any) =>
      String(a?.name ?? "").localeCompare(String(b?.name ?? ""));
    const byArtist = (a: any, b: any) =>
      String(primaryArtist(a?.artists ?? "")).localeCompare(
        String(primaryArtist(b?.artists ?? ""))
      );
    const byAlbum = (a: any, b: any) =>
      String(getAlbumName(a)).localeCompare(String(getAlbumName(b)));

    switch (sortKey) {
      case "Ascending":
        arr.sort(byName);
        break;
      case "Descending":
        arr.sort((a, b) => byName(b, a));
        break;
      case "Artist":
        arr.sort(byArtist);
        break;
      case "Album":
        arr.sort(byAlbum);
        break;
      default:
        arr.sort(byName);
        break;
    }

    return arr as SaavnSong[];
  }, [songs, sortKey]);

  const TabPill = ({ label }: { label: TabKey }) => {
    const isActive = activeTab === label;
    return (
      <Pressable
        onPress={() => setActiveTab(label)}
        style={[s.tabBtn, isActive && s.tabBtnActive]}
      >
        <Text style={[s.tabTxt, isActive && s.tabTxtActive]}>{label}</Text>
        {isActive ? <View style={s.tabUnderline} /> : null}
      </Pressable>
    );
  };

  const SectionHeader = ({
    title,
    rightText,
    onRightPress,
  }: {
    title: string;
    rightText?: string;
    onRightPress?: () => void;
  }) => (
    <View style={s.sectionHeader}>
      <Text style={s.sectionTitle}>{title}</Text>

      {rightText ? (
        <Pressable onPress={onRightPress}>
          <Text style={s.sectionRight}>{rightText}</Text>
        </Pressable>
      ) : (
        <View />
      )}
    </View>
  );

  const SuggestedCard = ({
    item,
    subtitle,
    onPress,
    rounded = 18,
  }: {
    item: { imageUrl: string; name: string };
    subtitle?: string;
    onPress?: () => void;
    rounded?: number;
  }) => (
    <Pressable onPress={onPress} style={s.suggCard}>
      <Image
        source={{ uri: item.imageUrl }}
        style={[s.suggArt, { borderRadius: rounded }]}
      />
      <Text numberOfLines={1} style={s.suggTitle}>
        {item.name}
      </Text>
      {subtitle ? (
        <Text numberOfLines={1} style={s.suggSub}>
          {subtitle}
        </Text>
      ) : null}
    </Pressable>
  );

  const renderSongRow = ({ item, index }: { item: SaavnSong; index: number }) => {
    const dur = (item as any)?.duration;
    const durTxt = typeof dur === "number" ? formatDuration(dur) : "";

    return (
      <Pressable onPress={() => setQueueAndPlay(sortedSongs, index)} style={s.row}>
        <Image source={{ uri: item.imageUrl }} style={s.rowArt} />

        <View style={s.rowMid}>
          <Text numberOfLines={1} style={s.rowTitle}>
            {item.name}
          </Text>
          <View style={s.rowMeta}>
            <Text numberOfLines={1} style={s.rowSub}>
              {item.artists}
            </Text>
            {durTxt ? <Text style={s.rowDot}> • </Text> : null}
            {durTxt ? <Text style={s.rowDur}>{durTxt}</Text> : null}
          </View>
        </View>

        <Pressable onPress={() => setQueueAndPlay(sortedSongs, index)} style={s.playCircle}>
          <Ionicons name="play" size={16} color={"white"} />
        </Pressable>

        <Pressable onPress={() => {}} style={s.moreBtn}>
          <Ionicons name="ellipsis-vertical" size={18} color={theme.colors.muted} />
        </Pressable>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      {/* Top bar */}
      <View style={s.topBar}>
        <View style={s.brandRow}>
          <View style={s.brandIcon}>
            <Ionicons name="musical-notes" size={18} color={theme.colors.accent} />
          </View>
          <Text style={s.brand}>Music Player</Text>
        </View>

        <View style={{ flexDirection: "row", gap: 10 }}>
          {/* ✅ Search toggle button */}
          <Pressable
            onPress={() => {
              setShowSearch((prev) => {
                const next = !prev;

                // When showing search: go to Songs tab and focus input
                if (next) {
                  setActiveTab("Songs");
                  setTimeout(() => searchRef.current?.focus(), 80);
                }
                return next;
              });
            }}
            style={s.topIconBtn}
          >
            <Ionicons name="search" size={18} color={theme.colors.text} />
          </Pressable>

          <Pressable onPress={toggle} style={s.topIconBtn}>
            <Text style={s.modeTxt}>{mode === "dark" ? "☀" : "🌙"}</Text>
          </Pressable>
        </View>
      </View>

      {/* Tabs */}
      <View style={s.tabsRow}>
        <TabPill label="Suggested" />
        <TabPill label="Songs" />
        <TabPill label="Artists" />
        <TabPill label="Albums" />
      </View>

      {/* ✅ Search area ONLY when showSearch = true */}
      {showSearch ? (
        <>
          <View style={s.searchWrap}>
            <View style={s.searchPill}>
              <Ionicons name="search" size={16} color={theme.colors.muted} />
              <TextInput
                ref={searchRef}
                value={q}
                onChangeText={setQ}
                placeholder="Search songs..."
                placeholderTextColor={theme.colors.muted}
                style={s.searchInput}
                returnKeyType="search"
                onSubmitEditing={() => runSearch(0)}
              />
            </View>

            <Pressable onPress={() => runSearch(0)} style={s.searchGo}>
              <Text style={s.searchGoTxt}>Go</Text>
            </Pressable>
          </View>

          <View style={s.pagerRow}>
            <Pressable
              disabled={!canPrev || loading}
              onPress={() => runSearch(page - 1)}
              style={[s.pagerBtn, (!canPrev || loading) && s.disabled]}
            >
              <Ionicons name="chevron-back" size={16} color={theme.colors.text} />
              <Text style={s.pagerTxt}>Prev</Text>
            </Pressable>

            <Text style={s.pageTxt}>Page {page}</Text>

            <Pressable
              disabled={loading}
              onPress={() => runSearch(page + 1)}
              style={[s.pagerBtn, loading && s.disabled]}
            >
              <Text style={s.pagerTxt}>Next</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.text} />
            </Pressable>
          </View>

          {loading ? (
            <View style={{ marginTop: 10 }}>
              <ActivityIndicator />
            </View>
          ) : err ? (
            <Text style={s.err}>{err}</Text>
          ) : null}
        </>
      ) : null}

      {/* Content */}
      {activeTab === "Suggested" ? (
        <FlatList
          data={[1]}
          keyExtractor={() => "suggested"}
          contentContainerStyle={{ paddingBottom: 160 }}
          renderItem={() => (
            <View>
              {/* ✅ See all now WORKS */}
              <SectionHeader
                title="Recently Played"
                rightText="See all"
                onRightPress={() => {
                  setShowSearch(false);
                  setActiveTab("Songs");
                }}
              />
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={songs.slice(0, 10)}
                keyExtractor={(it) => it.id}
                contentContainerStyle={{ paddingHorizontal: 14 }}
                renderItem={({ item, index }) => (
                  <SuggestedCard
                    item={{ imageUrl: item.imageUrl, name: item.name }}
                    subtitle={primaryArtist(item.artists)}
                    onPress={() => setQueueAndPlay(songs, index)}
                    rounded={20}
                  />
                )}
              />

              <SectionHeader
                title="Artists"
                rightText="See all"
                onRightPress={() => {
                  setShowSearch(false);
                  setActiveTab("Artists");
                }}
              />
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={artists.slice(0, 12)}
                keyExtractor={(it) => it.id}
                contentContainerStyle={{ paddingHorizontal: 14 }}
                renderItem={({ item }) => (
                  <SuggestedCard
                    item={{ imageUrl: item.imageUrl, name: item.name }}
                    onPress={() => {
                      setQ(item.name);
                      setActiveTab("Songs");
                      setShowSearch(true);
                      setTimeout(() => searchRef.current?.focus(), 80);
                      runSearch(0);
                    }}
                    rounded={999}
                  />
                )}
              />

              <SectionHeader
                title="Albums"
                rightText="See all"
                onRightPress={() => {
                  setShowSearch(false);
                  setActiveTab("Albums");
                }}
              />
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={albums.slice(0, 12)}
                keyExtractor={(it) => it.id}
                contentContainerStyle={{ paddingHorizontal: 14 }}
                renderItem={({ item }) => (
                  <SuggestedCard
                    item={{ imageUrl: item.imageUrl, name: item.name }}
                    onPress={() => {}}
                    rounded={18}
                  />
                )}
              />

              <View style={{ height: 10 }} />
            </View>
          )}
        />
      ) : activeTab === "Songs" ? (
        <FlatList
          data={sortedSongs}
          keyExtractor={(it) => it.id}
          contentContainerStyle={{ paddingBottom: 160 }}
          ListHeaderComponent={
            <View style={s.songsHeader}>
              <Text style={s.songsCount}>{sortedSongs.length} songs</Text>

              <Pressable onPress={() => setSortOpen(true)} style={s.sortBtn}>
                <Text style={s.sortTxt}>{sortKey}</Text>
                <Ionicons name="swap-vertical" size={16} color={theme.colors.accent} />
              </Pressable>
            </View>
          }
          renderItem={renderSongRow}
        />
      ) : activeTab === "Artists" ? (
        <FlatList
          data={artists}
          keyExtractor={(it) => it.id}
          contentContainerStyle={{ paddingBottom: 160, paddingHorizontal: 14 }}
          ListHeaderComponent={<Text style={s.bigListTitle}>Artists</Text>}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                setQ(item.name);
                setActiveTab("Songs");
                setShowSearch(true);
                setTimeout(() => searchRef.current?.focus(), 80);
                runSearch(0);
              }}
              style={s.simpleRow}
            >
              <Image source={{ uri: item.imageUrl }} style={s.simpleAvatar} />
              <Text style={s.simpleTitle}>{item.name}</Text>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.muted} />
            </Pressable>
          )}
        />
      ) : (
        <FlatList
          data={albums}
          keyExtractor={(it) => it.id}
          contentContainerStyle={{ paddingBottom: 160, paddingHorizontal: 14 }}
          ListHeaderComponent={<Text style={s.bigListTitle}>Albums</Text>}
          renderItem={({ item }) => (
            <View style={s.simpleRow}>
              <Image source={{ uri: item.imageUrl }} style={s.simpleAlbum} />
              <Text numberOfLines={1} style={s.simpleTitle}>
                {item.name}
              </Text>
            </View>
          )}
        />
      )}

      {/* Sort Modal */}
      <Modal transparent visible={sortOpen} animationType="fade" onRequestClose={() => setSortOpen(false)}>
        <Pressable style={s.modalOverlay} onPress={() => setSortOpen(false)}>
          <Pressable style={s.modalCard} onPress={() => {}}>
            {(
              [
                "Ascending",
                "Descending",
                "Artist",
                "Album",
                "Year",
                "Date Added",
                "Date Modified",
                "Composer",
              ] as SortKey[]
            ).map((k) => {
              const active = k === sortKey;
              return (
                <Pressable
                  key={k}
                  onPress={() => {
                    setSortKey(k);
                    setSortOpen(false);
                  }}
                  style={s.modalRow}
                >
                  <Text style={[s.modalTxt, active && s.modalTxtActive]}>{k}</Text>
                  <View style={[s.radio, active && s.radioOn]} />
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = (theme: any) => {
  const surface2 = theme.colors.surface2 ?? theme.colors.surface;

  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.colors.bg },

    topBar: {
      paddingHorizontal: 14,
      paddingTop: 6,
      paddingBottom: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    brandIcon: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    brand: { color: theme.colors.text, fontSize: 20, fontWeight: "900" },

    topIconBtn: {
      width: 40,
      height: 40,
      borderRadius: 14,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    modeTxt: { color: theme.colors.text, fontSize: 16, fontWeight: "900" },

    tabsRow: {
      paddingHorizontal: 14,
      flexDirection: "row",
      gap: 14,
      alignItems: "flex-end",
      paddingBottom: 6,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    tabBtn: { paddingVertical: 8 },
    tabBtnActive: {},
    tabTxt: { color: theme.colors.muted, fontWeight: "800" },
    tabTxtActive: { color: theme.colors.accent },
    tabUnderline: {
      height: 3,
      borderRadius: 2,
      backgroundColor: theme.colors.accent,
      marginTop: 8,
      width: 26,
    },

    searchWrap: {
      paddingHorizontal: 14,
      paddingTop: 12,
      flexDirection: "row",
      gap: 10,
      alignItems: "center",
    },
    searchPill: {
      flex: 1,
      height: 46,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    searchInput: { flex: 1, color: theme.colors.text, fontWeight: "700" },
    searchGo: {
      height: 46,
      paddingHorizontal: 18,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    searchGoTxt: { color: "white", fontWeight: "900" },

    pagerRow: {
      paddingHorizontal: 14,
      paddingTop: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    pagerBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    pagerTxt: { color: theme.colors.text, fontWeight: "800" },
    pageTxt: { color: theme.colors.muted, fontWeight: "800" },
    disabled: { opacity: 0.4 },

    err: { color: theme.colors.danger, paddingHorizontal: 14, paddingTop: 10, fontWeight: "800" },

    sectionHeader: {
      paddingHorizontal: 14,
      paddingTop: 18,
      paddingBottom: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    sectionTitle: { color: theme.colors.text, fontSize: 16, fontWeight: "900" },
    sectionRight: { color: theme.colors.accent, fontWeight: "900" },

    suggCard: { width: 132, marginRight: 12 },
    suggArt: {
      width: 132,
      height: 132,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    suggTitle: { marginTop: 8, color: theme.colors.text, fontWeight: "900" },
    suggSub: { marginTop: 2, color: theme.colors.muted, fontWeight: "700", fontSize: 12 },

    songsHeader: {
      paddingHorizontal: 14,
      paddingTop: 14,
      paddingBottom: 8,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    songsCount: { color: theme.colors.text, fontWeight: "900" },
    sortBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    sortTxt: { color: theme.colors.accent, fontWeight: "900" },

    row: {
      marginHorizontal: 14,
      marginTop: 10,
      padding: 12,
      borderRadius: theme.radius.lg,
      backgroundColor: surface2,
      borderWidth: 1,
      borderColor: theme.colors.border,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    rowArt: { width: 54, height: 54, borderRadius: 16, backgroundColor: theme.colors.surface },
    rowMid: { flex: 1 },
    rowTitle: { color: theme.colors.text, fontSize: 14, fontWeight: "900" },
    rowMeta: { flexDirection: "row", alignItems: "center", marginTop: 4 },
    rowSub: { flex: 1, color: theme.colors.muted, fontSize: 12, fontWeight: "700" },
    rowDot: { color: theme.colors.muted, fontWeight: "900" },
    rowDur: { color: theme.colors.muted, fontSize: 12, fontWeight: "800" },

    playCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    moreBtn: { width: 34, height: 34, borderRadius: 14, alignItems: "center", justifyContent: "center" },

    bigListTitle: {
      paddingTop: 14,
      paddingBottom: 8,
      color: theme.colors.text,
      fontSize: 18,
      fontWeight: "900",
    },
    simpleRow: {
      marginTop: 10,
      padding: 12,
      borderRadius: theme.radius.lg,
      backgroundColor: surface2,
      borderWidth: 1,
      borderColor: theme.colors.border,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    simpleAvatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: theme.colors.surface },
    simpleAlbum: { width: 46, height: 46, borderRadius: 14, backgroundColor: theme.colors.surface },
    simpleTitle: { flex: 1, color: theme.colors.text, fontWeight: "900" },

    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.35)",
      alignItems: "flex-end",
      justifyContent: "flex-start",
      paddingTop: 200,
      paddingRight: 14,
    },
    modalCard: {
      width: 220,
      borderRadius: theme.radius.lg,
      backgroundColor: surface2,
      borderWidth: 1,
      borderColor: theme.colors.border,
      overflow: "hidden",
    },
    modalRow: {
      paddingHorizontal: 14,
      paddingVertical: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    modalTxt: { color: theme.colors.text, fontWeight: "800" },
    modalTxtActive: { color: theme.colors.accent, fontWeight: "900" },
    radio: {
      width: 14,
      height: 14,
      borderRadius: 7,
      borderWidth: 2,
      borderColor: theme.colors.accent,
      opacity: 0.35,
    },
    radioOn: { opacity: 1, backgroundColor: theme.colors.accent },
  });
};
