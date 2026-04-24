import React, { useEffect, useDeferredValue, useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import colors from "@/constants/colors";
import { faoPesticides } from "@/constants/fao-codex";
import pesticides from "@/constants/pesticides";

const SFDA_SUBSTANCES = pesticides.sections.agriculture.substances;
const SFDA_DATES = pesticides.sections.dates.items;
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

function normCommodity(c: string): string {
  return c.toLowerCase().trim();
}

/** Collect all unique commodity names (from both SFDA and FAO) that match query */
function getMatchingCommodities(query: string): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const map = new Map<string, string>(); // normKey -> display name
  const add = (c: string) => {
    const k = normCommodity(c);
    if (!map.has(k)) map.set(k, c);
  };

  for (const sub of SFDA_SUBSTANCES) {
    for (const e of sub.entries) {
      if (e.commodity.toLowerCase().includes(q)) add(e.commodity);
    }
  }

  if ("dates".includes(q) || q.includes("date")) {
    add("Dates (Date Palm)");
  }

  for (const p of faoPesticides) {
    for (const m of p.mrls) {
      if (m.commodity.toLowerCase().includes(q)) add(m.commodity);
    }
  }

  return [...map.values()].sort((a, b) => a.localeCompare(b));
}

/** Build comparison rows filtered to an exact selected commodity */
function buildCompare(selectedCommodity: string): CompareRow[] {
  const sel = normCommodity(selectedCommodity);

  const sfdaMap = new Map<
    string,
    { name: string; entries: { commodity: string; mrl: string }[] }
  >();

  // Agriculture — exact commodity match
  for (const sub of SFDA_SUBSTANCES) {
    const matched = sub.entries.filter(
      (e) => normCommodity(e.commodity) === sel,
    );
    if (matched.length > 0) {
      const key = normalize(sub.substance);
      sfdaMap.set(key, {
        name: sub.substance,
        entries: matched.map((e) => ({ commodity: e.commodity, mrl: e.mrl })),
      });
    }
  }

  // Dates — if user picked "Dates (Date Palm)"
  if (sel === normCommodity("Dates (Date Palm)")) {
    for (const item of SFDA_DATES) {
      const key = normalize(item.name);
      const existing = sfdaMap.get(key);
      const dateEntry = {
        commodity: "Dates (Date Palm)",
        mrl: `${item.mrl} mg/kg`,
      };
      if (existing) {
        existing.entries = existing.entries.filter(
          (e) => !e.commodity.toLowerCase().match(/^dates?(\s|$|.*palm)/),
        );
        existing.entries.push(dateEntry);
      } else {
        sfdaMap.set(key, { name: item.name, entries: [dateEntry] });
      }
    }
  }

  // FAO — exact commodity match
  const faoMap = new Map<
    string,
    { name: string; entries: { commodity: string; mrl: string }[] }
  >();
  for (const p of faoPesticides) {
    const matched = p.mrls.filter((m) => normCommodity(m.commodity) === sel);
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

  rows.sort((a, b) => {
    const aScore =
      (a.sfdaEntries.length > 0 ? 2 : 0) + (a.faoEntries.length > 0 ? 1 : 0);
    const bScore =
      (b.sfdaEntries.length > 0 ? 2 : 0) + (b.faoEntries.length > 0 ? 1 : 0);
    if (bScore !== aScore) return bScore - aScore;
    return a.pesticideName.localeCompare(b.pesticideName);
  });

  return rows;
}

export default function PesticidesCompareScreen() {
  const [query, setQuery] = useState("");
  const [selectedCommodity, setSelectedCommodity] = useState<string | null>(
    null,
  );
  const [pickerVisible, setPickerVisible] = useState(false);

  const deferred = useDeferredValue(query);
  const commodities = useMemo(
    () => getMatchingCommodities(deferred),
    [deferred],
  );

  // Reset selection whenever query changes
  useEffect(() => {
    setSelectedCommodity(null);
    setPickerVisible(false);
  }, [deferred]);

  // Auto-select if exactly one commodity matches
  useEffect(() => {
    if (commodities.length === 1) {
      setSelectedCommodity(commodities[0]);
    } else if (commodities.length > 1 && deferred.trim()) {
      setPickerVisible(true);
    }
  }, [commodities, deferred]);

  const rows = useMemo(
    () => (selectedCommodity ? buildCompare(selectedCommodity) : []),
    [selectedCommodity],
  );

  const bothCount = rows.filter(
    (r) => r.sfdaEntries.length > 0 && r.faoEntries.length > 0,
  ).length;

  return (
    <>
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

            {/* Selected commodity pill */}
            {selectedCommodity && (
              <View style={styles.selectionRow}>
                <Pressable
                  style={styles.selectionPill}
                  onPress={() => setPickerVisible(true)}
                >
                  <Text style={styles.selectionLabel} numberOfLines={1}>
                    {selectedCommodity}
                  </Text>
                  {commodities.length > 1 && (
                    <Text style={styles.changeLabel}>تغيير ▾</Text>
                  )}
                </Pressable>
                <Pressable
                  style={styles.clearBtn}
                  onPress={() => {
                    setSelectedCommodity(null);
                    if (commodities.length > 1) setPickerVisible(true);
                  }}
                >
                  <Text style={styles.clearBtnText}>✕</Text>
                </Pressable>
              </View>
            )}

            {/* Prompt to open picker when multiple commodities but none selected */}
            {!selectedCommodity && commodities.length > 1 && deferred.trim() ? (
              <Pressable
                style={styles.pickPrompt}
                onPress={() => setPickerVisible(true)}
              >
                <Text style={styles.pickPromptText}>
                  {commodities.length} منتج متطابق — اختر منتجاً لعرض المبيدات
                </Text>
                <Text style={styles.pickPromptArrow}>▾</Text>
              </Pressable>
            ) : null}

            {selectedCommodity && rows.length > 0 ? (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryText}>
                  {rows.length} مبيد · {bothCount} موجود في المصدرين
                </Text>
              </View>
            ) : !deferred.trim() ? (
              <Text style={styles.hintText}>
                اكتب اسم منتج غذائي بالإنجليزية لمقارنة الحدود القصوى بين المصدرين
              </Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          selectedCommodity && deferred.trim() ? (
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

      {/* Commodity picker modal */}
      <Modal
        visible={pickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setPickerVisible(false);
          if (!selectedCommodity) setQuery("");
        }}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => {
            setPickerVisible(false);
            if (!selectedCommodity) setQuery("");
          }}
        >
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>اختر المنتج الغذائي</Text>
            <Text style={styles.modalSubtitle}>
              {commodities.length} منتج متطابق لـ "{query}"
            </Text>
            <ScrollView
              style={styles.modalList}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {commodities.map((c) => {
                const isSelected =
                  selectedCommodity &&
                  normCommodity(c) === normCommodity(selectedCommodity);
                return (
                  <Pressable
                    key={c}
                    style={({ pressed }) => [
                      styles.commodityOption,
                      isSelected && styles.commodityOptionSelected,
                      pressed && styles.commodityOptionPressed,
                    ]}
                    onPress={() => {
                      setSelectedCommodity(c);
                      setPickerVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.commodityOptionText,
                        isSelected && styles.commodityOptionTextSelected,
                      ]}
                    >
                      {c}
                    </Text>
                    {isSelected && (
                      <Text style={styles.commodityCheckmark}>✓</Text>
                    )}
                  </Pressable>
                );
              })}
              <View style={{ height: 24 }} />
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
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
    marginBottom: 8,
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
  selectionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  selectionPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e8f5e9",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: "#a5d6a7",
  },
  selectionLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: "#1b5e20",
  },
  changeLabel: {
    fontSize: 11,
    color: "#2e7d32",
    fontWeight: "700",
  },
  clearBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  clearBtnText: {
    fontSize: 13,
    color: "#6b7280",
  },
  pickPrompt: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff8e1",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#ffe082",
  },
  pickPromptText: {
    fontSize: 12,
    color: "#7b5800",
    textAlign: "right",
    flex: 1,
  },
  pickPromptArrow: {
    fontSize: 14,
    color: "#f59e0b",
    marginLeft: 8,
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
  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 16,
    maxHeight: "75%",
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#d1d5db",
    alignSelf: "center",
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.light.text,
    textAlign: "right",
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 12,
    color: colors.light.mutedForeground,
    textAlign: "right",
    marginBottom: 12,
  },
  modalList: {
    flexGrow: 0,
  },
  commodityOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  commodityOptionSelected: {
    backgroundColor: "#f0fdf4",
    borderRadius: 10,
    borderBottomColor: "transparent",
    paddingHorizontal: 10,
    marginHorizontal: -10,
  },
  commodityOptionPressed: {
    backgroundColor: "#f9fafb",
  },
  commodityOptionText: {
    flex: 1,
    fontSize: 14,
    color: colors.light.text,
    textAlign: "left",
  },
  commodityOptionTextSelected: {
    fontWeight: "700",
    color: "#15803d",
  },
  commodityCheckmark: {
    fontSize: 16,
    color: "#15803d",
    marginLeft: 8,
  },
});
