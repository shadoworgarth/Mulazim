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

const SUBCATEGORIES = [
  {
    id: "additives",
    title: "المضافات العلفية المسموح بتداولها",
    subtitle: "Permitted Feed Additives",
    emoji: "✅",
    bg: "#e8f5e9",
    accent: "#388e3c",
    route: "/animal-feed-additives",
  },
  {
    id: "guide",
    title: "دليل المواد المضافة لعلف المواشي والدواجن",
    subtitle: "Feed Additives Guide – Livestock & Poultry",
    emoji: "📋",
    bg: "#fff8e1",
    accent: "#f9a825",
    route: "/animal-feed-guide",
  },
];

export default function AnimalFeedScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>اختر القسم</Text>
        {SUBCATEGORIES.map((item) => (
          <Pressable
            key={item.id}
            style={({ pressed }) => [
              styles.card,
              { opacity: pressed ? 0.82 : 1 },
            ]}
            onPress={() => router.push(item.route as any)}
          >
            <View style={[styles.iconWrap, { backgroundColor: item.bg }]}>
              <Text style={styles.emoji}>{item.emoji}</Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={[styles.cardSubtitle, { color: item.accent }]}>
                {item.subtitle}
              </Text>
            </View>
            <Text style={[styles.chevron, { color: item.accent }]}>‹</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  content: {
    padding: 18,
    paddingBottom: Platform.OS === "web" ? 40 : 32,
    gap: 14,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.light.mutedForeground,
    textAlign: "right",
    marginBottom: 4,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  emoji: {
    fontSize: 28,
  },
  cardBody: {
    flex: 1,
    alignItems: "flex-end",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.light.text,
    textAlign: "right",
    lineHeight: 21,
  },
  cardSubtitle: {
    fontSize: 11,
    fontWeight: "500",
    textAlign: "right",
    marginTop: 3,
  },
  chevron: {
    fontSize: 22,
    fontWeight: "300",
    flexShrink: 0,
  },
});
