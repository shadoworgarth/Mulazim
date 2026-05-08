import { useRouter } from "expo-router";
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

const ALL_FIELDS: LabField[] = ["Food", "Cosmetics", "Feed", "Tobacco"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface MatchGroup {
  field: LabField;
  product: string;
  parameters: string[];
}

function getMatches(lab: PrivateLab, query: string, fieldFilter: LabField | null): MatchGroup[] {
  const q = query.trim().toLowerCase();
  const groups: Map<string, MatchGroup> = new Map();

  for (const test of lab.tests) {
    if (fieldFilter && test.field !== fieldFilter) continue;
    if (q && !test.parameter.toLowerCase().includes(q)) continue;

    const key = `${test.field}||${test.product}`;
    if (!groups.has(key)) {
      groups.set(key, { field: test.field, product: test.product, parameters: [] });
    }
    groups.get(key)!.parameters.push(test.parameter);
  }

  return Array.from(groups.values());
}

function labFields(lab: PrivateLab): LabField[] {
  return [...new Set(lab.tests.map((t) => t.field))] as LabField[];
}

// ─── Lab Card ─────────────────────────────────────────────────────────────────

const LabCard = React.memo(function LabCard({
  lab,
  query,
  fieldFilter,
  onNavigate,
}: {
  lab: PrivateLab;
  query: string;
  fieldFilter: LabField | null;
  onNavigate: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const matches = useMemo(() => getMatches(lab, query, fieldFilter), [lab, query, fieldFilter]);
  const fields = useMemo(() => labFields(lab), [lab]);

  const isSearching = query.trim().length > 0 || fieldFilter !== null;

  if (isSearching && matches.length === 0) return null;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.88 : 1 }]}
      onPress={() => isSearching ? setExpanded((v) => !v) : onNavigate(lab.id)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardBody}>
          <Text style={styles.labName}>{lab.name}</Text>
          <View style={styles.fieldPills}>
            {fields.map((f) => {
              const fc = FIELD_COLORS[f];
              return (
                <View key={f} style={[styles.fieldPill, { backgroundColor: fc.bg }]}>
                  <Text style={[styles.fieldPillText, { color: fc.text }]}>
                    {FIELD_LABELS[f]}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
        {isSearching && (
          <Text style={styles.expandArrow}>{expanded ? "▲" : "▼"}</Text>
        )}
      </View>

      {!isSearching && (
        <View style={styles.countRow}>
          {fields.map((f) => {
            const fc = FIELD_COLORS[f];
            const count = lab.tests.filter((t) => t.field === f).length;
            return (
              <View key={f} style={[styles.countPill, { backgroundColor: fc.badge }]}>
                <Text style={styles.countPillText}>{count} اختبار</Text>
                <Text style={styles.countPillField}>{FIELD_LABELS[f]}</Text>
              </View>
            );
          })}
        </View>
      )}

      {isSearching && (
        <View style={styles.matchSummary}>
          <Text style={styles.matchCount}>
            {matches.reduce((a, g) => a + g.parameters.length, 0)} اختبار مطابق
          </Text>
        </View>
      )}

      {isSearching && expanded && (
        <View style={styles.matchGroups}>
          {matches.map((grp, gi) => {
            const fc = FIELD_COLORS[grp.field];
            return (
              <View key={gi} style={styles.matchGroup}>
                <View style={styles.matchGroupHeader}>
                  <View style={[styles.fieldDot, { backgroundColor: fc.badge }]} />
                  <Text style={[styles.matchGroupField, { color: fc.text }]}>
                    {FIELD_LABELS[grp.field]}
                  </Text>
                  <Text style={styles.matchGroupProduct}>{grp.product}</Text>
                </View>
                {grp.parameters.map((p, pi) => (
                  <Text key={pi} style={styles.paramText}>• {p}</Text>
                ))}
              </View>
            );
          })}
        </View>
      )}
    </Pressable>
  );
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function PrivateLabsListScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [fieldFilter, setFieldFilter] = useState<LabField | null>(null);

  const isFiltering = query.trim().length > 0 || fieldFilter !== null;

  const visibleLabs = useMemo(() => {
    if (!isFiltering) return PRIVATE_LABS;
    return PRIVATE_LABS.filter((lab) => getMatches(lab, query, fieldFilter).length > 0);
  }, [query, fieldFilter, isFiltering]);

  const header = (
    <View>
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search parameter (e.g. Salmonella, Heavy metals…)"
          placeholderTextColor={colors.light.mutedForeground}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          returnKeyType="search"
          writingDirection="ltr"
          textAlign="left"
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        {ALL_FIELDS.map((f) => {
          const active = fieldFilter === f;
          const fc = FIELD_COLORS[f];
          return (
            <Pressable
              key={f}
              style={[styles.chip, { backgroundColor: active ? fc.badge : fc.bg, borderColor: fc.badge }]}
              onPress={() => setFieldFilter((p) => (p === f ? null : f))}
            >
              <Text style={[styles.chipText, { color: active ? "#fff" : fc.text }]}>
                {FIELD_LABELS[f]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {isFiltering ? (
        <View style={styles.filterRow}>
          <Pressable onPress={() => { setQuery(""); setFieldFilter(null); }}>
            <Text style={styles.clearText}>مسح ✕</Text>
          </Pressable>
          <Text style={styles.filterCount}>{visibleLabs.length} مختبر</Text>
        </View>
      ) : (
        <View style={styles.bannerWrap}>
          <Text style={styles.bannerText}>{PRIVATE_LABS.length} مختبر مُعيَّن</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={visibleLabs}
        keyExtractor={(l) => String(l.id)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={header}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={{ fontSize: 32 }}>🔬</Text>
            <Text style={styles.emptyText}>لا توجد مختبرات تُطابق البحث</Text>
          </View>
        }
        renderItem={({ item }) => (
          <LabCard
            lab={item}
            query={query}
            fieldFilter={fieldFilter}
            onNavigate={(id) =>
              router.push({ pathname: "/private-lab-detail", params: { id: String(id) } } as any)
            }
          />
        )}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.background },
  listContent: {
    padding: 16,
    paddingBottom: Platform.OS === "web" ? 40 : 28,
    gap: 10,
  },
  searchWrap: { marginBottom: 10 },
  searchInput: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    fontSize: 14,
    color: colors.light.text,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    writingDirection: "ltr",
    textAlign: "left",
  },
  chipsRow: { gap: 8, paddingBottom: 10, paddingRight: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 12, fontWeight: "600" },
  filterRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  filterCount: { fontSize: 12, color: "#6b7280", textAlign: "right" },
  clearText: { fontSize: 12, fontWeight: "600", color: ACCENT },
  bannerWrap: {
    backgroundColor: "#e0f2f1",
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 14,
    marginBottom: 4,
    alignItems: "flex-end",
  },
  bannerText: { fontSize: 13, fontWeight: "500", color: ACCENT },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
  },
  cardBody: { flex: 1, gap: 6, alignItems: "flex-end" },
  labName: { fontSize: 15, fontWeight: "700", color: colors.light.text, textAlign: "right" },
  fieldPills: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 5 },
  fieldPill: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  fieldPillText: { fontSize: 11, fontWeight: "600" },
  expandArrow: { fontSize: 11, color: "#9ca3af" },

  countRow: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 6,
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  countPill: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignItems: "center",
    gap: 2,
  },
  countPillText: { fontSize: 12, fontWeight: "700", color: "#fff" },
  countPillField: { fontSize: 10, color: "rgba(255,255,255,0.85)" },

  matchSummary: { paddingHorizontal: 14, paddingBottom: 10, alignItems: "flex-end" },
  matchCount: { fontSize: 12, color: ACCENT, fontWeight: "600" },

  matchGroups: {
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  matchGroup: { gap: 4 },
  matchGroupHeader: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  fieldDot: { width: 8, height: 8, borderRadius: 4 },
  matchGroupField: { fontSize: 11, fontWeight: "700" },
  matchGroupProduct: { fontSize: 11, color: "#6b7280", writingDirection: "ltr", flex: 1 },
  paramText: {
    fontSize: 12,
    color: colors.light.text,
    writingDirection: "ltr",
    textAlign: "left",
    paddingLeft: 14,
    lineHeight: 18,
  },

  emptyWrap: { alignItems: "center", paddingTop: 40, gap: 10 },
  emptyText: { fontSize: 14, color: colors.light.mutedForeground },
});
