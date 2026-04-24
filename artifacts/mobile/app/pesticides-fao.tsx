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
import { faoPesticides } from "@/constants/fao-codex";

export default function PesticidesFaoScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return faoPesticides;
    return faoPesticides.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.functionalClass.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <FlatList
      data={filtered}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <View>
          <Pressable
            style={({ pressed }) => [
              styles.commodityCard,
              { opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={() => router.push("/pesticides-fao-commodity" as any)}
          >
            <Text style={styles.commodityEmoji}>🥬</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.commodityTitle}>بحث حسب المنتج الغذائي</Text>
              <Text style={styles.commoditySubtitle}>
                Search by commodity (e.g. Tomato, Rice, Apple)
              </Text>
            </View>
            <Text style={styles.chev}>›</Text>
          </Pressable>
          <View style={styles.searchWrap}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search pesticide name or class…"
              placeholderTextColor="#9ca3af"
              style={styles.searchInput}
              textAlign="left"
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>
          <Text style={styles.resultCount}>
            {filtered.length} من {faoPesticides.length} مبيد
          </Text>
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
            { opacity: pressed ? 0.85 : 1 },
          ]}
          onPress={() =>
            router.push({
              pathname: "/pesticides-fao-detail",
              params: { id: item.id },
            } as any)
          }
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.nameText}>{item.name}</Text>
            {item.functionalClass ? (
              <Text style={styles.classText}>{item.functionalClass}</Text>
            ) : null}
          </View>
          <View style={styles.countPill}>
            <Text style={styles.countPillText}>{item.mrls.length}</Text>
            <Text style={styles.countPillLabel}>Products</Text>
          </View>
        </Pressable>
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
  emptyText: {
    fontSize: 14,
    color: colors.light.mutedForeground,
  },
  listContent: {
    padding: 16,
    paddingBottom: Platform.OS === "web" ? 34 : 24,
    gap: 8,
  },
  commodityCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#0e7c7c",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  commodityEmoji: {
    fontSize: 28,
  },
  commodityTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
    textAlign: "left",
  },
  commoditySubtitle: {
    fontSize: 11,
    color: "#b2dfdb",
    textAlign: "left",
    marginTop: 2,
  },
  chev: {
    fontSize: 26,
    color: "#ffffff",
    fontWeight: "700",
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
  resultCount: {
    fontSize: 11,
    color: colors.light.mutedForeground,
    textAlign: "right",
    marginBottom: 4,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  nameText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.light.text,
    textAlign: "left",
  },
  classText: {
    fontSize: 11,
    color: colors.light.mutedForeground,
    textAlign: "left",
    marginTop: 2,
  },
  countPill: {
    backgroundColor: "#e3f2fd",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: "center",
    minWidth: 56,
  },
  countPillText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1565c0",
  },
  countPillLabel: {
    fontSize: 9,
    color: "#1976d2",
    marginTop: 1,
  },
});
