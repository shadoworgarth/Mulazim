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
});
