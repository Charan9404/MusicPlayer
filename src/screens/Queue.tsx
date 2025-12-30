import React from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Image,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { usePlayerStore } from "../store/playerStore";

export default function Queue() {
  const nav = useNavigation<any>();
  const {
    queue,
    currentIndex,
    setQueueAndPlay,
    removeFromQueue,
    moveQueueItem,
  } = usePlayerStore();

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Pressable onPress={() => nav.goBack()} style={styles.topBtn}>
          <Text style={styles.topBtnTxt}>Back</Text>
        </Pressable>
        <Text style={styles.h1}>Queue</Text>
        <View style={{ width: 60 }} />
      </View>

      <FlatList
        data={queue}
        keyExtractor={(item) => item.id + Math.random()}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <Text style={{ color: "#9CA3AF" }}>Queue is empty.</Text>
        }
        renderItem={({ item, index }) => {
          const active = index === currentIndex;
          return (
            <View style={[styles.row, active && styles.activeRow]}>
              <Pressable
                onPress={() => setQueueAndPlay(queue, index)}
                style={styles.left}
              >
                <Image source={{ uri: item.imageUrl }} style={styles.art} />
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={styles.title}>
                    {item.name}
                  </Text>
                  <Text numberOfLines={1} style={styles.sub}>
                    {item.artists}
                  </Text>
                </View>
              </Pressable>

              <View style={styles.actions}>
                <Pressable
                  disabled={index === 0}
                  onPress={() => moveQueueItem(index, index - 1)}
                  style={[styles.smallBtn, index === 0 && styles.disabled]}
                >
                  <Text style={styles.smallTxt}>↑</Text>
                </Pressable>
                <Pressable
                  disabled={index === queue.length - 1}
                  onPress={() => moveQueueItem(index, index + 1)}
                  style={[
                    styles.smallBtn,
                    index === queue.length - 1 && styles.disabled,
                  ]}
                >
                  <Text style={styles.smallTxt}>↓</Text>
                </Pressable>
                <Pressable
                  onPress={() => removeFromQueue(index)}
                  style={[styles.smallBtn, styles.danger]}
                >
                  <Text style={styles.smallTxt}>X</Text>
                </Pressable>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#0B1220" },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  topBtn: {
    backgroundColor: "#111827",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  topBtnTxt: { color: "white", fontWeight: "700" },
  h1: { color: "white", fontSize: 18, fontWeight: "900" },

  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#111827",
    marginTop: 10,
  },
  activeRow: { borderWidth: 1, borderColor: "#4F46E5" },

  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    paddingRight: 10,
  },
  art: { width: 46, height: 46, borderRadius: 12, backgroundColor: "#374151" },
  title: { color: "white", fontWeight: "900" },
  sub: { color: "#9CA3AF", marginTop: 2, fontSize: 12 },

  actions: { flexDirection: "row", gap: 8 },
  smallBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#1F2937",
    alignItems: "center",
    justifyContent: "center",
  },
  smallTxt: { color: "white", fontWeight: "900" },
  danger: { backgroundColor: "#7F1D1D" },
  disabled: { opacity: 0.4 },
});
