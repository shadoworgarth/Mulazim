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

const ITEMS = pesticides.sections.prohibited.items;

export default function PesticidesProhibitedScreen() {
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
              {pesticides.sections.prohibited.title}
            </Text>
            <Text style={styles.subtitleText}>
              {ITEMS.length} مبيد محظور
            </Text>
          </View>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.row}>
          <Text style={styles.banIcon}>🚫</Text>
          <Text style={styles.rowName}>{item.name}</Text>
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
    backgroundColor: "#c62828",
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
    color: "#ffcdd2",
    textAlign: "right",
    marginTop: 4,
  },
  row: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
    borderRightWidth: 3,
    borderRightColor: "#c62828",
  },
  banIcon: {
    fontSize: 18,
  },
  rowName: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    color: colors.light.text,
    textAlign: "left",
    lineHeight: 19,
  },
});
