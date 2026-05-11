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
import { MandatoryEntry, MANDATORY_TESTS } from "@/constants/mandatory-tests";
import { LabField, PRIVATE_LABS, PrivateLab } from "@/constants/private-labs";

const ACCENT = "#00695c";
const FIELDS: LabField[] = ["Food", "Cosmetics", "Feed", "Tobacco"];

const FIELD_LABELS: Record<LabField, string> = {
  Food: "الغذاء",
  Cosmetics: "التجميل",
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
  parameter: string;   // display name (may include "(product)" suffix for price variants)
  baseParam: string;   // raw parameter name for data matching
  field: LabField;
  product?: string;    // set only for product-specific price variants
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normPriceStr(p: string | undefined): string {
  return (p ?? "").replace("*", "").trim();
}

// Pre-compute: for each (field||parameter), map normPrice → first representative product
function buildPriceVariants(): Map<string, Map<string, string>> {
  const map = new Map<string, Map<string, string>>();
  for (const lab of PRIVATE_LABS) {
    for (const t of lab.tests) {
      const key = `${t.field}||${t.parameter}`;
      if (!map.has(key)) map.set(key, new Map());
      const byPrice = map.get(key)!;
      const np = normPriceStr(t.price);
      if (!byPrice.has(np)) byPrice.set(np, t.product);
    }
  }
  return map;
}

const PRICE_VARIANTS = buildPriceVariants();

// ─── Build suggestion index (run once at module load) ─────────────────────────
// Same price for all products → one entry. Different prices → one entry per variant
// with the product name appended to the display parameter.

function buildSuggestions(): TestSuggestion[] {
  type Raw = Omit<TestSuggestion, "labCount">;
  const suggMap = new Map<string, Raw>();

  for (const [paramKey, byPrice] of PRICE_VARIANTS) {
    const sepIdx = paramKey.indexOf("||");
    const field = paramKey.slice(0, sepIdx) as LabField;
    const baseParam = paramKey.slice(sepIdx + 2);

    if (byPrice.size === 1) {
      suggMap.set(paramKey, { id: paramKey, parameter: baseParam, baseParam, field });
    } else {
      // Sort ascending by price — lowest is the "base" entry
      const sorted = [...byPrice.entries()].sort(
        (a, b) => parseFloat(a[0] || "0") - parseFloat(b[0] || "0")
      );
      sorted.forEach(([_np, product], i) => {
        if (i === 0) {
          const id = `${paramKey}__base`;
          suggMap.set(id, { id, parameter: baseParam, baseParam, field });
        } else {
          const id = `${paramKey}||${product}`;
          suggMap.set(id, { id, parameter: `${baseParam} (${product})`, baseParam, field, product });
        }
      });
    }
  }

  // Count labs per suggestion
  const result = new Map<string, TestSuggestion>(
    [...suggMap.entries()].map(([id, s]) => [id, { ...s, labCount: 0 }])
  );
  for (const lab of PRIVATE_LABS) {
    const seenIds = new Set<string>();
    for (const t of lab.tests) {
      const paramKey = `${t.field}||${t.parameter}`;
      const byPrice = PRICE_VARIANTS.get(paramKey);
      if (!byPrice) continue;
      const np = normPriceStr(t.price);
      let id: string;
      if (byPrice.size === 1) {
        id = paramKey;
      } else {
        const sorted = [...byPrice.entries()].sort(
          (a, b) => parseFloat(a[0] || "0") - parseFloat(b[0] || "0")
        );
        id = sorted[0][0] === np ? `${paramKey}__base` : `${paramKey}||${t.product}`;
      }
      if (!seenIds.has(id)) {
        seenIds.add(id);
        if (result.has(id)) result.get(id)!.labCount++;
      }
    }
  }

  return Array.from(result.values()).sort((a, b) => a.parameter.localeCompare(b.parameter));
}

const ALL_SUGGESTIONS = buildSuggestions();

// ─── Build product index (unique product+field combos with their tests) ────────

type ProductEntry = {
  id: string; // `${field}||${product}`
  product: string;
  field: LabField;
  tests: TestSuggestion[];
};

function buildProducts(): ProductEntry[] {
  const map = new Map<string, ProductEntry>();
  for (const lab of PRIVATE_LABS) {
    for (const t of lab.tests) {
      const productId = `${t.field}||${t.product}`;
      if (!map.has(productId)) {
        map.set(productId, { id: productId, product: t.product, field: t.field, tests: [] });
      }
      const entry = map.get(productId)!;
      // Resolve the suggestion id for this specific test+price combination
      const paramKey = `${t.field}||${t.parameter}`;
      const byPrice = PRICE_VARIANTS.get(paramKey);
      const np = normPriceStr(t.price);
      let suggId: string;
      if (!byPrice || byPrice.size === 1) {
        suggId = paramKey;
      } else {
        const sorted = [...byPrice.entries()].sort(
          (a, b) => parseFloat(a[0] || "0") - parseFloat(b[0] || "0")
        );
        suggId = sorted[0][0] === np ? `${paramKey}__base` : `${paramKey}||${t.product}`;
      }
      const sugg = ALL_SUGGESTIONS.find((s) => s.id === suggId);
      if (sugg && !entry.tests.some((x) => x.id === sugg.id)) {
        entry.tests.push(sugg);
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => a.product.localeCompare(b.product));
}

const ALL_PRODUCTS = buildProducts();

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
          t.parameter.toLowerCase() === sel.baseParam.toLowerCase() &&
          (sel.product == null || t.product.toLowerCase() === sel.product.toLowerCase())
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

  results.sort((a, b) => {
    if (a.missing.length !== b.missing.length) return a.missing.length - b.missing.length;
    return a.total - b.total;
  });

  return results;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

type MainView = "empty" | "browse" | "mandatory" | "suggestions" | "results";

export default function LabTestSearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<SelectedTest[]>([]);
  const [compareMode, setCompareMode] = useState(false);
  const [browsing, setBrowsing] = useState(false);
  const [browseField, setBrowseField] = useState<LabField | null>(null);
  const [browseQuery, setBrowseQuery] = useState("");
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [mandatoryMode, setMandatoryMode] = useState(false);
  const [mandatoryField, setMandatoryField] = useState<"Food" | "Cosmetics" | null>(null);
  const [mandatoryQuery, setMandatoryQuery] = useState("");
  const [expandedMandatory, setExpandedMandatory] = useState<Set<string>>(new Set());

  // ── Derived state ──────────────────────────────────────────────────────────
  const showSuggestions = query.trim().length >= 2;

  const mainView: MainView = showSuggestions
    ? "suggestions"
    : compareMode && selected.length > 0
    ? "results"
    : mandatoryMode
    ? "mandatory"
    : browsing
    ? "browse"
    : "empty";

  const suggestions = useMemo<TestSuggestion[]>(() => {
    if (!showSuggestions) return [];
    const q = query.trim().toLowerCase();
    const selectedIds = new Set(selected.map((s) => s.id));
    return ALL_SUGGESTIONS.filter(
      (s) =>
        !selectedIds.has(s.id) &&
        s.parameter.toLowerCase().includes(q)
    ).slice(0, 40);
  }, [query, selected, showSuggestions]);

  const browseProducts = useMemo<ProductEntry[]>(() => {
    if (mainView !== "browse") return [];
    const q = browseQuery.trim().toLowerCase();
    return ALL_PRODUCTS.filter(
      (p) =>
        (browseField === null || p.field === browseField) &&
        (q.length === 0 || p.product.toLowerCase().includes(q))
    );
  }, [mainView, browseField, browseQuery]);

  const mandatoryEntries = useMemo<MandatoryEntry[]>(() => {
    if (mainView !== "mandatory") return [];
    const q = mandatoryQuery.trim().toLowerCase();
    return MANDATORY_TESTS.filter(
      (e) =>
        (mandatoryField === null || e.field === mandatoryField) &&
        (q.length === 0 || e.product.toLowerCase().includes(q))
    );
  }, [mainView, mandatoryField, mandatoryQuery]);

  const labResults = useMemo(
    () => (mainView === "results" ? computeLabResults(selected) : []),
    [mainView, selected]
  );

  const fullMatchCount = labResults.filter((r) => r.missing.length === 0).length;

  // ── Actions ────────────────────────────────────────────────────────────────
  const addTest = useCallback((s: TestSuggestion) => {
    setSelected((prev) => {
      if (prev.some((x) => x.id === s.id)) return prev;
      return [...prev, { id: s.id, parameter: s.parameter, baseParam: s.baseParam, field: s.field, product: s.product }];
    });
    setQuery("");
    setCompareMode(false); // stay in basket/browse — don't jump to results
  }, []);

  const removeTest = useCallback((id: string) => {
    setSelected((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const handleCompare = useCallback(() => {
    setBrowsing(false);
    setQuery("");
    setCompareMode(true);
  }, []);

  const handleBrowse = useCallback(() => {
    setQuery("");
    setCompareMode(false);
    setBrowsing(true);
    setMandatoryMode(false);
    setBrowseQuery("");
    setExpandedProducts(new Set());
  }, []);

  const handleMandatory = useCallback(() => {
    setQuery("");
    setCompareMode(false);
    setBrowsing(false);
    setMandatoryMode(true);
    setMandatoryQuery("");
    setMandatoryField(null);
    setExpandedMandatory(new Set());
  }, []);

  const toggleProduct = useCallback((id: string) => {
    setExpandedProducts((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleMandatory = useCallback((id: string) => {
    setExpandedMandatory((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  // ── Suggestion card (shared between search and browse) ────────────────────
  const renderSuggestion = useCallback(
    ({ item: s }: { item: TestSuggestion }) => {
      const fc = FIELD_COLORS[s.field];
      const isSelected = selected.some((x) => x.id === s.id);
      return (
        <Pressable
          style={({ pressed }) => [styles.suggestionCard, { opacity: pressed ? 0.78 : 1 }]}
          onPress={() => (isSelected ? removeTest(s.id) : addTest(s))}
        >
          <View style={styles.suggestionRow}>
            <Text style={[styles.addIcon, isSelected && styles.addIconSelected]}>
              {isSelected ? "✓" : "+"}
            </Text>
            <View style={styles.suggestionTextBlock}>
              <Text style={styles.suggestionParam} numberOfLines={1}>{s.parameter}</Text>
            </View>
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
    },
    [addTest, removeTest, selected]
  );

  // ── Header ─────────────────────────────────────────────────────────────────
  const Header = (
    <View style={[styles.header, { paddingTop: Platform.OS === "web" ? 67 : insets.top + 12 }]}>
      <View style={styles.headerTitleRow}>
        <Text style={styles.headerTitle}>مقارنة الاختبارات وحساب التكلفة</Text>
        {(browsing || mandatoryMode) && !showSuggestions && (
          <Pressable
            onPress={() => { setBrowsing(false); setMandatoryMode(false); }}
            style={({ pressed }) => [styles.backBrowseBtn, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Text style={styles.backBrowseBtnText}>← رجوع</Text>
          </Pressable>
        )}
      </View>
      <Text style={styles.headerSubtitle}>
        {mainView === "browse"
          ? "اختر منتجاً لعرض الاختبارات المتاحة له وإضافتها إلى السلة"
          : mainView === "mandatory"
          ? "التحاليل الإلزامية حسب المنتج — اضغط على الاختبار للبحث عنه في المختبرات"
          : "أضف اختبار أو أكثر لمعرفة المختبرات المتاحة وحساب التكلفة"}
      </Text>

      {/* Search box */}
      <View style={styles.searchBox}>
        <Text style={{ fontSize: 16, color: "#80cbc4" }}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search test name (e.g. Salmonella, Moisture…)"
          placeholderTextColor="#9bb0b0"
          value={query}
          onChangeText={(t) => {
            setQuery(t);
            if (t.trim().length >= 2) {
              setCompareMode(false);
              setBrowsing(false);
              setMandatoryMode(false);
            }
          }}
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

      {/* Selected chips + Compare button */}
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
                  <View style={styles.chipTextBlock}>
                    <Text style={styles.chipParam} numberOfLines={1}>{s.parameter}</Text>
                  </View>
                  <View style={[styles.chipFieldBadge, { backgroundColor: fc.bg }]}>
                    <Text style={[styles.chipFieldText, { color: fc.text }]}>
                      {FIELD_LABELS[s.field]}
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.basketActions}>
            <Pressable
              onPress={() => setSelected([])}
              style={({ pressed }) => [styles.clearAllBtn, { opacity: pressed ? 0.7 : 1 }]}
              hitSlop={6}
            >
              <Text style={{ fontSize: 16, color: "#b2d8d8" }}>🗑</Text>
            </Pressable>
            {!showSuggestions && (
              <Pressable
                onPress={handleCompare}
                style={({ pressed }) => [styles.compareBtn, { opacity: pressed ? 0.85 : 1 }]}
              >
                <Text style={styles.compareBtnText}>قارن ({selected.length})</Text>
              </Pressable>
            )}
          </View>
        </View>
      )}
    </View>
  );

  // ── Browse field filter tabs header ──────────────────────────────────────
  const BrowseHeader = (
    <View>
      {/* Product search input */}
      <View style={styles.browseSearchBox}>
        <Text style={{ fontSize: 15, color: "#80cbc4" }}>🔍</Text>
        <TextInput
          style={styles.browseSearchInput}
          placeholder="Search product (e.g. Meat, Juice…)"
          placeholderTextColor="#9bb0b0"
          value={browseQuery}
          onChangeText={setBrowseQuery}
          autoCapitalize="none"
          returnKeyType="search"
          writingDirection="ltr"
          textAlign="left"
        />
        {browseQuery.length > 0 && (
          <Pressable onPress={() => setBrowseQuery("")} hitSlop={8}>
            <Text style={{ fontSize: 17, color: "#b2d8d8" }}>✕</Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.fieldTabs}
        style={styles.fieldTabsScroll}
      >
        <Pressable
          onPress={() => setBrowseField(null)}
          style={[styles.fieldTab, browseField === null && styles.fieldTabActive]}
        >
          <Text style={[styles.fieldTabText, browseField === null && styles.fieldTabTextActive]}>
            الكل
          </Text>
        </Pressable>
        {FIELDS.map((f) => {
          const fc = FIELD_COLORS[f];
          const isActive = browseField === f;
          return (
            <Pressable
              key={f}
              onPress={() => setBrowseField(isActive ? null : f)}
              style={[
                styles.fieldTab,
                isActive && { backgroundColor: fc.badge, borderColor: fc.badge },
              ]}
            >
              <Text style={[styles.fieldTabText, isActive && { color: "#fff" }]}>
                {FIELD_LABELS[f]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <Text style={styles.sectionLabel}>
        {browseProducts.length} منتج — اضغط على المنتج لعرض اختباراته
      </Text>
    </View>
  );

  // ── Mandatory tests header ─────────────────────────────────────────────────
  const MandatoryHeader = (
    <View>
      <View style={styles.browseSearchBox}>
        <Text style={{ fontSize: 15, color: "#80cbc4" }}>🔍</Text>
        <TextInput
          style={styles.browseSearchInput}
          placeholder="Search product (e.g. Meat, Juice…)"
          placeholderTextColor="#9bb0b0"
          value={mandatoryQuery}
          onChangeText={setMandatoryQuery}
          autoCapitalize="none"
          returnKeyType="search"
          writingDirection="ltr"
          textAlign="left"
        />
        {mandatoryQuery.length > 0 && (
          <Pressable onPress={() => setMandatoryQuery("")} hitSlop={8}>
            <Text style={{ fontSize: 17, color: "#b2d8d8" }}>✕</Text>
          </Pressable>
        )}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.fieldTabs}
        style={styles.fieldTabsScroll}
      >
        <Pressable
          onPress={() => setMandatoryField(null)}
          style={[styles.fieldTab, mandatoryField === null && styles.fieldTabActive]}
        >
          <Text style={[styles.fieldTabText, mandatoryField === null && styles.fieldTabTextActive]}>الكل</Text>
        </Pressable>
        {(["Food", "Cosmetics"] as const).map((f) => {
          const isActive = mandatoryField === f;
          const label = f === "Food" ? "الغذاء" : "التجميل";
          const bg = f === "Food" ? "#2e7d32" : "#ad1457";
          return (
            <Pressable
              key={f}
              onPress={() => setMandatoryField(isActive ? null : f)}
              style={[styles.fieldTab, isActive && { backgroundColor: bg, borderColor: bg }]}
            >
              <Text style={[styles.fieldTabText, isActive && { color: "#fff" }]}>{label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <Text style={styles.sectionLabel}>
        {mandatoryEntries.length} منتج — التحاليل الإلزامية وفق اشتراطات هيئة الغذاء والدواء
      </Text>
    </View>
  );

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {Header}

      {/* ── Suggestions (search) ──────────────────────────────────────────── */}
      {mainView === "suggestions" && (
        <FlatList
          data={suggestions}
          keyExtractor={(s) => s.id}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            suggestions.length > 0 ? (
              <Text style={styles.sectionLabel}>اضغط على الاختبار لإضافته إلى السلة</Text>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={{ fontSize: 36, color: colors.light.mutedForeground }}>🔍</Text>
              <Text style={styles.emptyTitle}>لا توجد نتائج</Text>
              <Text style={styles.emptySubtitle}>جرب البحث بجزء من اسم الاختبار بالإنجليزية</Text>
            </View>
          }
          renderItem={renderSuggestion}
        />
      )}

      {/* ── Browse products ───────────────────────────────────────────────── */}
      {mainView === "browse" && (
        <FlatList
          data={browseProducts}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={BrowseHeader}
          renderItem={({ item: p }) => {
            const fc = FIELD_COLORS[p.field];
            const isExpanded = expandedProducts.has(p.id);
            const addedCount = p.tests.filter((t) => selected.some((s) => s.id === t.id)).length;
            return (
              <View style={styles.productCard}>
                {/* Product row — tap to expand */}
                <Pressable
                  style={({ pressed }) => [styles.productRow, { opacity: pressed ? 0.82 : 1 }]}
                  onPress={() => toggleProduct(p.id)}
                >
                  <Text style={styles.expandChevron}>{isExpanded ? "▲" : "▼"}</Text>
                  <View style={styles.productRowBody}>
                    <Text style={styles.productName} numberOfLines={2}>{p.product}</Text>
                    <View style={styles.productRowMeta}>
                      <View style={[styles.productFieldBadge, { backgroundColor: fc.bg }]}>
                        <Text style={[styles.productFieldText, { color: fc.text }]}>
                          {FIELD_LABELS[p.field]}
                        </Text>
                      </View>
                      <Text style={styles.productTestCount}>{p.tests.length} اختبار</Text>
                      {addedCount > 0 && (
                        <View style={styles.addedBadge}>
                          <Text style={styles.addedBadgeText}>✓ {addedCount} مضاف</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </Pressable>

                {/* Tests within product (shown when expanded) */}
                {isExpanded && (
                  <View style={styles.productTests}>
                    {p.tests.map((t) => {
                      const isAdded = selected.some((s) => s.id === t.id);
                      return (
                        <Pressable
                          key={t.id}
                          style={({ pressed }) => [
                            styles.productTestRow,
                            isAdded && styles.productTestRowAdded,
                            { opacity: pressed ? 0.75 : 1 },
                          ]}
                          onPress={() => (isAdded ? removeTest(t.id) : addTest(t))}
                        >
                          <View style={[styles.addRemoveBtn, isAdded && styles.addRemoveBtnAdded]}>
                            <Text style={[styles.addRemoveIcon, isAdded && styles.addRemoveIconAdded]}>
                              {isAdded ? "✓" : "+"}
                            </Text>
                          </View>
                          <Text style={styles.productTestParam} numberOfLines={2}>{t.parameter}</Text>
                          <View style={styles.productTestLabCount}>
                            <Text style={styles.productTestLabCountText}>{t.labCount}</Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          }}
        />
      )}

      {/* ── Mandatory tests ───────────────────────────────────────────────── */}
      {mainView === "mandatory" && (
        <FlatList
          data={mandatoryEntries}
          keyExtractor={(e) => e.id}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={MandatoryHeader}
          renderItem={({ item: e }) => {
            const isExpanded = expandedMandatory.has(e.id);
            const fieldColor = e.field === "Food"
              ? { bg: "#e8f5e9", text: "#1b5e20", badge: "#2e7d32" }
              : { bg: "#fce4ec", text: "#880e4f", badge: "#ad1457" };
            const fieldLabel = e.field === "Food" ? "الغذاء" : "التجميل";
            return (
              <View style={styles.productCard}>
                <Pressable
                  style={({ pressed }) => [styles.productRow, { opacity: pressed ? 0.82 : 1 }]}
                  onPress={() => toggleMandatory(e.id)}
                >
                  <Text style={styles.expandChevron}>{isExpanded ? "▲" : "▼"}</Text>
                  <View style={styles.productRowBody}>
                    <Text style={styles.productName} numberOfLines={2}>{e.product}</Text>
                    <View style={styles.productRowMeta}>
                      <View style={[styles.productFieldBadge, { backgroundColor: fieldColor.bg }]}>
                        <Text style={[styles.productFieldText, { color: fieldColor.text }]}>{fieldLabel}</Text>
                      </View>
                      <Text style={styles.productTestCount}>{e.tests.length} تحليل إلزامي</Text>
                    </View>
                  </View>
                </Pressable>
                {isExpanded && (
                  <View style={styles.productTests}>
                    {e.tests.map((t, idx) => (
                      <Pressable
                        key={idx}
                        style={({ pressed }) => [styles.mandatoryTestRow, { opacity: pressed ? 0.75 : 1 }]}
                        onPress={() => {
                          setQuery(t.name);
                          setMandatoryMode(false);
                        }}
                      >
                        <View style={styles.mandatorySearchIcon}>
                          <Text style={{ fontSize: 12, color: "#004d40" }}>🔍</Text>
                        </View>
                        <View style={{ flex: 1, gap: 2 }}>
                          <Text style={styles.mandatoryTestName} numberOfLines={2}>{t.name}</Text>
                          {t.notes ? (
                            <Text style={styles.mandatoryTestNotes} numberOfLines={2}>{t.notes}</Text>
                          ) : null}
                        </View>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={{ fontSize: 36 }}>📋</Text>
              <Text style={styles.emptyTitle}>لا توجد نتائج</Text>
              <Text style={styles.emptySubtitle}>جرب البحث بكلمة مختلفة</Text>
            </View>
          }
        />
      )}

      {/* ── Lab results ───────────────────────────────────────────────────── */}
      {mainView === "results" && (
        <FlatList
          data={labResults}
          keyExtractor={(r) => String(r.lab.id)}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            labResults.length > 0 ? (
              <View style={styles.resultCountRow}>
                <Pressable
                  onPress={() => setCompareMode(false)}
                  style={({ pressed }) => [styles.backToBasketBtn, { opacity: pressed ? 0.7 : 1 }]}
                >
                  <Text style={styles.backToBasketText}>← إضافة المزيد</Text>
                </Pressable>
                <Text style={styles.resultCountText}>
                  {fullMatchCount > 0
                    ? `${fullMatchCount} مختبر بجميع الاختبارات · ${labResults.length} إجمالاً`
                    : `لا يوجد مختبر بجميع الاختبارات · ${labResults.length} جزئياً`}
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item: r }) => {
            const isFullMatch = r.missing.length === 0;
            const hasAsterisk = r.matched.some((m) => m.price?.includes("*"));
            return (
              <View style={[styles.resultCard, isFullMatch ? styles.resultCardFull : styles.resultCardPartial]}>

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

                <View style={styles.testsSection}>
                  {r.matched.map((m, i) => {
                    const fc = FIELD_COLORS[m.selected.field];
                    const priceNum = parsePrice(m.price);
                    const hasAst = m.price?.includes("*") ?? false;
                    return (
                      <View key={`match-${i}`} style={styles.testRow}>
                        <View style={styles.testRowInfo}>
                          <Text style={styles.checkIcon}>✓</Text>
                          <View style={styles.testTextBlock}>
                            <Text style={styles.testParam} numberOfLines={1}>
                              {m.selected.parameter}
                            </Text>
                          </View>
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

                  {r.missing.map((s, i) => {
                    const fc = FIELD_COLORS[s.field];
                    return (
                      <View key={`miss-${i}`} style={[styles.testRow, styles.testRowMissing]}>
                        <View style={styles.testRowInfo}>
                          <Text style={styles.crossIcon}>✕</Text>
                          <View style={styles.testTextBlock}>
                            <Text style={[styles.testParam, styles.testParamMissing]} numberOfLines={1}>
                              {s.parameter}
                            </Text>
                          </View>
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

                {hasAsterisk && (
                  <Text style={styles.asteriskNote}>* السعر للمكرر الواحد</Text>
                )}

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
            <View style={styles.emptyState}>
              <Text style={{ fontSize: 36, color: "#c62828" }}>✕</Text>
              <Text style={styles.emptyTitle}>لا توجد مختبرات متاحة</Text>
              <Text style={styles.emptySubtitle}>
                لا توجد مختبرات تُقدم أياً من الاختبارات المحددة
              </Text>
            </View>
          }
        />
      )}

      {/* ── Empty / initial state ──────────────────────────────────────────── */}
      {mainView === "empty" && (
        <ScrollView
          contentContainerStyle={styles.emptyScrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {selected.length === 0 ? (
            <>
              <Text style={{ fontSize: 48, color: colors.light.mutedForeground }}>🧮</Text>
              <Text style={styles.emptyTitle}>ابدأ بإضافة اختبار</Text>
              <Text style={styles.emptySubtitle}>
                ابحث عن اسم الاختبار وأضفه للسلة، ثم اضغط "قارن" لعرض المختبرات المتاحة مع التكلفة شاملة الضريبة
              </Text>
              <Pressable
                onPress={handleBrowse}
                style={({ pressed }) => [styles.browseAllBtn, { opacity: pressed ? 0.85 : 1 }]}
              >
                <Text style={styles.browseAllBtnText}>📦 تصفح المنتجات</Text>
              </Pressable>
              <Pressable
                onPress={handleMandatory}
                style={({ pressed }) => [styles.mandatoryBtn, { opacity: pressed ? 0.85 : 1 }]}
              >
                <Text style={styles.browseAllBtnText}>📋 التحاليل الإلزامية</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={{ fontSize: 40, color: colors.light.mutedForeground }}>🧺</Text>
              <Text style={styles.emptyTitle}>السلة جاهزة</Text>
              <Text style={styles.emptySubtitle}>
                أضفت {selected.length} اختبار — يمكنك إضافة المزيد أو الضغط على "قارن" لعرض النتائج
              </Text>
              <Pressable
                onPress={handleCompare}
                style={({ pressed }) => [styles.browseAllBtn, styles.compareBtnLarge, { opacity: pressed ? 0.85 : 1 }]}
              >
                <Text style={styles.browseAllBtnText}>🔬 قارن الاختبارات ({selected.length})</Text>
              </Pressable>
              <Pressable
                onPress={handleBrowse}
                style={({ pressed }) => [styles.browseOutlineBtn, { opacity: pressed ? 0.75 : 1 }]}
              >
                <Text style={styles.browseOutlineBtnText}>📦 تصفح المنتجات وإضافة اختبارات</Text>
              </Pressable>
              <Pressable
                onPress={handleMandatory}
                style={({ pressed }) => [styles.browseOutlineBtn, styles.mandatoryOutlineBtn, { opacity: pressed ? 0.75 : 1 }]}
              >
                <Text style={[styles.browseOutlineBtnText, { color: "#b45309" }]}>📋 التحاليل الإلزامية</Text>
              </Pressable>
            </>
          )}
        </ScrollView>
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
  headerTitleRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "right",
    flex: 1,
  },
  backBrowseBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  backBrowseBtnText: { fontSize: 12, color: "#80cbc4" },
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
    maxWidth: 220,
  },
  chipTextBlock: { flexDirection: "column", maxWidth: 110 },
  chipParam: {
    fontSize: 11,
    color: "#ffffff",
    fontWeight: "500",
    writingDirection: "ltr",
  },
  chipProduct: {
    fontSize: 9,
    color: "#80cbc4",
    writingDirection: "ltr",
  },
  chipFieldBadge: {
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  chipFieldText: { fontSize: 9, fontWeight: "600" },

  basketActions: {
    flexDirection: "column",
    gap: 6,
    alignItems: "center",
    flexShrink: 0,
  },
  clearAllBtn: {
    backgroundColor: "#d97706",
    borderRadius: 20,
    padding: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  compareBtn: {
    backgroundColor: "#f9a825",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  compareBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1a237e",
    textAlign: "center",
  },

  // List
  listContent: {
    padding: 16,
    paddingBottom: Platform.OS === "web" ? 40 : 28,
    gap: 10,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.light.mutedForeground,
    textAlign: "right",
    marginBottom: 4,
  },

  // Field tabs (browse)
  fieldTabsScroll: { marginBottom: 0 },
  fieldTabs: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  fieldTab: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#fff",
  },
  fieldTabActive: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  fieldTabText: { fontSize: 12, color: colors.light.mutedForeground, fontWeight: "500" },
  fieldTabTextActive: { color: "#fff" },

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
  addIcon: {
    fontSize: 18,
    color: ACCENT,
    lineHeight: 20,
    flexShrink: 0,
    fontWeight: "700",
    width: 18,
    textAlign: "center",
  },
  addIconSelected: { color: "#2e7d32" },
  suggestionTextBlock: { flex: 1, gap: 2 },
  suggestionParam: {
    fontSize: 14,
    color: colors.light.text,
    writingDirection: "ltr",
    lineHeight: 19,
  },
  suggestionProduct: {
    fontSize: 11,
    color: colors.light.mutedForeground,
    writingDirection: "ltr",
    lineHeight: 15,
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
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  resultCountText: {
    fontSize: 12,
    color: colors.light.mutedForeground,
    textAlign: "right",
    flex: 1,
  },
  backToBasketBtn: { paddingHorizontal: 6, paddingVertical: 4 },
  backToBasketText: { fontSize: 12, color: ACCENT, fontWeight: "600" },

  // Result cards
  resultCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1.5,
  },
  resultCardFull: { borderColor: "#a5d6a7" },
  resultCardPartial: { borderColor: "#ffcc80" },

  resultHeader: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    gap: 4,
  },
  resultHeaderMeta: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  matchBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  matchBadgeText: { fontSize: 11, color: "#fff", fontWeight: "700" },
  viewDetailHint: { fontSize: 11, color: "#9ca3af" },
  labName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.light.text,
    textAlign: "right",
  },

  testsSection: { paddingHorizontal: 0 },

  testRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
    gap: 8,
  },
  testRowMissing: { backgroundColor: "#fafafa" },
  testRowInfo: {
    flexDirection: "row-reverse",
    alignItems: "center",
    flex: 1,
    gap: 8,
    minWidth: 0,
  },
  checkIcon: { fontSize: 13, color: "#2e7d32", flexShrink: 0 },
  crossIcon: { fontSize: 13, color: "#c62828", flexShrink: 0 },
  testTextBlock: { flex: 1, gap: 1, minWidth: 0, alignItems: "flex-end" },
  testParam: {
    fontSize: 13,
    color: colors.light.text,
    writingDirection: "ltr",
    textAlign: "left",
  },
  testParamMissing: { color: "#9ca3af" },
  testProduct: {
    fontSize: 10,
    color: colors.light.mutedForeground,
    writingDirection: "ltr",
    textAlign: "left",
  },
  testProductMissing: { color: "#c4b5a0" },
  testFieldBadge: {
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 2,
    flexShrink: 0,
  },
  testFieldText: { fontSize: 9, fontWeight: "600" },
  priceBadge: {
    backgroundColor: "#e8f5e9",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexShrink: 0,
    minWidth: 60,
    alignItems: "flex-end",
  },
  priceText: { fontSize: 12, fontWeight: "700", color: "#2e7d32", writingDirection: "ltr" },
  noPriceBadge: { backgroundColor: "#f5f5f5" },
  noPriceText: { fontSize: 11, color: "#9ca3af" },
  missingBadge: { backgroundColor: "#fbe9e7" },
  missingText: { fontSize: 11, color: "#c62828" },

  asteriskNote: {
    fontSize: 10,
    color: "#9ca3af",
    textAlign: "right",
    paddingHorizontal: 14,
    paddingTop: 6,
  },

  costBox: {
    margin: 12,
    backgroundColor: "#f8fffe",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#b2dfdb",
    overflow: "hidden",
  },
  costRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  costRowBorder: {
    borderTopWidth: 1,
    borderTopColor: "#e0f2f1",
  },
  costRowTotal: {
    borderTopWidth: 1.5,
    borderTopColor: "#80cbc4",
    backgroundColor: "#e0f2f1",
  },
  costLabel: { fontSize: 12, color: colors.light.mutedForeground },
  costValue: { fontSize: 13, fontWeight: "600", color: colors.light.text },
  costLabelTotal: { fontSize: 13, fontWeight: "700", color: "#004d40" },
  costValueTotal: { fontSize: 15, fontWeight: "800", color: "#004d40" },

  // Empty / initial state
  emptyScrollContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 14,
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
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
  browseAllBtn: {
    backgroundColor: ACCENT,
    borderRadius: 14,
    paddingHorizontal: 22,
    paddingVertical: 13,
    marginTop: 8,
    alignItems: "center",
  },
  compareBtnLarge: { backgroundColor: "#1565c0" },
  browseAllBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
  },
  browseOutlineBtn: {
    borderWidth: 1.5,
    borderColor: ACCENT,
    borderRadius: 14,
    paddingHorizontal: 22,
    paddingVertical: 11,
    alignItems: "center",
    marginTop: 2,
  },
  browseOutlineBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: ACCENT,
    textAlign: "center",
  },
  mandatoryBtn: {
    backgroundColor: "#b45309",
    borderRadius: 14,
    paddingHorizontal: 22,
    paddingVertical: 13,
    marginTop: 4,
    alignItems: "center",
  },
  mandatoryOutlineBtn: {
    borderColor: "#b45309",
    marginTop: 4,
  },

  // Mandatory test rows
  mandatoryTestRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    gap: 10,
    backgroundColor: "#fffbf5",
  },
  mandatorySearchIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#fef3c7",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
  },
  mandatoryTestName: {
    fontSize: 13,
    color: "#1c1917",
    writingDirection: "ltr",
    textAlign: "left",
    lineHeight: 18,
    fontWeight: "500",
  },
  mandatoryTestNotes: {
    fontSize: 11,
    color: "#92400e",
    writingDirection: "ltr",
    textAlign: "left",
    lineHeight: 15,
    fontStyle: "italic",
  },

  // Browse product search
  browseSearchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fafa",
    borderRadius: 10,
    marginHorizontal: 14,
    marginTop: 10,
    marginBottom: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: "#b2d8d8",
  },
  browseSearchInput: {
    flex: 1,
    fontSize: 13,
    color: "#1a3a3a",
    paddingVertical: 0,
    writingDirection: "ltr",
    textAlign: "left",
  },

  // Product browse cards
  productCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
  },
  expandChevron: { fontSize: 10, color: "#9ca3af", flexShrink: 0 },
  productRowBody: { flex: 1, gap: 5, alignItems: "flex-end" },
  productName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.light.text,
    textAlign: "left",
    writingDirection: "ltr",
  },
  productRowMeta: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  productFieldBadge: {
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  productFieldText: { fontSize: 10, fontWeight: "600" },
  productTestCount: {
    fontSize: 11,
    color: colors.light.mutedForeground,
  },
  addedBadge: {
    backgroundColor: "#e8f5e9",
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  addedBadgeText: { fontSize: 10, fontWeight: "700", color: "#2e7d32" },

  productTests: {
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  productTestRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f7f7f7",
    gap: 10,
    backgroundColor: "#fafafa",
  },
  productTestRowAdded: { backgroundColor: "#f1f8e9" },
  addRemoveBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#e0f2f1",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  addRemoveBtnAdded: { backgroundColor: "#c8e6c9" },
  addRemoveIcon: { fontSize: 14, color: ACCENT, fontWeight: "700", lineHeight: 17 },
  addRemoveIconAdded: { color: "#2e7d32" },
  productTestParam: {
    flex: 1,
    fontSize: 13,
    color: colors.light.text,
    writingDirection: "ltr",
    textAlign: "left",
    lineHeight: 18,
  },
  productTestLabCount: {
    backgroundColor: "#e0f2f1",
    borderRadius: 9,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: "center",
    flexShrink: 0,
  },
  productTestLabCountText: { fontSize: 10, fontWeight: "700", color: ACCENT },
});
