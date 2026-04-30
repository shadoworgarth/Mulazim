import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import colors from "@/constants/colors";
import { FINES_CATEGORIES, FineEntry } from "@/constants/fines";

const ACCENT = "#c2185b";

const ENTITY_COLORS: Record<string, { bg: string; text: string }> = {
  "المصنع":       { bg: "#e3f2fd", text: "#1565c0" },
  "المستورد":     { bg: "#f3e5f5", text: "#6a1b9a" },
  "الموزع":       { bg: "#e8f5e9", text: "#2e7d32" },
  "منفذ البيع":   { bg: "#fff8e1", text: "#f57f17" },
};

export default function FinesDetailScreen() {
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const router = useRouter();
  const [query, setQuery] = useState("");

  const category = useMemo(
    () => FINES_CATEGORIES.find((c) => c.id === categoryId),
    [categoryId]
  );

  const violations = category?.data?.violations ?? [];
  const entityTypes = category?.data?.entityTypes ?? [];

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return violations;
    return violations.filter((v) =>
      v.violation.includes(q) || v.number.includes(q)
    );
  }, [violations, query]);

  if (!category) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: "center", marginTop: 40, color: "#aaa" }}>
          الفئة غير موجودة
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder="بحث في المخالفات..."
          placeholderTextColor="#9ca3af"
          value={query}
          onChangeText={setQuery}
          textAlign="right"
          returnKeyType="search"
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery("")} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>✕</Text>
          </Pressable>
        )}
      </View>

      {query.length > 0 && (
        <Text style={styles.resultCount}>
          {filtered.length} نتيجة من أصل {violations.length}
        </Text>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.number}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>لا توجد نتائج</Text>
          </View>
        }
        renderItem={({ item }: { item: FineEntry }) => (
          <ViolationCard item={item} entityTypes={entityTypes} />
        )}
      />
    </View>
  );
}

function ViolationCard({
  item,
  entityTypes,
}: {
  item: FineEntry;
  entityTypes: string[];
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.numberBadge}>
          <Text style={styles.numberText}>{item.number}</Text>
        </View>
        <Text style={styles.violationText}>{item.violation}</Text>
      </View>

      <View style={styles.finesGrid}>
        {entityTypes.map((entity) => {
          const amount = item.fines[entity];
          const c = ENTITY_COLORS[entity] ?? { bg: "#f3f4f6", text: "#374151" };
          return (
            <View
              key={entity}
              style={[styles.fineRow, { backgroundColor: c.bg }]}
            >
              <Text style={[styles.fineAmount, { color: c.text }]} numberOfLines={2}>
                {amount ?? "—"}
              </Text>
              <Text style={[styles.fineEntity, { color: c.text }]}>
                {entity}
              </Text>
            </View>
          );
        })}
      </View>

      {(item.closure || item.notes) && (
        <View style={styles.notesWrap}>
          {item.closure && (
            <Text style={styles.closureText}>⛔ {item.closure}</Text>
          )}
          {item.notes && (
            <Text style={styles.notesText}>ℹ️ {item.notes}</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  searchWrap: {
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 6,
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 15,
    color: colors.light.text,
  },
  clearBtn: {
    padding: 6,
  },
  clearBtnText: {
    fontSize: 14,
    color: "#9ca3af",
  },
  resultCount: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "right",
    marginHorizontal: 20,
    marginBottom: 4,
  },
  listContent: {
    padding: 16,
    paddingBottom: Platform.OS === "web" ? 40 : 32,
    gap: 14,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    padding: 14,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  numberBadge: {
    backgroundColor: ACCENT,
    borderRadius: 8,
    minWidth: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    flexShrink: 0,
  },
  numberText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ffffff",
  },
  violationText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: colors.light.text,
    textAlign: "right",
    lineHeight: 21,
  },
  finesGrid: {
    padding: 10,
    gap: 6,
  },
  fineRow: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  fineEntity: {
    fontSize: 12,
    fontWeight: "700",
    flexShrink: 0,
  },
  fineAmount: {
    fontSize: 13,
    fontWeight: "500",
    textAlign: "left",
    flex: 1,
  },
  notesWrap: {
    backgroundColor: "#fffde7",
    borderTopWidth: 1,
    borderTopColor: "#fdd835",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 4,
  },
  closureText: {
    fontSize: 12,
    color: "#b71c1c",
    textAlign: "right",
    lineHeight: 18,
  },
  notesText: {
    fontSize: 12,
    color: "#5d4037",
    textAlign: "right",
    lineHeight: 18,
  },
  emptyWrap: {
    alignItems: "center",
    paddingTop: 40,
  },
  emptyText: {
    fontSize: 14,
    color: colors.light.mutedForeground,
  },
});
