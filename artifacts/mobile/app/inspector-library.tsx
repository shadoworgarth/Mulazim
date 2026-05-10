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

interface LibraryCard {
  id: string;
  title: string;
  emojis: [string, string, string, string];
  singleEmoji?: boolean;
  bg: string;
  route: string;
  enabled: boolean;
}

const LIBRARY_CARDS: LibraryCard[] = [
  {
    id: "regulations",
    title: "اللوائح الفنية والمواصفات القياسية",
    emojis: ["📄", "📄", "📄", "📄"],
    singleEmoji: true,
    bg: "#e8eaf6",
    route: "/regulations",
    enabled: true,
  },
  {
    id: "toxins",
    title: "الملوثات والسموم في الأغذية والأعلاف",
    emojis: ["☠️", "☠️", "☠️", "☠️"],
    singleEmoji: true,
    bg: "#fce4ec",
    route: "/toxins",
    enabled: true,
  },
  {
    id: "pesticides",
    title: "الحدود القصوى لمتبقيات مبيدات الآفات في المنتجات الزراعية والغذائية",
    emojis: ["🌾", "🌾", "🌾", "🌾"],
    singleEmoji: true,
    bg: "#e8f5e9",
    route: "/pesticides",
    enabled: true,
  },
  {
    id: "animal-feed",
    title: "الأعلاف",
    emojis: ["🐔", "🐔", "🐔", "🐔"],
    singleEmoji: true,
    bg: "#fff3e0",
    route: "/animal-feed",
    enabled: true,
  },
  {
    id: "fines",
    title: "جداول المخالفات والعقوبات",
    emojis: ["⚖️", "⚖️", "⚖️", "⚖️"],
    singleEmoji: true,
    bg: "#fce4ec",
    route: "/fines-guide",
    enabled: true,
  },
  {
    id: "food-fines-v2",
    title: "مخالفات نظام الغذاء (محدّث 2026)",
    emojis: ["🍽️", "🍽️", "🍽️", "🍽️"],
    singleEmoji: true,
    bg: "#fff3e0",
    route: "/food-fines",
    enabled: true,
  },
  {
    id: "narcotics",
    title: "المخدرات والمؤثرات العقلية",
    emojis: ["💊", "💊", "💊", "💊"],
    singleEmoji: true,
    bg: "#f3e5f5",
    route: "/narcotics",
    enabled: true,
  },
  {
    id: "private-labs",
    title: "المختبرات الخاصة",
    emojis: ["🔬", "🔬", "🔬", "🔬"],
    singleEmoji: true,
    bg: "#e0f2f1",
    route: "/private-labs",
    enabled: true,
  },
];

export default function InspectorLibraryScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>المحتويات</Text>
        <View style={styles.row}>
          {LIBRARY_CARDS.map((card) => (
            <Pressable
              key={card.id}
              style={({ pressed }) => [
                styles.card,
                !card.enabled && styles.cardDisabled,
                { opacity: pressed && card.enabled ? 0.82 : 1 },
              ]}
              onPress={() => card.enabled && router.push(card.route as any)}
            >
              <View style={[styles.iconWrap, { backgroundColor: card.bg }]}>
                {card.singleEmoji ? (
                  <Text style={styles.singleEmoji}>{card.emojis[0]}</Text>
                ) : (
                  <View style={styles.emojiGrid}>
                    <Text style={styles.cardEmoji}>{card.emojis[0]}</Text>
                    <Text style={styles.cardEmoji}>{card.emojis[1]}</Text>
                    <Text style={styles.cardEmoji}>{card.emojis[2]}</Text>
                    <Text style={styles.cardEmoji}>{card.emojis[3]}</Text>
                  </View>
                )}
              </View>
              <Text
                style={[
                  styles.cardTitle,
                  !card.enabled && styles.cardTitleDisabled,
                ]}
                numberOfLines={3}
              >
                {card.title}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  grid: {
    padding: 18,
    paddingBottom: Platform.OS === "web" ? 40 : 32,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.light.mutedForeground,
    textAlign: "right",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    justifyContent: "space-evenly",
    rowGap: 14,
  },
  card: {
    width: 150,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
    gap: 10,
  },
  cardDisabled: {
    backgroundColor: "#f5f5f5",
  },
  iconWrap: {
    width: 70,
    height: 70,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  emojiGrid: {
    width: "100%",
    height: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  cardEmoji: {
    fontSize: 22,
    width: "44%",
    textAlign: "center",
  },
  singleEmoji: {
    fontSize: 40,
    textAlign: "center",
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.light.text,
    textAlign: "center",
    lineHeight: 19,
  },
  cardTitleDisabled: {
    color: "#aaa",
  },
});
