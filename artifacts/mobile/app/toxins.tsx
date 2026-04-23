import { useRouter } from "expo-router";
import React from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import colors from "@/constants/colors";
import toxins from "@/constants/toxins";

export default function ToxinsScreen() {
  const router = useRouter();

  const handleItem = (toxinIndex: number) => {
    router.push({
      pathname: "/toxin-detail",
      params: { toxinIndex },
    });
  };

  return (
    <FlatList
      data={toxins}
      keyExtractor={(_, i) => i.toString()}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <View>
          <View style={styles.headerBanner}>
            <Text style={styles.headerBannerText}>
              {toxins.length} ملوث متاح
            </Text>
          </View>
        </View>
      }
      renderItem={({ item, index }) => (
        <Pressable
          style={({ pressed }) => [
            styles.card,
            { opacity: pressed ? 0.82 : 1 },
          ]}
          onPress={() => handleItem(index)}
        >
          <View style={styles.cardInner}>
            <Text style={{ fontSize: 18, color: colors.light.mutedForeground }}>
              ›
            </Text>
            <View style={styles.cardBody}>
              <Text style={styles.itemName} numberOfLines={3}>
                {item.toxin}
              </Text>
              <Text style={styles.itemCount}>
                {item.rows.length} صنف غذائي
              </Text>
            </View>
            <View style={styles.indexBadge}>
              <Text style={styles.indexText}>{index + 1}</Text>
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
    backgroundColor: "#c2185b22",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 8,
    alignItems: "flex-end",
  },
  headerBannerText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#c2185b",
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
    backgroundColor: "#c2185b",
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
    color: "#c2185b",
    textAlign: "right",
    marginTop: 3,
  },
});
