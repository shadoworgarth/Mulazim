import { useRouter } from "expo-router";
import React, { useDeferredValue, useMemo, useState } from "react";
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
import { searchByCommodity } from "@/constants/fao-codex";

const RESULT_LIMIT = 500;

export default function PesticidesFaoCommodityScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query);

  const results = useMemo(() => {
    return searchByCommodity(deferred, RESULT_LIMIT + 1);
  }, [deferred]);

  const truncated = results.length > RESULT_LIMIT;
  const display = truncated ? results.slice(0, RESULT_LIMIT) : results;

  return (
    <FlatList
      data={display}
      keyExtractor={(_, i) => i.toString()}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View>
          <View style={styles.titleCard}>
            <Text style={styles.titleText}>بحث حسب المنتج الغذائي</Text>
            <Text style={styles.subtitleText}>
              Find all pesticide MRLs for a commodity
            </Text>
          </View>
          <View style={styles.searchWrap}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="e.g. Tomato, Rice, Apple, Wheat…"
              placeholderTextColor="#9ca3af"
              style={styles.searchInput}
              textAlign="left"
              autoCorrect={false}
              autoCapitalize="none"
              autoFocus
            />
          </View>
          {deferred.trim() ? (
            <Text style={styles.resultCount}>
              {truncated
                ? `أكثر من ${RESULT_LIMIT} نتيجة — يرجى تحديد البحث`
                : `${results.length} نتيجة`}
            </Text>
          ) : (
            <Text style={styles.hintText}>
              اكتب اسم منتج غذائي بالإنجليزية لعرض الحدود القصوى
            </Text>
          )}
        </View>
      }
      ListEmptyComponent={
        deferred.trim() ? (
          <View style={styles.center}>
            <Text style={{ fontSize: 36 }}>🔍</Text>
            <Text style={styles.emptyText}>لا توجد نتائج مطابقة</Text>
          </View>
        ) : null
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
              params: { id: item.pesticideId },
            } as any)
          }
        >
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.pesticideText}>{item.pesticide}</Text>
              <Text style={styles.commodityText}>{item.commodity}</Text>
            </View>
            <View style={styles.limitPill}>
              <Text style={styles.limitValue}>{item.mrl}</Text>
            </View>
          </View>
          {item.cacYear ? (
            <Text style={styles.metaText}>CAC {item.cacYear}</Text>
          ) : null}
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
  hintText: {
    fontSize: 12,
    color: colors.light.mutedForeground,
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 20,
  },
  listContent: {
    padding: 16,
    paddingBottom: Platform.OS === "web" ? 34 : 24,
    gap: 8,
  },
  titleCard: {
    backgroundColor: "#0e7c7c",
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  titleText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
    textAlign: "left",
  },
  subtitleText: {
    fontSize: 12,
    color: "#b2dfdb",
    textAlign: "left",
    marginTop: 4,
  },
  searchWrap: {
    marginBottom: 4,
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
    marginVertical: 6,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    gap: 6,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  pesticideText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0d47a1",
    textAlign: "left",
  },
  commodityText: {
    fontSize: 12,
    color: colors.light.text,
    textAlign: "left",
    marginTop: 2,
  },
  limitPill: {
    backgroundColor: "#e3f2fd",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: "center",
    minWidth: 80,
  },
  limitValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0d47a1",
    textAlign: "center",
  },
  metaText: {
    fontSize: 10,
    color: colors.light.mutedForeground,
    textAlign: "left",
  },
});
