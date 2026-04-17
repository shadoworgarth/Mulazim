import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  ImageBackground,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const logoImage = require("../../assets/sfda-logo.png");

import appData from "@/constants/data";
import colors from "@/constants/colors";

const CATEGORY_COLORS = colors.light.categoryColors;

interface SubItemResult {
  categoryIndex: number;
  categoryName: string;
  subItemIndex: number;
  subItemName: string;
  hasData: boolean;
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [categoriesExpanded, setCategoriesExpanded] = useState(true);

  const q = search.trim();

  const subItemResults: SubItemResult[] = q
    ? appData.flatMap((cat, catIdx) =>
        cat.subItems
          .map((sub, subIdx) => ({
            categoryIndex: catIdx,
            categoryName: cat.name,
            subItemIndex: subIdx,
            subItemName: sub.name,
            hasData: !!sub.data,
          }))
          .filter((r) => r.subItemName.includes(q) || r.categoryName.includes(q))
      )
    : [];

  const handleCategory = (index: number) => {
    router.push({ pathname: "/items", params: { categoryIndex: index } });
  };

  const handleSubItemResult = (result: SubItemResult) => {
    if (result.hasData) {
      router.push({
        pathname: "/detail",
        params: { categoryIndex: result.categoryIndex, itemIndex: result.subItemIndex },
      });
    } else {
      router.push({ pathname: "/items", params: { categoryIndex: result.categoryIndex } });
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <ImageBackground
        source={logoImage}
        style={[
          styles.header,
          { paddingTop: Platform.OS === "web" ? 67 : insets.top + 12 },
        ]}
        imageStyle={styles.headerImage}
        resizeMode="contain"
      >
        <Text style={styles.headerTitle}>دليل المضافات الغذائية</Text>
        <Text style={styles.headerSubtitle}>اختر التصنيف لعرض الأصناف</Text>

        {/* Category Search */}
        <View style={styles.searchContainer}>
          <Feather name="search" size={18} color="#0e7c7c" />
          <TextInput
            style={styles.searchInput}
            placeholder="بحث في الأصناف والمنتجات..."
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
      </ImageBackground>

      {/* Search Results */}
      {q ? (
        <FlatList
          data={subItemResults}
          keyExtractor={(_, i) => i.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const color = CATEGORY_COLORS[item.categoryIndex % CATEGORY_COLORS.length];
            return (
              <Pressable
                style={({ pressed }) => [
                  styles.card,
                  !item.hasData && styles.cardDisabledResult,
                  { opacity: pressed ? 0.85 : 1 },
                ]}
                onPress={() => handleSubItemResult(item)}
              >
                <View style={[styles.cardAccent, { backgroundColor: item.hasData ? color : colors.light.muted }]} />
                <View style={styles.cardContent}>
                  <Feather
                    name={item.hasData ? "chevron-left" : "list"}
                    size={20}
                    color={colors.light.mutedForeground}
                  />
                  <View style={styles.cardText}>
                    <Text style={[styles.cardTitle, !item.hasData && { color: colors.light.mutedForeground }]} numberOfLines={2}>
                      {item.subItemName.trim()}
                    </Text>
                    <Text style={styles.cardCount}>{item.categoryName.trim()}</Text>
                  </View>
                  <View style={[styles.categoryIcon, { backgroundColor: (item.hasData ? color : "#888") + "22" }]}>
                    <Feather name={item.hasData ? "file-text" : "folder"} size={18} color={item.hasData ? color : "#888"} />
                  </View>
                </View>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="search" size={48} color={colors.light.mutedForeground} />
              <Text style={styles.emptyText}>لا توجد نتائج</Text>
            </View>
          }
          ListHeaderComponent={
            <Text style={styles.resultsCount}>{subItemResults.length} نتيجة</Text>
          }
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {/* General Additives Card (always visible) */}
          <Pressable
            style={({ pressed }) => [
              styles.card,
              styles.generalCard,
              { opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={() => router.push("/general-additives")}
          >
            <View style={[styles.cardAccent, { backgroundColor: "#7c4e0e" }]} />
            <View style={styles.cardContent}>
              <Feather name="chevron-left" size={20} color={colors.light.mutedForeground} />
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>المضافات العامة</Text>
                <Text style={styles.cardCount}>182 مادة مضافة • 55 لون</Text>
              </View>
              <View style={[styles.categoryIcon, { backgroundColor: "#7c4e0e22" }]}>
                <Feather name="star" size={20} color="#7c4e0e" />
              </View>
            </View>
          </Pressable>

          {/* Collapsible Categories Section */}
          <View style={styles.sectionWrapper}>
            {/* Section Toggle Header */}
            <Pressable
              style={({ pressed }) => [
                styles.sectionHeader,
                categoriesExpanded && styles.sectionHeaderExpanded,
                { opacity: pressed ? 0.8 : 1 },
              ]}
              onPress={() => setCategoriesExpanded((v) => !v)}
            >
              <Feather
                name={categoriesExpanded ? "chevron-up" : "chevron-down"}
                size={18}
                color="#0e7c7c"
              />
              <Text style={styles.sectionHeaderText}>
                تصنيفات الغذاء ({appData.length})
              </Text>
            </Pressable>

            {/* Category Cards */}
            {categoriesExpanded &&
              appData.map((item, index) => {
                const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
                return (
                  <Pressable
                    key={index}
                    style={({ pressed }) => [
                      styles.card,
                      index < appData.length - 1 && styles.cardInSection,
                      { opacity: pressed ? 0.85 : 1 },
                    ]}
                    onPress={() => handleCategory(index)}
                  >
                    <View style={[styles.cardAccent, { backgroundColor: color }]} />
                    <View style={styles.cardContent}>
                      <Feather name="chevron-left" size={20} color={colors.light.mutedForeground} />
                      <View style={styles.cardText}>
                        <Text style={styles.cardTitle} numberOfLines={2}>
                          {item.name.trim()}
                        </Text>
                        <Text style={styles.cardCount}>{item.subItems.length} صنف</Text>
                      </View>
                      <View style={[styles.categoryIcon, { backgroundColor: color + "22" }]}>
                        <Text style={[styles.categoryNumber, { color }]}>{index + 1}</Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
          </View>

          <Text style={styles.footer}>اعداد وتصميم عبدالعزيز الدوسري</Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  header: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e8e8",
  },
  headerImage: {
    opacity: 0.22,
    resizeMode: "contain",
    left: 0,
    bottom: 0,
    top: 0,
    width: "55%",
    height: "100%",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0b1e1e",
    textAlign: "right",
    marginBottom: 4,
    textShadowColor: "rgba(0,0,0,0.55)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#152828",
    textAlign: "right",
    marginBottom: 14,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 2,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1.5,
    borderColor: "#000000",
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
  cardInSection: {
    borderRadius: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#e8f0f0",
  },
  generalCard: {
    borderWidth: 1.5,
    borderColor: "#7c4e0e33",
    backgroundColor: "#fffaf6",
  },
  cardDisabledResult: {
    backgroundColor: "#f5f7f7",
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
  categoryNumber: {
    fontSize: 20,
    fontWeight: "700",
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
  sectionWrapper: {
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    backgroundColor: "#e8f4f4",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#c8e0e0",
  },
  sectionHeaderExpanded: {
    borderBottomWidth: 1,
    borderBottomColor: "#c8e0e0",
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0e7c7c",
    textAlign: "right",
  },
  resultsCount: {
    fontSize: 12,
    color: colors.light.mutedForeground,
    textAlign: "right",
    paddingBottom: 8,
  },
  footer: {
    textAlign: "center",
    fontSize: 12,
    color: colors.light.mutedForeground,
    paddingTop: 20,
    paddingBottom: 8,
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
