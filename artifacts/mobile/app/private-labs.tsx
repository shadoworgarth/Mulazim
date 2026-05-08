import { useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import colors from "@/constants/colors";
import { PRIVATE_LABS } from "@/constants/private-labs";

const TILES = [
  {
    id: "browse",
    emoji: "🔬",
    title: "تصفح معلومات المختبرات",
    subtitle: `${PRIVATE_LABS.length} مختبر مُعيَّن`,
    bg: "#e0f2f1",
    accent: "#00695c",
    route: "/private-labs-list",
  },
  {
    id: "compare",
    emoji: "🧮",
    title: "مقارنة الاختبارات والأسعار",
    subtitle: "احسب التكلفة شاملة الضريبة",
    bg: "#e8eaf6",
    accent: "#3949ab",
    route: "/lab-test-search",
  },
] as const;

export default function PrivateLabsScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>المختبرات الخاصة</Text>
        <View style={styles.grid}>
          {TILES.map((tile) => (
            <Pressable
              key={tile.id}
              style={({ pressed }) => [styles.tile, { opacity: pressed ? 0.82 : 1 }]}
              onPress={() => router.push(tile.route as any)}
            >
              <View style={[styles.iconWrap, { backgroundColor: tile.bg }]}>
                <Text style={styles.tileEmoji}>{tile.emoji}</Text>
              </View>
              <Text style={styles.tileTitle}>{tile.title}</Text>
              <Text style={[styles.tileSubtitle, { color: tile.accent }]}>{tile.subtitle}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.background },
  content: {
    padding: 20,
    paddingBottom: Platform.OS === "web" ? 40 : 32,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.light.mutedForeground,
    textAlign: "right",
    marginBottom: 16,
  },
  grid: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    justifyContent: "space-evenly",
    gap: 16,
  },
  tile: {
    width: 150,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 16,
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  tileEmoji: { fontSize: 42, textAlign: "center" },
  tileTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.light.text,
    textAlign: "center",
    lineHeight: 19,
  },
  tileSubtitle: {
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 16,
  },
});
