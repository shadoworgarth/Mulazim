import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import appData from "@/constants/data";
import colors from "@/constants/colors";

const CATEGORY_COLORS = colors.light.categoryColors;

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");

  const filtered = search
    ? appData.filter((cat) => cat.name.includes(search))
    : appData;

  const handleCategory = (index: number) => {
    const realIndex = search
      ? appData.findIndex((c) => c.name === filtered[index].name)
      : index;
    router.push({ pathname: "/items", params: { categoryIndex: realIndex } });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0e7c7c" />

      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: Platform.OS === "web" ? 67 : insets.top + 12 },
        ]}
      >
        <Text style={styles.headerTitle}>دليل المضافات الغذائية</Text>
        <Text style={styles.headerSubtitle}>اختر التصنيف لعرض الأصناف</Text>

        {/* Category Search */}
        <View style={styles.searchContainer}>
          <Feather name="search" size={18} color="#0e7c7c" />
          <TextInput
            style={styles.searchInput}
            placeholder="بحث في التصنيفات..."
            placeholderTextColor="#9bb0b0"
            value={search}
            onChangeText={setSearch}
            textAlign="right"
          />
        </View>

        {/* Additive Search Button */}
        <Pressable
          style={({ pressed }) => [
            styles.additiveSearchBtn,
            { opacity: pressed ? 0.82 : 1 },
          ]}
          onPress={() => router.push("/additive-search")}
        >
          <Feather name="zap" size={16} color="#0e7c7c" />
          <Text style={styles.additiveSearchBtnText}>
            بحث عن مادة مضافة في جميع الأصناف
          </Text>
          <Feather name="arrow-left" size={14} color="#0e7c7c" />
        </Pressable>
      </View>

      {/* Categories List */}
      <FlatList
        data={filtered}
        keyExtractor={(_, i) => i.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        scrollEnabled={filtered.length > 0}
        renderItem={({ item, index }) => {
          const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
          return (
            <Pressable
              style={({ pressed }) => [
                styles.card,
                { opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={() => handleCategory(index)}
            >
              <View style={[styles.cardAccent, { backgroundColor: color }]} />
              <View style={styles.cardContent}>
                <Feather
                  name="chevron-left"
                  size={20}
                  color={colors.light.mutedForeground}
                />
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {item.name.trim()}
                  </Text>
                  <Text style={styles.cardCount}>
                    {item.subItems.length} صنف
                  </Text>
                </View>
                <View
                  style={[
                    styles.categoryIcon,
                    { backgroundColor: color + "22" },
                  ]}
                >
                  <Feather name="list" size={20} color={color} />
                </View>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="inbox" size={48} color={colors.light.mutedForeground} />
            <Text style={styles.emptyText}>لا توجد نتائج</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  header: {
    backgroundColor: "#0e7c7c",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "right",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#b2d8d8",
    textAlign: "right",
    marginBottom: 14,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.light.text,
    padding: 0,
    textAlign: "right",
  },
  additiveSearchBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e0f4f4",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 8,
    marginTop: 10,
  },
  additiveSearchBtnText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#0e7c7c",
    textAlign: "right",
  },
  listContent: {
    padding: 16,
    paddingBottom: Platform.OS === "web" ? 34 : 24,
    gap: 10,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    flexDirection: "row",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardAccent: {
    width: 4,
    alignSelf: "stretch",
  },
  cardContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.light.text,
    textAlign: "right",
    lineHeight: 22,
  },
  cardCount: {
    fontSize: 12,
    color: colors.light.mutedForeground,
    textAlign: "right",
    marginTop: 2,
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: colors.light.mutedForeground,
  },
});
