import { useLocalSearchParams, useNavigation } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
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
import toxins, { ToxinRow } from "@/constants/toxins";

const ACCENT = "#c2185b";

// ─── Food category classification ────────────────────────────────────────────

type FoodCategory = "نباتية" | "حيوانية" | "بحرية" | "أخرى";

const SEAFOOD_KW = [
  "سمك",
  "أسماك",
  "قشريات",
  "رخويات",
  "تونا",
  "مارلن",
  "أبراميس",
  "قرش",
  "بحر",
  "ربيان",
  "رأسيات",
  "طحالب",
];
const ANIMAL_KW = [
  "ألبان",
  "حليب",
  "لحوم",
  "لحم ",
  "اللحم",
  "طيور",
  "دواجن",
  "لانشون",
  "كورنيد",
  "مواشي",
  "ماشية",
  "أغنام",
  "أحشاء",
  "أكباد",
  "كلاوي",
];
const PLANT_KW = [
  "قمح",
  "شعير",
  "ذرة",
  "أرز",
  "لوز",
  "فستق",
  "فول",
  "تفاح",
  "خضر",
  "فاكه",
  "فواكه",
  "طحين",
  "دقيق",
  "حبوب",
  "بذرة",
  "نبات",
  "عرق",
  "مستخلص",
  "كستناء",
  "طماطم",
  "صويا",
  "مكرونة",
  "خبز",
  "رقائق",
  "بسكويت",
  "مانجو",
  "ملح",
  "توابل",
  "بهارات",
  "توت",
  "عنب",
  "كاكاو",
  "شوكولا",
  "شيلم",
  "فلفل",
  "كرز",
  "كشمش",
  "مربى",
  "جيلي",
  "فطر",
  "مشروم",
  "بقول",
  "بندق",
  "تين",
  "زيتون",
  "عصائر",
  "عصير",
  "بلسان",
  "بن ",
  "زيت",
  "خيار",
  "دهون",
  "زيوت",
  "جوز",
];

const ALWAYS_PLANT = ["شوكولا", "شوكولاتة", "كاكاو"];

function rowFoodCategory(product: string): FoodCategory {
  if (ALWAYS_PLANT.some((k) => product.includes(k))) return "نباتية";
  if (SEAFOOD_KW.some((k) => product.includes(k))) return "بحرية";
  if (ANIMAL_KW.some((k) => product.includes(k))) return "حيوانية";
  if (PLANT_KW.some((k) => product.includes(k))) return "نباتية";
  return "أخرى";
}

const FOOD_CHIPS: {
  label: string;
  value: FoodCategory;
  icon: string;
  bg: string;
  activeBg: string;
  text: string;
  activeText: string;
}[] = [
  {
    label: "نباتية",
    value: "نباتية",
    icon: "🌾",
    bg: "#f0fdf4",
    activeBg: "#16a34a",
    text: "#15803d",
    activeText: "#fff",
  },
  {
    label: "حيوانية",
    value: "حيوانية",
    icon: "🥩",
    bg: "#fff7ed",
    activeBg: "#ea580c",
    text: "#c2410c",
    activeText: "#fff",
  },
  {
    label: "بحرية",
    value: "بحرية",
    icon: "🐟",
    bg: "#eff6ff",
    activeBg: "#2563eb",
    text: "#1d4ed8",
    activeText: "#fff",
  },
  {
    label: "أخرى",
    value: "أخرى",
    icon: "📦",
    bg: "#f9fafb",
    activeBg: "#6b7280",
    text: "#4b5563",
    activeText: "#fff",
  },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ToxinDetailScreen() {
  const { toxinIndex } = useLocalSearchParams<{ toxinIndex: string }>();
  const navigation = useNavigation();
  const idx = parseInt(toxinIndex ?? "0", 10);
  const toxin = toxins[idx];
  const [query, setQuery] = useState("");
  const [selectedFood, setSelectedFood] = useState<FoodCategory | null>(null);

  useEffect(() => {
    if (toxin) {
      navigation.setOptions({ title: toxin.toxin });
    }
  }, [toxin, navigation]);

  // Determine which food categories actually exist in this toxin
  const availableCategories = useMemo<FoodCategory[]>(() => {
    if (!toxin) return [];
    const found = new Set<FoodCategory>();
    for (const r of toxin.rows) {
      found.add(rowFoodCategory(r.product));
    }
    return FOOD_CHIPS.map((c) => c.value).filter((v) => found.has(v));
  }, [toxin]);

  const filtered = useMemo<ToxinRow[]>(() => {
    if (!toxin) return [];
    const q = query.trim();
    return toxin.rows.filter((r) => {
      const matchesText =
        !q ||
        r.product.includes(q) ||
        r.applicable_part.includes(q) ||
        r.notes.includes(q);
      const matchesFood =
        !selectedFood || rowFoodCategory(r.product) === selectedFood;
      return matchesText && matchesFood;
    });
  }, [toxin, query, selectedFood]);

  if (!toxin) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>لم يتم العثور على الملوث</Text>
      </View>
    );
  }

  const isFiltering = query.trim().length > 0 || selectedFood !== null;

  const headerComponent = (
    <View>
      <View style={styles.titleCard}>
        <Text style={styles.titleText}>{toxin.toxin}</Text>
        <Text style={styles.subtitleText}>
          {toxin.rows.length} حد أقصى مسجل
        </Text>
      </View>

      {/* Text search */}
      <View style={styles.searchWrap}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="ابحث عن صنف غذائي…"
          placeholderTextColor="#9ca3af"
          style={styles.searchInput}
          textAlign="right"
        />
      </View>

      {/* Food category chips — show only categories that exist in this toxin */}
      {availableCategories.length > 1 && (
        <View style={styles.chipsSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {FOOD_CHIPS.filter((c) =>
              availableCategories.includes(c.value)
            ).map((chip) => {
              const active = selectedFood === chip.value;
              return (
                <Pressable
                  key={chip.value}
                  style={[
                    styles.foodChip,
                    {
                      backgroundColor: active ? chip.activeBg : chip.bg,
                      borderColor: active ? chip.activeBg : "#e5e7eb",
                    },
                  ]}
                  onPress={() =>
                    setSelectedFood((prev) =>
                      prev === chip.value ? null : chip.value
                    )
                  }
                >
                  <Text
                    style={[
                      styles.foodChipText,
                      { color: active ? chip.activeText : chip.text },
                    ]}
                    numberOfLines={1}
                  >
                    {chip.icon} {chip.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Filter summary */}
      {isFiltering && (
        <View style={styles.filterSummary}>
          <Pressable
            onPress={() => {
              setQuery("");
              setSelectedFood(null);
            }}
          >
            <Text style={styles.clearAll}>مسح ✕</Text>
          </Pressable>
          <Text style={styles.filterSummaryText}>
            {filtered.length} نتيجة
            {selectedFood ? ` · ${selectedFood}` : ""}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <FlatList
      data={filtered}
      keyExtractor={(_, i) => i.toString()}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={headerComponent}
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={{ fontSize: 36 }}>🔍</Text>
          <Text style={styles.emptyText}>لا توجد نتائج مطابقة</Text>
        </View>
      }
      renderItem={({ item, index }) => (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.rowBadge}>
              <Text style={styles.rowBadgeText}>{index + 1}</Text>
            </View>
            <Text style={styles.productText} numberOfLines={3}>
              {item.product}
            </Text>
            <View style={styles.limitPill}>
              <Text style={styles.limitValue}>{item.max_level}</Text>
              <Text style={styles.limitUnit}>{item.unit}</Text>
            </View>
          </View>

          {/* Applicable part — always show, use "—" when empty */}
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>جزء المنتج المنطبق</Text>
            <Text style={styles.fieldValue}>
              {item.applicable_part || "—"}
            </Text>
          </View>

          {(item as any).radionuclides ? (
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>النويدات المشعة الممثلة</Text>
              <Text style={styles.fieldValue}>
                {(item as any).radionuclides}
              </Text>
            </View>
          ) : null}

          {item.notes ? (
            <View style={[styles.fieldBlock, styles.notesBlock]}>
              <Text style={styles.fieldLabel}>ملاحظات</Text>
              <Text style={styles.fieldValue}>{item.notes}</Text>
            </View>
          ) : null}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingTop: 40,
  },
  errorText: {
    fontSize: 16,
    color: colors.light.mutedForeground,
  },
  emptyText: {
    fontSize: 14,
    color: colors.light.mutedForeground,
  },
  listContent: {
    padding: 16,
    paddingBottom: Platform.OS === "web" ? 34 : 24,
    gap: 10,
  },
  titleCard: {
    backgroundColor: ACCENT,
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
    color: "#fce4ec",
    textAlign: "right",
    marginTop: 4,
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
  foodChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  foodChipText: {
    fontSize: 13,
    fontWeight: "600",
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
  cardHeader: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    gap: 10,
  },
  rowBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: "#f3e5f5",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 2,
  },
  rowBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#7b1fa2",
  },
  productText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: colors.light.text,
    textAlign: "right",
    lineHeight: 22,
  },
  limitPill: {
    backgroundColor: "#fce4ec",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: "center",
    minWidth: 70,
  },
  limitValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#880e4f",
  },
  limitUnit: {
    fontSize: 10,
    color: "#ad1457",
    marginTop: 2,
    textAlign: "center",
  },
  fieldBlock: {
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    padding: 10,
  },
  notesBlock: {
    backgroundColor: "#fffde7",
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6b7280",
    textAlign: "right",
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 13,
    color: colors.light.text,
    textAlign: "right",
    lineHeight: 20,
  },
});
