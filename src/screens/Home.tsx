import React, { useMemo, useRef, useState } from "react";
import { SkeletonSongsList, SkeletonSuggestedSections } from "../components/Skeleton";

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
  Alert,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused, useNavigation, useRoute } from "@react-navigation/native";

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

function primaryArtist(s: string) {
  if (!s) return "";
  const parts = String(s)
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  return parts[0] ?? "";
}

function getAlbumName(s: any) {
  return (
    s?.albumName ??
    s?.album?.name ??
    s?.more_info?.album ??
    s?.album ??
    s?.more_info?.album_title ??
    ""
  );
}
function getAlbumId(s: any) {
  return s?.albumId ?? s?.album?.id ?? s?.more_info?.album_id ?? "";
}
function getImageUrl(s: any) {
  return (
    s?.imageUrl ??
    s?.image?.[2]?.link ??
    s?.image?.[2]?.url ??
    s?.image?.[s?.image?.length - 1]?.link ??
    s?.image?.[s?.image?.length - 1]?.url ??
    s?.image ??
    ""
  );
}

function normalizeSong(x: any) {
  const id = String(
    x?.id ??
      x?.songId ??
      x?._id ??
      x?.url ??
      x?.perma_url ??
      `${x?.name ?? "song"}-${Math.random()}`
  );
  const name = String(x?.name ?? x?.title ?? "");
  const artists = String(
    x?.artists ??
      x?.primaryArtists ??
      x?.primary_artists ??
      x?.subtitle ??
      x?.more_info?.artistMap?.primary?.map((a: any) => a?.name).filter(Boolean).join(", ") ??
      ""
  );
  const imageUrl = String(getImageUrl(x) ?? "");
  const duration = Number(x?.duration ?? x?.more_info?.duration ?? 0);
  const albumName = String(getAlbumName(x) ?? "");
  const albumId = String(getAlbumId(x) ?? "");
  const year = String(x?.year ?? x?.more_info?.year ?? "");

  return { ...x, id, name, artists, imageUrl, duration, albumName, albumId, year };
}

function formatDuration(seconds?: number) {
  if (!seconds || Number.isNaN(seconds)) return "";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Simple Bottom Action Sheet (no external deps) */
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

export default function Home() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const isFocused = useIsFocused();
  const { theme, mode, toggle } = useTheme();
  const s = styles(theme);

  const PAGE_SIZE = 10;

  const inputRef = useRef<TextInput | null>(null);
  const songsListRef = useRef<FlatList<any> | null>(null);

  const [activeTab, setActiveTab] = useState<TabKey>("Suggested");
  const [showSearch, setShowSearch] = useState(false);

  const [q, setQ] = useState("Believer");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [songs, setSongs] = useState<any[]>([]);
  const [err, setErr] = useState("");

  const [sortOpen, setSortOpen] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("Ascending");
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);

  // sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetSong, setSheetSong] = useState<any | null>(null);

  // Store actions
  const setQueueAndPlay = usePlayerStore((st: any) => st.setQueueAndPlay);
  const storeQueue = usePlayerStore((st: any) => st.queue ?? []);
  const currentIndex = usePlayerStore((st: any) => st.currentIndex ?? 0);

  const runSearch = async (nextPage = 0, overrideQuery?: string, keepSelectedArtist = false) => {
    const query = (overrideQuery ?? q).trim();
    if (!query) return;

    if (!keepSelectedArtist) setSelectedArtist(null);

    try {
      setErr("");
      setLoading(true);

      const res = await searchSongs(query, nextPage, PAGE_SIZE);
      const normalized = (res ?? []).map((x: SaavnSong) => normalizeSong(x));

      setSongs(normalized);
      setHasMore((normalized?.length ?? 0) >= PAGE_SIZE);
      setPage(nextPage);

      // premium feel: jump to top on page change
      setTimeout(() => {
        try {
          songsListRef.current?.scrollToOffset?.({ offset: 0, animated: false });
        } catch {}
      }, 0);
    } catch {
      setErr("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    runSearch(0, q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // auto-hide search outside Songs (premium UX)
  React.useEffect(() => {
    if (!isFocused) return;
    if (activeTab !== "Songs" && showSearch) {
      setShowSearch(false);
      inputRef.current?.blur?.();
    }
  }, [isFocused, activeTab, showSearch]);

  // handle navigation params (Go to Artist / external jump)
  React.useEffect(() => {
    const p = route?.params;
    if (!p) return;

    const incomingArtist = typeof p.selectedArtist === "string" ? p.selectedArtist : null;
    if (incomingArtist) setSelectedArtist(incomingArtist);

    if (p.initialTab) setActiveTab(p.initialTab);

    if (typeof p.query === "string") {
      setQ(p.query);
      setShowSearch(true);
      setActiveTab("Songs");
      runSearch(0, p.query, !!incomingArtist);
      setTimeout(() => inputRef.current?.focus?.(), 250);
    }
  }, [route?.params]); // eslint-disable-line react-hooks/exhaustive-deps

  const canPrev = useMemo(() => page > 0, [page]);

  const pageChips = useMemo(() => {
    const p = Math.max(0, page);
    if (p < 2) return [0, 1, 2, 3, 4];

    const start = Math.max(0, p - 2);
    const end = p + 2;
    const chips: number[] = [];
    for (let i = start; i <= end; i++) chips.push(i);
    while (chips.length < 5) chips.push(chips[chips.length - 1] + 1);
    return chips;
  }, [page]);

  const artists = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of songs) {
      const name = primaryArtist(item.artists);
      if (!name) continue;
      if (!map.has(name)) map.set(name, item.imageUrl);
    }
    return Array.from(map.entries()).map(([name, imageUrl]) => ({ id: name, name, imageUrl }));
  }, [songs]);

  const albums = useMemo(() => {
    const map = new Map<
      string,
      { id: string; name: string; imageUrl: string; subtitle?: string; albumId?: string }
    >();

    for (const item of songs as any[]) {
      const rawAlbum = String(getAlbumName(item) ?? "").trim();
      const isSingle = !rawAlbum;
      const displayName = isSingle ? String(item?.name ?? "Single") : rawAlbum;
      if (!displayName) continue;

      const key = displayName.toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          id: displayName,
          name: displayName,
          imageUrl: String(item.imageUrl ?? ""),
          subtitle: isSingle ? primaryArtist(item.artists) : undefined,
          albumId: String(item.albumId ?? ""),
        });
      }
    }

    return Array.from(map.values()).slice(0, 60);
  }, [songs]);

  const filteredForArtist = useMemo(() => {
    if (!selectedArtist) return songs;
    const needle = selectedArtist.trim().toLowerCase();
    const filtered = (songs ?? []).filter((it: any) =>
      String(it?.artists ?? "").toLowerCase().includes(needle)
    );
    return filtered.length ? filtered : songs;
  }, [songs, selectedArtist]);

  const sortedSongs = useMemo(() => {
    const arr = [...(filteredForArtist ?? [])] as any[];

    const byName = (a: any, b: any) => String(a?.name ?? "").localeCompare(String(b?.name ?? ""));
    const byArtist = (a: any, b: any) =>
      String(primaryArtist(a?.artists ?? "")).localeCompare(String(primaryArtist(b?.artists ?? "")));
    const byAlbum = (a: any, b: any) => String(getAlbumName(a)).localeCompare(String(getAlbumName(b)));
    const byYear = (a: any, b: any) => String(a?.year ?? "").localeCompare(String(b?.year ?? ""));

    if (sortKey === "Ascending") return arr.sort(byName);
    if (sortKey === "Descending") return arr.sort((a, b) => byName(b, a));
    if (sortKey === "Artist") return arr.sort(byArtist);
    if (sortKey === "Album") return arr.sort(byAlbum);
    if (sortKey === "Year") return arr.sort(byYear);

    return arr.sort(byName);
  }, [filteredForArtist, sortKey]);

  const onToggleSearch = () => {
    setShowSearch((v) => {
      const next = !v;
      if (next) {
        setActiveTab("Songs");
        setTimeout(() => inputRef.current?.focus?.(), 200);
      }
      return next;
    });
  };

  const openSongMenu = (song: any) => {
    setSheetSong(song);
    setSheetOpen(true);
  };

  const insertPlayNext = (song: any) => {
    const q0 = (usePlayerStore as any).getState?.().queue ?? storeQueue ?? [];
    const idx0 = (usePlayerStore as any).getState?.().currentIndex ?? currentIndex ?? 0;

    const next = q0.slice();
    next.splice(Math.min(idx0 + 1, next.length), 0, song);
    (usePlayerStore as any).setState({ queue: next });
  };

  const addToQueue = (song: any) => {
    const q0 = (usePlayerStore as any).getState?.().queue ?? storeQueue ?? [];
    const next = q0.concat([song]);
    (usePlayerStore as any).setState({ queue: next });
  };

  const goToAlbum = (song: any) => {
    const albumName = String(getAlbumName(song) ?? "").trim() || String(song?.name ?? "Album");
    const albumId = String(getAlbumId(song) ?? "");
    nav.navigate("Album", {
      albumName,
      albumId: albumId || undefined,
      seedSong: song,
      songs: sortedSongs.filter(
        (x: any) => String(getAlbumName(x) ?? "").trim().toLowerCase() === albumName.toLowerCase()
      ),
    });
  };

  const goToArtist = (song: any) => {
    const a = primaryArtist(String(song?.artists ?? ""));
    if (!a) return;
    nav.navigate("Home", { initialTab: "Songs", query: a, selectedArtist: a });
  };

  const menuItems = useMemo(() => {
    const sng = sheetSong;
    if (!sng) return [];
    return [
      { icon: "play-skip-forward-outline", label: "Play Next", onPress: () => insertPlayNext(sng) },
      { icon: "list-outline", label: "Add to Playing Queue", onPress: () => addToQueue(sng) },
      { icon: "albums-outline", label: "Go to Album", onPress: () => goToAlbum(sng) },
      { icon: "person-outline", label: "Go to Artist", onPress: () => goToArtist(sng) },
      {
        icon: "information-circle-outline",
        label: "Details",
        onPress: () =>
          Alert.alert("Song Details", `${sng?.name ?? ""}\n${sng?.artists ?? ""}\n${getAlbumName(sng) ?? ""}`),
      },
    ];
  }, [sheetSong]); // eslint-disable-line react-hooks/exhaustive-deps

  const SectionHeader = ({
    title,
    rightText,
    onRightPress,
  }: {
    title: string;
    rightText?: string;
    onRightPress?: () => void;
  }) => (
    <View style={s.sectionHead}>
      <Text style={s.sectionTitle}>{title}</Text>
      {rightText ? (
        <Pressable onPress={onRightPress} hitSlop={8}>
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
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={[s.suggArt, { borderRadius: rounded }]} />
      ) : (
        <View style={[s.suggArt, { borderRadius: rounded, backgroundColor: theme.colors.surface }]} />
      )}
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

  const renderSongRow = ({ item, index }: { item: any; index: number }) => {
    const dur = (item as any)?.duration;
    const durTxt = typeof dur === "number" ? formatDuration(dur) : "";

    return (
      <Pressable onPress={() => setQueueAndPlay(sortedSongs, index)} style={s.row}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={s.rowArt} />
        ) : (
          <View style={[s.rowArt, { backgroundColor: theme.colors.surface }]} />
        )}

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

        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            setQueueAndPlay(sortedSongs, index);
          }}
          style={s.playCircle}
        >
          <Ionicons name="play" size={16} color={"white"} />
        </Pressable>

        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            openSongMenu(item);
          }}
          style={s.moreBtn}
        >
          <Ionicons name="ellipsis-vertical" size={18} color={theme.colors.muted} />
        </Pressable>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      {/* Top bar */}
      <View style={s.top}>
        <View style={s.brand}>
          <View style={s.brandIcon}>
            <Ionicons name="musical-notes" size={18} color={theme.colors.accent} />
          </View>
          <Text style={s.brandTxt}>Music Player</Text>
        </View>

        <View style={s.topBtns}>
          <Pressable onPress={onToggleSearch} style={s.iconBtn}>
            <Ionicons name="search" size={18} color={theme.colors.text} />
          </Pressable>
          <Pressable onPress={toggle} style={s.iconBtn}>
            <Text style={s.modeTxt}>{mode === "dark" ? "☀" : "○"}</Text>
          </Pressable>
        </View>
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        {(["Suggested", "Songs", "Artists", "Albums"] as TabKey[]).map((t) => {
          const active = activeTab === t;
          return (
            <Pressable key={t} onPress={() => setActiveTab(t)} style={s.tabBtn}>
              <Text style={[s.tabTxt, active && s.tabTxtActive]}>{t}</Text>
              {active ? <View style={s.tabUnderline} /> : <View style={{ height: 2 }} />}
            </Pressable>
          );
        })}
      </View>

      {/* Search bar (toggled) */}
      {showSearch ? (
        <View style={s.searchRow}>
          <View style={s.searchBox}>
            <Ionicons name="search" size={16} color={theme.colors.muted} />
            <TextInput
              ref={(r) => {
                if (r) inputRef.current = r;
              }}
              value={q}
              onChangeText={setQ}
              placeholder="Search songs..."
              placeholderTextColor={theme.colors.muted}
              style={s.searchInput}
              returnKeyType="search"
              onSubmitEditing={() => {
                setSelectedArtist(null);
                runSearch(0);
              }}
            />
          </View>
          <Pressable
            style={[s.goBtn, loading && { opacity: 0.6 }]}
            disabled={loading}
            onPress={() => {
              setSelectedArtist(null);
              runSearch(0);
            }}
          >
            <Text style={s.goTxt}>Go</Text>
          </Pressable>
        </View>
      ) : null}

      {/* Premium Pagination (Songs tab only) */}
      {activeTab === "Songs" ? (
        <View style={s.pagerWrap}>
          <Pressable
            disabled={!canPrev || loading}
            onPress={() => runSearch(page - 1, undefined, !!selectedArtist)}
            style={[s.pagerBtn, (!canPrev || loading) && s.disabledBtn]}
            hitSlop={10}
          >
            <Ionicons name="chevron-back" size={18} color={theme.colors.text} />
          </Pressable>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.pagerChips}>
            {pageChips.map((p) => {
              const active = p === page;
              return (
                <Pressable
                  key={`p-${p}`}
                  disabled={loading || active}
                  onPress={() => runSearch(p, undefined, !!selectedArtist)}
                  style={[s.chip, active && s.chipActive, loading && !active && { opacity: 0.7 }]}
                >
                  <Text style={[s.chipTxt, active && s.chipTxtActive]}>{p + 1}</Text>
                </Pressable>
              );
            })}

            {!hasMore ? (
              <View style={s.endPill}>
                <Ionicons name="checkmark-circle" size={16} color={theme.colors.muted} />
                <Text style={s.endTxt}>End</Text>
              </View>
            ) : null}
          </ScrollView>

          <Pressable
            disabled={!hasMore || loading}
            onPress={() => runSearch(page + 1, undefined, !!selectedArtist)}
            style={[s.pagerBtn, (!hasMore || loading) && s.disabledBtn]}
            hitSlop={10}
          >
            <Ionicons name="chevron-forward" size={18} color={theme.colors.text} />
          </Pressable>
        </View>
      ) : null}

      {activeTab === "Suggested" ? (
        loading ? (
          <SkeletonSuggestedSections />
        ) : (
          <FlatList
            data={[{ id: "suggested" }]}
            keyExtractor={(x) => x.id}
            contentContainerStyle={{ paddingBottom: 140 }}
            renderItem={() => (
              <View>
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
                  data={sortedSongs.slice(0, 12)}
                  keyExtractor={(it: any) => it.id}
                  contentContainerStyle={{ paddingHorizontal: 14 }}
                  renderItem={({ item, index }) => (
                    <SuggestedCard
                      item={{ imageUrl: item.imageUrl, name: item.name }}
                      subtitle={primaryArtist(item.artists)}
                      onPress={() => setQueueAndPlay(sortedSongs, index)}
                      rounded={18}
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
                        setSelectedArtist(item.name);
                        setActiveTab("Songs");
                        setShowSearch(true);
                        setQ(item.name);
                        runSearch(0, item.name, true);
                        setTimeout(() => inputRef.current?.focus?.(), 200);
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
                  renderItem={({ item }) => {
                    const seedSong =
                      sortedSongs.find((x: any) => String(getAlbumId(x) ?? "") === String(item.albumId ?? "")) ??
                      sortedSongs.find(
                        (x: any) =>
                          String(getAlbumName(x) ?? "").trim().toLowerCase() === String(item.name).toLowerCase()
                      ) ??
                      null;

                    return (
                      <SuggestedCard
                        item={{ imageUrl: item.imageUrl, name: item.name }}
                        subtitle={item.subtitle}
                        onPress={() => {
                          nav.navigate("Album", {
                            albumName: item.name,
                            albumId: item.albumId || undefined,
                            seedSong: seedSong || undefined,
                            songs: sortedSongs.filter(
                              (x: any) =>
                                String(getAlbumName(x) ?? "")
                                  .trim()
                                  .toLowerCase() === item.name.toLowerCase()
                            ),
                          });
                        }}
                        rounded={18}
                      />
                    );
                  }}
                />

                <View style={{ height: 10 }} />
              </View>
            )}
          />
        )
      ) : activeTab === "Songs" ? (
        loading ? (
          <SkeletonSongsList count={8} />
        ) : err ? (
          <Text style={s.errTxt}>{err}</Text>
        ) : (
          <FlatList
            ref={(r) => {
              if (r) songsListRef.current = r as any;
            }}
            data={sortedSongs}
            keyExtractor={(it: any) => it.id}
            contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 140, paddingTop: 10 }}
            ListHeaderComponent={
              <View style={s.songsHeadRow}>
                <Text style={s.countTxt}>
                  {sortedSongs.length} song{sortedSongs.length === 1 ? "" : "s"} • Page {page + 1}
                  {!hasMore ? " • last" : ""}
                </Text>

                <Pressable onPress={() => setSortOpen(true)} style={s.sortPill}>
                  <Text style={s.sortTxt}>{sortKey}</Text>
                  <Ionicons name="swap-vertical" size={16} color={theme.colors.accent} />
                </Pressable>
              </View>
            }
            renderItem={renderSongRow}
          />
        )
      ) : activeTab === "Artists" ? (
        <FlatList
          data={artists}
          keyExtractor={(it) => it.id}
          contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 140, paddingTop: 10 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                setSelectedArtist(item.name);
                setActiveTab("Songs");
                setShowSearch(true);
                setQ(item.name);
                runSearch(0, item.name, true);
                setTimeout(() => inputRef.current?.focus?.(), 200);
              }}
              style={s.artistRow}
            >
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={s.artistArt} />
              ) : (
                <View style={[s.artistArt, { backgroundColor: theme.colors.surface }]} />
              )}
              <Text style={s.artistName}>{item.name}</Text>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.muted} />
            </Pressable>
          )}
        />
      ) : (
        <FlatList
          data={albums}
          keyExtractor={(it) => it.id}
          contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 140, paddingTop: 10 }}
          renderItem={({ item }) => {
            const seedSong =
              sortedSongs.find((x: any) => String(getAlbumId(x) ?? "") === String(item.albumId ?? "")) ??
              sortedSongs.find(
                (x: any) => String(getAlbumName(x) ?? "").trim().toLowerCase() === String(item.name).toLowerCase()
              ) ??
              null;

            return (
              <Pressable
                onPress={() => {
                  nav.navigate("Album", {
                    albumName: item.name,
                    albumId: item.albumId || undefined,
                    seedSong: seedSong || undefined,
                    songs: sortedSongs.filter(
                      (x: any) =>
                        String(getAlbumName(x) ?? "")
                          .trim()
                          .toLowerCase() === item.name.toLowerCase()
                    ),
                  });
                }}
                style={s.albumRow}
              >
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={s.albumArt} />
                ) : (
                  <View style={[s.albumArt, { backgroundColor: theme.colors.surface }]} />
                )}
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={s.albumName}>
                    {item.name}
                  </Text>
                  {item.subtitle ? <Text style={s.albumSub}>{item.subtitle}</Text> : null}
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.colors.muted} />
              </Pressable>
            );
          }}
        />
      )}

      {/* Sort Modal */}
      <Modal transparent visible={sortOpen} animationType="fade" onRequestClose={() => setSortOpen(false)}>
        <Pressable style={s.modalOverlay} onPress={() => setSortOpen(false)}>
          <Pressable style={s.modalCard} onPress={() => {}}>
            {(
              ["Ascending", "Descending", "Artist", "Album", "Year", "Date Added", "Date Modified", "Composer"] as SortKey[]
            ).map((k) => {
              const active = sortKey === k;
              return (
                <Pressable
                  key={k}
                  onPress={() => {
                    setSortKey(k);
                    setSortOpen(false);
                  }}
                  style={s.modalRow}
                >
                  <Text style={[s.modalTxt, active && { color: theme.colors.accent }]}>{k}</Text>
                  <Ionicons
                    name={active ? "radio-button-on" : "radio-button-off"}
                    size={18}
                    color={active ? theme.colors.accent : theme.colors.muted}
                  />
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Action Sheet (3 dots) */}
      <ActionSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        theme={theme}
        headerSong={sheetSong}
        items={menuItems}
      />
    </SafeAreaView>
  );
}

const styles = (theme: any) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.colors.bg },

    top: {
      paddingHorizontal: 14,
      paddingTop: 6,
      paddingBottom: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    brand: { flexDirection: "row", alignItems: "center", gap: 10 },
    brandIcon: {
      width: 38,
      height: 38,
      borderRadius: 14,
      backgroundColor: theme.colors.surface,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    brandTxt: { color: theme.colors.text, fontSize: 18, fontWeight: "900" },

    topBtns: { flexDirection: "row", gap: 10 },
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
    modeTxt: { color: theme.colors.text, fontSize: 16, fontWeight: "900" },

    tabs: {
      paddingHorizontal: 14,
      flexDirection: "row",
      gap: 18,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    tabBtn: { paddingVertical: 8 },
    tabTxt: { color: theme.colors.muted, fontWeight: "800" },
    tabTxtActive: { color: theme.colors.accent, fontWeight: "900" },
    tabUnderline: {
      height: 2,
      marginTop: 6,
      borderRadius: 999,
      backgroundColor: theme.colors.accent,
      width: 22,
    },

    searchRow: { paddingHorizontal: 14, flexDirection: "row", gap: 10, paddingTop: 12 },
    searchBox: {
      flex: 1,
      height: 46,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    searchInput: { flex: 1, color: theme.colors.text, fontWeight: "800" },
    goBtn: {
      width: 64,
      height: 46,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    goTxt: { color: "white", fontWeight: "900" },

    // Premium pager styles
    pagerWrap: {
      paddingHorizontal: 14,
      paddingTop: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    pagerBtn: {
      width: 44,
      height: 44,
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    disabledBtn: { opacity: 0.45 },
    pagerChips: { alignItems: "center", gap: 8, paddingHorizontal: 2 },
    chip: {
      minWidth: 44,
      height: 38,
      paddingHorizontal: 12,
      borderRadius: 999,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    chipActive: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
    chipTxt: { color: theme.colors.text, fontWeight: "900" },
    chipTxtActive: { color: "white" },
    endPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      height: 38,
      paddingHorizontal: 12,
      borderRadius: 999,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    endTxt: { color: theme.colors.muted, fontWeight: "900" },

    sectionHead: {
      paddingHorizontal: 14,
      paddingTop: 14,
      paddingBottom: 8,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    sectionTitle: { color: theme.colors.text, fontSize: 15, fontWeight: "900" },
    sectionRight: { color: theme.colors.accent, fontWeight: "900" },

    suggCard: { width: 120, marginRight: 12 },
    suggArt: { width: 120, height: 120, backgroundColor: theme.colors.surface },
    suggTitle: { color: theme.colors.text, fontWeight: "900", marginTop: 8 },
    suggSub: { color: theme.colors.muted, fontWeight: "800", marginTop: 2, fontSize: 12 },

    songsHeadRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingBottom: 10,
    },
    countTxt: { color: theme.colors.muted, fontWeight: "900" },
    sortPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    sortTxt: { color: theme.colors.accent, fontWeight: "900" },

    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 12,
      borderRadius: theme.radius.lg,
      backgroundColor: theme.colors.surface2,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    rowArt: { width: 56, height: 56, borderRadius: 18, backgroundColor: theme.colors.surface },
    rowMid: { flex: 1 },
    rowTitle: { color: theme.colors.text, fontWeight: "900" },
    rowMeta: { flexDirection: "row", alignItems: "center", marginTop: 4 },
    rowSub: { color: theme.colors.muted, fontWeight: "800", fontSize: 12, flexShrink: 1 },
    rowDot: { color: theme.colors.muted, fontWeight: "900" },
    rowDur: { color: theme.colors.muted, fontWeight: "900", fontSize: 12 },

    playCircle: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: theme.colors.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    moreBtn: {
      width: 38,
      height: 42,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },

    artistRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 12,
      borderRadius: theme.radius.lg,
      backgroundColor: theme.colors.surface2,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    artistArt: { width: 46, height: 46, borderRadius: 23, backgroundColor: theme.colors.surface },
    artistName: { color: theme.colors.text, fontWeight: "900", flex: 1 },

    albumRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 12,
      borderRadius: theme.radius.lg,
      backgroundColor: theme.colors.surface2,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    albumArt: { width: 56, height: 56, borderRadius: 18, backgroundColor: theme.colors.surface },
    albumName: { color: theme.colors.text, fontWeight: "900" },
    albumSub: { color: theme.colors.muted, fontWeight: "800", marginTop: 3, fontSize: 12 },

    errTxt: { color: theme.colors.text, padding: 14, fontWeight: "900" },

    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", padding: 18 },
    modalCard: {
      backgroundColor: theme.colors.surface2,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: 14,
    },
    modalRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12 },
    modalTxt: { color: theme.colors.text, fontWeight: "900" },
  });
