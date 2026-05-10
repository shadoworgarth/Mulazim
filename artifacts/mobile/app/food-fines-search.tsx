import React, { useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import colors from "@/constants/colors";
import {
  EstablishmentFines,
  FOOD_FINES_V2,
  FoodFineV2,
} from "@/constants/food-fines-v2";

const SECTION_COLORS: Record<number, { bg: string; badgeBg: string; text: string; header: string }> = {
  1: { bg: "#e3f2fd", badgeBg: "#64b5f6", text: "#0d47a1", header: "#1565c0" },
  2: { bg: "#e8f5e9", badgeBg: "#66bb6a", text: "#1b5e20", header: "#2e7d32" },
  3: { bg: "#fff3e0", badgeBg: "#ffa726", text: "#bf360c", header: "#e65100" },
  4: { bg: "#f3e5f5", badgeBg: "#ab47bc", text: "#4a148c", header: "#6a1b9a" },
  5: { bg: "#fce4ec", badgeBg: "#ec407a", text: "#880e4f", header: "#ad1457" },
};

const SECTION_BG: Record<number, string> = {
  1: "#bbdefb", 2: "#c8e6c9", 3: "#ffe0b2",
  4: "#e1bee7", 5: "#f8bbd0",
};

type SectionFilter = "all" | 1 | 2 | 3 | 4 | 5;

type ListSection = {
  key: string;
  section: number;
  sectionLabel: string;
  chapter: number;
  chapterLabel: string;
  showSectionHeader: boolean;
  data: FoodFineV2[];
};

const SIZE_LABELS: { key: keyof EstablishmentFines; label: string }[] = [
  { key: "small", label: "صغيرة" },
  { key: "medium", label: "متوسطة" },
  { key: "large", label: "كبيرة" },
];
const CAT_KEYS = ["a", "b", "c", "d"] as const;
const CAT_LABELS = ["أ", "ب", "ج", "د"];

function fmt(n: number | null): string {
  if (n === null) return "—";
  return n.toLocaleString("ar-SA");
}

function allSame(fines: EstablishmentFines): boolean {
  const vals: (number | null)[] = [];
  for (const size of SIZE_LABELS)
    for (const cat of CAT_KEYS) vals.push(fines[size.key][cat]);
  const nonNull = vals.filter((v) => v !== null) as number[];
  return nonNull.length > 0 && new Set(nonNull).size === 1;
}

function FineTable({
  finesMin, finesMax, fineType,
}: {
  finesMin: EstablishmentFines;
  finesMax: EstablishmentFines;
  fineType: "fixed" | "range";
}) {
  return (
    <View style={tableStyles.container}>
      <View style={tableStyles.row}>
        <View style={[tableStyles.sizeCell, tableStyles.headerCell]}>
          <Text style={tableStyles.headerText}>الفئة</Text>
        </View>
        {CAT_LABELS.map((lbl) => (
          <View key={lbl} style={[tableStyles.amtCell, tableStyles.headerCell]}>
            <Text style={tableStyles.headerText}>{lbl}</Text>
          </View>
        ))}
      </View>
      {SIZE_LABELS.map(({ key, label }, si) => (
        <View key={key} style={[tableStyles.row, si % 2 === 1 && tableStyles.rowAlt]}>
          <View style={tableStyles.sizeCell}>
            <Text style={tableStyles.sizeText}>{label}</Text>
          </View>
          {CAT_KEYS.map((cat) => {
            const hi = finesMax[key][cat];
            const lo = finesMin[key][cat];
            const isRange = fineType === "range" && hi !== lo;
            return (
              <View key={cat} style={tableStyles.amtCell}>
                {isRange ? (
                  <>
                    <Text style={tableStyles.amtHi}>{fmt(hi)}</Text>
                    <Text style={tableStyles.amtSep}>–</Text>
                    <Text style={tableStyles.amtLo}>{fmt(lo)}</Text>
                  </>
                ) : (
                  <Text style={tableStyles.amtFixed}>{fmt(hi)}</Text>
                )}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

function FineCard({ item }: { item: FoodFineV2 }) {
  const [expanded, setExpanded] = useState(false);
  const sc = SECTION_COLORS[item.section];

  const allVals: number[] = [];
  for (const size of SIZE_LABELS) {
    for (const cat of CAT_KEYS) {
      const lo = item.finesMin[size.key][cat];
      const hi = item.finesMax[size.key][cat];
      if (lo !== null) allVals.push(lo);
      if (hi !== null) allVals.push(hi);
    }
  }
  const overallMin = allVals.length ? Math.min(...allVals) : 0;
  const overallMax = allVals.length ? Math.max(...allVals) : 0;
  const uniformFines = allSame(item.finesMax) && allSame(item.finesMin);
  const summaryLabel =
    overallMin === overallMax
      ? `${fmt(overallMax)} ر.س`
      : `${fmt(overallMin)} – ${fmt(overallMax)} ر.س`;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, { backgroundColor: sc.bg, opacity: pressed ? 0.9 : 1 }]}
      onPress={() => setExpanded((e) => !e)}
    >
      <View style={styles.cardTop}>
        <View style={styles.topRight}>
          <View style={[styles.codeBadge, { backgroundColor: sc.badgeBg }]}>
            <Text style={[styles.codeText, { color: "#ffffff" }]}>
              {item.articleCode}
            </Text>
          </View>
        </View>
        <Text
          style={styles.violationText}
          numberOfLines={expanded ? undefined : 3}
        >
          {item.violation}
        </Text>
      </View>

      {item.warningApplicable && (
        <View style={styles.metaRow}>
          <View style={styles.warningBadge}>
            <Text style={styles.warningText}>إنذار</Text>
          </View>
        </View>
      )}

      {expanded && (
        <View style={styles.expandedBlock}>
          <View style={styles.expandedMeta}>
            <View style={styles.expandedMetaRow}>
              <Text style={styles.expandedLabel}>وحدة الغرامة</Text>
              <Text style={styles.expandedValue}>{item.unit || "—"}</Text>
            </View>
            <View style={styles.expandedMetaRow}>
              <Text style={styles.expandedLabel}>نوع العقوبة</Text>
              <Text style={styles.expandedValue}>
                {item.fineType === "fixed" ? "قيمة ثابتة" : "حد أدنى / أعلى"}
              </Text>
            </View>
            {item.warningApplicable && (
              <View style={styles.expandedMetaRow}>
                <Text style={styles.expandedLabel}>الإنذار</Text>
                <Text style={[styles.expandedValue, { color: "#e65100" }]}>
                  ينطبق
                </Text>
              </View>
            )}
          </View>

          <View style={styles.tableSection}>
            <Text style={styles.tableTitle}>
              {item.fineType === "range"
                ? "قيمة الغرامة (الحد الأدنى – الأعلى) بالريال"
                : "قيمة الغرامة بالريال"}
            </Text>
            {uniformFines ? (
              <View style={styles.uniformFine}>
                <Text style={styles.uniformFineText}>{summaryLabel}</Text>
                <Text style={styles.uniformFineNote}>
                  (موحدة لجميع الفئات والأحجام)
                </Text>
              </View>
            ) : (
              <FineTable
                finesMin={item.finesMin}
                finesMax={item.finesMax}
                fineType={item.fineType}
              />
            )}
          </View>
        </View>
      )}

      <Text style={styles.expandHint}>{expanded ? "▲" : "▼"}</Text>
    </Pressable>
  );
}

const SECTION_NUMS = [1, 2, 3, 4, 5] as const;
const SECTION_SHORT: Record<number, string> = {
  1: "المصانع", 2: "المستودعات", 3: "المستوردون",
  4: "المختبرات", 5: "المكاتب",
};

export default function FoodFinesSearchScreen() {
  const [query, setQuery] = useState("");
  const [activeSection, setActiveSection] = useState<SectionFilter>("all");
  const [collapsedChapters, setCollapsedChapters] = useState<Set<string>>(new Set());

  const toggleChapter = (key: string) => {
    setCollapsedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const q = query.trim();

  const filtered = useMemo(() => {
    return FOOD_FINES_V2.filter((item) => {
      if (activeSection !== "all" && item.section !== activeSection) return false;
      if (!q) return true;
      return (
        item.violation.includes(q) ||
        item.articleCode.toLowerCase().includes(q.toLowerCase()) ||
        item.chapterLabel.includes(q) ||
        item.sectionLabel.includes(q)
      );
    });
  }, [q, activeSection]);

  const rawSections = useMemo<(ListSection & { totalCount: number })[]>(() => {
    const map = new Map<string, ListSection & { totalCount: number }>();
    for (const item of filtered) {
      const key = `${item.section}-${item.chapter}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          section: item.section,
          sectionLabel: item.sectionLabel,
          chapter: item.chapter,
          chapterLabel: item.chapterLabel,
          showSectionHeader: false,
          totalCount: 0,
          data: [],
        });
      }
      const entry = map.get(key)!;
      entry.totalCount += 1;
      entry.data.push(item);
    }
    const list = Array.from(map.values());
    let lastSec = -1;
    for (const s of list) {
      if (s.section !== lastSec) {
        s.showSectionHeader = true;
        lastSec = s.section;
      }
    }
    return list;
  }, [filtered]);

  const sections = useMemo<(ListSection & { totalCount: number; collapsed: boolean })[]>(() => {
    return rawSections.map((s) => {
      const collapsed = collapsedChapters.has(s.key);
      return { ...s, collapsed, data: collapsed ? [] : s.data };
    });
  }, [rawSections, collapsedChapters]);

  const totalCount = filtered.length;

  return (
    <View style={styles.container}>
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder="ابحث بوصف المخالفة أو رقم المادة (مثال: 1/1/1)"
          placeholderTextColor={colors.light.mutedForeground}
          value={query}
          onChangeText={setQuery}
          clearButtonMode="while-editing"
          textAlign="right"
          returnKeyType="search"
        />
      </View>

      <View style={styles.tabsWrap}>
        <View style={styles.tabs}>
          {(["all", ...SECTION_NUMS] as SectionFilter[]).map((val) => {
            const active = activeSection === val;
            const sc = typeof val === "number" ? SECTION_COLORS[val] : null;
            return (
              <Pressable
                key={String(val)}
                style={[
                  styles.tab,
                  active && {
                    backgroundColor: sc ? sc.bg : "#0e7c7c",
                  },
                ]}
                onPress={() => setActiveSection(val)}
              >
                <Text
                  style={[
                    styles.tabText,
                    active && {
                      color: sc ? sc.text : "#ffffff",
                      fontWeight: "700",
                    },
                  ]}
                >
                  {val === "all" ? "الكل" : SECTION_SHORT[val]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.resultsBar}>
        <Text style={styles.resultsCount}>{totalCount} مخالفة</Text>
        <Text style={styles.tapHint}>اضغط على البطاقة لعرض جدول الغرامات</Text>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => `${item.articleCode}-${item.section}`}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        stickySectionHeadersEnabled={false}
        renderItem={({ item }) => (
          <View style={styles.cardWrap}>
            <FineCard item={item} />
          </View>
        )}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeaderWrap}>
            {section.showSectionHeader && (
              <View
                style={[
                  styles.sectionBanner,
                  { backgroundColor: SECTION_BG[section.section] },
                ]}
              >
                <Text
                  style={[
                    styles.sectionBannerText,
                    { color: SECTION_COLORS[section.section].header },
                  ]}
                >
                  {section.sectionLabel}
                </Text>
              </View>
            )}
            <Pressable
              style={({ pressed }) => [
                styles.chapterHeader,
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => toggleChapter(section.key)}
            >
              <Text
                style={[
                  styles.chapterArrow,
                  { color: SECTION_COLORS[section.section].header },
                ]}
              >
                {section.collapsed ? "◀" : "▼"}
              </Text>
              <Text style={styles.chapterHeaderText} numberOfLines={2}>
                {section.chapterLabel}
              </Text>
              <View
                style={[
                  styles.chapterAccent,
                  { backgroundColor: SECTION_COLORS[section.section].header },
                ]}
              />
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>لا توجد نتائج</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f6f9" },
  searchWrap: { padding: 14, paddingBottom: 8 },
  searchInput: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    fontSize: 14,
    color: colors.light.text,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    textAlign: "right",
  },
  tabsWrap: { paddingBottom: 4, paddingHorizontal: 14 },
  tabs: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 6,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
  },
  tabText: {
    fontSize: 12,
    color: colors.light.mutedForeground,
    fontWeight: "500",
  },
  resultsBar: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resultsCount: { fontSize: 12, color: colors.light.mutedForeground },
  tapHint: {
    fontSize: 11,
    color: colors.light.mutedForeground,
    fontStyle: "italic",
  },
  list: {
    paddingHorizontal: 14,
    paddingBottom: Platform.OS === "web" ? 40 : 28,
  },
  sectionHeaderWrap: { marginTop: 12 },
  sectionBanner: {
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  sectionBannerText: {
    fontSize: 15,
    fontWeight: "800",
    textAlign: "right",
  },
  chapterHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 6,
    borderRadius: 8,
  },
  chapterAccent: {
    width: 3,
    height: 18,
    borderRadius: 2,
    flexShrink: 0,
  },
  chapterHeaderText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    textAlign: "right",
    flex: 1,
  },
  chapterArrow: {
    fontSize: 11,
    fontWeight: "700",
    flexShrink: 0,
    width: 16,
    textAlign: "center",
  },
  cardWrap: { marginBottom: 8 },
  card: {
    borderRadius: 14,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    gap: 8,
  },
  cardTop: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    gap: 10,
  },
  topRight: { flexShrink: 0 },
  codeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  codeText: { fontSize: 13, fontWeight: "700", letterSpacing: 0.3 },
  violationText: {
    flex: 1,
    fontSize: 14,
    color: colors.light.text,
    textAlign: "right",
    lineHeight: 21,
  },
  metaRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
  },
  warningBadge: {
    backgroundColor: "#fff3e0",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  warningText: { fontSize: 11, color: "#e65100", fontWeight: "600" },
  expandedBlock: {
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 10,
    gap: 12,
  },
  expandedMeta: { gap: 6 },
  expandedMetaRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  expandedLabel: {
    fontSize: 12,
    color: colors.light.mutedForeground,
    flexShrink: 0,
  },
  expandedValue: {
    fontSize: 13,
    color: colors.light.text,
    textAlign: "right",
    flex: 1,
    lineHeight: 19,
  },
  tableSection: { gap: 6 },
  tableTitle: {
    fontSize: 12,
    color: colors.light.mutedForeground,
    textAlign: "right",
    fontWeight: "600",
  },
  uniformFine: { alignItems: "flex-end", gap: 2 },
  uniformFineText: { fontSize: 16, fontWeight: "700", color: "#0e7c7c" },
  uniformFineNote: { fontSize: 11, color: colors.light.mutedForeground },
  expandHint: {
    textAlign: "center",
    fontSize: 10,
    color: "#d1d5db",
    marginTop: -2,
  },
  empty: { paddingVertical: 60, alignItems: "center" },
  emptyText: { fontSize: 15, color: colors.light.mutedForeground },
});

const tableStyles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row-reverse",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  rowAlt: { backgroundColor: "#fafafa" },
  headerCell: { backgroundColor: "#f3f4f6" },
  sizeCell: {
    width: 52,
    paddingVertical: 6,
    paddingHorizontal: 4,
    justifyContent: "center",
    alignItems: "flex-end",
    borderLeftWidth: 1,
    borderLeftColor: "#e5e7eb",
  },
  amtCell: {
    flex: 1,
    paddingVertical: 5,
    paddingHorizontal: 3,
    alignItems: "center",
    justifyContent: "center",
    borderLeftWidth: 1,
    borderLeftColor: "#f0f0f0",
  },
  headerText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.light.text,
    textAlign: "center",
  },
  sizeText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.light.text,
    textAlign: "right",
  },
  amtFixed: {
    fontSize: 11,
    color: "#0e7c7c",
    fontWeight: "600",
    textAlign: "center",
  },
  amtHi: {
    fontSize: 10,
    color: "#c62828",
    fontWeight: "600",
    textAlign: "center",
  },
  amtSep: { fontSize: 9, color: "#9ca3af" },
  amtLo: {
    fontSize: 10,
    color: "#2e7d32",
    fontWeight: "600",
    textAlign: "center",
  },
});
