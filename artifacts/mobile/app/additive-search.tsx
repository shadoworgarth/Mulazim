import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import appData, { SubItem } from "@/constants/data";
import colors from "@/constants/colors";

const generalData = require("../assets/general-additives.json") as {
  table1: { rows: { ins: string; name: string }[] };
  table2: { rows: { ins: string; color: string; food: string }[] };
};

// ─── Result types ─────────────────────────────────────────────────────────────
type ItemResult = {
  kind: "item";
  categoryIndex: number;
  categoryName: string;
  itemIndex: number;
  item: SubItem;
  matchedAdditive: string;
};

type GeneralMatchResult = {
  kind: "general-match";
  ins: string;
  label: string;      // English name or color name
  detail: string;     // food description (table2 only)
};

type AllowsGeneralResult = {
  kind: "allows-general";
  categoryIndex: number;
  categoryName: string;
  itemIndex: number;
  item: SubItem;
};

type SearchResult = ItemResult | GeneralMatchResult | AllowsGeneralResult;

// ─── Highlight helper ─────────────────────────────────────────────────────────
function highlight(text: string, query: string): React.ReactNode {
  if (!query.trim()) return <Text style={styles.matchText}>{text}</Text>;
  const lq = query.toLowerCase();
  const lt = text.toLowerCase();
  const idx = lt.indexOf(lq);
  if (idx === -1) return <Text style={styles.matchText}>{text}</Text>;
  return (
    <Text style={styles.matchText}>
      {text.slice(0, idx)}
      <Text style={styles.matchHighlight}>{text.slice(idx, idx + query.length)}</Text>
      {text.slice(idx + query.length)}
    </Text>
  );
}

export default function AdditiveSearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 2) return [];

    const found: SearchResult[] = [];
    const itemResultKeys = new Set<string>(); // "catIdx-itemIdx"

    // ── 1. Regular items: search row2.D ──────────────────────────────────────
    appData.forEach((category, categoryIndex) => {
      category.subItems.forEach((item, itemIndex) => {
        if (!item.data?.row2.D) return;
        const additivesText = item.data.row2.D.toLowerCase();
        if (!additivesText.includes(q)) return;

        const lines = item.data.row2.D
          .split(/[\r\n]+/)
          .map((s) => s.trim())
          .filter(Boolean);
        const matchedLine = lines.find((l) => l.toLowerCase().includes(q)) ?? item.data!.row2.D.slice(0, 80);

        found.push({ kind: "item", categoryIndex, categoryName: category.name.trim(), itemIndex, item, matchedAdditive: matchedLine });
        itemResultKeys.add(`${categoryIndex}-${itemIndex}`);
      });
    });

    // ── 2. Search General Additives table1 (INS + English name) ──────────────
    const generalMatches: GeneralMatchResult[] = [];
    const seenIns = new Set<string>();

    generalData.table1.rows.forEach((row) => {
      if (
        row.ins.toLowerCase().includes(q) ||
        row.name.toLowerCase().includes(q)
      ) {
        if (!seenIns.has(row.ins)) {
          seenIns.add(row.ins);
          generalMatches.push({ kind: "general-match", ins: row.ins, label: row.name, detail: "" });
        }
      }
    });

    // ── 3. Search General Additives table2 (INS + color + food) ──────────────
    generalData.table2.rows.forEach((row) => {
      if (
        row.ins.toLowerCase().includes(q) ||
        row.color.toLowerCase().includes(q) ||
        row.food.toLowerCase().includes(q)
      ) {
        if (!seenIns.has(row.ins)) {
          seenIns.add(row.ins);
          generalMatches.push({ kind: "general-match", ins: row.ins, label: row.color, detail: row.food });
        } else {
          // Update existing entry with food detail if empty
          const existing = generalMatches.find((m) => m.ins === row.ins);
          if (existing && !existing.detail) existing.detail = row.food;
        }
      }
    });

    found.push(...generalMatches);

    // ── 4. If any general additive matched → show items with "نعم" ────────────
    if (generalMatches.length > 0) {
      appData.forEach((category, categoryIndex) => {
        category.subItems.forEach((item, itemIndex) => {
          const key = `${categoryIndex}-${itemIndex}`;
          // Only add if not already shown as a regular result
          if (itemResultKeys.has(key)) return;
          if (item.data?.row2.C !== "نعم") return;

          found.push({ kind: "allows-general", categoryIndex, categoryName: category.name.trim(), itemIndex, item });
        });
      });
    }

    return found;
  }, [query]);

  const handleItemResult = useCallback(
    (categoryIndex: number, itemIndex: number) => {
      router.push({ pathname: "/detail", params: { categoryIndex, itemIndex } });
    },
    [router]
  );

  const renderItem = ({ item: result }: { item: SearchResult }) => {
    // ── Regular item match ───────────────────────────────────────────────────
    if (result.kind === "item") {
      return (
        <Pressable
          style={({ pressed }) => [styles.resultCard, { opacity: pressed ? 0.84 : 1 }]}
          onPress={() => handleItemResult(result.categoryIndex, result.itemIndex)}
        >
          <View style={styles.resultHeader}>
            <Feather name="chevron-left" size={16} color={colors.light.mutedForeground} />
            <Text style={styles.resultItemName} numberOfLines={2}>{result.item.name.trim()}</Text>
          </View>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText} numberOfLines={1}>{result.categoryName}</Text>
          </View>
          <View style={styles.matchRow}>
            <Feather name="check-circle" size={14} color="#0e7c7c" style={styles.matchIcon} />
            <View style={styles.matchTextWrap}>{highlight(result.matchedAdditive, query.trim())}</View>
          </View>
          {result.item.data?.row2.A ? <Text style={styles.itemCode}>{result.item.data.row2.A}</Text> : null}
        </Pressable>
      );
    }

    // ── General additive match ───────────────────────────────────────────────
    if (result.kind === "general-match") {
      return (
        <Pressable
          style={({ pressed }) => [styles.resultCard, styles.generalCard, { opacity: pressed ? 0.84 : 1 }]}
          onPress={() => router.push("/general-additives")}
        >
          <View style={styles.resultHeader}>
            <Feather name="external-link" size={16} color="#7c4e0e" />
            <Text style={[styles.resultItemName, { color: "#7c4e0e" }]} numberOfLines={2}>
              {highlight(result.label, query.trim()) as any}
            </Text>
          </View>
          <View style={styles.generalBadgeRow}>
            <View style={styles.generalGreenBadge}>
              <Text style={styles.generalGreenBadgeText}>مضاف عام</Text>
            </View>
            <View style={styles.generalBadge}>
              <Text style={styles.generalBadgeText}>INS {result.ins}</Text>
            </View>
          </View>
          {result.detail ? (
            <View style={[styles.matchRow, { backgroundColor: "#fff8f0" }]}>
              <Feather name="info" size={14} color="#7c4e0e" style={styles.matchIcon} />
              <View style={styles.matchTextWrap}>
                <Text style={[styles.matchText, { color: "#7c4e0e" }]}>{result.detail}</Text>
              </View>
            </View>
          ) : null}
        </Pressable>
      );
    }

    // ── Item that allows general additives ────────────────────────────────────
    return (
      <Pressable
        style={({ pressed }) => [styles.resultCard, { opacity: pressed ? 0.84 : 1 }]}
        onPress={() => handleItemResult(result.categoryIndex, result.itemIndex)}
      >
        <View style={styles.resultHeader}>
          <Feather name="chevron-left" size={16} color={colors.light.mutedForeground} />
          <Text style={styles.resultItemName} numberOfLines={2}>{result.item.name.trim()}</Text>
        </View>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText} numberOfLines={1}>{result.categoryName}</Text>
        </View>
        <View style={[styles.matchRow, { backgroundColor: "#f0faf5" }]}>
          <Feather name="check-circle" size={14} color="#2e8b57" style={styles.matchIcon} />
          <View style={styles.matchTextWrap}>
            <Text style={[styles.matchText, { color: "#2e8b57" }]}>يسمح بالمضافات الغذائية العامة</Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={[styles.header, { paddingTop: Platform.OS === "web" ? 67 : insets.top + 12 }]}>
        <Text style={styles.headerTitle}>بحث عن مادة مضافة</Text>
        <Text style={styles.headerSubtitle}>
          ابحث باسم المادة المضافة لمعرفة المنتجات المسموح بها
        </Text>
        <View style={styles.searchBox}>
          <Feather name="search" size={18} color="#0e7c7c" />
          <TextInput
            style={styles.searchInput}
            placeholder="مثال: ASCORBYL ESTERS 304"
            placeholderTextColor="#9bb0b0"
            value={query}
            onChangeText={setQuery}
            autoFocus
            autoCapitalize="none"
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")}>
              <Feather name="x-circle" size={18} color={colors.light.mutedForeground} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Results */}
      <FlatList
        data={results}
        keyExtractor={(_, i) => i.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          query.trim().length >= 2 && results.length > 0 ? (
            <View style={styles.resultCountRow}>
              <Text style={styles.resultCount}>
                {results.filter((r) => r.kind !== "general-match").length} بند
              </Text>
              {results.some((r) => r.kind === "general-match") && (
                <View style={styles.generalGreenBadge}>
                  <Text style={styles.generalGreenBadgeText}>
                    {results.filter((r) => r.kind === "general-match").length} مضاف عام
                  </Text>
                </View>
              )}
            </View>
          ) : query.trim().length >= 2 ? (
            <Text style={styles.resultCount}>لا توجد نتائج</Text>
          ) : null
        }
        renderItem={renderItem}
        ListEmptyComponent={
          query.trim().length >= 2 ? (
            <View style={styles.emptyState}>
              <Feather name="search" size={48} color={colors.light.mutedForeground} />
              <Text style={styles.emptyTitle}>لا توجد نتائج</Text>
              <Text style={styles.emptySubtitle}>جرب البحث بجزء من اسم المادة المضافة</Text>
            </View>
          ) : query.trim().length > 0 ? (
            <View style={styles.emptyState}>
              <Feather name="type" size={48} color={colors.light.mutedForeground} />
              <Text style={styles.emptyTitle}>أدخل حرفين على الأقل</Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Feather name="search" size={48} color={colors.light.mutedForeground} />
              <Text style={styles.emptyTitle}>ابدأ البحث</Text>
              <Text style={styles.emptySubtitle}>
                اكتب اسم أي مادة مضافة للعثور على جميع المنتجات المرتبطة بها
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.background },
  header: { backgroundColor: "#0a5f5f", paddingHorizontal: 20, paddingBottom: 20 },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#ffffff", textAlign: "right", marginBottom: 4 },
  headerSubtitle: { fontSize: 12, color: "#b2d8d8", textAlign: "right", marginBottom: 14, lineHeight: 18 },
  searchBox: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#ffffff",
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.light.text, padding: 0 },
  listContent: { padding: 16, paddingBottom: Platform.OS === "web" ? 34 : 24, gap: 10 },
  resultCountRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "flex-end",
    gap: 8, marginBottom: 4, paddingHorizontal: 4,
  },
  resultCount: {
    fontSize: 12, fontWeight: "600", color: colors.light.mutedForeground,
    textAlign: "right",
  },
  resultCard: {
    backgroundColor: "#ffffff", borderRadius: 14, padding: 14, gap: 8,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  generalCard: {
    borderWidth: 1.5, borderColor: "#7c4e0e33", backgroundColor: "#fffaf6",
  },
  resultHeader: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  resultItemName: { flex: 1, fontSize: 15, fontWeight: "600", color: colors.light.text, textAlign: "right", lineHeight: 22 },
  categoryBadge: {
    backgroundColor: "#0e7c7c22", borderRadius: 6, paddingHorizontal: 8,
    paddingVertical: 3, alignSelf: "flex-end",
  },
  categoryBadgeText: { fontSize: 11, fontWeight: "500", color: "#0e7c7c", textAlign: "right" },
  generalBadgeRow: {
    flexDirection: "row", gap: 6, justifyContent: "flex-end",
  },
  generalGreenBadge: {
    backgroundColor: "#1a7a4022", borderRadius: 6, paddingHorizontal: 8,
    paddingVertical: 3,
  },
  generalGreenBadgeText: { fontSize: 11, fontWeight: "700", color: "#1a7a40", textAlign: "right" },
  generalBadge: {
    backgroundColor: "#7c4e0e22", borderRadius: 6, paddingHorizontal: 8,
    paddingVertical: 3,
  },
  generalBadgeText: { fontSize: 11, fontWeight: "500", color: "#7c4e0e", textAlign: "right" },
  matchRow: {
    flexDirection: "row", alignItems: "flex-start", gap: 6,
    backgroundColor: "#f0faf8", borderRadius: 8, padding: 8,
  },
  matchIcon: { marginTop: 1, flexShrink: 0 },
  matchTextWrap: { flex: 1 },
  matchText: { fontSize: 12, color: colors.light.text, lineHeight: 18 },
  matchHighlight: { backgroundColor: "#ffe066", color: "#333", fontWeight: "700", borderRadius: 3 },
  itemCode: { fontSize: 11, color: "#0e7c7c", textAlign: "right" },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 12, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 17, fontWeight: "600", color: colors.light.text, textAlign: "center" },
  emptySubtitle: { fontSize: 14, color: colors.light.mutedForeground, textAlign: "center", lineHeight: 22 },
});
