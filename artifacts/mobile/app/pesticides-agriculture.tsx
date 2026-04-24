import { useRouter } from "expo-router";
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
import pesticides from "@/constants/pesticides";

const SUBSTANCES = pesticides.sections.agriculture.substances;

export default function PesticidesAgricultureScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SUBSTANCES.map((s, i) => ({ ...s, originalIndex: i }));
    return SUBSTANCES.map((s, i) => ({ ...s, originalIndex: i })).filter((s) =>
      s.substance.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <FlatList
      data={filtered}
      keyExtractor={(item) => item.originalIndex.toString()}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <View>
          <View style={styles.headerBanner}>
            <Text style={styles.headerBannerText}>
              {SUBSTANCES.length} مبيد متاح
            </Text>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.commodityBtn,
              { opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={() =>
              router.push("/pesticides-agriculture-commodity" as any)
            }
          >
            <Text style={styles.commodityBtnIcon}>🥦</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.commodityBtnTitle}>بحث حسب المنتج الغذائي</Text>
              <Text style={styles.commodityBtnSub}>
                اعرض جميع المبيدات لمنتج معين
              </Text>
            </View>
            <Text style={styles.commodityBtnArrow}>›</Text>
          </Pressable>
          <View style={styles.searchWrap}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="ابحث عن مبيد…"
              placeholderTextColor="#9ca3af"
              style={styles.searchInput}
              textAlign="left"
            />
          </View>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={{ fontSize: 36 }}>🔍</Text>
          <Text style={styles.emptyText}>لا توجد نتائج مطابقة</Text>
        </View>
      }
      renderItem={({ item }) => (
        <Pressable
          style={({ pressed }) => [
            styles.card,
            { opacity: pressed ? 0.82 : 1 },
          ]}
          onPress={() =>
            router.push({
              pathname: "/pesticides-agriculture-detail",
              params: { substanceIndex: item.originalIndex },
            })
          }
        >
          <View style={styles.cardInner}>
            <Text style={{ fontSize: 18, color: colors.light.mutedForeground }}>
              ›
            </Text>
            <View style={styles.cardBody}>
              <Text style={styles.itemName} numberOfLines={2}>
                {item.substance}
              </Text>
              <Text style={styles.itemCount}>
                {item.entries.length} منتج
              </Text>
            </View>
            <View style={styles.indexBadge}>
              <Text style={styles.indexText}>{item.originalIndex + 1}</Text>
            </View>
          </View>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
    paddingBottom: Platform.OS === "web" ? 34 : 24,
    gap: 8,
  },
  headerBanner: {
    backgroundColor: "#2e7d3222",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 8,
    alignItems: "flex-end",
  },
  headerBannerText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#2e7d32",
    textAlign: "right",
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
    minWidth: 36,
    height: 36,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: "#2e7d32",
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
    textAlign: "left",
    lineHeight: 22,
  },
  itemCount: {
    fontSize: 12,
    color: "#2e7d32",
    textAlign: "left",
    marginTop: 3,
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
  commodityBtn: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#c8e6c9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  commodityBtnIcon: {
    fontSize: 26,
  },
  commodityBtnTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2e7d32",
    textAlign: "right",
  },
  commodityBtnSub: {
    fontSize: 11,
    color: colors.light.mutedForeground,
    textAlign: "right",
    marginTop: 2,
  },
  commodityBtnArrow: {
    fontSize: 22,
    color: "#2e7d32",
  },
});
