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
import * as WebBrowser from "expo-web-browser";

import colors from "@/constants/colors";
import { CIRCULARS, CIRCULARS_SNAPSHOT_DATE, CircularEntry } from "@/constants/circulars";

const ACCENT = "#0e7c7c";

// ─── Category colours ──────────────────────────────────────────────────────

const CAT_COLOR: Record<string, { bg: string; text: string; badge: string }> = {
  "الغذاء": { bg: "#e8f5e9", text: "#1b5e20", badge: "#2e7d32" },
  "الدواء": { bg: "#e3f2fd", text: "#0d47a1", badge: "#1565c0" },
  "مستحضرات التجميل": { bg: "#fce4ec", text: "#ad1457", badge: "#c2185b" },
  "أجهزة طبية": { bg: "#ede7f6", text: "#4527a0", badge: "#5e35b1" },
  "الهيئة": { bg: "#eceff1", text: "#37474f", badge: "#546e7a" },
  "حلال": { bg: "#fff3e0", text: "#e65100", badge: "#f57c00" },
  "المبيدات": { bg: "#f1f8e9", text: "#33691e", badge: "#558b2f" },
  "مختبرات": { bg: "#e0f7fa", text: "#00695c", badge: "#00897b" },
  "أعلاف": { bg: "#fff8e1", text: "#ff6f00", badge: "#ffa000" },
  "تبغ": { bg: "#efebe9", text: "#3e2723", badge: "#5d4037" },
  "التغذية": { bg: "#e1f5fe", text: "#01579b", badge: "#0277bd" },
};

const DEFAULT_COLOR = { bg: "#e0eef0", text: "#0a5f5f", badge: ACCENT };

function catColor(cat: string) {
  const firstTag = cat.split(",")[0]?.trim();
  return CAT_COLOR[firstTag] ?? CAT_COLOR[cat.trim()] ?? DEFAULT_COLOR;
}

// ─── Category order (matches sfda.gov.sa/ar/circulars filter order) ────────

const CATEGORY_ORDER = [
  "الهيئة",
  "الغذاء",
  "الدواء",
  "أجهزة طبية",
  "أعلاف",
  "تبغ",
  "المبيدات",
  "مختبرات",
  "مستحضرات التجميل",
  "حلال",
  "التغذية",
];

const ALL_CAT = "الكل";

const COLLAPSED_CAT_COUNT = 2;

function entryCategories(c: CircularEntry): string[] {
  return c.category.split(",").map((s) => s.trim());
}

function matchesCategory(c: CircularEntry, cat: string | null): boolean {
  if (!cat) return true;
  return entryCategories(c).includes(cat);
}

function matches(c: CircularEntry, q: string): boolean {
  return c.title.includes(q) || c.category.includes(q);
}

// ─── Card ───────────────────────────────────────────────────────────────────

const CircularCard = React.memo(function CircularCard({ entry }: { entry: CircularEntry }) {
  const cc = catColor(entry.category);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.88 : 1 }]}
      onPress={() => WebBrowser.openBrowserAsync(entry.pdfUrl || entry.url)}
    >
      <View style={styles.cardTopRow}>
        <Text style={styles.dateText}>{entry.date}</Text>
        <View style={[styles.catPill, { backgroundColor: cc.bg }]}>
          <Text style={[styles.catPillText, { color: cc.text }]} numberOfLines={1}>
            {entry.category}
          </Text>
        </View>
      </View>
      <Text style={styles.titleText}>{entry.title}</Text>
      <View style={styles.viewRow}>
        <Text style={[styles.viewText, { color: cc.badge }]}>عرض التعميم (PDF) ←</Text>
      </View>
    </Pressable>
  );
});

// ─── Screen ─────────────────────────────────────────────────────────────────

export default function CircularsScreen() {
  const [query, setQuery] = useState("");
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [showAllCats, setShowAllCats] = useState(false);

  const visibleCats = showAllCats
    ? CATEGORY_ORDER
    : CATEGORY_ORDER.slice(0, COLLAPSED_CAT_COUNT);

  const filtered = useMemo(() => {
    const q = query.trim();
    return CIRCULARS.filter((c) => {
      const matchesCat = matchesCategory(c, selectedCat);
      const matchesText = !q || matches(c, q);
      return matchesCat && matchesText;
    });
  }, [query, selectedCat]);

  const isFiltering = query.trim().length > 0 || selectedCat !== null;

  const header = (
    <View>
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder="ابحث في عنوان التعميم..."
          placeholderTextColor={colors.light.mutedForeground}
          value={query}
          onChangeText={setQuery}
          textAlign="right"
          returnKeyType="search"
        />
      </View>

      <View style={styles.chipsWrap}>
        <Pressable
          style={[
            styles.chip,
            {
              backgroundColor: !selectedCat ? ACCENT : DEFAULT_COLOR.bg,
              borderColor: ACCENT,
            },
          ]}
          onPress={() => setSelectedCat(null)}
        >
          <Text
            style={[styles.chipText, { color: !selectedCat ? "#fff" : DEFAULT_COLOR.text }]}
            numberOfLines={1}
          >
            {ALL_CAT}
          </Text>
        </Pressable>

        {visibleCats.map((cat) => {
          const active = selectedCat === cat;
          const cc = catColor(cat);
          return (
            <Pressable
              key={cat}
              style={[
                styles.chip,
                { backgroundColor: active ? cc.badge : cc.bg, borderColor: cc.badge },
              ]}
              onPress={() => setSelectedCat((p) => (p === cat ? null : cat))}
            >
              <Text
                style={[styles.chipText, { color: active ? "#fff" : cc.text }]}
                numberOfLines={1}
              >
                {cat}
              </Text>
            </Pressable>
          );
        })}

        <Pressable
          style={styles.showAllChip}
          onPress={() => setShowAllCats((p) => !p)}
        >
          <Text style={styles.showAllChipText}>
            {showAllCats ? "إخفاء ▲" : "عرض الكل ▾"}
          </Text>
        </Pressable>
      </View>

      {isFiltering ? (
        <View style={styles.filterRow}>
          <Pressable onPress={() => { setQuery(""); setSelectedCat(null); }}>
            <Text style={styles.clearText}>مسح ✕</Text>
          </Pressable>
          <Text style={styles.filterCount}>{filtered.length} نتيجة</Text>
        </View>
      ) : (
        <View style={styles.bannerWrap}>
          <Text style={styles.bannerText}>
            {CIRCULARS.length} تعميم · آخر تحديث للقائمة {CIRCULARS_SNAPSHOT_DATE}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filtered}
        keyExtractor={(c) => String(c.id)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={header}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={{ fontSize: 32 }}>🔍</Text>
            <Text style={styles.emptyText}>لا توجد نتائج مطابقة</Text>
          </View>
        }
        renderItem={({ item }) => <CircularCard entry={item} />}
      />
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.background },
  listContent: {
    padding: 16,
    paddingBottom: Platform.OS === "web" ? 40 : 28,
    gap: 8,
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
  },
  chipsWrap: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 8,
    paddingBottom: 10,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    maxWidth: 220,
  },
  chipText: { fontSize: 12, fontWeight: "600" },
  showAllChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#f3f4f6",
  },
  showAllChipText: { fontSize: 12, fontWeight: "600", color: "#4b5563" },
  filterRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  filterCount: { fontSize: 12, color: "#6b7280", textAlign: "right" },
  clearText: { fontSize: 12, fontWeight: "600", color: ACCENT },
  bannerWrap: {
    backgroundColor: "#e0eef0",
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 14,
    marginBottom: 4,
    alignItems: "flex-end",
  },
  bannerText: { fontSize: 13, fontWeight: "500", color: "#0a5f5f" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateText: { fontSize: 12, color: "#9ca3af" },
  catPill: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    maxWidth: "70%",
  },
  catPillText: { fontSize: 11, fontWeight: "600" },
  titleText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.light.text,
    textAlign: "right",
    lineHeight: 22,
  },
  viewRow: { alignItems: "flex-end" },
  viewText: { fontSize: 12, fontWeight: "700" },
  emptyWrap: { alignItems: "center", paddingTop: 40, gap: 10 },
  emptyText: { fontSize: 14, color: colors.light.mutedForeground },
});
