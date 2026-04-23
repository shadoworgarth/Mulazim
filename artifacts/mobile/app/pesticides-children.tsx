import React from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";

import colors from "@/constants/colors";
import pesticides from "@/constants/pesticides";

const ITEMS = pesticides.sections.children.items;

export default function PesticidesChildrenScreen() {
  return (
    <FlatList
      data={ITEMS}
      keyExtractor={(_, i) => i.toString()}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <View>
          <View style={styles.titleCard}>
            <Text style={styles.titleText}>
              {pesticides.sections.children.title}
            </Text>
            <Text style={styles.subtitleText}>
              {ITEMS.length} مبيد مسجل
            </Text>
          </View>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.row}>
          <Text style={styles.rowName}>{item.name}</Text>
          <View style={styles.mrlPill}>
            <Text style={styles.mrlValue}>{item.mrl}</Text>
            <Text style={styles.mrlUnit}>mg/kg</Text>
          </View>
        </View>
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
  titleCard: {
    backgroundColor: "#1565c0",
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  titleText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
    textAlign: "right",
    lineHeight: 22,
  },
  subtitleText: {
    fontSize: 12,
    color: "#bbdefb",
    textAlign: "right",
    marginTop: 4,
  },
  row: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  rowName: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    color: colors.light.text,
    textAlign: "left",
    lineHeight: 19,
  },
  mrlPill: {
    backgroundColor: "#e3f2fd",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: "center",
    minWidth: 70,
  },
  mrlValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0d47a1",
  },
  mrlUnit: {
    fontSize: 9,
    color: "#1565c0",
    marginTop: 1,
  },
});
