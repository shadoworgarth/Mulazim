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
import ANIMAL_FEED_ADDITIVES from "@/constants/animal-feed-additives";

const CATEGORY_COLORS: Record<number, { bg: string; text: string; badge: string }> = {
  1: { bg: "#e3f2fd", text: "#1565c0", badge: "#1565c0" },
  2: { bg: "#fce4ec", text: "#c62828", badge: "#c62828" },
  3: { bg: "#e8f5e9", text: "#2e7d32", badge: "#2e7d32" },
  4: { bg: "#ede7f6", text: "#4527a0", badge: "#4527a0" },
};

const CATEGORY_LABELS: Record<number, string> = {
  1: "التقنية",
  2: "الحسية",
  3: "الغذائية",
  4: "الحيوية",
};

type FilterCategory = "all" | 1 | 2 | 3 | 4;

export default function AnimalFeedAdditivesScreen() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<FilterCategory>("all");

  const q = search.trim().toLowerCase();

  const filtered = useMemo(() => {
    return ANIMAL_FEED_ADDITIVES.filter((item) => {
      const matchCat =
        activeCategory === "all" || item.category === activeCategory;
      if (!matchCat) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.eNumber.toLowerCase().includes(q) ||
        item.functionalGroup.includes(q) ||
        item.provisions.includes(q)
      );
    });
  }, [q, activeCategory]);

  const tabs: { label: string; value: FilterCategory }[] = [
    { label: "الكل", value: "all" },
    { label: "التقنية", value: 1 },
    { label: "الحسية", value: 2 },
    { label: "الغذائية", value: 3 },
    { label: "الحيوية", value: 4 },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder="ابحث باسم المادة أو رقم E..."
          placeholderTextColor={colors.light.mutedForeground}
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
          textAlign="right"
        />
      </View>

      <View style={styles.tabsWrap}>
        <FlatList
          horizontal
          data={tabs}
          keyExtractor={(t) => String(t.value)}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}
          inverted
          renderItem={({ item: tab }) => {
            const isActive = activeCategory === tab.value;
            const col =
              typeof tab.value === "number"
                ? CATEGORY_COLORS[tab.value]
                : null;
            return (
              <Pressable
                style={[
                  styles.tab,
                  isActive && {
                    backgroundColor: col ? col.bg : "#e0e0e0",
                    borderColor: col ? col.badge : "#9e9e9e",
                  },
                ]}
                onPress={() => setActiveCategory(tab.value)}
              >
                <Text
                  style={[
                    styles.tabText,
                    isActive && {
                      color: col ? col.text : colors.light.text,
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

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text style={styles.countText}>
            {filtered.length} إضافة
            {q ? ` · نتائج البحث عن "${search}"` : ""}
          </Text>
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>لا توجد نتائج</Text>
          </View>
        }
        renderItem={({ item }) => {
          const col = CATEGORY_COLORS[item.category];
          return (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.cardTopLeft}>
                  {item.eNumber !== "—" && (
                    <View
                      style={[
                        styles.eNumBadge,
                        { backgroundColor: col.bg, borderColor: col.badge },
                      ]}
                    >
                      <Text style={[styles.eNumText, { color: col.text }]}>
                        {item.eNumber}
                      </Text>
                    </View>
                  )}
                  <View
                    style={[
                      styles.catBadge,
                      { backgroundColor: col.badge },
                    ]}
                  >
                    <Text style={styles.catBadgeText}>
                      {CATEGORY_LABELS[item.category]}
                    </Text>
                  </View>
                </View>
                <Text style={styles.groupLabel} numberOfLines={2}>
                  {item.functionalGroup}
                </Text>
              </View>

              <Text style={styles.name}>{item.name}</Text>

              {item.provisions ? (
                <Text style={styles.provisions}>{item.provisions}</Text>
              ) : null}
            </View>
          );
        }}
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  searchInput: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 12 : 9,
    fontSize: 14,
    color: colors.light.text,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  tabsWrap: {
    paddingBottom: 6,
  },
  tabs: {
    paddingHorizontal: 16,
    gap: 8,
    paddingVertical: 4,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  tabText: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.light.mutedForeground,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === "web" ? 40 : 32,
    gap: 8,
  },
  countText: {
    fontSize: 12,
    color: colors.light.mutedForeground,
    textAlign: "right",
    marginBottom: 4,
  },
  emptyWrap: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: colors.light.mutedForeground,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    gap: 6,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  cardTopLeft: {
    flexDirection: "column",
    gap: 4,
    flexShrink: 0,
  },
  eNumBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    alignSelf: "flex-start",
  },
  eNumText: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  catBadge: {
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    alignSelf: "flex-start",
  },
  catBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#ffffff",
  },
  groupLabel: {
    fontSize: 11,
    color: colors.light.mutedForeground,
    textAlign: "right",
    flex: 1,
    lineHeight: 16,
  },
  name: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.light.text,
    textAlign: "right",
    lineHeight: 19,
  },
  provisions: {
    fontSize: 11,
    color: "#5d4037",
    textAlign: "right",
    backgroundColor: "#fff8e1",
    borderRadius: 6,
    padding: 7,
    lineHeight: 17,
  },
});
