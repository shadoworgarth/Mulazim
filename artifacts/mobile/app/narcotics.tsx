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
import { NARCOTICS, NarcoticEntry } from "@/constants/narcotics";

const ACCENT = "#6a1b9a";

// ─── Category colours ──────────────────────────────────────────────────────────

const CAT_COLOR: Record<string, { bg: string; text: string; badge: string }> = {
  "فئة (أ) من الجدول الأول":     { bg: "#fce4ec", text: "#b71c1c", badge: "#c62828" },
  "فئة (ب) من الجدول الأول":     { bg: "#fce4ec", text: "#c62828", badge: "#e53935" },
  "فئة (ه) من الجدول الأول":     { bg: "#fce4ec", text: "#d32f2f", badge: "#ef5350" },
  "فئة (د) من الجدول  الأول":    { bg: "#fce4ec", text: "#c62828", badge: "#e53935" },
  "فئة (د) من الجدول الأول":     { bg: "#fce4ec", text: "#c62828", badge: "#e53935" },
  "فئة (أ) من الجدول الثاني":    { bg: "#fff3e0", text: "#bf360c", badge: "#e64a19" },
  "فئة (ب) من الجدول الثاني":    { bg: "#fff3e0", text: "#e65100", badge: "#f4511e" },
  "فئة (جـ) من الجدول الثاني":   { bg: "#fff3e0", text: "#f57c00", badge: "#fb8c00" },
  "فئة (د) من الجدول الثاني":    { bg: "#fff8e1", text: "#f9a825", badge: "#fbc02d" },
  "فئة (ه) من الجدول الثاني":    { bg: "#fff8e1", text: "#f57f17", badge: "#f9a825" },
  "خاضع للرقابة وفق احكام وشروط خاصة": { bg: "#e3f2fd", text: "#0d47a1", badge: "#1565c0" },
  "خاضع لرقابة وفق احكام وشروط خاصة":  { bg: "#e3f2fd", text: "#0d47a1", badge: "#1565c0" },
  "الجدول الرابع بذور ونباتات":  { bg: "#e8f5e9", text: "#1b5e20", badge: "#2e7d32" },
};

const DEFAULT_COLOR = { bg: "#f3e5f5", text: "#4a148c", badge: "#6a1b9a" };

function catColor(cat: string | undefined) {
  if (!cat) return DEFAULT_COLOR;
  return CAT_COLOR[cat.trim()] ?? DEFAULT_COLOR;
}

// ─── Unique categories in order ───────────────────────────────────────────────

const ALL_CATS = Array.from(new Set(NARCOTICS.map((e) => e.category).filter(Boolean))) as string[];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function noteLines(e: NarcoticEntry): { label: string; value: string; isLatin: boolean }[] {
  const notes: { label: string; value: string; isLatin: boolean }[] = [];
  if (e.mainNameType !== "scientific" && e.scientific)
    notes.push({ label: "الاسم العلمي", value: e.scientific, isLatin: true });
  if (e.mainNameType !== "common" && e.common)
    notes.push({ label: "الاسم الشائع", value: e.common, isLatin: true });
  if (e.mainNameType !== "arabic" && e.arabic)
    notes.push({ label: "الاسم العربي", value: e.arabic, isLatin: false });
  if (e.mainNameType !== "chemical" && e.chemical)
    notes.push({ label: "الاسم الكيميائي", value: e.chemical, isLatin: true });
  return notes;
}

function matches(e: NarcoticEntry, q: string): boolean {
  const s = q.toLowerCase();
  return (
    (e.mainName?.toLowerCase().includes(s) ?? false) ||
    (e.scientific?.toLowerCase().includes(s) ?? false) ||
    (e.common?.toLowerCase().includes(s) ?? false) ||
    (e.arabic?.includes(q) ?? false) ||
    (e.chemical?.toLowerCase().includes(s) ?? false)
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

const NarcoticCard = React.memo(function NarcoticCard({
  entry,
  index,
}: {
  entry: NarcoticEntry;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const cc = catColor(entry.category);
  const notes = noteLines(entry);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.88 : 1 }]}
      onPress={() => setExpanded((v) => !v)}
    >
      <View style={styles.cardRow}>
        <View style={[styles.badge, { backgroundColor: cc.badge }]}>
          <Text style={styles.badgeText}>{index + 1}</Text>
        </View>

        <View style={styles.cardBody}>
          <Text style={[styles.mainName, entry.mainNameType !== "arabic" && styles.mainNameLatin]}>
            {entry.mainName}
          </Text>
          <View style={[styles.catPill, { backgroundColor: cc.bg }]}>
            <Text style={[styles.catPillText, { color: cc.text }]} numberOfLines={1}>
              {entry.category}
            </Text>
          </View>
        </View>

        {notes.length > 0 && (
          <Text style={styles.expandArrow}>{expanded ? "▲" : "▼"}</Text>
        )}
      </View>

      {expanded && notes.length > 0 && (
        <View style={styles.notesBlock}>
          {notes.map((n, i) => (
            <View key={i} style={styles.noteRow}>
              <Text style={styles.noteLabel}>{n.label}: </Text>
              <Text
                style={[styles.noteValue, n.isLatin ? styles.noteValueLatin : styles.noteValueArabic]}
                numberOfLines={4}
              >
                {n.value}
              </Text>
            </View>
          ))}
        </View>
      )}
    </Pressable>
  );
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function NarcoticsScreen() {
  const [query, setQuery] = useState("");
  const [selectedCat, setSelectedCat] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim();
    return NARCOTICS.filter((e) => {
      const matchesCat = !selectedCat || e.category?.trim() === selectedCat.trim();
      const matchesText = !q || matches(e, q);
      return matchesCat && matchesText;
    });
  }, [query, selectedCat]);

  const isFiltering = query.trim().length > 0 || selectedCat !== null;

  const header = (
    <View>
      {/* Search */}
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder="ابحث بالاسم العلمي أو العربي أو الكيميائي..."
          placeholderTextColor={colors.light.mutedForeground}
          value={query}
          onChangeText={setQuery}
          textAlign="right"
          returnKeyType="search"
        />
      </View>

      {/* Category chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        {ALL_CATS.map((cat) => {
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
      </ScrollView>

      {/* Filter summary */}
      {isFiltering ? (
        <View style={styles.filterRow}>
          <Pressable onPress={() => { setQuery(""); setSelectedCat(null); }}>
            <Text style={styles.clearText}>مسح ✕</Text>
          </Pressable>
          <Text style={styles.filterCount}>{filtered.length} نتيجة</Text>
        </View>
      ) : (
        <View style={styles.bannerWrap}>
          <Text style={styles.bannerText}>{NARCOTICS.length} مادة مسجّلة</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filtered}
        keyExtractor={(e) => String(e.id)}
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
        renderItem={({ item, index }) => (
          <NarcoticCard entry={item} index={filtered.indexOf(item)} />
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
  chipsRow: { gap: 8, paddingBottom: 10, paddingRight: 4 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    maxWidth: 220,
  },
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
    backgroundColor: "#f3e5f5",
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
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
  },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  badgeText: { fontSize: 12, fontWeight: "700", color: "#fff" },
  cardBody: { flex: 1, gap: 5, alignItems: "flex-end" },
  mainName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.light.text,
    textAlign: "right",
    lineHeight: 22,
  },
  mainNameLatin: {
    writingDirection: "ltr",
    textAlign: "left",
  },
  catPill: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: "flex-end",
  },
  catPillText: { fontSize: 11, fontWeight: "600" },
  expandArrow: { fontSize: 11, color: "#9ca3af", paddingLeft: 4 },
  notesBlock: {
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
  },
  noteRow: {
    gap: 2,
    alignItems: "flex-end",
  },
  noteLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6b7280",
    textAlign: "right",
    alignSelf: "flex-end",
  },
  noteValue: {
    fontSize: 12,
    color: colors.light.text,
    lineHeight: 19,
    alignSelf: "stretch",
  },
  noteValueLatin: {
    writingDirection: "ltr",
    textAlign: "left",
  },
  noteValueArabic: {
    writingDirection: "rtl",
    textAlign: "right",
  },
  emptyWrap: { alignItems: "center", paddingTop: 40, gap: 10 },
  emptyText: { fontSize: 14, color: colors.light.mutedForeground },
});
