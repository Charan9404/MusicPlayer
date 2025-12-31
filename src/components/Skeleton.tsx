import React, { useEffect, useMemo, useRef } from "react";
import { Animated, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { useTheme } from "../theme/ThemeProvider";

type BoxProps = {
  w?: number | string;
  h: number;
  r?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Premium-ish skeleton:
 * - base block
 * - subtle shimmer sweep (no extra deps)
 * - gentle opacity pulse
 */
export function SkeletonBox({ w = "100%", h, r = 16, style }: BoxProps) {
  const { theme } = useTheme();

  const shimmer = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmerAnim = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1300,
        useNativeDriver: true,
      })
    );

    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );

    shimmerAnim.start();
    pulseAnim.start();

    return () => {
      shimmerAnim.stop();
      pulseAnim.stop();
    };
  }, [shimmer, pulse]);

  // theme-safe colors (no color lib)
  const base = theme.colors.surface;
  const highlight = theme.colors.surface2;

  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-220, 220],
  });

  const opacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 1],
  });

  return (
    <Animated.View
      style={[
        styles.box,
        {
          width: w as any,
          height: h,
          borderRadius: r,
          backgroundColor: base,
          opacity,
        },
        style,
      ]}
    >
      {/* shimmer sweep */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.shimmer,
          {
            backgroundColor: highlight,
            transform: [{ translateX }, { skewX: "-15deg" }],
          },
        ]}
      />
    </Animated.View>
  );
}

export function SkeletonSongRow({ style }: { style?: StyleProp<ViewStyle> }) {
  const { theme } = useTheme();
  return (
    <View
      style={[
        rowStyles.row,
        { backgroundColor: theme.colors.surface2, borderColor: "transparent" },
        style,
      ]}
    >
      <SkeletonBox w={54} h={54} r={16} />
      <View style={{ flex: 1, gap: 10 }}>
        <SkeletonBox w="75%" h={12} r={8} />
        <SkeletonBox w="55%" h={10} r={8} />
      </View>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <SkeletonBox w={34} h={34} r={999} />
        <SkeletonBox w={26} h={34} r={12} />
      </View>
    </View>
  );
}

export function SkeletonSuggestedCard({ round = 18 }: { round?: number }) {
  return (
    <View style={{ width: 140, marginRight: 12 }}>
      <SkeletonBox w={140} h={140} r={round} />
      <View style={{ height: 10 }} />
      <SkeletonBox w="85%" h={12} r={8} />
      <View style={{ height: 8 }} />
      <SkeletonBox w="60%" h={10} r={8} />
    </View>
  );
}

export function SkeletonSongsList({ count = 8 }: { count?: number }) {
  const items = useMemo(() => Array.from({ length: count }, (_, i) => i), [count]);
  return (
    <View style={{ paddingHorizontal: 14, paddingTop: 10 }}>
      {items.map((i) => (
        <SkeletonSongRow key={`sk-row-${i}`} style={{ marginBottom: 12 }} />
      ))}
    </View>
  );
}

export function SkeletonSuggestedSections() {
  return (
    <View style={{ paddingBottom: 160 }}>
      {/* Recently Played */}
      <View style={{ paddingHorizontal: 14, marginTop: 18, marginBottom: 10, flexDirection: "row", justifyContent: "space-between" }}>
        <SkeletonBox w={140} h={14} r={8} />
        <SkeletonBox w={60} h={12} r={8} />
      </View>
      <View style={{ paddingHorizontal: 14, flexDirection: "row" }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonSuggestedCard key={`sk-sug-1-${i}`} round={18} />
        ))}
      </View>

      {/* Artists */}
      <View style={{ paddingHorizontal: 14, marginTop: 22, marginBottom: 10, flexDirection: "row", justifyContent: "space-between" }}>
        <SkeletonBox w={90} h={14} r={8} />
        <SkeletonBox w={60} h={12} r={8} />
      </View>
      <View style={{ paddingHorizontal: 14, flexDirection: "row" }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonSuggestedCard key={`sk-sug-2-${i}`} round={999} />
        ))}
      </View>

      {/* Albums */}
      <View style={{ paddingHorizontal: 14, marginTop: 22, marginBottom: 10, flexDirection: "row", justifyContent: "space-between" }}>
        <SkeletonBox w={95} h={14} r={8} />
        <SkeletonBox w={60} h={12} r={8} />
      </View>
      <View style={{ paddingHorizontal: 14, flexDirection: "row" }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonSuggestedCard key={`sk-sug-3-${i}`} round={18} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    overflow: "hidden",
  },
  shimmer: {
    position: "absolute",
    top: -20,
    left: -120,
    width: 120,
    height: 400,
    opacity: 0.35,
  },
});

const rowStyles = StyleSheet.create({
  row: {
    padding: 12,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
});
