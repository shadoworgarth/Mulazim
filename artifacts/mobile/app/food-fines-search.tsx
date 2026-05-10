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
import { FOOD_FINES_V2, FoodFineV2 } from "@/constants/food-fines-v2";

const SECTION_LABELS: Record<number, string> = {
  1: "مصانع الأغذية",
  2: "مستودعات وتوزيع",
  3: "مستوردو الأغذية",
  4: "المختبرات الخاصة",
  5: "المكاتب الاستشارية",
};

const SECTION_COLORS: Record<number, { bg: string; text: string }> = {
  1: { bg: "#e3f2fd", text: "#1565c0" },
  2: { bg: "#e8f5e9", text: "#2e7d32" },
  3: { bg: "#fff3e0", text: "#e65100" },
  4: { bg: "#f3e5f5", text: "#6a1b9a" },
  5: { bg: "#fce4ec", text: "#ad1457" },
};

type SectionFilter = "all" | 1 | 2 | 3 | 4 | 5;

function formatAmount(n: number): string {
  return n.toLocaleString("ar-SA");
}

function FineCard({ item }: { item: FoodFineV2 }) {
  const [expanded, setExpanded] = useState(false);
  const sc = SECTION_COLORS[item.section];

  const fineLabel =
    item.fineType === "fixed"
      ? item.fineMin === item.fineMax
        ? `${formatAmount(item.fineMin)} ر.س`
        : `${formatAmount(item.fineMin)} – ${formatAmount(item.fineMax)} ر.س`
      : `${formatAmount(item.fineMin)} – ${formatAmount(item.fineMax)} ر.س`;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.88 : 1 }]}
      onPress={() => setExpanded((e) => !e)}
    >
      <View style={styles.cardTop}>
        <View style={styles.cardTopLeft}>
          <View style={[styles.codeBadge, { backgroundColor: sc.bg }]}>
            <Text style={[styles.codeText, { color: sc.text }]}>
              {item.articleCode}
            </Text>
          </View>
          {item.warningApplicable && (
            <View style={styles.warningBadge}>
              <Text style={styles.warningText}>إنذار</Text>
            </View>
          )}
        </View>
        <Text style={styles.violationText} numberOfLines={expanded ? undefined : 2}>
          {item.violation}
        </Text>
      </View>

      <View style={styles.cardMeta}>
        <Text style={styles.metaFine}>{fineLabel}</Text>
        <Text style={styles.metaDot}>·</Text>
        <Text style={styles.metaChapter} numberOfLines={1}>
          {item.chapterLabel.replace(/^الفصل [^:]+: /, "")}
        </Text>
      </View>

      {expanded && (
        <View style={styles.expandedBlock}>
          <View style={styles.expandedRow}>
            <Text style={styles.expandedLabel}>القسم</Text>
            <Text style={styles.expandedValue}>{item.sectionLabel}</Text>
          </View>
          <View style={styles.expandedRow}>
            <Text style={styles.expandedLabel}>الفصل</Text>
            <Text style={styles.expandedValue}>{item.chapterLabel}</Text>
          </View>
          <View style={styles.expandedRow}>
            <Text style={styles.expandedLabel}>وحدة الغرامة</Text>
            <Text style={styles.expandedValue}>{item.unit || "—"}</Text>
          </View>
          <View style={styles.expandedRow}>
            <Text style={styles.expandedLabel}>نوع العقوبة</Text>
            <Text style={styles.expandedValue}>
              {item.fineType === "fixed" ? "قيمة ثابتة" : "حد أدنى / أعلى"}
            </Text>
          </View>
          <View style={styles.expandedRow}>
            <Text style={styles.expandedLabel}>نطاق الغرامة</Text>
            <Text style={[styles.expandedValue, styles.fineValue]}>{fineLabel}</Text>
          </View>
        </View>
      )}
    </Pressable>
  );
}

export default function FoodFinesSearchScreen() {
  const [query, setQuery] = useState("");
  const [activeSection, setActiveSection] = useState<SectionFilter>("all");

  const q = query.trim();

  const filtered = useMemo(() => {
    return FOOD_FINES_V2.filter((item) => {
      const matchSection =
        activeSection === "all" || item.section === activeSection;
      if (!matchSection) return false;
      if (!q) return true;
      const ql = q.toLowerCase();
      return (
        item.violation.includes(q) ||
        item.articleCode.toLowerCase().includes(ql) ||
        item.chapterLabel.includes(q) ||
        item.sectionLabel.includes(q)
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

      <View style={styles.tabsRow}>
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

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {filtered.length} مخالفة
        </Text>
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
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  searchWrap: {
    padding: 14,
    paddingBottom: 8,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    textAlign: "right",
  },
  tabsRow: {
    paddingBottom: 6,
  },
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
  resultsHeader: {
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  resultsCount: {
    fontSize: 12,
    color: colors.light.mutedForeground,
    textAlign: "right",
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
  cardTopLeft: {
    flexShrink: 0,
    alignItems: "flex-end",
    gap: 5,
  },
  codeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  codeText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  warningBadge: {
    backgroundColor: "#fff3e0",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  warningText: {
    fontSize: 11,
    color: "#e65100",
    fontWeight: "600",
  },
  violationText: {
    flex: 1,
    fontSize: 14,
    color: colors.light.text,
    textAlign: "right",
    lineHeight: 21,
  },
  cardMeta: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
  },
  metaFine: {
    fontSize: 13,
    color: "#0e7c7c",
    fontWeight: "700",
  },
  metaDot: {
    fontSize: 13,
    color: colors.light.mutedForeground,
  },
  metaChapter: {
    flex: 1,
    fontSize: 12,
    color: colors.light.mutedForeground,
    textAlign: "right",
  },
  expandedBlock: {
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    paddingTop: 10,
    gap: 7,
  },
  expandedRow: {
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
  fineValue: {
    color: "#0e7c7c",
    fontWeight: "700",
  },
  empty: {
    paddingVertical: 60,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 15,
    color: colors.light.mutedForeground,
  },
});
