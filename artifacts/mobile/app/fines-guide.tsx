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
import { FINES_CATEGORIES } from "@/constants/fines";

export default function FinesGuideScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>اختر جدول المخالفات</Text>

        {FINES_CATEGORIES.map((cat) => (
          <Pressable
            key={cat.id}
            style={({ pressed }) => [
              styles.card,
              !cat.enabled && styles.cardDisabled,
              { opacity: pressed && cat.enabled ? 0.82 : 1 },
            ]}
            onPress={() =>
              cat.enabled &&
              router.push({
                pathname: "/fines-detail",
                params: { categoryId: cat.id },
              })
            }
          >
            <View style={[styles.emojiWrap, { backgroundColor: cat.bg }]}>
              <Text style={styles.emoji}>{cat.emoji}</Text>
            </View>
            <View style={styles.cardBody}>
              <Text
                style={[
                  styles.cardTitle,
                  !cat.enabled && styles.cardTitleDisabled,
                ]}
                numberOfLines={3}
              >
                {cat.shortTitle}
              </Text>
              {!cat.enabled && (
                <Text style={styles.comingSoon}>قريباً</Text>
              )}
              {cat.enabled && cat.data && (
                <Text style={styles.countLabel}>
                  {cat.data.violations.length} مخالفة
                </Text>
              )}
            </View>
            <Text
              style={[
                styles.chevron,
                !cat.enabled && { color: "#ccc" },
              ]}
            >
              ‹
            </Text>
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
    gap: 10,
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
    padding: 14,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardDisabled: {
    backgroundColor: "#f9f9f9",
  },
  emojiWrap: {
    width: 52,
    height: 52,
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
    gap: 4,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.light.text,
    textAlign: "right",
    lineHeight: 20,
  },
  cardTitleDisabled: {
    color: "#aaa",
  },
  comingSoon: {
    fontSize: 12,
    color: "#aaa",
    fontWeight: "500",
  },
  countLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  chevron: {
    fontSize: 22,
    color: colors.light.mutedForeground,
    lineHeight: 24,
  },
});
