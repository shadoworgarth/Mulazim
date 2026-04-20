import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import React, { useEffect } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import appData from "@/constants/data";
import colors from "@/constants/colors";

export default function ItemsScreen() {
  const { categoryIndex } = useLocalSearchParams<{ categoryIndex: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const idx = parseInt(categoryIndex ?? "0", 10);
  const category = appData[idx];

  useEffect(() => {
    if (category) {
      navigation.setOptions({ title: category.name.trim() });
    }
  }, [category, navigation]);

  if (!category) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>لم يتم العثور على التصنيف</Text>
      </View>
    );
  }

  const handleItem = (itemIndex: number) => {
    router.push({
      pathname: "/detail",
      params: { categoryIndex: idx, itemIndex },
    });
  };

  return (
    <FlatList
      data={category.subItems}
      keyExtractor={(_, i) => i.toString()}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      scrollEnabled={category.subItems.length > 0}
      ListHeaderComponent={
        <View style={styles.headerBanner}>
          <Text style={styles.headerBannerText}>
            {category.subItems.length} صنف متاح
          </Text>
        </View>
      }
      renderItem={({ item, index }) => {
        const hasData = !!item.data;
        return (
          <Pressable
            style={({ pressed }) => [
              styles.card,
              !hasData && styles.cardDisabled,
              { opacity: pressed && hasData ? 0.82 : 1 },
            ]}
            onPress={() => hasData && handleItem(index)}
          >
            <View style={styles.cardInner}>
              {hasData && (
                <Text style={{ fontSize: 18, color: colors.light.mutedForeground }}>›</Text>
              )}
              <View style={styles.cardBody}>
                <Text
                  style={[styles.itemName, !hasData && styles.itemNameMuted]}
                  numberOfLines={3}
                >
                  {item.name.trim()}
                </Text>
                {item.data?.row2.A ? (
                  <Text style={styles.itemCode}>{item.data.row2.A}</Text>
                ) : null}
                {item.data?.row2.C === "نعم" ? (
                  <View style={styles.generalBadge}>
                    <Text style={styles.generalBadgeText}>يسمح بالمضافات العامة</Text>
                  </View>
                ) : null}
              </View>
              <View
                style={[
                  styles.indexBadge,
                  !hasData && styles.indexBadgeDisabled,
                ]}
              >
                <Text
                  style={[
                    styles.indexText,
                    !hasData && styles.indexTextDisabled,
                  ]}
                >
                  {index + 1}
                </Text>
              </View>
            </View>
          </Pressable>
        );
      }}
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={{ fontSize: 48, color: colors.light.mutedForeground }}>📥</Text>
          <Text style={styles.emptyText}>لا توجد أصناف</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingTop: 60,
  },
  errorText: {
    fontSize: 16,
    color: colors.light.mutedForeground,
  },
  listContent: {
    padding: 16,
    paddingBottom: Platform.OS === "web" ? 34 : 24,
    gap: 8,
  },
  headerBanner: {
    backgroundColor: "#0e7c7c22",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 8,
    alignItems: "flex-end",
  },
  headerBannerText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#0e7c7c",
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
  cardDisabled: {
    backgroundColor: "#f5f7f7",
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
    backgroundColor: "#0e7c7c",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  indexBadgeDisabled: {
    backgroundColor: colors.light.muted,
  },
  indexText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#ffffff",
  },
  indexTextDisabled: {
    color: colors.light.mutedForeground,
  },
  cardBody: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.light.text,
    textAlign: "right",
    lineHeight: 21,
  },
  itemNameMuted: {
    color: colors.light.mutedForeground,
  },
  itemCode: {
    fontSize: 12,
    color: "#0e7c7c",
    textAlign: "right",
    marginTop: 3,
  },
  emptyText: {
    fontSize: 16,
    color: colors.light.mutedForeground,
  },
  generalBadge: {
    alignSelf: "flex-end",
    backgroundColor: "#e0f4f4",
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginTop: 5,
  },
  generalBadgeText: {
    fontSize: 11,
    color: "#0e7c7c",
    fontWeight: "600",
  },
});
