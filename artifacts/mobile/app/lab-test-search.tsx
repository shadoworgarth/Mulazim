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

import colors from "@/constants/colors";
import { LabField, PRIVATE_LABS, PrivateLab } from "@/constants/private-labs";

const ACCENT = "#00695c";

const FIELD_LABELS: Record<LabField, string> = {
  Food: "الغذاء",
  Cosmetics: "مستحضرات التجميل",
  Feed: "الأعلاف",
  Tobacco: "التبغ",
};

const FIELD_COLORS: Record<LabField, { bg: string; text: string; badge: string }> = {
  Food:      { bg: "#e8f5e9", text: "#1b5e20", badge: "#2e7d32" },
  Cosmetics: { bg: "#fce4ec", text: "#880e4f", badge: "#ad1457" },
  Feed:      { bg: "#fff3e0", text: "#bf360c", badge: "#e64a19" },
  Tobacco:   { bg: "#efebe9", text: "#3e2723", badge: "#4e342e" },
};

// ─── Types ────────────────────────────────────────────────────────────────────

type SelectedTest = {
  id: string;
  parameter: string;
  field: LabField;
};

type TestSuggestion = SelectedTest & { labCount: number };

type MatchedTest = {
  selected: SelectedTest;
  price?: string;
};

type LabResult = {
  lab: PrivateLab;
  matched: MatchedTest[];
  missing: SelectedTest[];
  subtotal: number;
  vat: number;
  total: number;
};

// ─── Build suggestion index (run once at module load) ─────────────────────────

function buildSuggestions(): TestSuggestion[] {
  const map = new Map<string, TestSuggestion>();
  for (const lab of PRIVATE_LABS) {
    const seen = new Set<string>();
    for (const t of lab.tests) {
      const id = `${t.field}||${t.parameter}`;
      if (seen.has(id)) continue;
      seen.add(id);
      if (!map.has(id)) {
        map.set(id, { id, parameter: t.parameter, field: t.field, labCount: 0 });
      }
      map.get(id)!.labCount++;
    }
  }
  return Array.from(map.values()).sort((a, b) =>
    a.parameter.localeCompare(b.parameter)
  );
}

const ALL_SUGGESTIONS = buildSuggestions();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parsePrice(raw: string | undefined): number {
  if (!raw) return 0;
  return parseFloat(raw.replace(/[^0-9.]/g, "")) || 0;
}

function computeLabResults(selected: SelectedTest[]): LabResult[] {
  if (selected.length === 0) return [];

  const results: LabResult[] = [];

  for (const lab of PRIVATE_LABS) {
    const matched: MatchedTest[] = [];
    const missing: SelectedTest[] = [];

    for (const sel of selected) {
      const found = lab.tests.find(
        (t) =>
          t.field === sel.field &&
          t.parameter.toLowerCase() === sel.parameter.toLowerCase()
      );
      if (found) {
        matched.push({ selected: sel, price: found.price });
      } else {
        missing.push(sel);
      }
    }

    if (matched.length === 0) continue;

    const subtotal = matched.reduce((sum, m) => sum + parsePrice(m.price), 0);
    const vat = Math.round(subtotal * 0.15 * 100) / 100;
    const total = Math.round((subtotal + vat) * 100) / 100;

    results.push({ lab, matched, missing, subtotal, vat, total });
  }

  // Full matches first (cheapest first); then partial by coverage desc → cost asc
  results.sort((a, b) => {
    if (a.missing.length !== b.missing.length) return a.missing.length - b.missing.length;
    return a.total - b.total;
  });

  return results;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function LabTestSearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<SelectedTest[]>([]);

  const suggestions = useMemo<TestSuggestion[]>(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const selectedIds = new Set(selected.map((s) => s.id));
    return ALL_SUGGESTIONS.filter(
      (s) => !selectedIds.has(s.id) && s.parameter.toLowerCase().includes(q)
    ).slice(0, 25);
  }, [query, selected]);

  const labResults = useMemo(() => computeLabResults(selected), [selected]);

  const addTest = useCallback((s: TestSuggestion) => {
    setSelected((prev) => {
      if (prev.some((x) => x.id === s.id)) return prev;
      return [...prev, { id: s.id, parameter: s.parameter, field: s.field }];
    });
    setQuery("");
  }, []);

  const removeTest = useCallback((id: string) => {
    setSelected((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const showingSuggestions = query.trim().length >= 2;
  const fullMatchCount = labResults.filter((r) => r.missing.length === 0).length;

  return (
    <View style={styles.container}>
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: Platform.OS === "web" ? 67 : insets.top + 12 }]}>
        <Text style={styles.headerTitle}>مقارنة الاختبارات وحساب التكلفة</Text>
        <Text style={styles.headerSubtitle}>
          أضف اختبار أو أكثر لمعرفة المختبرات المتاحة وحساب التكلفة الإجمالية
        </Text>

        <View style={styles.searchBox}>
          <Text style={{ fontSize: 16, color: "#80cbc4" }}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search test name (e.g. Salmonella, Moisture…)"
            placeholderTextColor="#9bb0b0"
            value={query}
            onChangeText={setQuery}
            autoFocus
            autoCapitalize="none"
            returnKeyType="search"
            writingDirection="ltr"
            textAlign="left"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")} hitSlop={8}>
              <Text style={{ fontSize: 18, color: "#b2d8d8" }}>✕</Text>
            </Pressable>
          )}
        </View>

        {/* Selected chips */}
        {selected.length > 0 && (
          <View style={styles.chipsWrap}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ flex: 1 }}
              contentContainerStyle={styles.chipsRow}
            >
              {selected.map((s) => {
                const fc = FIELD_COLORS[s.field];
                return (
                  <View key={s.id} style={styles.chip}>
                    <Pressable onPress={() => removeTest(s.id)} hitSlop={8}>
                      <Text style={{ fontSize: 15, color: "#b2d8d8", lineHeight: 17 }}>×</Text>
                    </Pressable>
                    <Text style={styles.chipParam} numberOfLines={1}>{s.parameter}</Text>
                    <View style={[styles.chipFieldBadge, { backgroundColor: fc.bg }]}>
                      <Text style={[styles.chipFieldText, { color: fc.text }]}>
                        {FIELD_LABELS[s.field]}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
            <Pressable
              onPress={() => setSelected([])}
              style={({ pressed }) => [styles.clearAllBtn, { opacity: pressed ? 0.7 : 1 }]}
              hitSlop={6}
            >
              <Text style={{ fontSize: 16, color: "#b2d8d8" }}>🗑</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* ── Suggestions ───────────────────────────────────────────────────── */}
      {showingSuggestions ? (
        <FlatList
          data={suggestions}
          keyExtractor={(s) => s.id}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            suggestions.length > 0 ? (
              <Text style={styles.sectionLabel}>اختر اختباراً لإضافته</Text>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={{ fontSize: 36, color: colors.light.mutedForeground }}>🔍</Text>
              <Text style={styles.emptyTitle}>لا توجد نتائج</Text>
              <Text style={styles.emptySubtitle}>جرب البحث بجزء من اسم الاختبار بالإنجليزية</Text>
            </View>
          }
          renderItem={({ item: s }) => {
            const fc = FIELD_COLORS[s.field];
            return (
              <Pressable
                style={({ pressed }) => [styles.suggestionCard, { opacity: pressed ? 0.78 : 1 }]}
                onPress={() => addTest(s)}
              >
                <View style={styles.suggestionRow}>
                  <Text style={{ fontSize: 18, color: ACCENT, lineHeight: 20, flexShrink: 0 }}>+</Text>
                  <Text style={styles.suggestionParam} numberOfLines={2}>{s.parameter}</Text>
                  <View style={[styles.suggestionFieldBadge, { backgroundColor: fc.bg }]}>
                    <Text style={[styles.suggestionFieldText, { color: fc.text }]}>
                      {FIELD_LABELS[s.field]}
                    </Text>
                  </View>
                  <View style={styles.labCountBadge}>
                    <Text style={styles.labCountText}>{s.labCount}</Text>
                  </View>
                </View>
              </Pressable>
            );
          }}
        />
      ) : (
        /* ── Lab results ──────────────────────────────────────────────────── */
        <FlatList
          data={labResults}
          keyExtractor={(r) => String(r.lab.id)}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            selected.length > 0 && labResults.length > 0 ? (
              <View style={styles.resultCountRow}>
                <Text style={styles.resultCountText}>
                  {fullMatchCount > 0
                    ? `${fullMatchCount} مختبر يملك جميع الاختبارات · ${labResults.length} مختبر إجمالاً`
                    : `لا يوجد مختبر بجميع الاختبارات · ${labResults.length} مختبر جزئياً`}
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item: r }) => {
            const isFullMatch = r.missing.length === 0;
            const hasAsterisk = r.matched.some((m) => m.price?.includes("*"));
            return (
              <View style={[styles.resultCard, isFullMatch ? styles.resultCardFull : styles.resultCardPartial]}>

                {/* Card header — tappable to go to lab detail */}
                <Pressable
                  style={({ pressed }) => [styles.resultHeader, { opacity: pressed ? 0.84 : 1 }]}
                  onPress={() =>
                    router.push({
                      pathname: "/private-lab-detail",
                      params: { id: String(r.lab.id) },
                    } as any)
                  }
                >
                  <View style={styles.resultHeaderMeta}>
                    <View
                      style={[
                        styles.matchBadge,
                        { backgroundColor: isFullMatch ? "#2e7d32" : "#e65100" },
                      ]}
                    >
                      <Text style={styles.matchBadgeText}>
                        {r.matched.length}/{selected.length} اختبار
                      </Text>
                    </View>
                    <Text style={styles.viewDetailHint}>عرض المختبر ›</Text>
                  </View>
                  <Text style={styles.labName}>{r.lab.name}</Text>
                </Pressable>

                {/* Test rows */}
                <View style={styles.testsSection}>
                  {/* Matched */}
                  {r.matched.map((m, i) => {
                    const fc = FIELD_COLORS[m.selected.field];
                    const priceNum = parsePrice(m.price);
                    const hasAst = m.price?.includes("*") ?? false;
                    return (
                      <View key={`match-${i}`} style={styles.testRow}>
                        <View style={styles.testRowInfo}>
                          <Text style={styles.checkIcon}>✓</Text>
                          <Text style={styles.testParam} numberOfLines={2}>
                            {m.selected.parameter}
                          </Text>
                          <View style={[styles.testFieldBadge, { backgroundColor: fc.bg }]}>
                            <Text style={[styles.testFieldText, { color: fc.text }]}>
                              {FIELD_LABELS[m.selected.field]}
                            </Text>
                          </View>
                        </View>
                        {m.price ? (
                          <View style={styles.priceBadge}>
                            <Text style={styles.priceText}>
                              {priceNum}{hasAst ? "*" : ""} ر.س
                            </Text>
                          </View>
                        ) : (
                          <View style={[styles.priceBadge, styles.noPriceBadge]}>
                            <Text style={styles.noPriceText}>غير محدد</Text>
                          </View>
                        )}
                      </View>
                    );
                  })}

                  {/* Missing */}
                  {r.missing.map((s, i) => {
                    const fc = FIELD_COLORS[s.field];
                    return (
                      <View key={`miss-${i}`} style={[styles.testRow, styles.testRowMissing]}>
                        <View style={styles.testRowInfo}>
                          <Text style={styles.crossIcon}>✕</Text>
                          <Text style={[styles.testParam, styles.testParamMissing]} numberOfLines={2}>
                            {s.parameter}
                          </Text>
                          <View style={[styles.testFieldBadge, { backgroundColor: fc.bg }]}>
                            <Text style={[styles.testFieldText, { color: fc.text }]}>
                              {FIELD_LABELS[s.field]}
                            </Text>
                          </View>
                        </View>
                        <View style={[styles.priceBadge, styles.missingBadge]}>
                          <Text style={styles.missingText}>غير متاح</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>

                {/* Asterisk note */}
                {hasAsterisk && (
                  <Text style={styles.asteriskNote}>* السعر للمكرر الواحد</Text>
                )}

                {/* Cost breakdown */}
                <View style={styles.costBox}>
                  <View style={styles.costRow}>
                    <Text style={styles.costValue}>{r.subtotal.toFixed(2)} ر.س</Text>
                    <Text style={styles.costLabel}>المجموع قبل الضريبة</Text>
                  </View>
                  <View style={[styles.costRow, styles.costRowBorder]}>
                    <Text style={styles.costValue}>{r.vat.toFixed(2)} ر.س</Text>
                    <Text style={styles.costLabel}>ضريبة القيمة المضافة (15%)</Text>
                  </View>
                  <View style={[styles.costRow, styles.costRowTotal]}>
                    <Text style={styles.costValueTotal}>{r.total.toFixed(2)} ر.س</Text>
                    <Text style={styles.costLabelTotal}>الإجمالي شامل الضريبة</Text>
                  </View>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            selected.length > 0 ? (
              <View style={styles.emptyState}>
                <Text style={{ fontSize: 36, color: "#c62828" }}>✕</Text>
                <Text style={styles.emptyTitle}>لا توجد مختبرات متاحة</Text>
                <Text style={styles.emptySubtitle}>
                  لا توجد مختبرات تُقدم أياً من الاختبارات المحددة
                </Text>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={{ fontSize: 40, color: colors.light.mutedForeground }}>🔬</Text>
                <Text style={styles.emptyTitle}>ابدأ بإضافة اختبار</Text>
                <Text style={styles.emptySubtitle}>
                  ابحث عن اسم الاختبار وأضفه للسلة، ثم ستظهر المختبرات المتاحة مع التكلفة الإجمالية شاملة الضريبة
                </Text>
              </View>
            )
          }
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.background },

  // Header
  header: {
    backgroundColor: "#004d40",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "right",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#80cbc4",
    textAlign: "right",
    marginBottom: 14,
    lineHeight: 18,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.light.text,
    padding: 0,
  },

  // Chips
  chipsWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 8,
  },
  chipsRow: {
    flexDirection: "row",
    gap: 8,
    paddingBottom: 2,
    alignItems: "flex-start",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#00695c",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
    maxWidth: 240,
  },
  chipParam: {
    fontSize: 12,
    color: "#ffffff",
    fontWeight: "500",
    maxWidth: 120,
    writingDirection: "ltr",
  },
  chipFieldBadge: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  chipFieldText: { fontSize: 10, fontWeight: "600" },
  clearAllBtn: {
    backgroundColor: "#d97706",
    borderRadius: 20,
    padding: 7,
    alignItems: "center",
    justifyContent: "center",
  },

  // List
  listContent: {
    padding: 16,
    paddingBottom: Platform.OS === "web" ? 40 : 28,
    gap: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.light.mutedForeground,
    textAlign: "right",
    marginBottom: 4,
  },

  // Suggestion cards
  suggestionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  suggestionParam: {
    flex: 1,
    fontSize: 14,
    color: colors.light.text,
    writingDirection: "ltr",
    textAlign: "left",
    lineHeight: 20,
  },
  suggestionFieldBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  suggestionFieldText: { fontSize: 11, fontWeight: "600" },
  labCountBadge: {
    backgroundColor: "#e0f2f1",
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
    minWidth: 28,
    alignItems: "center",
  },
  labCountText: { fontSize: 11, fontWeight: "700", color: ACCENT },

  // Result count row
  resultCountRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 4,
  },
  resultCountText: {
    fontSize: 12,
    color: colors.light.mutedForeground,
    textAlign: "right",
    fontWeight: "500",
  },

  // Result cards
  resultCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 5,
    elevation: 2,
  },
  resultCardFull: {
    borderWidth: 1.5,
    borderColor: "#a5d6a7",
  },
  resultCardPartial: {
    borderWidth: 1,
    borderColor: "#ffcc80",
  },

  resultHeader: {
    paddingHorizontal: 14,
    paddingTop: 13,
    paddingBottom: 10,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  resultHeaderMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  matchBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  matchBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
  },
  viewDetailHint: {
    fontSize: 12,
    color: ACCENT,
    fontWeight: "600",
  },
  labName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.light.text,
    textAlign: "right",
  },

  // Test rows inside result card
  testsSection: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 7,
  },
  testRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f0faf8",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  testRowMissing: {
    backgroundColor: "#fff5f5",
  },
  testRowInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  checkIcon: { fontSize: 13, color: "#2e7d32", flexShrink: 0 },
  crossIcon: { fontSize: 13, color: "#c62828", flexShrink: 0 },
  testParam: {
    flex: 1,
    fontSize: 12,
    color: colors.light.text,
    writingDirection: "ltr",
    textAlign: "left",
    lineHeight: 17,
  },
  testParamMissing: { color: "#c62828" },
  testFieldBadge: {
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexShrink: 0,
  },
  testFieldText: { fontSize: 10, fontWeight: "600" },

  // Price badges
  priceBadge: {
    backgroundColor: "#e0f2f1",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexShrink: 0,
    alignItems: "center",
  },
  priceText: { fontSize: 12, fontWeight: "700", color: "#00695c" },
  noPriceBadge: { backgroundColor: "#f3f4f6" },
  noPriceText: { fontSize: 11, color: "#9ca3af" },
  missingBadge: { backgroundColor: "#fde8e8" },
  missingText: { fontSize: 11, fontWeight: "600", color: "#c62828" },

  asteriskNote: {
    fontSize: 10,
    color: "#6b7280",
    textAlign: "right",
    paddingHorizontal: 14,
    paddingBottom: 6,
    fontStyle: "italic",
  },

  // Cost box
  costBox: {
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    marginHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 5,
  },
  costRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  costRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    paddingBottom: 6,
  },
  costRowTotal: {
    paddingTop: 6,
  },
  costLabel: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "right",
  },
  costValue: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.light.text,
  },
  costLabelTotal: {
    fontSize: 13,
    fontWeight: "700",
    color: "#004d40",
    textAlign: "right",
  },
  costValueTotal: {
    fontSize: 15,
    fontWeight: "800",
    color: "#004d40",
  },

  // Empty state
  emptyState: {
    alignItems: "center",
    paddingTop: 50,
    paddingHorizontal: 24,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.light.text,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.light.mutedForeground,
    textAlign: "center",
    lineHeight: 20,
  },
});
