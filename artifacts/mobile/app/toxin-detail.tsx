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
import toxins from "@/constants/toxins";

export default function ToxinDetailScreen() {
  const { toxinIndex } = useLocalSearchParams<{ toxinIndex: string }>();
  const navigation = useNavigation();
  const idx = parseInt(toxinIndex ?? "0", 10);
  const toxin = toxins[idx];
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (toxin) {
      navigation.setOptions({ title: toxin.toxin });
    }
  }, [toxin, navigation]);

  const filtered = useMemo(() => {
    if (!toxin) return [];
    const q = query.trim();
    if (!q) return toxin.rows;
    return toxin.rows.filter(
      (r) =>
        r.product.includes(q) ||
        r.applicable_part.includes(q) ||
        r.notes.includes(q),
    );
  }, [toxin, query]);

  if (!toxin) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>لم يتم العثور على الملوث</Text>
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
            <Text style={styles.titleText}>{toxin.toxin}</Text>
            <Text style={styles.subtitleText}>
              {toxin.rows.length} حد أقصى مسجل
            </Text>
          </View>
          <View style={styles.searchWrap}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="ابحث عن صنف غذائي…"
              placeholderTextColor="#9ca3af"
              style={styles.searchInput}
              textAlign="right"
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
      renderItem={({ item, index }) => (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.productText} numberOfLines={3}>
              {item.product}
            </Text>
            <View style={styles.limitPill}>
              <Text style={styles.limitValue}>{item.max_level}</Text>
              <Text style={styles.limitUnit}>{item.unit}</Text>
            </View>
            <View style={styles.rowBadge}>
              <Text style={styles.rowBadgeText}>{index + 1}</Text>
            </View>
          </View>
          {item.applicable_part ? (
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>جزء المنتج المنطبق</Text>
              <Text style={styles.fieldValue}>{item.applicable_part}</Text>
            </View>
          ) : null}
          {item.notes ? (
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>ملاحظات</Text>
              <Text style={styles.fieldValue}>{item.notes}</Text>
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
    backgroundColor: "#c2185b",
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  titleText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
    textAlign: "right",
  },
  subtitleText: {
    fontSize: 12,
    color: "#fce4ec",
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
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    gap: 10,
  },
  rowBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: "#f3e5f5",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 2,
  },
  rowBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#7b1fa2",
  },
  productText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: colors.light.text,
    textAlign: "right",
    lineHeight: 22,
  },
  limitPill: {
    backgroundColor: "#fce4ec",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: "center",
    minWidth: 70,
  },
  limitValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#880e4f",
  },
  limitUnit: {
    fontSize: 10,
    color: "#ad1457",
    marginTop: 2,
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
    textAlign: "right",
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 13,
    color: colors.light.text,
    textAlign: "right",
    lineHeight: 20,
  },
});
