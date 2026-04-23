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

interface CategoryCard {
  id: string;
  title: string;
  emojis: [string, string, string, string];
  bg: string;
  route: string;
  enabled: boolean;
}

const CATEGORIES: CategoryCard[] = [
  {
    id: "food-standards",
    title: "قائمة اللوائح والمواصفات الغذائية",
    emojis: ["🍎", "🥖", "🥛", "🍖"],
    bg: "#e0f4f4",
    route: "/food-standards",
    enabled: true,
  },
  {
    id: "medical-devices-standards",
    title: "مواصفات الأجهزة والمستلزمات الطبية",
    emojis: ["🩺", "💉", "🩻", "🧪"],
    bg: "#fde8ea",
    route: "/medical-devices-standards",
    enabled: false,
  },
];

export default function RegulationsScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>التصنيفات</Text>
        <View style={styles.row}>
          {CATEGORIES.map((card) => (
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
                <View style={styles.emojiGrid}>
                  <Text style={styles.cardEmoji}>{card.emojis[0]}</Text>
                  <Text style={styles.cardEmoji}>{card.emojis[1]}</Text>
                  <Text style={styles.cardEmoji}>{card.emojis[2]}</Text>
                  <Text style={styles.cardEmoji}>{card.emojis[3]}</Text>
                </View>
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
