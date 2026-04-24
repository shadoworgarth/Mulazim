import { useRouter } from "expo-router";
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
import { faoPesticides, searchByCommodity, FaoCommodityHit } from "@/constants/fao-codex";

const RESULT_LIMIT = 500;
const CHIP_LIMIT = 2;

function getUniqueCommodities(query: string): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const map = new Map<string, string>();
  for (const p of faoPesticides)
    for (const m of p.mrls)
      if (m.commodity.toLowerCase().includes(q)) {
        const k = m.commodity.toLowerCase().trim();
        if (!map.has(k)) map.set(k, m.commodity);
      }
  return [...map.values()].sort((a, b) => a.localeCompare(b));
}

function searchExact(commodity: string, limit: number): FaoCommodityHit[] {
  const sel = commodity.toLowerCase().trim();
  const hits: FaoCommodityHit[] = [];
  for (const p of faoPesticides) {
    for (const m of p.mrls) {
      if (m.commodity.toLowerCase().trim() === sel) {
        hits.push({
          pesticide: p.name,
          pesticideId: p.id,
          mrl: m.mrl,
          cacYear: m.cacYear,
          commodity: m.commodity,
          footnote: m.footnote,
        });
        if (hits.length >= limit) return hits;
      }
    }
  }
  return hits;
}

export default function PesticidesFaoCommodityScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedCommodity, setSelectedCommodity] = useState<string | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);

  const deferred = useDeferredValue(query);
  const commodities = useMemo(() => getUniqueCommodities(deferred), [deferred]);

  useEffect(() => {
    setSelectedCommodity(null);
  }, [deferred]);

  const results = useMemo(() => {
    if (!deferred.trim()) return [];
    return selectedCommodity
      ? searchExact(selectedCommodity, RESULT_LIMIT + 1)
      : searchByCommodity(deferred, RESULT_LIMIT + 1);
  }, [deferred, selectedCommodity]);

  const truncated = results.length > RESULT_LIMIT;
  const display = truncated ? results.slice(0, RESULT_LIMIT) : results;
  const chipsToShow = commodities.slice(0, CHIP_LIMIT);
  const hasMoreChips = commodities.length > CHIP_LIMIT;

  return (
    <>
      <FlatList
        data={display}
        keyExtractor={(_, i) => i.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View>
            <View style={styles.titleCard}>
              <Text style={styles.titleText}>بحث حسب المنتج الغذائي</Text>
              <Text style={styles.subtitleText}>
                Find all pesticide MRLs for a commodity
              </Text>
            </View>
            <View style={styles.searchWrap}>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="e.g. Tomato, Rice, Apple, Wheat…"
                placeholderTextColor="#9ca3af"
                style={styles.searchInput}
                textAlign="left"
                autoCorrect={false}
                autoCapitalize="none"
                autoFocus
              />
            </View>

            {deferred.trim() && commodities.length > 1 ? (
              <View style={styles.chipsSection}>
                <Text style={styles.chipsLabel}>تصفية حسب المنتج:</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipsRow}
                >
                  {chipsToShow.map((c) => {
                    const active =
                      selectedCommodity !== null &&
                      c.toLowerCase().trim() === selectedCommodity.toLowerCase().trim();
                    return (
                      <Pressable
                        key={c}
                        style={[styles.chip, active && styles.chipActive]}
                        onPress={() => setSelectedCommodity(active ? null : c)}
                      >
                        <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
                          {c}
                        </Text>
                      </Pressable>
                    );
                  })}
                  {hasMoreChips && (
                    <Pressable style={styles.chipMore} onPress={() => setPickerVisible(true)}>
                      <Text style={styles.chipMoreText}>+{commodities.length - CHIP_LIMIT} عرض الكل</Text>
                    </Pressable>
                  )}
                </ScrollView>
              </View>
            ) : null}

            {deferred.trim() ? (
              <Text style={styles.resultCount}>
                {truncated
                  ? `أكثر من ${RESULT_LIMIT} نتيجة — يرجى تحديد البحث`
                  : `${results.length} نتيجة${selectedCommodity ? ` · ${selectedCommodity}` : ""}`}
              </Text>
            ) : (
              <Text style={styles.hintText}>
                اكتب اسم منتج غذائي بالإنجليزية لعرض الحدود القصوى
              </Text>
            )}
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
          <Pressable
            style={({ pressed }) => [styles.card, { opacity: pressed ? 0.85 : 1 }]}
            onPress={() =>
              router.push({
                pathname: "/pesticides-fao-detail",
                params: { id: item.pesticideId },
              } as any)
            }
          >
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.pesticideText}>{item.pesticide}</Text>
                <Text style={styles.commodityText}>{item.commodity}</Text>
              </View>
              <View style={styles.limitPill}>
                <Text style={styles.limitValue}>{item.mrl}</Text>
              </View>
            </View>
            {item.cacYear ? <Text style={styles.metaText}>CAC {item.cacYear}</Text> : null}
          </Pressable>
        )}
      />

      <Modal
        visible={pickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setPickerVisible(false)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>اختر المنتج الغذائي</Text>
            <Text style={styles.modalSubtitle}>
              {commodities.length} منتج متطابق لـ "{query}"
            </Text>
            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              {commodities.map((c) => {
                const isSelected =
                  selectedCommodity !== null &&
                  c.toLowerCase().trim() === selectedCommodity.toLowerCase().trim();
                return (
                  <Pressable
                    key={c}
                    style={({ pressed }) => [
                      styles.commodityOption,
                      isSelected && styles.commodityOptionSelected,
                      pressed && styles.commodityOptionPressed,
                    ]}
                    onPress={() => {
                      setSelectedCommodity(isSelected ? null : c);
                      setPickerVisible(false);
                    }}
                  >
                    <Text style={[styles.commodityOptionText, isSelected && styles.commodityOptionTextSelected]}>
                      {c}
                    </Text>
                    {isSelected && <Text style={styles.commodityCheckmark}>✓</Text>}
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
  center: { alignItems: "center", justifyContent: "center", gap: 10, paddingTop: 40 },
  emptyText: { fontSize: 14, color: colors.light.mutedForeground },
  hintText: { fontSize: 12, color: colors.light.mutedForeground, textAlign: "center", marginTop: 8, paddingHorizontal: 20 },
  listContent: {
    padding: 16,
    paddingBottom: Platform.OS === "web" ? 34 : 24,
    gap: 8,
  },
  titleCard: { backgroundColor: "#0e7c7c", borderRadius: 14, padding: 16, marginBottom: 10 },
  titleText: { fontSize: 16, fontWeight: "700", color: "#ffffff", textAlign: "left" },
  subtitleText: { fontSize: 12, color: "#b2dfdb", textAlign: "left", marginTop: 4 },
  searchWrap: { marginBottom: 8 },
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
  chipsSection: { marginBottom: 4 },
  chipsLabel: { fontSize: 11, color: colors.light.mutedForeground, textAlign: "right", marginBottom: 6 },
  chipsRow: { gap: 6, paddingBottom: 2 },
  chip: {
    backgroundColor: "#f3f4f6",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    maxWidth: 180,
  },
  chipActive: { backgroundColor: "#e0f2f1", borderColor: "#0e7c7c" },
  chipText: { fontSize: 12, color: colors.light.text },
  chipTextActive: { fontWeight: "700", color: "#004d40" },
  chipMore: {
    backgroundColor: "#fffbeb",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  chipMoreText: { fontSize: 12, color: "#92400e", fontWeight: "600" },
  resultCount: { fontSize: 11, color: colors.light.mutedForeground, textAlign: "right", marginVertical: 6 },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    gap: 6,
  },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  pesticideText: { fontSize: 14, fontWeight: "700", color: "#0d47a1", textAlign: "left" },
  commodityText: { fontSize: 12, color: colors.light.text, textAlign: "left", marginTop: 2 },
  limitPill: {
    backgroundColor: "#e3f2fd",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: "center",
    minWidth: 80,
  },
  limitValue: { fontSize: 13, fontWeight: "700", color: "#0d47a1", textAlign: "center" },
  metaText: { fontSize: 10, color: colors.light.mutedForeground, textAlign: "left" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 16,
    maxHeight: "75%",
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#d1d5db", alignSelf: "center", marginBottom: 14 },
  modalTitle: { fontSize: 17, fontWeight: "700", color: colors.light.text, textAlign: "right", marginBottom: 4 },
  modalSubtitle: { fontSize: 12, color: colors.light.mutedForeground, textAlign: "right", marginBottom: 12 },
  modalList: { flexGrow: 0 },
  commodityOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  commodityOptionSelected: {
    backgroundColor: "#e0f2f1",
    borderRadius: 10,
    borderBottomColor: "transparent",
    paddingHorizontal: 10,
    marginHorizontal: -10,
  },
  commodityOptionPressed: { backgroundColor: "#f9fafb" },
  commodityOptionText: { flex: 1, fontSize: 14, color: colors.light.text, textAlign: "left" },
  commodityOptionTextSelected: { fontWeight: "700", color: "#004d40" },
  commodityCheckmark: { fontSize: 16, color: "#0e7c7c", marginLeft: 8 },
});
