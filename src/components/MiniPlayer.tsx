import React from "react";
import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { usePlayerStore } from "../store/playerStore";
import { useTheme } from "../theme/ThemeProvider";

export default function MiniPlayer() {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const s = styles(theme);

  const { queue, currentIndex, isPlaying, togglePlayPause } = usePlayerStore();
  const song = queue[currentIndex];

  if (!song) return null;

  return (
    <Pressable onPress={() => navigation.navigate("Player")} style={s.wrap}>
      <View style={s.left}>
        <Image source={{ uri: song.imageUrl }} style={s.art} />
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={s.title}>
            {song.name}
          </Text>
          <Text numberOfLines={1} style={s.sub}>
            {song.artists}
          </Text>
        </View>
      </View>

      <Pressable onPress={togglePlayPause} style={s.btn}>
        <Text style={s.btnTxt}>{isPlaying ? "Pause" : "Play"}</Text>
      </Pressable>
    </Pressable>
  );
}

const styles = (theme: any) =>
  StyleSheet.create({
    wrap: {
      position: "absolute",
      left: 14,
      right: 14,
      bottom: 14,
      height: 74,
      borderRadius: theme.radius.lg,
      backgroundColor: theme.colors.surface2,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      shadowColor: "#000",
      shadowOpacity: theme.mode === "dark" ? 0.25 : 0.08,
      shadowRadius: 18,
      elevation: 3,
    },
    left: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1, paddingRight: 10 },
    art: { width: 46, height: 46, borderRadius: 14, backgroundColor: theme.colors.surface },
    title: { color: theme.colors.text, fontSize: 14, fontWeight: "900" },
    sub: { color: theme.colors.muted, fontSize: 12, marginTop: 2 },
    btn: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.accent,
    },
    btnTxt: { color: "white", fontWeight: "900" },
  });
