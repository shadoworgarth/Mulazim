import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import colors from "@/constants/colors";

const rawData = require("../assets/general-additives.json");

interface Table1Row {
  ins: string;
  name: string;
}

interface Table2Row {
  ins: string;
  color: string;
  food: string;
}

interface GeneralData {
  table1: { title: string; headers: { ins: string; name: string }; rows: Table1Row[] };
  table2: { title: string; headers: { ins: string; color: string; food: string }; rows: Table2Row[] };
}

const data: GeneralData = rawData;

type SectionItem =
  | { kind: "t1"; row: Table1Row }
  | { kind: "t2"; row: Table2Row };

export default function GeneralAdditivesScreen() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "colors">("all");

  const q = search.trim().toLowerCase();

  const filteredT1 = q
    ? data.table1.rows.filter(
        (r) =>
          r.ins.toLowerCase().includes(q) ||
          r.name.toLowerCase().includes(q)
      )
    : data.table1.rows;

  const filteredT2 = q
    ? data.table2.rows.filter(
        (r) =>
          r.ins.toLowerCase().includes(q) ||
          r.color.toLowerCase().includes(q) ||
          r.food.toLowerCase().includes(q)
      )
    : data.table2.rows;

  const sections =
    activeTab === "all"
      ? [
          {
            key: "t1",
            title: "المضافات الغذائية العامة",
            subtitle: `${filteredT1.length} مادة مضافة`,
            data: filteredT1.map((row): SectionItem => ({ kind: "t1", row })),
          },
          {
            key: "t2",
            title: "الألوان المسموح بها",
            subtitle: `${filteredT2.length} لون`,
            data: filteredT2.map((row): SectionItem => ({ kind: "t2", row })),
          },
        ]
      : [
          {
            key: "t2",
            title: "الألوان المسموح بها",
            subtitle: `${filteredT2.length} لون`,
            data: filteredT2.map((row): SectionItem => ({ kind: "t2", row })),
          },
        ];

  const renderItem = ({ item }: { item: SectionItem }) => {
    if (item.kind === "t1") {
      return (
        <View style={styles.t1Row}>
          <Text style={styles.t1Name}>{item.row.name}</Text>
          <View style={styles.insBadge}>
            <Text style={styles.insBadgeText}>{item.row.ins}</Text>
          </View>
        </View>
      );
    }
    return (
      <View style={styles.t2Row}>
        <View style={styles.t2Right}>
          <Text style={styles.t2Food} numberOfLines={3}>
            {item.row.food || "—"}
          </Text>
          <Text style={styles.t2Color}>{item.row.color}</Text>
        </View>
        <View style={styles.insBadgeAlt}>
          <Text style={styles.insBadgeAltText}>{item.row.ins}</Text>
        </View>
      </View>
    );
  };

  const renderSectionHeader = ({
    section,
  }: {
    section: { title: string; subtitle: string };
  }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderSubtitle}>{section.subtitle}</Text>
      <Text style={styles.sectionHeaderTitle}>{section.title}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchBar}>
        <Feather name="search" size={17} color="#0e7c7c" />
        <TextInput
          style={styles.searchInput}
          placeholder="بحث باسم المادة أو رقم INS..."
          placeholderTextColor="#9bb0b0"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")}>
            <Feather name="x" size={17} color={colors.light.mutedForeground} />
          </Pressable>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, activeTab === "all" && styles.tabActive]}
          onPress={() => setActiveTab("all")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "all" && styles.tabTextActive,
            ]}
          >
            الكل
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === "colors" && styles.tabActive]}
          onPress={() => setActiveTab("colors")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "colors" && styles.tabTextActive,
            ]}
          >
            الألوان
          </Text>
        </Pressable>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        stickySectionHeadersEnabled
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="search" size={40} color={colors.light.mutedForeground} />
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
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: Platform.OS === "web" ? 12 : 12,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.light.text,
    padding: 0,
  },
  tabs: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 4,
    backgroundColor: colors.light.muted,
    borderRadius: 10,
    padding: 3,
    gap: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.light.mutedForeground,
  },
  tabTextActive: {
    color: "#0e7c7c",
    fontWeight: "700",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === "web" ? 34 : 24,
    paddingTop: 8,
  },
  sectionHeader: {
    backgroundColor: colors.light.background,
    paddingTop: 12,
    paddingBottom: 6,
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0e7c7c",
    textAlign: "right",
  },
  sectionHeaderSubtitle: {
    fontSize: 11,
    color: colors.light.mutedForeground,
    textAlign: "right",
  },
  // Table 1 row
  t1Row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
    paddingVertical: 11,
    paddingHorizontal: 12,
    gap: 10,
  },
  t1Name: {
    flex: 1,
    fontSize: 13,
    color: colors.light.text,
  },
  insBadge: {
    backgroundColor: "#0e7c7c",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexShrink: 0,
  },
  insBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#ffffff",
  },
  // Table 2 row
  t2Row: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
    paddingVertical: 11,
    paddingHorizontal: 12,
    gap: 10,
  },
  t2Right: {
    flex: 1,
    gap: 3,
    alignItems: "flex-end",
  },
  t2Color: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.light.text,
    textAlign: "right",
  },
  t2Food: {
    fontSize: 12,
    color: colors.light.mutedForeground,
    textAlign: "right",
    lineHeight: 17,
  },
  insBadgeAlt: {
    backgroundColor: "#6b5b9a22",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexShrink: 0,
  },
  insBadgeAltText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6b5b9a",
  },
  empty: {
    alignItems: "center",
    paddingTop: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: colors.light.mutedForeground,
  },
});
