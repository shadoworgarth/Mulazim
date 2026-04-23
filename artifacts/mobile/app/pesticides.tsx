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
import pesticides from "@/constants/pesticides";

interface Card {
  id: string;
  title: string;
  emoji: string;
  bg: string;
  count: number;
  unit: string;
  route: string;
}

const CARDS: Card[] = [
  {
    id: "agriculture",
    title: pesticides.sections.agriculture.title,
    emoji: "🌾",
    bg: "#e8f5e9",
    count: pesticides.sections.agriculture.substances.length,
    unit: "مبيد",
    route: "/pesticides-agriculture",
  },
  {
    id: "dates",
    title: pesticides.sections.dates.title,
    emoji: "🌴",
    bg: "#fff3e0",
    count: pesticides.sections.dates.items.length,
    unit: "مبيد",
    route: "/pesticides-dates",
  },
  {
    id: "children",
    title: pesticides.sections.children.title,
    emoji: "🍼",
    bg: "#e3f2fd",
    count: pesticides.sections.children.items.length,
    unit: "مبيد",
    route: "/pesticides-children",
  },
  {
    id: "prohibited",
    title: pesticides.sections.prohibited.title,
    emoji: "🚫",
    bg: "#ffebee",
    count: pesticides.sections.prohibited.items.length,
    unit: "مبيد محظور",
    route: "/pesticides-prohibited",
  },
];

export default function PesticidesScreen() {
  const router = useRouter();
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.sourceNote}>
        <Text style={styles.sourceText}>
          {pesticides.source} — {pesticides.standard}
        </Text>
      </View>
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
              <Text style={styles.cardEmoji}>{card.emoji}</Text>
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
  sourceNote: {
    backgroundColor: "#fff8e1",
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderRightWidth: 3,
    borderRightColor: "#f9a825",
  },
  sourceText: {
    fontSize: 11.5,
    color: "#5d4e1f",
    textAlign: "right",
    lineHeight: 18,
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
    minHeight: 180,
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
