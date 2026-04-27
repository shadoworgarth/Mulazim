import React, { useMemo, useState } from "react";
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

import colors from "@/constants/colors";
import ANIMAL_FEED_GUIDE, { FeedGuideRow } from "@/constants/animal-feed-guide";

const ACCENT = "#f57f17";
const ACCENT_LIGHT = "#fff8e1";

// ─── Category definitions ────────────────────────────────────────────────────

const CATEGORY_CHIPS = ["الدواجن", "المواشي"] as const;
type CategoryChip = typeof CATEGORY_CHIPS[number];

interface Subtype {
  label: string;
  keywords: string[];
}

const POULTRY_SUBTYPES: Subtype[] = [
  { label: "البياض",       keywords: ["بياض"] },
  { label: "الدجاج اللاحم", keywords: ["لاحم"] },
  { label: "الرومي",       keywords: ["رومي"] },
  { label: "صيصان الدواجن", keywords: ["صيصان"] },
  { label: "الحمام",       keywords: ["حمام"] },
  { label: "البط",         keywords: ["البط"] },
  { label: "الأوز",        keywords: ["الأوز"] },
];

const LIVESTOCK_SUBTYPES: Subtype[] = [
  { label: "أبقار الحلاب", keywords: ["أبقار", "حلاب"] },
  { label: "العجول",       keywords: ["عجول"] },
  { label: "الخراف",       keywords: ["خراف"] },
  { label: "الأرانب",      keywords: ["أرانب"] },
];

// ─── Matching helpers ─────────────────────────────────────────────────────────

const POULTRY_KEYWORDS   = ["دواجن", "بياض", "رومي", "لاحم", "صيصان", "حمام"];
const POULTRY_EXACT      = ["البط", "الأوز"];
const LIVESTOCK_KEYWORDS = ["مواشي", "أبقار", "عجول", "خراف", "أرانب"];

function isPoultry(animals: string): boolean {
  if (POULTRY_EXACT.includes(animals)) return true;
  return POULTRY_KEYWORDS.some((k) => animals.includes(k));
}

function isLivestock(animals: string): boolean {
  return LIVESTOCK_KEYWORDS.some((k) => animals.includes(k));
}

/** True when the row is a blanket rule with NO exclusion clause. */
function isFullyGeneral(animals: string): boolean {
  if (animals.includes("ما عدا")) return false;
  return (
    animals === "الدواجن" ||
    animals === "المواشي" ||
    animals.includes("جميع")
  );
}

/**
 * Ordered from most-specific to least-specific so the first match wins.
 * Each entry maps a trigger phrase to the sub-type labels it excludes.
 */
const EXCLUSION_RULES: { trigger: string; excludes: string[] }[] = [
  {
    trigger: "ما عدا البط والأوز والحمام والبياض",
    excludes: ["البياض", "البط", "الأوز", "الحمام"],
  },
  {
    trigger: "ما عدا البط والأوز",
    excludes: ["البط", "الأوز"],
  },
  {
    trigger: "ما عدا البياض",
    excludes: ["البياض"],
  },
];

/** Returns the sub-type labels explicitly excluded by the "ما عدا" clause. */
function getExcludedSubtypeLabels(animals: string): string[] {
  for (const rule of EXCLUSION_RULES) {
    if (animals.includes(rule.trigger)) return rule.excludes;
  }
  return [];
}

/**
 * Core filter — determines whether a row's `animals` value matches the
 * selected category and optional sub-type.
 *
 * Logic (evaluated in order):
 *  1. Exclusion check first: if the row has "ما عدا" and the sub-type is
 *     in its exclusion list → never show.
 *  2. Rows with "ما عدا" whose exclusion list does NOT include the sub-type
 *     → the rule applies to all non-excluded animals in the category → show.
 *  3. Fully-general rows (no exclusions, e.g. "الدواجن", "جميع أنواع الدواجن")
 *     → apply to every animal in the category → show.
 *  4. Specific rows without "ما عدا": show only if they directly name the
 *     sub-type via keyword match.
 */
function matchesFilter(
  animals: string,
  category: CategoryChip,
  subtype: Subtype | null
): boolean {
  // ── category-only (no sub-type selected) ──────────────────────────────────
  if (!subtype) {
    return category === "الدواجن" ? isPoultry(animals) : isLivestock(animals);
  }

  // ── sub-type selected ─────────────────────────────────────────────────────

  const inCategory =
    category === "الدواجن" ? isPoultry(animals) : isLivestock(animals);

  // Step 1 & 2: handle "ما عدا" (exception) rows first
  if (animals.includes("ما عدا")) {
    if (!inCategory) return false;
    const excluded = getExcludedSubtypeLabels(animals);
    // Sub-type is explicitly excluded → never show
    if (excluded.includes(subtype.label)) return false;
    // Sub-type is NOT in the exclusion list → rule applies to it → show
    return true;
  }

  // Step 3: fully-general rows apply to every animal in the category
  if (isFullyGeneral(animals)) return inCategory;

  // Step 4: specific rows — show only on direct keyword match
  return subtype.keywords.some((k) => animals.includes(k));
}

// ─── UI components ────────────────────────────────────────────────────────────

interface FilterSection {
  sectionId: string;
  sectionTitle: string;
  note?: string;
  rows: { row: FeedGuideRow; rowIndex: number }[];
}

function RowCard({ row }: { row: FeedGuideRow }) {
  const hasValues =
    (row.min && row.min !== "—") || (row.max && row.max !== "—");
  return (
    <View style={rowStyles.card}>
      <View style={rowStyles.nameRow}>
        <Text style={rowStyles.name}>{row.name}</Text>
        <Text style={rowStyles.unit}>{row.unit}</Text>
      </View>
      <Text style={rowStyles.animals}>{row.animals}</Text>
      {hasValues && (
        <View style={rowStyles.rangeRow}>
          <View style={rowStyles.rangeBox}>
            <Text style={rowStyles.rangeLabel}>الأدنى</Text>
            <Text style={rowStyles.rangeVal}>{row.min || "—"}</Text>
          </View>
          <View style={rowStyles.rangeDivider} />
          <View style={rowStyles.rangeBox}>
            <Text style={rowStyles.rangeLabel}>الأقصى</Text>
            <Text style={rowStyles.rangeVal}>{row.max || "—"}</Text>
          </View>
        </View>
      )}
      {row.notes ? <Text style={rowStyles.notes}>{row.notes}</Text> : null}
    </View>
  );
}

function SectionBlock({
  sectionId,
  sectionTitle,
  rows,
  note,
  collapsed,
  onToggle,
}: {
  sectionId: string;
  sectionTitle: string;
  rows: { row: FeedGuideRow; rowIndex: number }[];
  note?: string;
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <View>
      <Pressable
        style={({ pressed }) => [
          styles.sectionHeader,
          { opacity: pressed ? 0.82 : 1 },
        ]}
        onPress={onToggle}
      >
        <Text style={styles.chevron}>{collapsed ? "▸" : "▾"}</Text>
        <Text style={styles.sectionTitle}>{sectionTitle}</Text>
        <Text style={styles.sectionCount}>{rows.length}</Text>
      </Pressable>

      {!collapsed && (
        <View>
          {rows.map(({ row, rowIndex }) => (
            <View key={`${sectionId}-${rowIndex}`} style={styles.rowWrap}>
              <RowCard row={row} />
            </View>
          ))}
          {note && (
            <View style={styles.noteWrap}>
              <View style={styles.noteBox}>
                <Text style={styles.noteText}>{note}</Text>
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const ALL_COLLAPSED = Object.fromEntries(
  ANIMAL_FEED_GUIDE.map((s) => [s.id, true])
);

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function AnimalFeedGuideScreen() {
  const [collapsed, setCollapsed] =
    useState<Record<string, boolean>>(ALL_COLLAPSED);
  const [filteredCollapsed, setFilteredCollapsed] = useState<
    Record<string, boolean>
  >({});

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryChip | null>(null);
  const [selectedSubtype, setSelectedSubtype] = useState<Subtype | null>(null);

  const q = search.trim().toLowerCase();
  const isFiltering = q.length > 0 || selectedCategory !== null;

  const toggle = (id: string) =>
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  const toggleFiltered = (id: string) =>
    setFilteredCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));

  function handleCategoryPress(cat: CategoryChip) {
    if (selectedCategory === cat) {
      // deselect everything
      setSelectedCategory(null);
      setSelectedSubtype(null);
    } else {
      setSelectedCategory(cat);
      setSelectedSubtype(null);
    }
    setFilteredCollapsed({});
  }

  function handleSubtypePress(sub: Subtype) {
    setSelectedSubtype((prev) => (prev?.label === sub.label ? null : sub));
    setFilteredCollapsed({});
  }

  const subtypeList: Subtype[] =
    selectedCategory === "الدواجن"
      ? POULTRY_SUBTYPES
      : selectedCategory === "المواشي"
      ? LIVESTOCK_SUBTYPES
      : [];

  const filteredSections = useMemo<FilterSection[]>(() => {
    if (!isFiltering) return [];
    const result: FilterSection[] = [];
    ANIMAL_FEED_GUIDE.forEach((section) => {
      const matched = section.rows
        .map((row, i) => ({ row, rowIndex: i }))
        .filter(({ row }) => {
          const matchesText =
            !q ||
            row.name.toLowerCase().includes(q) ||
            row.animals.toLowerCase().includes(q);

          const matchesAnimal =
            !selectedCategory ||
            matchesFilter(row.animals, selectedCategory, selectedSubtype);

          return matchesText && matchesAnimal;
        });
      if (matched.length > 0) {
        result.push({
          sectionId: section.id,
          sectionTitle: section.title,
          note: section.note,
          rows: matched,
        });
      }
    });
    return result;
  }, [q, selectedCategory, selectedSubtype, isFiltering]);

  const totalRows = ANIMAL_FEED_GUIDE.reduce(
    (acc, s) => acc + s.rows.length,
    0
  );
  const totalFilteredRows = filteredSections.reduce(
    (acc, s) => acc + s.rows.length,
    0
  );

  // ── label shown in result count bar ──
  const activeLabel = selectedSubtype?.label ?? selectedCategory ?? "";

  // ── filters bar ──────────────────────────────────────────────────────────
  const filtersBar = (
    <View>
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder="ابحث عن مادة أو حيوان..."
          placeholderTextColor={colors.light.mutedForeground}
          value={search}
          onChangeText={(t) => {
            setSearch(t);
            setFilteredCollapsed({});
          }}
          textAlign="right"
          returnKeyType="search"
        />
      </View>

      {/* Category chips row */}
      <View style={styles.chipsSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {CATEGORY_CHIPS.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <Pressable
                key={cat}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => handleCategoryPress(cat)}
              >
                <Text
                  style={[styles.chipText, active && styles.chipTextActive]}
                  numberOfLines={1}
                >
                  {cat}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Sub-type chips row — only when a category is active */}
      {subtypeList.length > 0 && (
        <View style={styles.subtypeSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {subtypeList.map((sub) => {
              const active = selectedSubtype?.label === sub.label;
              return (
                <Pressable
                  key={sub.label}
                  style={[styles.subChip, active && styles.subChipActive]}
                  onPress={() => handleSubtypePress(sub)}
                >
                  <Text
                    style={[
                      styles.subChipText,
                      active && styles.subChipTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {sub.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {filtersBar}

      {isFiltering ? (
        <FlatList
          data={filteredSections}
          keyExtractor={(item) => item.sectionId}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            filteredSections.length > 0 ? (
              <Text style={styles.countText}>
                {totalFilteredRows} نتيجة في {filteredSections.length} قسم
                {activeLabel ? ` · ${activeLabel}` : ""}
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>لا توجد نتائج</Text>
            </View>
          }
          renderItem={({ item }) => (
            <SectionBlock
              sectionId={item.sectionId}
              sectionTitle={item.sectionTitle}
              rows={item.rows}
              note={item.note}
              collapsed={filteredCollapsed[item.sectionId] !== false}
              onToggle={() => toggleFiltered(item.sectionId)}
            />
          )}
        />
      ) : (
        <FlatList
          data={ANIMAL_FEED_GUIDE}
          keyExtractor={(s) => s.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.headerBanner}>
              <Text style={styles.headerBannerText}>
                دليل المواد المضافة لعلف المواشي والدواجن
              </Text>
              <Text style={styles.headerBannerSub}>
                {totalRows} مادة في {ANIMAL_FEED_GUIDE.length} قسم
              </Text>
            </View>
          }
          renderItem={({ item: section }) => (
            <SectionBlock
              sectionId={section.id}
              sectionTitle={section.title}
              rows={section.rows.map((row, i) => ({ row, rowIndex: i }))}
              note={section.note}
              collapsed={collapsed[section.id] !== false}
              onToggle={() => toggle(section.id)}
            />
          )}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  searchWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  searchInput: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
    fontSize: 14,
    color: colors.light.text,
    textAlign: "right",
  },
  chipsSection: {
    paddingBottom: 6,
  },
  subtypeSection: {
    paddingBottom: 8,
  },
  chipsRow: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: "row",
  },
  // Category chips (solid fill when active)
  chip: {
    borderWidth: 1.5,
    borderColor: ACCENT,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: "#ffffff",
  },
  chipActive: {
    backgroundColor: ACCENT,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "700",
    color: ACCENT,
  },
  chipTextActive: {
    color: "#ffffff",
  },
  // Sub-type chips (smaller, outlined style)
  subChip: {
    borderWidth: 1,
    borderColor: ACCENT,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: ACCENT_LIGHT,
  },
  subChipActive: {
    backgroundColor: ACCENT,
  },
  subChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: ACCENT,
  },
  subChipTextActive: {
    color: "#ffffff",
  },
  listContent: {
    paddingTop: 4,
    paddingBottom: Platform.OS === "web" ? 40 : 32,
  },
  headerBanner: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: `${ACCENT}22`,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "flex-end",
  },
  headerBannerText: {
    fontSize: 14,
    fontWeight: "700",
    color: ACCENT,
    textAlign: "right",
  },
  headerBannerSub: {
    fontSize: 12,
    color: ACCENT,
    textAlign: "right",
    marginTop: 2,
    opacity: 0.8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 6,
    backgroundColor: ACCENT_LIGHT,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  chevron: {
    fontSize: 16,
    color: ACCENT,
    flexShrink: 0,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: ACCENT,
    textAlign: "right",
  },
  sectionCount: {
    fontSize: 11,
    fontWeight: "700",
    color: "#ffffff",
    backgroundColor: ACCENT,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: "hidden",
    minWidth: 22,
    textAlign: "center",
  },
  rowWrap: {
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  noteWrap: {
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  noteBox: {
    backgroundColor: "#fff9c4",
    borderWidth: 1,
    borderColor: "#f9a825",
    borderRadius: 10,
    padding: 12,
    marginTop: 2,
    marginBottom: 4,
  },
  noteText: {
    fontSize: 12,
    color: "#5d4037",
    textAlign: "right",
    lineHeight: 19,
  },
  countText: {
    fontSize: 12,
    color: colors.light.mutedForeground,
    textAlign: "right",
    marginBottom: 6,
    marginHorizontal: 16,
  },
  emptyWrap: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: colors.light.mutedForeground,
  },
});

const rowStyles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    gap: 6,
  },
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.light.text,
    flex: 1,
  },
  unit: {
    fontSize: 11,
    fontWeight: "600",
    color: ACCENT,
    backgroundColor: ACCENT_LIGHT,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: "hidden",
  },
  animals: {
    fontSize: 12,
    color: colors.light.mutedForeground,
    textAlign: "right",
  },
  rangeRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 4,
  },
  rangeBox: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
  },
  rangeDivider: {
    width: 1,
    backgroundColor: "#e0e0e0",
  },
  rangeLabel: {
    fontSize: 10,
    color: colors.light.mutedForeground,
    fontWeight: "500",
  },
  rangeVal: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.light.text,
    marginTop: 2,
  },
  notes: {
    fontSize: 11,
    color: "#5d4037",
    textAlign: "right",
    backgroundColor: "#fff8e1",
    borderRadius: 6,
    padding: 8,
    lineHeight: 17,
  },
});
