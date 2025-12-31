import React from "react";
import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { usePlayerStore } from "../store/playerStore";
import { useTheme } from "../theme/ThemeProvider";

export default function MiniPlayer() {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const s = styles(theme);

  const store = usePlayerStore() as any;
  const queue = (store.queue ?? []) as any[];
  const currentIndex = (store.currentIndex ?? 0) as number;
  const song = queue[currentIndex];

  const isPlaying = !!(store.isPlaying ?? store.playing ?? false);

  const togglePlayPause =
    (store.togglePlayPause ??
      store.togglePlay ??
      store.playPause ??
      store.toggle ??
      null) as null | (() => void);

  const play =
    (store.play ?? store.resume ?? store.start ?? store.playCurrent ?? null) as
      | null
      | (() => void);

  const pause =
    (store.pause ?? store.stop ?? store.halt ?? store.pauseCurrent ?? null) as
      | null
      | (() => void);

  const next =
    (store.next ??
      store.skipNext ??
      store.playNext ??
      store.nextTrack ??
      null) as null | (() => void);

  const onPlayPause = () => {
    if (togglePlayPause) return togglePlayPause();
    if (isPlaying) return pause?.();
    return play?.();
  };

  const onNext = () => next?.();

  if (!song) return null;

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <View style={s.container} pointerEvents="box-none">
        <Pressable
          onPress={() => navigation.navigate("Player")}
          style={s.wrap}
        >
          {/* Left: art + texts */}
          <View style={s.left}>
            <Image source={{ uri: song.imageUrl }} style={s.art} />
            <View style={{ flex: 1 }}>
              <Text style={s.nowPlaying}>Now playing</Text>
              <Text numberOfLines={1} style={s.title}>
                {song.name}
              </Text>
              <Text numberOfLines={1} style={s.sub}>
                {song.artists}
              </Text>
            </View>
          </View>

          {/* Right: controls */}
          <View style={s.controls}>
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onPlayPause();
              }}
              style={s.iconBtnPrimary}
              hitSlop={10}
            >
              <Ionicons
                name={isPlaying ? "pause" : "play"}
                size={18}
                color={"#fff"}
              />
            </Pressable>

            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onNext();
              }}
              style={s.iconBtn}
              hitSlop={10}
            >
              <Ionicons
                name="play-skip-forward"
                size={18}
                color={theme.colors.text}
              />
            </Pressable>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = (theme: any) => {
  const surface2 = theme.colors.surface2 ?? theme.colors.surface;

  return StyleSheet.create({
    container: {
      position: "absolute",
      left: 14,
      right: 14,
      bottom: 14,
    },

    wrap: {
      height: 78,
      borderRadius: theme.radius.lg,
      backgroundColor: surface2,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",

      // premium shadow
      shadowColor: "#000",
      shadowOpacity: theme.mode === "dark" ? 0.28 : 0.10,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 10 },
      elevation: 6,
    },

    left: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      flex: 1,
      paddingRight: 10,
    },

    art: {
      width: 52,
      height: 52,
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
    },

    nowPlaying: {
      color: theme.colors.muted,
      fontSize: 11,
      fontWeight: "700",
      marginBottom: 2,
    },

    title: {
      color: theme.colors.text,
      fontSize: 14,
      fontWeight: "900",
      lineHeight: 18,
    },

    sub: {
      color: theme.colors.muted,
      fontSize: 12,
      fontWeight: "700",
      marginTop: 2,
    },

    controls: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },

    iconBtnPrimary: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: theme.colors.accent,
      alignItems: "center",
      justifyContent: "center",
    },

    iconBtn: {
      width: 40,
      height: 40,
      borderRadius: 18,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
  });
};
