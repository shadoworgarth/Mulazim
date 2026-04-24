import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import colors from "@/constants/colors";
import pesticides from "@/constants/pesticides";

const SFDA_LOGO = require("../assets/sfda-logo.png");
const FAO_PESTICIDE_COUNT = 240;

interface Card {
  id: string;
  title: string;
  emoji?: string;
  image?: number;
  bg: string;
  count: number;
  unit: string;
  route: string;
}

const sfdaCount =
  pesticides.sections.agriculture.substances.length +
  pesticides.sections.dates.items.length +
  pesticides.sections.children.items.length +
  pesticides.sections.prohibited.items.length;

const CARDS: Card[] = [
  {
    id: "sfda",
    title: "SFDA.FD 382_2019",
    image: SFDA_LOGO,
    bg: "#ffffff",
    count: sfdaCount,
    unit: "مبيد",
    route: "/pesticides-sfda",
  },
  {
    id: "fao",
    title: "دستور الأغذية (FAO Codex)",
    emoji: "🌍",
    bg: "#e3f2fd",
    count: FAO_PESTICIDE_COUNT,
    unit: "مبيد",
    route: "/pesticides-fao",
  },
];

export default function PesticidesScreen() {
  const router = useRouter();
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.grid}>
        {CARDS.map((card) => (
          <Pressable
            key={card.id}
            style={({ pressed }) => [
              styles.card,
              { opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={() => router.push(card.route as any)}
          >
            <View style={[styles.iconWrap, { backgroundColor: card.bg }]}>
              {card.image ? (
                <Image
                  source={card.image}
                  style={styles.cardImage}
                  resizeMode="contain"
                />
              ) : (
                <Text style={styles.cardEmoji}>{card.emoji}</Text>
              )}
            </View>
            <Text style={styles.cardTitle} numberOfLines={4}>
              {card.title}
            </Text>
            <Text style={styles.cardCount}>
              {card.count} {card.unit}
            </Text>
          </Pressable>
        ))}
      </View>
      <Pressable
        style={({ pressed }) => [
          styles.compareCard,
          { opacity: pressed ? 0.85 : 1 },
        ]}
        onPress={() => router.push("/pesticides-compare" as any)}
      >
        <View style={styles.compareIconWrap}>
          <Text style={styles.compareEmoji}>🔍</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.compareTitle}>بحث مقارنة</Text>
          <Text style={styles.compareSubtitle}>
            قارن الحدود القصوى بين SFDA وFAO Codex لأي منتج
          </Text>
        </View>
        <View style={styles.compareBadgesPreview}>
          <View style={styles.previewGreen} />
          <View style={styles.previewBlue} />
        </View>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: Platform.OS === "web" ? 34 : 24,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  card: {
    width: "48%",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
    minHeight: 200,
  },
  iconWrap: {
    width: 76,
    height: 76,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  cardEmoji: {
    fontSize: 40,
    textAlign: "center",
  },
  cardImage: {
    width: 60,
    height: 60,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.light.text,
    textAlign: "center",
    lineHeight: 18,
  },
  cardCount: {
    fontSize: 11,
    color: colors.light.mutedForeground,
    textAlign: "center",
    marginTop: 6,
  },
  compareCard: {
    marginTop: 12,
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  compareIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
  },
  compareEmoji: {
    fontSize: 28,
  },
  compareTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.light.text,
    textAlign: "right",
  },
  compareSubtitle: {
    fontSize: 11,
    color: colors.light.mutedForeground,
    textAlign: "right",
    marginTop: 3,
    lineHeight: 16,
  },
  compareBadgesPreview: {
    flexDirection: "column",
    gap: 4,
  },
  previewGreen: {
    width: 14,
    height: 14,
    borderRadius: 4,
    backgroundColor: "#2e7d32",
  },
  previewBlue: {
    width: 14,
    height: 14,
    borderRadius: 4,
    backgroundColor: "#0d47a1",
  },
});
