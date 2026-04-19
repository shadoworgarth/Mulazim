import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import appData, { SubItem } from "@/constants/data";
import colors from "@/constants/colors";
import { getParentCodes, getAdditivesByCode } from "@/constants/category-utils";

const generalData = require("../assets/general-additives.json") as {
  table1: { rows: { ins: string; name: string }[] };
  table2: { rows: { ins: string; color: string; food: string }[] };
};

const comprehensiveData = (require("../assets/comprehensive-additives.json") as {
  ins: string; name: string; funcClass?: string;
}[]).filter((e) => /^\d/.test(e.ins));

type AdditiveEntry = { ins: string; name: string };

const generalInsSet = new Set<string>([
  ...generalData.table1.rows.map((r) => r.ins.toLowerCase()),
  ...generalData.table2.rows.map((r) => r.ins.toLowerCase()),
]);

const CHILDREN_WARNING_SET = new Set(["102", "110", "122", "129"]);
const CHILDREN_WARNING_TEXT = "قد يكون له تأثير سلبي على النشاط والتركيز لدى الأطفال";

// ── Range-aware matching helpers ─────────────────────────────────────────────

const ROMAN: Record<string, number> = {
  i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, x: 10,
};
function romanToInt(r: string): number { return ROMAN[r.toLowerCase()] ?? 0; }

function normCode(s: string): string {
  return s.replace(/\s+/g, "").toLowerCase();
}

function normalizeQuery(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^ins\s*/i, "")
    .replace(/^e(?=\d{3})/i, "")
    .trim();
}

function missingLetterExpansions(q: string): string[] {
  const m = q.match(/^(\d{3,4})\(([ivx]+)\)$/i);
  if (!m) return [];
  return ["a", "b", "c", "d", "e", "f"].map((l) => `${m[1]}${l}(${m[2]})`);
}

function escRx(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function matchesPrefixRoman(tn: string, prefix: string, qVal: number): boolean {
  const esc = "(?<!\\d)" + escRx(prefix);
  const rangeRx = new RegExp(esc + "\\(([ivx]+)\\)-\\(([ivx]+)\\)", "gi");
  let m: RegExpExecArray | null;
  while ((m = rangeRx.exec(tn)) !== null) {
    if (qVal >= romanToInt(m[1]) && qVal <= romanToInt(m[2])) return true;
  }
  const listRx = new RegExp(esc + "(?:\\(([ivx]+)\\),?\\s*)+", "gi");
  while ((m = listRx.exec(tn)) !== null) {
    const block = m[0];
    const vals = [...block.matchAll(/\(([ivx]+)\)/gi)].map((x) => romanToInt(x[1]));
    if (vals.includes(qVal)) return true;
  }
  return false;
}

function matchesQuery(text: string, q: string): boolean {
  const tl = text.toLowerCase();
  const tn = normCode(text);
  const qn = normCode(q);

  if (tl.includes(q)) {
    const idx = tl.indexOf(q);
    const before = idx > 0 ? tl[idx - 1] : " ";
    if (!/\d/.test(before)) return true;
  }

  const queryNum = parseInt(q, 10);
  if (/^\d{3,4}$/.test(q) && !Number.isNaN(queryNum)) {
    const wordBound = new RegExp(`(?<!\\d)${q}(?!\\d)`, "g");
    if (wordBound.test(tl)) return true;
    const numRange = /\b(\d{3,4})-(\d{3,4})\b/g;
    let m: RegExpExecArray | null;
    while ((m = numRange.exec(tl)) !== null) {
      if (queryNum >= Number(m[1]) && queryNum <= Number(m[2])) return true;
    }
    return false;
  }

  const romanQ = q.match(/^(\d{3,4}[a-z]?)\(([ivx]+)\)$/i);
  if (romanQ) {
    const prefix = romanQ[1].toLowerCase();
    const qVal = romanToInt(romanQ[2]);
    if (qVal > 0) {
      const exactRx = new RegExp(`(?<!\\d)${escRx(qn)}(?![\\w])`, "i");
      if (exactRx.test(tn)) return true;
      if (matchesPrefixRoman(tn, prefix, qVal)) return true;
      for (const exp of missingLetterExpansions(q)) {
        const expM = exp.match(/^(\d{3,4}[a-z])\(([ivx]+)\)$/i);
        if (!expM) continue;
        const expPfx = expM[1].toLowerCase();
        const expVal = romanToInt(expM[2]);
        if (matchesPrefixRoman(tn, expPfx, expVal)) return true;
      }
    }
    return false;
  }

  const genericQ = q.match(/^\(([ivx]+)\)$/i);
  if (genericQ) {
    const qVal = romanToInt(genericQ[1]);
    if (qVal > 0) {
      const anyRange = /\(([ivx]+)\)-\(([ivx]+)\)/gi;
      let m: RegExpExecArray | null;
      while ((m = anyRange.exec(tl)) !== null) {
        if (qVal >= romanToInt(m[1]) && qVal <= romanToInt(m[2])) return true;
      }
    }
    return false;
  }

  if (qn.length >= 2 && tn.includes(qn)) return true;

  {
    const numMatch = qn.match(/^(\d{3,4})/);
    if (numMatch) {
      const numBase = numMatch[1];
      const abbrevRx = new RegExp(
        `(?<!\\d)${escRx(numBase)}[a-z]?\\([ivx]+\\)((?:,\\s*[a-z]?(?:\\([ivx]+\\))?(?![a-z\\d]))+)`,
        "gi"
      );
      let am: RegExpExecArray | null;
      while ((am = abbrevRx.exec(tn)) !== null) {
        const contStr = am[1];
        for (const part of [...contStr.matchAll(/,\s*([a-z]?)(\([ivx]+\))?/gi)]) {
          const letter = part[1] || "";
          const roman  = part[2] || "";
          if (!letter && !roman) continue;
          if (`${numBase}${letter}${roman}`.toLowerCase() === qn) return true;
        }
      }
    }
  }

  return false;
}

// ── Single-additive permit check for a food item ─────────────────────────────

type AdditiveCheck = {
  ins: string;
  name: string;
  matchedLine?: string;
  inheritedFrom?: string;
  isGeneral?: boolean;
};

function checkAdditiveForItem(
  additive: AdditiveEntry,
  itemCode: string | undefined,
  itemD: string | undefined,
  itemC: string | undefined,
): AdditiveCheck | null {
  const q = normalizeQuery(additive.ins);

  if (itemD) {
    const lines = itemD.split(/[\r\n]+/).map((s) => s.trim()).filter(Boolean);
    const matched = lines.find((l) => matchesQuery(l.toLowerCase(), q));
    if (matched) return { ins: additive.ins, name: additive.name, matchedLine: matched };
  }

  if (itemCode) {
    for (const parentCode of getParentCodes(itemCode)) {
      const parentData = getAdditivesByCode(parentCode);
      if (!parentData || parentData.lines.length === 0) continue;
      const matched = parentData.lines.find((l) => matchesQuery(l.toLowerCase(), q));
      if (matched) return { ins: additive.ins, name: additive.name, matchedLine: matched, inheritedFrom: parentCode };
    }
  }

  if (itemC === "نعم" && generalInsSet.has(additive.ins.toLowerCase())) {
    return { ins: additive.ins, name: additive.name, isGeneral: true };
  }

  return null;
}

// ── Food item result type ─────────────────────────────────────────────────────

type ItemMatch = {
  categoryIndex: number;
  categoryName: string;
  itemIndex: number;
  item: SubItem;
  checks: AdditiveCheck[];
};

// ── Screen ────────────────────────────────────────────────────────────────────

export default function AdditiveSearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [selectedAdditives, setSelectedAdditives] = useState<AdditiveEntry[]>([]);

  // Suggestion list — shown while user is typing
  const suggestions = useMemo<AdditiveEntry[]>(() => {
    const raw = query.trim();
    if (raw.length < 2) return [];
    const q = normalizeQuery(raw);
    if (!q || q.length < 2) return [];
    const qn = normCode(q);
    const selectedSet = new Set(selectedAdditives.map((a) => a.ins));
    return comprehensiveData
      .filter((entry) => {
        if (selectedSet.has(entry.ins)) return false;
        const insNorm = normCode(entry.ins);
        const nameNorm = entry.name.toLowerCase();
        const codeMatch =
          insNorm === qn ||
          insNorm.startsWith(qn + "(") ||
          insNorm.startsWith(qn + "a") ||
          insNorm.startsWith(qn + "b") ||
          insNorm.startsWith(qn + "c") ||
          insNorm.startsWith(qn + "d") ||
          insNorm.startsWith(qn + "e") ||
          insNorm.startsWith(qn + "f") ||
          (/^\d{3,4}$/.test(qn) && new RegExp(`^${escRx(qn)}[^0-9]`).test(insNorm));
        const nameMatch = nameNorm.includes(q.toLowerCase());
        return codeMatch || nameMatch;
      })
      .slice(0, 12);
  }, [query, selectedAdditives]);

  // Food item results — intersection of all selected additives
  const itemResults = useMemo<ItemMatch[]>(() => {
    if (selectedAdditives.length === 0) return [];
    const matches: ItemMatch[] = [];
    appData.forEach((category, categoryIndex) => {
      category.subItems.forEach((item, itemIndex) => {
        const itemCode = item.data?.row2?.A?.trim();
        const itemD = item.data?.row2?.D;
        const itemC = item.data?.row2?.C;
        const checks: AdditiveCheck[] = [];
        for (const additive of selectedAdditives) {
          const result = checkAdditiveForItem(additive, itemCode, itemD, itemC);
          if (!result) return; // one additive not permitted → skip item
          checks.push(result);
        }
        matches.push({ categoryIndex, categoryName: category.name.trim(), itemIndex, item, checks });
      });
    });
    return matches;
  }, [selectedAdditives]);

  const addAdditive = useCallback((entry: AdditiveEntry) => {
    setSelectedAdditives((prev) => {
      if (prev.some((a) => a.ins === entry.ins)) return prev;
      return [...prev, entry];
    });
    setQuery("");
  }, []);

  const removeAdditive = useCallback((ins: string) => {
    setSelectedAdditives((prev) => prev.filter((a) => a.ins !== ins));
  }, []);

  const showingSuggestions = query.trim().length >= 2;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Platform.OS === "web" ? 67 : insets.top + 12 }]}>
        <Text style={styles.headerTitle}>بحث عن مادة مضافة</Text>
        <Text style={styles.headerSubtitle}>
          أضف مادة أو أكثر لعرض الأصناف الغذائية المسموح بها لجميعها
        </Text>
        <View style={styles.searchBox}>
          <Feather name="search" size={18} color="#0e7c7c" />
          <TextInput
            style={styles.searchInput}
            placeholder="اسم المادة المضافة أو رمز INS"
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

        {/* Selected additive chips */}
        {selectedAdditives.length > 0 && (
          <View style={styles.chipsContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipsScroll}
              contentContainerStyle={styles.chipsRow}
            >
              {selectedAdditives.map((a) => {
                const hasWarning = CHILDREN_WARNING_SET.has(a.ins);
                return (
                  <View key={a.ins} style={[styles.chip, hasWarning && styles.chipWarn]}>
                    <View style={styles.chipMainRow}>
                      <Pressable onPress={() => removeAdditive(a.ins)} hitSlop={8}>
                        <Feather name="x" size={13} color={hasWarning ? "#fdba74" : "#b2d8d8"} />
                      </Pressable>
                      <Text style={styles.chipText} numberOfLines={1}>{a.name.split(",")[0]}</Text>
                      <View style={[styles.chipInsBadge, hasWarning && styles.chipInsBadgeWarn]}>
                        <Text style={[styles.chipIns, hasWarning && styles.chipInsWarn]}>INS {a.ins}</Text>
                      </View>
                    </View>
                    {hasWarning && (
                      <View style={styles.chipWarningRow}>
                        <Feather name="alert-triangle" size={10} color="#f97316" />
                        <Text style={styles.chipWarningText}>{CHILDREN_WARNING_TEXT}</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </ScrollView>
            <Pressable
              onPress={() => setSelectedAdditives([])}
              style={({ pressed }) => [styles.clearAllBtn, { opacity: pressed ? 0.7 : 1 }]}
              hitSlop={6}
            >
              <Feather name="trash-2" size={14} color="#b2d8d8" />
            </Pressable>
          </View>
        )}
      </View>

      {/* Suggestions list — visible while typing */}
      {showingSuggestions ? (
        <FlatList
          data={suggestions}
          keyExtractor={(item) => item.ins}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            suggestions.length > 0 ? (
              <Text style={styles.sectionLabel}>اختر مادة مضافة لإضافتها</Text>
            ) : null
          }
          renderItem={({ item: entry }) => (
            <Pressable
              style={({ pressed }) => [styles.suggestionCard, { opacity: pressed ? 0.78 : 1 }]}
              onPress={() => addAdditive({ ins: entry.ins, name: entry.name })}
            >
              <View style={styles.suggestionRow}>
                <Feather name="plus-circle" size={16} color="#0e7c7c" />
                <Text style={styles.suggestionName} numberOfLines={2}>{entry.name}</Text>
                <View style={styles.suggestionInsBadge}>
                  <Text style={styles.suggestionIns}>INS {entry.ins}</Text>
                </View>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Feather name="search" size={48} color={colors.light.mutedForeground} />
              <Text style={styles.emptyTitle}>لا توجد نتائج</Text>
              <Text style={styles.emptySubtitle}>جرب البحث بجزء من اسم المادة المضافة أو رمز INS</Text>
            </View>
          }
        />
      ) : (
        /* Food item results list */
        <FlatList
          data={itemResults}
          keyExtractor={(_, i) => i.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            selectedAdditives.length > 0 && itemResults.length > 0 ? (
              <View style={styles.resultCountRow}>
                <Text style={styles.resultCount}>{itemResults.length} صنف غذائي مسموح</Text>
              </View>
            ) : null
          }
          renderItem={({ item: result }) => (
            <Pressable
              style={({ pressed }) => [styles.resultCard, { opacity: pressed ? 0.84 : 1 }]}
              onPress={() =>
                router.push({ pathname: "/detail", params: { categoryIndex: result.categoryIndex, itemIndex: result.itemIndex } })
              }
            >
              <View style={styles.resultHeader}>
                <Feather name="chevron-left" size={16} color={colors.light.mutedForeground} />
                <Text style={styles.resultItemName} numberOfLines={2}>{result.item.name.trim()}</Text>
              </View>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText} numberOfLines={1}>{result.categoryName}</Text>
              </View>
              {result.checks.map((check, idx) => (
                <View key={idx} style={styles.checkGroup}>
                  {check.inheritedFrom ? (
                    <View style={styles.inheritedBadge}>
                      <Feather name="corner-left-up" size={12} color="#6b5b00" />
                      <Text style={styles.inheritedBadgeText}>من التصنيف الرئيسي ({check.inheritedFrom})</Text>
                    </View>
                  ) : null}
                  <View style={[styles.matchRow, check.isGeneral ? styles.matchRowGeneral : {}]}>
                    <Feather
                      name="check-circle"
                      size={14}
                      color={check.isGeneral ? "#1d4ed8" : "#0e7c7c"}
                      style={styles.matchIcon}
                    />
                    <View style={styles.matchTextWrap}>
                      {check.isGeneral ? (
                        <Text style={[styles.matchText, { color: "#1e3a8a" }]}>
                          INS {check.ins} — مضاف عام مسموح
                        </Text>
                      ) : (
                        <Text style={styles.matchText} numberOfLines={2}>{check.matchedLine}</Text>
                      )}
                    </View>
                  </View>
                  {CHILDREN_WARNING_SET.has(check.ins) ? (
                    <View style={styles.childrenWarning}>
                      <Feather name="alert-triangle" size={11} color="#c2410c" />
                      <Text style={styles.childrenWarningText}>{CHILDREN_WARNING_TEXT}</Text>
                    </View>
                  ) : null}
                </View>
              ))}
              {result.item.data?.row2.A ? (
                <Text style={styles.itemCode}>{result.item.data.row2.A}</Text>
              ) : null}
            </Pressable>
          )}
          ListEmptyComponent={
            selectedAdditives.length > 0 ? (
              <View style={styles.emptyState}>
                <Feather name="x-circle" size={48} color="#cc4444" />
                <Text style={styles.emptyTitle}>لا يوجد تطابق</Text>
                <Text style={styles.emptySubtitle}>
                  لا يوجد صنف غذائي يسمح بجميع المواد المضافة المحددة معاً
                </Text>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Feather name="plus-circle" size={48} color={colors.light.mutedForeground} />
                <Text style={styles.emptyTitle}>ابدأ بإضافة مادة مضافة</Text>
                <Text style={styles.emptySubtitle}>
                  ابحث عن مادة مضافة واضغط عليها لإضافتها، يمكنك إضافة أكثر من مادة
                </Text>
              </View>
            )
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.background },
  header: { backgroundColor: "#0a5f5f", paddingHorizontal: 20, paddingBottom: 16 },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#ffffff", textAlign: "right", marginBottom: 4 },
  headerSubtitle: { fontSize: 12, color: "#b2d8d8", textAlign: "right", marginBottom: 14, lineHeight: 18 },
  searchBox: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#ffffff",
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.light.text, padding: 0 },
  chipsContainer: { flexDirection: "row", alignItems: "center", marginTop: 12, gap: 8 },
  chipsScroll: { flex: 1 },
  chipsRow: { flexDirection: "row", gap: 8, paddingBottom: 2, alignItems: "flex-start" },
  clearAllBtn: {
    backgroundColor: "#d97706", borderRadius: 20, padding: 7,
    alignItems: "center", justifyContent: "center",
  },
  chip: {
    backgroundColor: "#1a5a5a", borderRadius: 14,
    paddingHorizontal: 10, paddingVertical: 7, maxWidth: 220,
  },
  chipWarn: {
    backgroundColor: "#431407", borderWidth: 1, borderColor: "#f97316",
  },
  chipMainRow: {
    flexDirection: "row", alignItems: "center", gap: 6,
  },
  chipWarningRow: {
    flexDirection: "row", alignItems: "flex-start", gap: 4,
    marginTop: 5, paddingTop: 5,
    borderTopWidth: 1, borderTopColor: "#c2410c44",
  },
  chipWarningText: {
    flex: 1, fontSize: 9.5, color: "#fb923c", lineHeight: 13, textAlign: "right",
  },
  chipText: { fontSize: 12, color: "#ffffff", fontWeight: "500", maxWidth: 110 },
  chipInsBadge: {
    backgroundColor: "#0e7c7c55", borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2,
  },
  chipInsBadgeWarn: { backgroundColor: "#c2410c55" },
  chipIns: { fontSize: 10, color: "#b2d8d8", fontWeight: "600" },
  chipInsWarn: { color: "#fdba74" },
  listContent: { padding: 16, paddingBottom: Platform.OS === "web" ? 34 : 24, gap: 10 },
  sectionLabel: {
    fontSize: 12, fontWeight: "600", color: colors.light.mutedForeground,
    textAlign: "right", marginBottom: 4, paddingHorizontal: 2,
  },
  suggestionCard: {
    backgroundColor: "#ffffff", borderRadius: 12, padding: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  suggestionRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  suggestionName: { flex: 1, fontSize: 14, color: colors.light.text, textAlign: "right", lineHeight: 20 },
  suggestionInsBadge: {
    backgroundColor: "#0e7c7c22", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
  },
  suggestionIns: { fontSize: 11, fontWeight: "600", color: "#0e5f5f" },
  resultCountRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "flex-end",
    marginBottom: 4, paddingHorizontal: 2,
  },
  resultCount: { fontSize: 12, fontWeight: "600", color: colors.light.mutedForeground, textAlign: "right" },
  resultCard: {
    backgroundColor: "#ffffff", borderRadius: 14, padding: 14, gap: 8,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  resultHeader: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  resultItemName: { flex: 1, fontSize: 15, fontWeight: "600", color: colors.light.text, textAlign: "right", lineHeight: 22 },
  categoryBadge: {
    backgroundColor: "#0e7c7c22", borderRadius: 6, paddingHorizontal: 8,
    paddingVertical: 3, alignSelf: "flex-end",
  },
  categoryBadgeText: { fontSize: 11, fontWeight: "500", color: "#0e7c7c", textAlign: "right" },
  checkGroup: { gap: 4 },
  inheritedBadge: {
    flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-end",
    backgroundColor: "#fef3c7", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
  },
  inheritedBadgeText: { fontSize: 11, fontWeight: "500", color: "#6b5b00", textAlign: "right" },
  matchRow: {
    flexDirection: "row", alignItems: "flex-start", gap: 6,
    backgroundColor: "#f0faf8", borderRadius: 8, padding: 8,
  },
  matchRowGeneral: { backgroundColor: "#eff6ff", borderWidth: 1, borderColor: "#bfdbfe" },
  matchIcon: { marginTop: 1, flexShrink: 0 },
  matchTextWrap: { flex: 1 },
  matchText: { fontSize: 12, color: colors.light.text, lineHeight: 18 },
  itemCode: { fontSize: 11, color: "#0e7c7c", textAlign: "right" },
  childrenWarning: {
    flexDirection: "row", alignItems: "flex-start", gap: 5,
    backgroundColor: "#fff7ed", borderRadius: 6, padding: 7,
    borderWidth: 1, borderColor: "#fed7aa",
  },
  childrenWarningText: {
    flex: 1, fontSize: 11, color: "#9a3412", textAlign: "right", lineHeight: 16,
  },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 12, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 17, fontWeight: "600", color: colors.light.text, textAlign: "center" },
  emptySubtitle: { fontSize: 14, color: colors.light.mutedForeground, textAlign: "center", lineHeight: 22 },
});
