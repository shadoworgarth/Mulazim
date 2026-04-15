import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import appData from "@/constants/data";
import colors from "@/constants/colors";
import generalAdditives from "@/assets/general-additives.json";
import comprehensiveAdditives from "@/assets/comprehensive-additives.json";


type AdditiveEntry = { ins: string; name: string };
type Badge = AdditiveEntry;
type VerifyResult = Badge & { permitted: boolean; reason: string };

// Valid INS number: starts with a digit (filters out Arabic header/section rows in table2)
const isValidIns = (ins: string) => /^\d/.test(String(ins));

// Full autocomplete database — all 406 entries from every item + general additives
const GA_DB: AdditiveEntry[] = comprehensiveAdditives as AdditiveEntry[];

// General-additives-only set used for the "item allows general additives" verification check
const GA_GENERAL_SET = new Set<string>([
  ...(generalAdditives as any).table1.rows
    .filter((r: any) => isValidIns(r.ins))
    .map((r: any) => String(r.ins).toLowerCase()),
  ...(generalAdditives as any).table2.rows
    .filter((r: any) => isValidIns(r.ins) && r.color)
    .map((r: any) => String(r.ins).toLowerCase()),
]);

function buildPermittedMap(additives: string[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const line of additives) {
    const ranges = [...line.matchAll(/(\d{3,4})\s*[-–]\s*(\d{3,4})/g)];
    for (const m of ranges) {
      const from = parseInt(m[1]), to = parseInt(m[2]);
      for (let n = from; n <= to; n++) {
        if (!map.has(String(n))) map.set(String(n), line);
      }
    }
    // Codes with letter suffix e.g. 160a, 150c → stored as "160a", "150c"
    const withSuffix = [...line.matchAll(/\b(\d{3,4}[a-z])(?:\([ivx]+\))?/gi)];
    for (const m of withSuffix) {
      const key = m[1].toLowerCase();
      if (!map.has(key)) map.set(key, line);
    }
    // Plain numbers not followed by a letter
    const nums = [...line.matchAll(/\b(\d{3,4})\b(?![a-z])/gi)];
    for (const m of nums) {
      if (!map.has(m[1])) map.set(m[1], line);
    }
  }
  return map;
}


function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoValue}>{value || "—"}</Text>
      <View style={styles.infoLabelWrap}>
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
    </View>
  );
}

// ── Checker component ────────────────────────────────────────────────────────

function AdditiveChecker({
  additives,
  itemAllowsGeneral,
}: {
  additives: string[];
  itemAllowsGeneral: boolean;
}) {
  const [query, setQuery] = useState("");
  const [badges, setBadges] = useState<Badge[]>([]);
  const [results, setResults] = useState<VerifyResult[] | null>(null);

  const trimmed = query.trim().toLowerCase();

  const suggestions = useMemo<AdditiveEntry[]>(() => {
    if (trimmed.length < 1) return [];
    const q = trimmed.replace(/^e/, "");
    const available = GA_DB.filter(a => !badges.some(b => b.ins === a.ins));
    const exact    = available.filter(a => a.ins === q);
    const starts   = available.filter(a => a.ins !== q && a.ins.startsWith(q));
    const contains = available.filter(a => !a.ins.startsWith(q) && (a.ins.includes(q) || a.name.toLowerCase().includes(q)));
    return [...exact, ...starts, ...contains].slice(0, 6);
  }, [trimmed, badges]);

  function addBadge(entry: AdditiveEntry) {
    setBadges(prev => [...prev, entry]);
    setQuery("");
    setResults(null);
  }

  function removeBadge(ins: string) {
    setBadges(prev => prev.filter(b => b.ins !== ins));
    setResults(null);
  }

  function handleVerify() {
    const permMap = buildPermittedMap(additives);
    const res: VerifyResult[] = badges.map(badge => {
      const key = badge.ins.replace(/[a-z]$/, "");
      const inItem = permMap.has(badge.ins) || permMap.has(key);
      const inGeneral = itemAllowsGeneral && (GA_GENERAL_SET.has(badge.ins) || GA_GENERAL_SET.has(key));
      const permitted = inItem || inGeneral;
      const reason = inItem
        ? permMap.get(badge.ins) || permMap.get(key) || ""
        : inGeneral ? "مضاف عام مسموح به (GMP)" : "";
      return { ...badge, permitted, reason };
    });
    setResults(res);
  }

  function handleReset() {
    setBadges([]);
    setQuery("");
    setResults(null);
  }

  return (
    <View style={styles.checkerWrap}>
      {/* Hint */}
      <Text style={styles.checkerHint}>
        ابحث عن رقم المادة المضافة أو اسمها وأضفها، ثم اضغط تحقق
      </Text>

      {/* Badges */}
      {badges.length > 0 && (
        <View style={styles.badgesRow}>
          {badges.map(b => (
            <Pressable
              key={b.ins}
              style={({ pressed }) => [styles.badge, pressed && { opacity: 0.7 }]}
              onPress={() => removeBadge(b.ins)}
            >
              <Text style={styles.badgeText}>E{b.ins.toUpperCase()}</Text>
              <Feather name="x" size={12} color="#0e7c7c" />
            </Pressable>
          ))}
        </View>
      )}

      {/* Search input */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={t => { setQuery(t); setResults(null); }}
          placeholder="مثال: 440 أو pectins"
          placeholderTextColor="#aaa"
          textAlign="right"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        <Feather name="search" size={18} color="#999" style={styles.searchIcon} />
      </View>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <View style={styles.suggestionsWrap}>
          {suggestions.map((s, i) => (
            <View
              key={s.ins}
              style={[styles.suggestionRow, i < suggestions.length - 1 && styles.suggestionDivider]}
            >
              <Pressable
                style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.7 }]}
                onPress={() => addBadge(s)}
              >
                <Feather name="plus" size={16} color="#fff" />
              </Pressable>
              <View style={styles.suggestionText}>
                <Text style={styles.suggestionName} numberOfLines={1}>{s.name}</Text>
                <Text style={styles.suggestionIns}>E{s.ins.toUpperCase()}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Action buttons */}
      {badges.length > 0 && (
        <View style={styles.actionRow}>
          <Pressable
            style={({ pressed }) => [styles.resetBtn, pressed && { opacity: 0.7 }]}
            onPress={handleReset}
          >
            <Text style={styles.resetBtnText}>مسح الكل</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.verifyBtn, pressed && { opacity: 0.8 }]}
            onPress={handleVerify}
          >
            <Feather name="check-circle" size={16} color="#fff" />
            <Text style={styles.verifyBtnText}>تحقق ({badges.length})</Text>
          </Pressable>
        </View>
      )}

      {/* Results */}
      {results && results.length > 0 && (
        <View style={styles.resultsWrap}>
          <Text style={styles.resultsTitle}>نتائج التحقق</Text>
          {results.map((r, i) => (
            <View
              key={i}
              style={[styles.resultRow, r.permitted ? styles.resultGreen : styles.resultRed]}
            >
              <View style={styles.resultLeft}>
                <Feather
                  name={r.permitted ? "check-circle" : "x-circle"}
                  size={20}
                  color={r.permitted ? "#1a7a4a" : "#b91c1c"}
                />
                <Text style={[styles.resultStatus, r.permitted ? styles.statusGreen : styles.statusRed]}>
                  {r.permitted ? "مسموح" : "غير مسموح"}
                </Text>
              </View>
              <View style={styles.resultRight}>
                <Text style={styles.resultCode}>E{r.ins.toUpperCase()} — {r.name}</Text>
                {r.reason ? (
                  <Text style={styles.resultReason} numberOfLines={2}>{r.reason}</Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ── Main screen ──────────────────────────────────────────────────────────────

export default function DetailScreen() {
  const { categoryIndex, itemIndex } = useLocalSearchParams<{
    categoryIndex: string;
    itemIndex: string;
  }>();
  const navigation = useNavigation();
  const router = useRouter();

  const catIdx = parseInt(categoryIndex ?? "0", 10);
  const itemIdx = parseInt(itemIndex ?? "0", 10);
  const category = appData[catIdx];
  const item = category?.subItems[itemIdx];
  useEffect(() => {
    if (item) navigation.setOptions({ title: item.name.trim().slice(0, 30) });
  }, [item, navigation]);

  if (!item || !item.data) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>لا تتوفر بيانات لهذا الصنف</Text>
      </View>
    );
  }

  const { row1, row2 } = item.data;
  const additives = row2.D
    ? row2.D.split(/[\r\n]+/).map((s: string) => s.trim()).filter(Boolean)
    : [];

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { paddingBottom: Platform.OS === "web" ? 34 : 24 },
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Name Banner */}
      <View style={styles.nameBanner}>
        <Text style={styles.itemName}>{item.name.trim()}</Text>
        {row2.A ? (
          <View style={styles.codeBadge}>
            <Text style={styles.codeBadgeText}>{row2.A}</Text>
          </View>
        ) : null}
      </View>

      {/* Additive Checker */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>التحقق من المواد المضافة</Text>
        <View style={styles.card}>
          <AdditiveChecker
            additives={additives}
            itemAllowsGeneral={row2.C === "نعم"}
          />
        </View>
      </View>

      {/* Basic Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>المعلومات الأساسية</Text>
        <View style={styles.card}>
          {row1.B && row2.B ? (
            <>
              <InfoRow label={row1.B} value={row2.B} />
              <View style={styles.divider} />
            </>
          ) : null}
          {row1.C ? (
            <Pressable
              style={({ pressed }) => [
                styles.infoRow,
                row2.C === "نعم" && styles.infoRowGreen,
                row2.C === "لا" && styles.infoRowRed,
                row2.C === "نعم" && pressed && { opacity: 0.75 },
              ]}
              onPress={() => row2.C === "نعم" && router.push("/general-additives")}
            >
              <View style={styles.infoValueRow}>
                <Text style={[
                  styles.infoValue,
                  (row2.C === "نعم" || row2.C === "لا") && styles.infoValueBold,
                  row2.C === "نعم" && styles.infoValueLink,
                ]}>
                  {row2.C || "—"}
                </Text>
                {row2.C === "نعم" && (
                  <Feather name="external-link" size={14} color="#0e7c7c" style={{ marginTop: 2 }} />
                )}
              </View>
              <View style={styles.infoLabelWrap}>
                <Text style={styles.infoLabel}>{row1.C}</Text>
              </View>
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Additives */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{row1.D || "المواد المضافة المسموح بها"}</Text>
        {additives.length > 0 ? (
          <View style={styles.card}>
            {additives.map((additive: string, i: number) => (
              <View key={i} style={[styles.additiveRow, i < additives.length - 1 && styles.additiveDivider]}>
                <View style={styles.additiveDot} />
                <Text style={styles.additiveText}>{additive}</Text>
              </View>
            ))}
          </View>
        ) : row2.D ? (
          <View style={styles.card}>
            <Text style={styles.noAddText}>{row2.D}</Text>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.noAddText}>لا توجد مضافات مسجلة</Text>
          </View>
        )}
      </View>

      {/* Category */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>التصنيف الرئيسي</Text>
        <View style={styles.card}>
          <Text style={styles.categoryText}>{category.name.trim()}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  errorText: { fontSize: 16, color: colors.light.mutedForeground, textAlign: "center" },
  container: { padding: 16, gap: 16 },
  nameBanner: {
    backgroundColor: "#0e7c7c", borderRadius: 16, padding: 18, gap: 10, alignItems: "flex-end",
  },
  itemName: { fontSize: 18, fontWeight: "700", color: "#ffffff", textAlign: "right", lineHeight: 28 },
  codeBadge: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  codeBadgeText: { fontSize: 13, fontWeight: "600", color: "#ffffff" },
  section: { gap: 8 },
  sectionTitle: {
    fontSize: 12, fontWeight: "600", color: colors.light.mutedForeground,
    textAlign: "right", letterSpacing: 0.3, paddingHorizontal: 4, textTransform: "uppercase",
  },
  card: {
    backgroundColor: "#ffffff", borderRadius: 14, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  divider: { height: 1, backgroundColor: colors.light.border, marginHorizontal: 14 },
  infoRow: { flexDirection: "row", alignItems: "flex-start", padding: 14, gap: 12 },
  infoRowGreen: { backgroundColor: "#f0faf5" },
  infoRowRed: { backgroundColor: "#fff5f5" },
  infoLabelWrap: { flexShrink: 0, maxWidth: 160 },
  infoLabel: {
    fontSize: 12, fontWeight: "500", color: "#0e7c7c", textAlign: "right",
    backgroundColor: "#e0f4f4", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  infoValueRow: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 6 },
  infoValue: { fontSize: 14, color: colors.light.text, textAlign: "right", lineHeight: 20 },
  infoValueBold: { fontWeight: "700", fontSize: 15 },
  infoValueLink: { color: "#0e7c7c", textDecorationLine: "underline" },
  additiveRow: { flexDirection: "row", alignItems: "flex-start", paddingHorizontal: 14, paddingVertical: 10, gap: 10 },
  additiveDivider: { borderBottomWidth: 1, borderBottomColor: colors.light.border },
  additiveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#0e7c7c", marginTop: 6, flexShrink: 0 },
  additiveText: { flex: 1, fontSize: 13, color: colors.light.text, textAlign: "right", lineHeight: 20 },
  noAddText: { fontSize: 14, color: colors.light.mutedForeground, textAlign: "right", padding: 14, lineHeight: 22 },
  categoryText: { fontSize: 14, color: colors.light.text, textAlign: "right", padding: 14, lineHeight: 22 },

  // Checker
  checkerWrap: { padding: 14, gap: 12 },
  checkerHint: { fontSize: 13, color: colors.light.mutedForeground, textAlign: "right", lineHeight: 20 },
  badgesRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "flex-end" },
  badge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "#e0f4f4", borderRadius: 20,
    paddingVertical: 5, paddingHorizontal: 10,
    borderWidth: 1, borderColor: "#b2e0e0",
  },
  badgeText: { fontSize: 13, fontWeight: "700", color: "#0e7c7c" },
  searchRow: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderColor: colors.light.border, borderRadius: 10, overflow: "hidden",
  },
  searchInput: {
    flex: 1, padding: 11, fontSize: 15, color: colors.light.text,
  },
  searchIcon: { paddingHorizontal: 10 },
  suggestionsWrap: {
    borderWidth: 1, borderColor: colors.light.border, borderRadius: 10, overflow: "hidden",
  },
  suggestionRow: {
    flexDirection: "row", alignItems: "center", padding: 10, gap: 10,
    backgroundColor: "#fafafa",
  },
  suggestionDivider: { borderBottomWidth: 1, borderBottomColor: colors.light.border },
  addBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: "#0e7c7c", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  suggestionText: { flex: 1, alignItems: "flex-end", gap: 1 },
  suggestionName: { fontSize: 13, color: colors.light.text, textAlign: "right" },
  suggestionIns: { fontSize: 11, color: colors.light.mutedForeground, fontWeight: "600" },
  actionRow: { flexDirection: "row", gap: 10, justifyContent: "flex-end" },
  resetBtn: {
    borderWidth: 1, borderColor: colors.light.border, borderRadius: 10,
    paddingVertical: 10, paddingHorizontal: 16,
  },
  resetBtnText: { fontSize: 14, color: colors.light.mutedForeground },
  verifyBtn: {
    backgroundColor: "#0e7c7c", borderRadius: 10,
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingVertical: 10, paddingHorizontal: 20,
  },
  verifyBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  resultsWrap: { gap: 8 },
  resultsTitle: { fontSize: 13, fontWeight: "700", color: colors.light.text, textAlign: "right" },
  resultRow: {
    borderRadius: 10, padding: 12,
    flexDirection: "row", alignItems: "center", gap: 10,
    borderWidth: 1,
  },
  resultGreen: { backgroundColor: "#f0faf5", borderColor: "#bbf0d9" },
  resultRed: { backgroundColor: "#fff5f5", borderColor: "#fecaca" },
  resultLeft: { flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 0 },
  resultStatus: { fontSize: 13, fontWeight: "700" },
  statusGreen: { color: "#1a7a4a" },
  statusRed: { color: "#b91c1c" },
  resultRight: { flex: 1, alignItems: "flex-end", gap: 2 },
  resultCode: { fontSize: 13, fontWeight: "700", color: colors.light.text, textAlign: "right" },
  resultReason: { fontSize: 11, color: colors.light.mutedForeground, textAlign: "right", lineHeight: 16 },
});
