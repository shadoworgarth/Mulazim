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
import {
  EstablishmentFines,
  FOOD_FINES_V2,
  FoodFineV2,
} from "@/constants/food-fines-v2";

const SECTION_COLORS: Record<number, { bg: string; text: string }> = {
  1: { bg: "#e3f2fd", text: "#1565c0" },
  2: { bg: "#e8f5e9", text: "#2e7d32" },
  3: { bg: "#fff3e0", text: "#e65100" },
  4: { bg: "#f3e5f5", text: "#6a1b9a" },
  5: { bg: "#fce4ec", text: "#ad1457" },
};

type SectionFilter = "all" | 1 | 2 | 3 | 4 | 5;

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
  for (const size of SIZE_LABELS) {
    for (const cat of CAT_KEYS) {
      vals.push(fines[size.key][cat]);
    }
  }
  const nonNull = vals.filter((v) => v !== null) as number[];
  return nonNull.length > 0 && new Set(nonNull).size === 1;
}

function FineTable({
  finesMin,
  finesMax,
  fineType,
}: {
  finesMin: EstablishmentFines;
  finesMax: EstablishmentFines;
  fineType: "fixed" | "range";
}) {
  return (
    <View style={tableStyles.container}>
      {/* Header row */}
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

      {/* Data rows */}
      {SIZE_LABELS.map(({ key, label }, si) => (
        <View
          key={key}
          style={[tableStyles.row, si % 2 === 1 && tableStyles.rowAlt]}
        >
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

  // Quick summary: overall min and max across all cells
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
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.9 : 1 }]}
      onPress={() => setExpanded((e) => !e)}
    >
      {/* Top row: code badge + violation text */}
      <View style={styles.cardTop}>
        <View style={styles.topRight}>
          <View style={[styles.codeBadge, { backgroundColor: sc.bg }]}>
            <Text style={[styles.codeText, { color: sc.text }]}>
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

      {/* Meta row */}
      <View style={styles.metaRow}>
        {item.warningApplicable && (
          <View style={styles.warningBadge}>
            <Text style={styles.warningText}>إنذار</Text>
          </View>
        )}
        <Text style={styles.metaFine}>{summaryLabel}</Text>
        <Text style={styles.metaDot}>·</Text>
        <Text style={styles.metaChapter} numberOfLines={1}>
          {item.chapterLabel.replace(/^الفصل [^:]+: /, "")}
        </Text>
      </View>

      {/* Expanded detail */}
      {expanded && (
        <View style={styles.expandedBlock}>
          <View style={styles.expandedMeta}>
            <View style={styles.expandedMetaRow}>
              <Text style={styles.expandedLabel}>القسم</Text>
              <Text style={styles.expandedValue}>{item.sectionLabel}</Text>
            </View>
            <View style={styles.expandedMetaRow}>
              <Text style={styles.expandedLabel}>الفصل</Text>
              <Text style={styles.expandedValue}>{item.chapterLabel}</Text>
            </View>
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

export default function FoodFinesSearchScreen() {
  const [query, setQuery] = useState("");
  const [activeSection, setActiveSection] = useState<SectionFilter>("all");

  const q = query.trim();

  const filtered = useMemo(() => {
    return FOOD_FINES_V2.filter((item) => {
      if (activeSection !== "all" && item.section !== activeSection)
        return false;
      if (!q) return true;
      return (
        item.violation.includes(q) ||
        item.articleCode.toLowerCase().includes(q.toLowerCase()) ||
        item.chapterLabel.includes(q)
      );
    });
  }, [q, activeSection]);

  const tabs: { label: string; value: SectionFilter }[] = [
    { label: "الكل", value: "all" },
    { label: "المصانع", value: 1 },
    { label: "المستودعات", value: 2 },
    { label: "المستوردون", value: 3 },
    { label: "المختبرات", value: 4 },
    { label: "المكاتب", value: 5 },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder="ابحث بوصف المخالفة أو رقم المادة (مثال: 3/2/1)"
          placeholderTextColor={colors.light.mutedForeground}
          value={query}
          onChangeText={setQuery}
          clearButtonMode="while-editing"
          textAlign="right"
          returnKeyType="search"
        />
      </View>

      <View style={styles.tabsWrap}>
        <FlatList
          horizontal
          data={tabs}
          keyExtractor={(t) => String(t.value)}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}
          renderItem={({ item: tab }) => {
            const active = activeSection === tab.value;
            const sc =
              typeof tab.value === "number"
                ? SECTION_COLORS[tab.value]
                : { bg: "#0e7c7c", text: "#ffffff" };
            return (
              <Pressable
                style={[
                  styles.tab,
                  active && {
                    backgroundColor:
                      typeof tab.value === "number" ? sc.bg : "#0e7c7c",
                  },
                ]}
                onPress={() => setActiveSection(tab.value)}
              >
                <Text
                  style={[
                    styles.tabText,
                    active && {
                      color:
                        typeof tab.value === "number" ? sc.text : "#ffffff",
                      fontWeight: "700",
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      <View style={styles.resultsBar}>
        <Text style={styles.resultsCount}>{filtered.length} مخالفة</Text>
        <Text style={styles.tapHint}>اضغط على البطاقة لعرض جدول الغرامات</Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => `${item.articleCode}-${item.section}`}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => <FineCard item={item} />}
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
  container: { flex: 1, backgroundColor: colors.light.background },
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
  tabsWrap: { paddingBottom: 4 },
  tabs: {
    paddingHorizontal: 14,
    gap: 8,
    flexDirection: "row-reverse",
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
  },
  tabText: {
    fontSize: 13,
    color: colors.light.mutedForeground,
    fontWeight: "500",
  },
  resultsBar: {
    paddingHorizontal: 16,
    paddingBottom: 6,
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resultsCount: {
    fontSize: 12,
    color: colors.light.mutedForeground,
  },
  tapHint: {
    fontSize: 11,
    color: colors.light.mutedForeground,
    fontStyle: "italic",
  },
  list: {
    paddingHorizontal: 14,
    paddingBottom: Platform.OS === "web" ? 40 : 28,
    gap: 10,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
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
    flexWrap: "wrap",
  },
  warningBadge: {
    backgroundColor: "#fff3e0",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  warningText: { fontSize: 11, color: "#e65100", fontWeight: "600" },
  metaFine: { fontSize: 13, color: "#0e7c7c", fontWeight: "700" },
  metaDot: { fontSize: 13, color: colors.light.mutedForeground },
  metaChapter: {
    flex: 1,
    fontSize: 12,
    color: colors.light.mutedForeground,
    textAlign: "right",
  },
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
