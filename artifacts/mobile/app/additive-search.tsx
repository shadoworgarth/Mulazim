import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import appData, { SubItem } from "@/constants/data";
import colors from "@/constants/colors";

interface SearchResult {
  categoryIndex: number;
  categoryName: string;
  itemIndex: number;
  item: SubItem;
  matchedAdditive: string;
}

function highlight(text: string, query: string): React.ReactNode {
  if (!query.trim()) return <Text style={styles.matchText}>{text}</Text>;
  const lq = query.toLowerCase();
  const lt = text.toLowerCase();
  const idx = lt.indexOf(lq);
  if (idx === -1) return <Text style={styles.matchText}>{text}</Text>;
  return (
    <Text style={styles.matchText}>
      {text.slice(0, idx)}
      <Text style={styles.matchHighlight}>{text.slice(idx, idx + query.length)}</Text>
      {text.slice(idx + query.length)}
    </Text>
  );
}

export default function AdditiveSearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 2) return [];

    const found: SearchResult[] = [];

    appData.forEach((category, categoryIndex) => {
      category.subItems.forEach((item, itemIndex) => {
        if (!item.data?.row2.D) return;

        const additivesText = item.data.row2.D.toLowerCase();
        if (!additivesText.includes(q)) return;

        // Find which line(s) match
        const lines = item.data.row2.D
          .split(/[\r\n]+/)
          .map((s) => s.trim())
          .filter(Boolean);

        const matchedLine = lines.find((l) => l.toLowerCase().includes(q)) ?? item.data!.row2.D.slice(0, 80);

        found.push({
          categoryIndex,
          categoryName: category.name.trim(),
          itemIndex,
          item,
          matchedAdditive: matchedLine,
        });
      });
    });

    return found;
  }, [query]);

  const handleResult = useCallback(
    (result: SearchResult) => {
      router.push({
        pathname: "/detail",
        params: {
          categoryIndex: result.categoryIndex,
          itemIndex: result.itemIndex,
        },
      });
    },
    [router]
  );

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View
        style={[
          styles.header,
          { paddingTop: Platform.OS === "web" ? 67 : insets.top + 12 },
        ]}
      >
        <Text style={styles.headerTitle}>بحث عن مادة مضافة</Text>
        <Text style={styles.headerSubtitle}>
          ابحث باسم المادة المضافة لمعرفة المنتجات المسموح بها
        </Text>
        <View style={styles.searchBox}>
          <Feather name="search" size={18} color="#0e7c7c" />
          <TextInput
            style={styles.searchInput}
            placeholder="مثال: ASCORBYL ESTERS 304"
            placeholderTextColor="#9bb0b0"
            value={query}
            onChangeText={setQuery}
            autoFocus
            autoCapitalize="characters"
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")}>
              <Feather name="x-circle" size={18} color={colors.light.mutedForeground} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Results */}
      <FlatList
        data={results}
        keyExtractor={(_, i) => i.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          query.trim().length >= 2 ? (
            <Text style={styles.resultCount}>
              {results.length > 0
                ? `${results.length} نتيجة`
                : "لا توجد نتائج"}
            </Text>
          ) : null
        }
        renderItem={({ item: result }) => (
          <Pressable
            style={({ pressed }) => [
              styles.resultCard,
              { opacity: pressed ? 0.84 : 1 },
            ]}
            onPress={() => handleResult(result)}
          >
            {/* Item name */}
            <View style={styles.resultHeader}>
              <Feather
                name="chevron-left"
                size={16}
                color={colors.light.mutedForeground}
              />
              <Text style={styles.resultItemName} numberOfLines={2}>
                {result.item.name.trim()}
              </Text>
            </View>

            {/* Category badge */}
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText} numberOfLines={1}>
                {result.categoryName}
              </Text>
            </View>

            {/* Matched additive line */}
            <View style={styles.matchRow}>
              <Feather name="check-circle" size={14} color="#0e7c7c" style={styles.matchIcon} />
              <View style={styles.matchTextWrap}>
                {highlight(result.matchedAdditive, query.trim())}
              </View>
            </View>

            {result.item.data?.row2.A ? (
              <Text style={styles.itemCode}>{result.item.data.row2.A}</Text>
            ) : null}
          </Pressable>
        )}
        ListEmptyComponent={
          query.trim().length >= 2 ? (
            <View style={styles.emptyState}>
              <Feather name="search" size={48} color={colors.light.mutedForeground} />
              <Text style={styles.emptyTitle}>لا توجد نتائج</Text>
              <Text style={styles.emptySubtitle}>
                جرب البحث بجزء من اسم المادة المضافة
              </Text>
            </View>
          ) : query.trim().length > 0 ? (
            <View style={styles.emptyState}>
              <Feather name="type" size={48} color={colors.light.mutedForeground} />
              <Text style={styles.emptyTitle}>أدخل حرفين على الأقل</Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Feather name="search" size={48} color={colors.light.mutedForeground} />
              <Text style={styles.emptyTitle}>ابدأ البحث</Text>
              <Text style={styles.emptySubtitle}>
                اكتب اسم أي مادة مضافة للعثور على جميع المنتجات المرتبطة بها
              </Text>
            </View>
          )
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
    backgroundColor: "#0a5f5f",
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
    fontSize: 12,
    color: "#b2d8d8",
    textAlign: "right",
    marginBottom: 14,
    lineHeight: 18,
  },
  searchBox: {
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
    fontSize: 14,
    color: colors.light.text,
    padding: 0,
  },
  listContent: {
    padding: 16,
    paddingBottom: Platform.OS === "web" ? 34 : 24,
    gap: 10,
  },
  resultCount: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.light.mutedForeground,
    textAlign: "right",
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  resultCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 14,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  resultItemName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: colors.light.text,
    textAlign: "right",
    lineHeight: 22,
  },
  categoryBadge: {
    backgroundColor: "#0e7c7c22",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: "flex-end",
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#0e7c7c",
    textAlign: "right",
  },
  matchRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    backgroundColor: "#f0faf8",
    borderRadius: 8,
    padding: 8,
  },
  matchIcon: {
    marginTop: 1,
    flexShrink: 0,
  },
  matchTextWrap: {
    flex: 1,
  },
  matchText: {
    fontSize: 12,
    color: colors.light.text,
    lineHeight: 18,
  },
  matchHighlight: {
    backgroundColor: "#ffe066",
    color: "#333",
    fontWeight: "700",
    borderRadius: 3,
  },
  itemCode: {
    fontSize: 11,
    color: "#0e7c7c",
    textAlign: "right",
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 60,
    gap: 12,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.light.text,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.light.mutedForeground,
    textAlign: "center",
    lineHeight: 22,
  },
});
