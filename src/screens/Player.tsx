import React from "react";
import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import Slider from "@react-native-community/slider";
import { useNavigation } from "@react-navigation/native";
import { usePlayerStore } from "../store/playerStore";
import { formatMillis } from "../utils/time";

export default function Player() {
  const nav = useNavigation<any>();
  const {
    queue,
    currentIndex,
    isPlaying,
    positionMillis,
    durationMillis,
    togglePlayPause,
    next,
    prev,
    seekTo,
    repeat,
    setRepeat,
    shuffle,
    toggleShuffle,
  } = usePlayerStore();

  const song = queue[currentIndex];
  if (!song) {
    return (
      <View style={styles.container}>
        <Text style={{ color: "white" }}>No song selected.</Text>
      </View>
    );
  }

  const cycleRepeat = async () => {
    if (repeat === "off") await setRepeat("all");
    else if (repeat === "all") await setRepeat("one");
    else await setRepeat("off");
  };

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Pressable onPress={() => nav.goBack()} style={styles.topBtn}>
          <Text style={styles.topBtnTxt}>Back</Text>
        </Pressable>
        <Pressable onPress={() => nav.navigate("Queue")} style={styles.topBtn}>
          <Text style={styles.topBtnTxt}>Queue</Text>
        </Pressable>
      </View>

      <Image source={{ uri: song.imageUrl }} style={styles.art} />
      <Text numberOfLines={2} style={styles.title}>
        {song.name}
      </Text>
      <Text numberOfLines={1} style={styles.sub}>
        {song.artists}
      </Text>

      <View style={{ marginTop: 18 }}>
        <Slider
          value={positionMillis}
          minimumValue={0}
          maximumValue={Math.max(1, durationMillis)}
          onSlidingComplete={(v) => seekTo(Number(v))}
          minimumTrackTintColor="#4F46E5"
          maximumTrackTintColor="#374151"
          thumbTintColor="#A5B4FC"
        />
        <View style={styles.timeRow}>
          <Text style={styles.timeTxt}>{formatMillis(positionMillis)}</Text>
          <Text style={styles.timeTxt}>{formatMillis(durationMillis)}</Text>
        </View>
      </View>

      <View style={styles.controls}>
        <Pressable
          onPress={toggleShuffle}
          style={[styles.modeBtn, shuffle && styles.modeActive]}
        >
          <Text style={styles.modeTxt}>Shuffle</Text>
        </Pressable>

        <Pressable onPress={prev} style={styles.ctrlBtn}>
          <Text style={styles.ctrlTxt}>Prev</Text>
        </Pressable>

        <Pressable
          onPress={togglePlayPause}
          style={[styles.ctrlBtn, styles.playBtn]}
        >
          <Text style={styles.ctrlTxt}>{isPlaying ? "Pause" : "Play"}</Text>
        </Pressable>

        <Pressable onPress={next} style={styles.ctrlBtn}>
          <Text style={styles.ctrlTxt}>Next</Text>
        </Pressable>

        <Pressable
          onPress={cycleRepeat}
          style={[styles.modeBtn, repeat !== "off" && styles.modeActive]}
        >
          <Text style={styles.modeTxt}>Repeat: {repeat}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#0B1220",
    alignItems: "center",
  },
  topRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  topBtn: {
    backgroundColor: "#111827",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  topBtnTxt: { color: "white", fontWeight: "700" },

  art: {
    width: 260,
    height: 260,
    borderRadius: 18,
    marginTop: 18,
    backgroundColor: "#374151",
  },
  title: {
    color: "white",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 16,
    textAlign: "center",
  },
  sub: { color: "#9CA3AF", marginTop: 6 },

  timeRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  timeTxt: { color: "#9CA3AF", fontWeight: "700" },

  controls: { marginTop: 20, width: "100%", gap: 10, alignItems: "center" },
  ctrlBtn: {
    width: "70%",
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#111827",
    alignItems: "center",
  },
  playBtn: { backgroundColor: "#4F46E5" },
  ctrlTxt: { color: "white", fontWeight: "900" },

  modeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#111827",
  },
  modeActive: { borderWidth: 1, borderColor: "#4F46E5" },
  modeTxt: { color: "white", fontWeight: "700" },
});
