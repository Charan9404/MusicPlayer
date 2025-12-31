import React from "react";
import { View, Text, Modal, Pressable, StyleSheet, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeProvider";

export type SheetAction = {
  key: string;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  destructive?: boolean;
  onPress: () => void;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  header?: {
    title: string;
    subtitle?: string;
    imageUrl?: string;
    rightIcon?: keyof typeof Ionicons.glyphMap; // e.g. heart-outline
    onRightPress?: () => void;
  };
  actions: SheetAction[];
};

export default function ActionSheet({ visible, onClose, header, actions }: Props) {
  const { theme } = useTheme();
  const s = styles(theme);

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose}>
        <Pressable style={s.sheet} onPress={() => {}}>
          {/* drag handle */}
          <View style={s.handle} />

          {header ? (
            <View style={s.headerRow}>
              {header.imageUrl ? <Image source={{ uri: header.imageUrl }} style={s.headerArt} /> : null}

              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={s.headerTitle}>
                  {header.title}
                </Text>
                {header.subtitle ? (
                  <Text numberOfLines={1} style={s.headerSub}>
                    {header.subtitle}
                  </Text>
                ) : null}
              </View>

              {header.rightIcon ? (
                <Pressable onPress={header.onRightPress} style={s.headerIconBtn} hitSlop={10}>
                  <Ionicons name={header.rightIcon} size={20} color={theme.colors.text} />
                </Pressable>
              ) : null}
            </View>
          ) : null}

          <View style={s.list}>
            {actions.map((a) => (
              <Pressable
                key={a.key}
                onPress={() => {
                  onClose();
                  a.onPress();
                }}
                style={s.row}
              >
                <View style={s.leftIcon}>
                  {a.icon ? (
                    <Ionicons
                      name={a.icon}
                      size={20}
                      color={a.destructive ? theme.colors.danger ?? "#EF4444" : theme.colors.text}
                    />
                  ) : null}
                </View>

                <Text style={[s.label, a.destructive && { color: theme.colors.danger ?? "#EF4444" }]}>
                  {a.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={{ height: 10 }} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = (theme: any) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.45)",
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: theme.colors.surface2 ?? theme.colors.surface,
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 18,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    handle: {
      alignSelf: "center",
      width: 44,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.mode === "dark" ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.15)",
      marginBottom: 10,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      marginBottom: 6,
    },
    headerArt: { width: 54, height: 54, borderRadius: 14, backgroundColor: theme.colors.surface },
    headerTitle: { color: theme.colors.text, fontWeight: "900", fontSize: 15 },
    headerSub: { color: theme.colors.muted, fontWeight: "700", marginTop: 2, fontSize: 12 },
    headerIconBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
    },
    list: { paddingTop: 6 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      gap: 10,
    },
    leftIcon: { width: 28, alignItems: "center" },
    label: { color: theme.colors.text, fontWeight: "800", fontSize: 14 },
  });
