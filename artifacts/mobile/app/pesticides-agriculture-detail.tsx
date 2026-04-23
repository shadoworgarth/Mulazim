import { useLocalSearchParams, useNavigation } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import colors from "@/constants/colors";
import pesticides from "@/constants/pesticides";

const SUBSTANCES = pesticides.sections.agriculture.substances;

export default function PesticidesAgricultureDetailScreen() {
  const { substanceIndex } = useLocalSearchParams<{ substanceIndex: string }>();
  const navigation = useNavigation();
  const idx = parseInt(substanceIndex ?? "0", 10);
  const sub = SUBSTANCES[idx];
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (sub) navigation.setOptions({ title: sub.substance });
  }, [sub, navigation]);

  const filtered = useMemo(() => {
    if (!sub) return [];
    const q = query.trim().toLowerCase();
    if (!q) return sub.entries;
    return sub.entries.filter(
      (r) =>
        r.commodity.toLowerCase().includes(q) ||
        r.remark.toLowerCase().includes(q),
    );
  }, [sub, query]);

  if (!sub) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>لم يتم العثور على المبيد</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={filtered}
      keyExtractor={(_, i) => i.toString()}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <View>
          <View style={styles.titleCard}>
            <Text style={styles.titleText}>{sub.substance}</Text>
            <Text style={styles.subtitleText}>
              {sub.entries.length} حد أقصى مسجل
            </Text>
          </View>
          <View style={styles.searchWrap}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="ابحث عن منتج…"
              placeholderTextColor="#9ca3af"
              style={styles.searchInput}
              textAlign="left"
            />
          </View>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={{ fontSize: 36 }}>🔍</Text>
          <Text style={styles.emptyText}>لا توجد نتائج مطابقة</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.productText}>{item.commodity}</Text>
            <View style={styles.limitPill}>
              <Text style={styles.limitValue}>{item.mrl}</Text>
            </View>
          </View>
          {item.remark ? (
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Remark</Text>
              <Text style={styles.fieldValue}>{item.remark}</Text>
            </View>
          ) : null}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingTop: 40,
  },
  errorText: {
    fontSize: 16,
    color: colors.light.mutedForeground,
  },
  emptyText: {
    fontSize: 14,
    color: colors.light.mutedForeground,
  },
  listContent: {
    padding: 16,
    paddingBottom: Platform.OS === "web" ? 34 : 24,
    gap: 10,
  },
  titleCard: {
    backgroundColor: "#2e7d32",
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  titleText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
    textAlign: "left",
  },
  subtitleText: {
    fontSize: 12,
    color: "#c8e6c9",
    textAlign: "right",
    marginTop: 4,
  },
  searchWrap: {
    marginBottom: 10,
  },
  searchInput: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    fontSize: 14,
    color: colors.light.text,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    gap: 10,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  productText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: colors.light.text,
    textAlign: "left",
    lineHeight: 20,
  },
  limitPill: {
    backgroundColor: "#e8f5e9",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: "center",
    minWidth: 80,
  },
  limitValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1b5e20",
    textAlign: "center",
  },
  fieldBlock: {
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    padding: 10,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6b7280",
    textAlign: "left",
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 13,
    color: colors.light.text,
    textAlign: "left",
    lineHeight: 20,
  },
});
