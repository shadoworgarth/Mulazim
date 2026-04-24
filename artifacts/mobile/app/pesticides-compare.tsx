import React, { useDeferredValue, useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import colors from "@/constants/colors";
import { faoPesticides } from "@/constants/fao-codex";
import pesticides from "@/constants/pesticides";

const SFDA_SUBSTANCES = pesticides.sections.agriculture.substances;
const RESULT_LIMIT = 300;

interface CompareRow {
  key: string;
  pesticideName: string;
  sfdaEntries: { commodity: string; mrl: string }[];
  faoEntries: { commodity: string; mrl: string }[];
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function buildCompare(query: string): CompareRow[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  // Collect SFDA matches: map normalized substance name -> entries
  const sfdaMap = new Map<string, { name: string; entries: { commodity: string; mrl: string }[] }>();
  for (const sub of SFDA_SUBSTANCES) {
    const matched = sub.entries.filter((e) =>
      e.commodity.toLowerCase().includes(q),
    );
    if (matched.length > 0) {
      const key = normalize(sub.substance);
      sfdaMap.set(key, {
        name: sub.substance,
        entries: matched.map((e) => ({ commodity: e.commodity, mrl: e.mrl })),
      });
    }
  }

  // Collect FAO matches: map normalized pesticide name -> entries
  const faoMap = new Map<string, { name: string; entries: { commodity: string; mrl: string }[] }>();
  for (const p of faoPesticides) {
    const matched = p.mrls.filter((m) =>
      m.commodity.toLowerCase().includes(q),
    );
    if (matched.length > 0) {
      const key = normalize(p.name);
      faoMap.set(key, {
        name: p.name,
        entries: matched.map((m) => ({
          commodity: m.commodity,
          mrl: m.mrl ? `${m.mrl} mg/kg` : "—",
        })),
      });
    }
  }

  // Union of all normalized names
  const allKeys = new Set([...sfdaMap.keys(), ...faoMap.keys()]);
  const rows: CompareRow[] = [];

  for (const key of allKeys) {
    const sfda = sfdaMap.get(key);
    const fao = faoMap.get(key);
    rows.push({
      key,
      pesticideName: sfda?.name ?? fao?.name ?? key,
      sfdaEntries: sfda?.entries ?? [],
      faoEntries: fao?.entries ?? [],
    });
    if (rows.length >= RESULT_LIMIT) break;
  }

  // Sort: rows with both sources first, then SFDA-only, then FAO-only
  rows.sort((a, b) => {
    const aScore = (a.sfdaEntries.length > 0 ? 2 : 0) + (a.faoEntries.length > 0 ? 1 : 0);
    const bScore = (b.sfdaEntries.length > 0 ? 2 : 0) + (b.faoEntries.length > 0 ? 1 : 0);
    if (bScore !== aScore) return bScore - aScore;
    return a.pesticideName.localeCompare(b.pesticideName);
  });

  return rows;
}

export default function PesticidesCompareScreen() {
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query);
  const rows = useMemo(() => buildCompare(deferred), [deferred]);

  const bothCount = rows.filter((r) => r.sfdaEntries.length > 0 && r.faoEntries.length > 0).length;

  return (
    <FlatList
      data={rows}
      keyExtractor={(item) => item.key}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View>
          <View style={styles.titleCard}>
            <Text style={styles.titleText}>بحث مقارنة</Text>
            <Text style={styles.subtitleText}>
              مقارنة الحدود القصوى بين SFDA وFAO Codex لأي منتج غذائي
            </Text>
          </View>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#2e7d32" }]} />
              <Text style={styles.legendLabel}>SFDA.FD 382_2019</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#0d47a1" }]} />
              <Text style={styles.legendLabel}>FAO Codex</Text>
            </View>
          </View>
          <View style={styles.searchWrap}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="e.g. Tomato, Apple, Wheat, Rice…"
              placeholderTextColor="#9ca3af"
              style={styles.searchInput}
              textAlign="left"
              autoCorrect={false}
              autoCapitalize="none"
              autoFocus
            />
          </View>
          {deferred.trim() && rows.length > 0 ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryText}>
                {rows.length} مبيد · {bothCount} موجود في المصدرين
              </Text>
            </View>
          ) : deferred.trim() && rows.length === 0 ? null : !deferred.trim() ? (
            <Text style={styles.hintText}>
              اكتب اسم منتج غذائي بالإنجليزية لمقارنة الحدود القصوى بين المصدرين
            </Text>
          ) : null}
        </View>
      }
      ListEmptyComponent={
        deferred.trim() ? (
          <View style={styles.center}>
            <Text style={{ fontSize: 36 }}>🔍</Text>
            <Text style={styles.emptyText}>لا توجد نتائج مطابقة</Text>
          </View>
        ) : null
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.pesticideName}>{item.pesticideName}</Text>

          <View style={styles.columnsRow}>
            {/* SFDA column — green */}
            <View style={styles.column}>
              {item.sfdaEntries.length > 0 ? (
                item.sfdaEntries.map((e, i) => (
                  <View key={i} style={styles.sfdaBadge}>
                    <Text style={styles.sfdaMrl}>{e.mrl}</Text>
                    <Text style={styles.badgeCommodity} numberOfLines={2}>
                      {e.commodity}
                    </Text>
                  </View>
                ))
              ) : (
                <View style={styles.absentBadge}>
                  <Text style={styles.absentText}>—</Text>
                </View>
              )}
            </View>

            <View style={styles.divider} />

            {/* FAO column — blue */}
            <View style={styles.column}>
              {item.faoEntries.length > 0 ? (
                item.faoEntries.map((e, i) => (
                  <View key={i} style={styles.faoBadge}>
                    <Text style={styles.faoMrl}>{e.mrl}</Text>
                    <Text style={styles.badgeCommodity} numberOfLines={2}>
                      {e.commodity}
                    </Text>
                  </View>
                ))
              ) : (
                <View style={styles.absentBadge}>
                  <Text style={styles.absentText}>—</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
    paddingBottom: Platform.OS === "web" ? 34 : 24,
    gap: 10,
  },
  titleCard: {
    backgroundColor: "#37474f",
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  titleText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
    textAlign: "right",
  },
  subtitleText: {
    fontSize: 12,
    color: "#cfd8dc",
    textAlign: "right",
    marginTop: 4,
    lineHeight: 18,
  },
  legendRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    marginBottom: 10,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    fontSize: 11,
    color: colors.light.mutedForeground,
    fontWeight: "600",
  },
  searchWrap: {
    marginBottom: 6,
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
  },
  summaryRow: {
    alignItems: "flex-end",
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 11,
    color: colors.light.mutedForeground,
  },
  hintText: {
    fontSize: 12,
    color: colors.light.mutedForeground,
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingTop: 40,
  },
  emptyText: {
    fontSize: 14,
    color: colors.light.mutedForeground,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    gap: 10,
  },
  pesticideName: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.light.text,
    textAlign: "left",
  },
  columnsRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
  },
  column: {
    flex: 1,
    gap: 6,
  },
  divider: {
    width: 1,
    backgroundColor: "#e5e7eb",
    alignSelf: "stretch",
  },
  sfdaBadge: {
    backgroundColor: "#e8f5e9",
    borderRadius: 8,
    padding: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#2e7d32",
  },
  sfdaMrl: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1b5e20",
  },
  faoBadge: {
    backgroundColor: "#e3f2fd",
    borderRadius: 8,
    padding: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#0d47a1",
  },
  faoMrl: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0d47a1",
  },
  badgeCommodity: {
    fontSize: 10,
    color: colors.light.mutedForeground,
    marginTop: 2,
    lineHeight: 14,
  },
  absentBadge: {
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
  },
  absentText: {
    fontSize: 14,
    color: "#9ca3af",
  },
});
