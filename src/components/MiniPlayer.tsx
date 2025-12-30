import React from "react";
import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { usePlayerStore } from "../store/playerStore";

export default function MiniPlayer() {
  const navigation = useNavigation<any>();
  const { queue, currentIndex, isPlaying, togglePlayPause } = usePlayerStore();
  const song = queue[currentIndex];

  if (!song) return null;

  return (
    <Pressable
      onPress={() => navigation.navigate("Player")}
      style={styles.wrap}
    >
      <View style={styles.left}>
        <Image source={{ uri: song.imageUrl }} style={styles.art} />
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={styles.title}>
            {song.name}
          </Text>
          <Text numberOfLines={1} style={styles.sub}>
            {song.artists}
          </Text>
        </View>
      </View>

      <Pressable
        onPress={(e) => {
          e.stopPropagation();
          togglePlayPause();
        }}
        style={styles.btn}
      >
        <Text style={styles.btnTxt}>{isPlaying ? "Pause" : "Play"}</Text>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    height: 64,
    borderRadius: 14,
    backgroundColor: "#111827",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    paddingRight: 10,
  },
  art: { width: 44, height: 44, borderRadius: 10, backgroundColor: "#374151" },
  title: { color: "white", fontSize: 14, fontWeight: "700" },
  sub: { color: "#9CA3AF", fontSize: 12, marginTop: 2 },
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#4F46E5",
  },
  btnTxt: { color: "white", fontWeight: "700" },
});
