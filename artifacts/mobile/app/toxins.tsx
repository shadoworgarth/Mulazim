import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
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
import toxins, { Toxin } from "@/constants/toxins";

const ACCENT = "#c2185b";

// ─── Toxin type classification ────────────────────────────────────────────────

type ToxinType = "ميكوتوكسينات" | "معادن ثقيلة" | "نويدات مشعة";

const TOXIN_TYPE_MAP: Record<string, ToxinType> = {
  "إجمالي الأفلاتوكسين": "ميكوتوكسينات",
  "أفلاتوكسين M1": "ميكوتوكسينات",
  "ديوكسي فالينول (DON)": "ميكوتوكسينات",
  "فومونيزينات (B1 + B2)": "ميكوتوكسينات",
  "أوكراتوكسين A": "ميكوتوكسينات",
  "الباتولين": "ميكوتوكسينات",
  "الزرنيخ": "معادن ثقيلة",
  "الكادميوم": "معادن ثقيلة",
  "الرصاص": "معادن ثقيلة",
  "الزئبق": "معادن ثقيلة",
  "ميثيل الزئبق في بعض أنواع الأسماك والقشريات": "معادن ثقيلة",
  "القصدير": "معادن ثقيلة",
  "النويدات المشعة": "نويدات مشعة",
};

const TYPE_ORDER: ToxinType[] = [
  "ميكوتوكسينات",
  "معادن ثقيلة",
  "نويدات مشعة",
];

const TYPE_CHIP_LIMIT = 2;

const TYPE_COLORS: Record<
  ToxinType,
  { bg: string; text: string; activeBg: string; activeText: string }
> = {
  ميكوتوكسينات: {
    bg: "#f3e5f5",
    text: "#7b1fa2",
    activeBg: "#7b1fa2",
    activeText: "#fff",
  },
  "معادن ثقيلة": {
    bg: "#e8f5e9",
    text: "#2e7d32",
    activeBg: "#2e7d32",
    activeText: "#fff",
  },
  "نويدات مشعة": {
    bg: "#fff3e0",
    text: "#e65100",
    activeBg: "#e65100",
    activeText: "#fff",
  },
};

// ─── List item types ──────────────────────────────────────────────────────────

type ListItem =
  | { kind: "header"; toxinType: ToxinType }
  | { kind: "toxin"; toxin: Toxin; originalIndex: number };

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ToxinsScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedType, setSelectedType] = useState<ToxinType | null>(null);
  const [typeModalVisible, setTypeModalVisible] = useState(false);

  const isFiltering = query.trim().length > 0 || selectedType !== null;

  const filtered = useMemo(() => {
    const q = query.trim();
    return toxins.filter((t) => {
      const matchesText = !q || t.toxin.includes(q);
      const matchesType =
        !selectedType || TOXIN_TYPE_MAP[t.toxin] === selectedType;
      return matchesText && matchesType;
    });
  }, [query, selectedType]);

  const listData = useMemo<ListItem[]>(() => {
    const items: ListItem[] = [];
    for (const toxinType of TYPE_ORDER) {
      const group = filtered.filter(
        (t) => TOXIN_TYPE_MAP[t.toxin] === toxinType
      );
      if (group.length === 0) continue;
      items.push({ kind: "header", toxinType });
      for (const t of group) {
        items.push({
          kind: "toxin",
          toxin: t,
          originalIndex: toxins.indexOf(t),
        });
      }
    }
    return items;
  }, [filtered]);

  function handleTypePress(type: ToxinType) {
    setSelectedType((prev) => (prev === type ? null : type));
    setTypeModalVisible(false);
  }

  const filtersBar = (
    <View>
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder="ابحث عن ملوث..."
          placeholderTextColor={colors.light.mutedForeground}
          value={query}
          onChangeText={setQuery}
          textAlign="right"
          returnKeyType="search"
        />
      </View>

      {/* Toxin type chips — limited to 2 + show-all */}
      <View style={styles.chipsSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {TYPE_ORDER.slice(0, TYPE_CHIP_LIMIT).map((type) => {
            const active = selectedType === type;
            const c = TYPE_COLORS[type];
            return (
              <Pressable
                key={type}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? c.activeBg : c.bg,
                    borderColor: active ? c.activeBg : c.bg,
                  },
                ]}
                onPress={() => handleTypePress(type)}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: active ? c.activeText : c.text },
                  ]}
                  numberOfLines={1}
                >
                  {type}
                </Text>
              </Pressable>
            );
          })}
          {TYPE_ORDER.length > TYPE_CHIP_LIMIT && (
            <Pressable
              style={styles.chipMore}
              onPress={() => setTypeModalVisible(true)}
            >
              <Text style={styles.chipMoreText}>
                +{TYPE_ORDER.length - TYPE_CHIP_LIMIT} عرض الكل
              </Text>
            </Pressable>
          )}
        </ScrollView>
      </View>

      {/* Active filter summary row */}
      {isFiltering && (
        <View style={styles.filterSummary}>
          <Pressable
            onPress={() => {
              setSelectedType(null);
              setQuery("");
            }}
          >
            <Text style={styles.clearAll}>مسح ✕</Text>
          </Pressable>
          <Text style={styles.filterSummaryText}>
            {filtered.length} ملوث
            {selectedType ? ` · ${selectedType}` : ""}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={listData}
        keyExtractor={(item, i) =>
          item.kind === "header" ? `h-${item.toxinType}` : `t-${i}`
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View>
            {filtersBar}
            {!isFiltering && (
              <View style={styles.headerBanner}>
                <Text style={styles.headerBannerText}>
                  {toxins.length} ملوث متاح
                </Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={{ fontSize: 32 }}>🔍</Text>
            <Text style={styles.emptyText}>لا توجد نتائج مطابقة</Text>
          </View>
        }
        ListFooterComponent={
          <View style={styles.referenceBox}>
            <Text style={styles.referenceText}>
              {
                "المراجع: CXS 193-1995\nCOMMISSION REGULATION (EC) No 1881/2006\nولمزيد من المعلومات يرجى الاطلاع على لائحة الملوثات والسموم:\nSFDA.FD GSO 193:2021"
              }
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          if (item.kind === "header") {
            const c = TYPE_COLORS[item.toxinType];
            return (
              <View
                style={[styles.sectionHeader, { backgroundColor: c.bg }]}
              >
                <Text
                  style={[styles.sectionHeaderText, { color: c.text }]}
                >
                  {item.toxinType}
                </Text>
              </View>
            );
          }

          const { toxin: t, originalIndex } = item;
          const toxinType = TOXIN_TYPE_MAP[t.toxin];
          const typeColor = toxinType ? TYPE_COLORS[toxinType] : null;

          return (
            <Pressable
              style={({ pressed }) => [
                styles.card,
                { opacity: pressed ? 0.82 : 1 },
              ]}
              onPress={() =>
                router.push({
                  pathname: "/toxin-detail",
                  params: { toxinIndex: originalIndex },
                })
              }
            >
              <View style={styles.cardInner}>
                <Text
                  style={{
                    fontSize: 18,
                    color: colors.light.mutedForeground,
                  }}
                >
                  ›
                </Text>
                <View style={styles.cardBody}>
                  <Text style={styles.itemName} numberOfLines={3}>
                    {t.toxin}
                  </Text>
                  <Text style={styles.itemCount}>
                    {t.rows.length} صنف غذائي
                  </Text>
                </View>
                <View
                  style={[
                    styles.indexBadge,
                    typeColor
                      ? { backgroundColor: typeColor.activeBg }
                      : null,
                  ]}
                >
                  <Text style={styles.indexText}>{originalIndex + 1}</Text>
                </View>
              </View>
            </Pressable>
          );
        }}
      />

      {/* Toxin type picker modal */}
      <Modal
        visible={typeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTypeModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setTypeModalVisible(false)}
        >
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>نوع الملوث</Text>
            {TYPE_ORDER.map((type) => {
              const active = selectedType === type;
              const c = TYPE_COLORS[type];
              return (
                <Pressable
                  key={type}
                  style={[
                    styles.modalOption,
                    active && { backgroundColor: c.bg },
                  ]}
                  onPress={() => handleTypePress(type)}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      { color: active ? c.text : colors.light.text },
                    ]}
                  >
                    {type}
                  </Text>
                  {active && (
                    <Text style={{ color: c.text, fontWeight: "700" }}>
                      ✓
                    </Text>
                  )}
                </Pressable>
              );
            })}
            <Pressable
              style={styles.modalCancel}
              onPress={() => setTypeModalVisible(false)}
            >
              <Text style={styles.modalCancelText}>إغلاق</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  listContent: {
    padding: 16,
    paddingBottom: Platform.OS === "web" ? 34 : 24,
    gap: 8,
  },
  searchWrap: {
    marginBottom: 10,
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
  chipsSection: {
    marginBottom: 8,
  },
  chipsRow: {
    gap: 8,
    paddingRight: 4,
    paddingBottom: 2,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  chipMore: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  chipMoreText: {
    fontSize: 13,
    fontWeight: "600",
    color: ACCENT,
  },
  filterSummary: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  filterSummaryText: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "right",
  },
  clearAll: {
    fontSize: 12,
    fontWeight: "600",
    color: ACCENT,
  },
  headerBanner: {
    backgroundColor: "#c2185b22",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 4,
    alignItems: "flex-end",
  },
  headerBannerText: {
    fontSize: 13,
    fontWeight: "500",
    color: ACCENT,
    textAlign: "right",
  },
  sectionHeader: {
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginTop: 4,
    marginBottom: 2,
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: "700",
    textAlign: "right",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cardInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  indexBadge: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  indexText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#ffffff",
  },
  cardBody: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.light.text,
    textAlign: "right",
    lineHeight: 22,
  },
  itemCount: {
    fontSize: 12,
    color: ACCENT,
    textAlign: "right",
    marginTop: 3,
  },
  emptyWrap: {
    alignItems: "center",
    paddingTop: 40,
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    color: colors.light.mutedForeground,
  },
  referenceBox: {
    marginTop: 16,
    backgroundColor: "#fffde7",
    borderWidth: 1,
    borderColor: "#fdd835",
    borderRadius: 12,
    padding: 14,
  },
  referenceText: {
    fontSize: 12,
    color: "#5d4037",
    textAlign: "right",
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
    gap: 6,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.light.text,
    textAlign: "right",
    marginBottom: 8,
  },
  modalOption: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  modalOptionText: {
    fontSize: 15,
    fontWeight: "500",
    textAlign: "right",
  },
  modalCancel: {
    marginTop: 8,
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6b7280",
  },
});
