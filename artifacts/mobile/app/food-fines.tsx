import { useRouter } from "expo-router";
import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import colors from "@/constants/colors";

const SUBCATEGORIES = [
  {
    id: "table",
    title: "جدول المخالفات والعقوبات",
    subtitle: "274 مخالفة مصنفة حسب القطاع والنشاط",
    emoji: "📋",
    bg: "#fde8e8",
    accent: "#c0392b",
    route: "/food-fines-search",
  },
];

export default function FoodFinesScreen() {
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
            style={({ pressed }) => [styles.card, { opacity: pressed ? 0.82 : 1 }]}
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
            <Text style={styles.arrow}>◀</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.background },
  content: { padding: 16, gap: 14 },
  sectionLabel: {
    fontSize: 13,
    color: colors.light.mutedForeground,
    textAlign: "right",
    marginBottom: 4,
    fontFamily: "Inter_500Medium",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  iconWrap: {
    width: 54,
    height: 54,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: { fontSize: 26 },
  cardBody: { flex: 1, gap: 4 },
  cardTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: colors.light.text,
    textAlign: "right",
  },
  cardSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "right",
    lineHeight: 18,
  },
  arrow: { fontSize: 12, color: colors.light.mutedForeground },
});
