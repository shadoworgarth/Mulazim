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
import ANIMAL_FEED_GUIDE, { FeedGuideRow } from "@/constants/animal-feed-guide";

const ACCENT = "#f57f17";
const ACCENT_LIGHT = "#fff8e1";

interface SearchResult {
  row: FeedGuideRow;
  sectionTitle: string;
  sectionId: string;
  rowIndex: number;
}

function RowCard({
  row,
  sectionTitle,
  showSection,
}: {
  row: FeedGuideRow;
  sectionTitle?: string;
  showSection?: boolean;
}) {
  const hasValues =
    (row.min && row.min !== "—") || (row.max && row.max !== "—");

  return (
    <View style={rowStyles.card}>
      {showSection && sectionTitle && (
        <Text style={rowStyles.sectionTag}>{sectionTitle}</Text>
      )}
      <View style={rowStyles.nameRow}>
        <Text style={rowStyles.name}>{row.name}</Text>
        <Text style={rowStyles.unit}>{row.unit}</Text>
      </View>
      <Text style={rowStyles.animals}>{row.animals}</Text>
      {hasValues && (
        <View style={rowStyles.rangeRow}>
          <View style={rowStyles.rangeBox}>
            <Text style={rowStyles.rangeLabel}>الأدنى</Text>
            <Text style={rowStyles.rangeVal}>{row.min || "—"}</Text>
          </View>
          <View style={rowStyles.rangeDivider} />
          <View style={rowStyles.rangeBox}>
            <Text style={rowStyles.rangeLabel}>الأقصى</Text>
            <Text style={rowStyles.rangeVal}>{row.max || "—"}</Text>
          </View>
        </View>
      )}
      {row.notes ? (
        <Text style={rowStyles.notes}>{row.notes}</Text>
      ) : null}
    </View>
  );
}

const ALL_SECTION_IDS = Object.fromEntries(
  ANIMAL_FEED_GUIDE.map((s) => [s.id, true])
);

export default function AnimalFeedGuideScreen() {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(
    ALL_SECTION_IDS
  );
  const [search, setSearch] = useState("");

  const q = search.trim().toLowerCase();

  const toggle = (id: string) =>
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));

  const searchResults = useMemo<SearchResult[]>(() => {
    if (!q) return [];
    const results: SearchResult[] = [];
    ANIMAL_FEED_GUIDE.forEach((section) => {
      section.rows.forEach((row, i) => {
        if (
          row.name.toLowerCase().includes(q) ||
          row.animals.toLowerCase().includes(q)
        ) {
          results.push({
            row,
            sectionTitle: section.title,
            sectionId: section.id,
            rowIndex: i,
          });
        }
      });
    });
    return results;
  }, [q]);

  const totalRows = ANIMAL_FEED_GUIDE.reduce(
    (acc, s) => acc + s.rows.length,
    0
  );

  if (q) {
    return (
      <View style={styles.container}>
        <View style={styles.searchWrap}>
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث عن مادة أو حيوان..."
            placeholderTextColor={colors.light.mutedForeground}
            value={search}
            onChangeText={setSearch}
            textAlign="right"
            returnKeyType="search"
          />
        </View>
        <FlatList
          data={searchResults}
          keyExtractor={(item) => `${item.sectionId}-${item.rowIndex}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.countText}>
              {searchResults.length} نتيجة لـ &quot;{search.trim()}&quot;
            </Text>
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>لا توجد نتائج</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.rowWrap}>
              <RowCard
                row={item.row}
                sectionTitle={item.sectionTitle}
                showSection
              />
            </View>
          )}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder="ابحث عن مادة أو حيوان..."
          placeholderTextColor={colors.light.mutedForeground}
          value={search}
          onChangeText={setSearch}
          textAlign="right"
          returnKeyType="search"
        />
      </View>

      <FlatList
        data={ANIMAL_FEED_GUIDE}
        keyExtractor={(s) => s.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.headerBanner}>
            <Text style={styles.headerBannerText}>
              دليل المواد المضافة لعلف المواشي والدواجن
            </Text>
            <Text style={styles.headerBannerSub}>
              {totalRows} مادة في {ANIMAL_FEED_GUIDE.length} قسم
            </Text>
          </View>
        }
        renderItem={({ item: section }) => {
          const isCollapsed = collapsed[section.id] !== false;
          return (
            <View>
              <Pressable
                style={({ pressed }) => [
                  styles.sectionHeader,
                  { opacity: pressed ? 0.82 : 1 },
                ]}
                onPress={() => toggle(section.id)}
              >
                <Text style={styles.chevron}>
                  {isCollapsed ? "▸" : "▾"}
                </Text>
                <Text style={styles.sectionTitle}>{section.title}</Text>
              </Pressable>

              {!isCollapsed && (
                <View>
                  {section.rows.map((row, i) => (
                    <View key={`${section.id}-${i}`} style={styles.rowWrap}>
                      <RowCard row={row} />
                    </View>
                  ))}
                  {section.note && (
                    <View style={styles.noteWrap}>
                      <View style={styles.noteBox}>
                        <Text style={styles.noteText}>{section.note}</Text>
                      </View>
                    </View>
                  )}
                  {section.rows.length === 0 && section.note && null}
                </View>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  searchWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  searchInput: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
    fontSize: 14,
    color: colors.light.text,
    textAlign: "right",
  },
  listContent: {
    paddingTop: 4,
    paddingBottom: Platform.OS === "web" ? 40 : 32,
  },
  headerBanner: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: `${ACCENT}22`,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "flex-end",
  },
  headerBannerText: {
    fontSize: 14,
    fontWeight: "700",
    color: ACCENT,
    textAlign: "right",
  },
  headerBannerSub: {
    fontSize: 12,
    color: ACCENT,
    textAlign: "right",
    marginTop: 2,
    opacity: 0.8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 6,
    backgroundColor: ACCENT_LIGHT,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  chevron: {
    fontSize: 16,
    color: ACCENT,
    flexShrink: 0,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: ACCENT,
    textAlign: "right",
  },
  rowWrap: {
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  noteWrap: {
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  noteBox: {
    backgroundColor: "#fff9c4",
    borderWidth: 1,
    borderColor: "#f9a825",
    borderRadius: 10,
    padding: 12,
    marginTop: 2,
    marginBottom: 4,
  },
  noteText: {
    fontSize: 12,
    color: "#5d4037",
    textAlign: "right",
    lineHeight: 19,
  },
  countText: {
    fontSize: 12,
    color: colors.light.mutedForeground,
    textAlign: "right",
    marginBottom: 8,
    marginHorizontal: 16,
  },
  emptyWrap: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: colors.light.mutedForeground,
  },
});

const rowStyles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    gap: 6,
  },
  sectionTag: {
    fontSize: 10,
    fontWeight: "600",
    color: ACCENT,
    backgroundColor: ACCENT_LIGHT,
    alignSelf: "flex-end",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: "hidden",
  },
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.light.text,
    flex: 1,
  },
  unit: {
    fontSize: 11,
    fontWeight: "600",
    color: ACCENT,
    backgroundColor: ACCENT_LIGHT,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: "hidden",
  },
  animals: {
    fontSize: 12,
    color: colors.light.mutedForeground,
    textAlign: "right",
  },
  rangeRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 4,
  },
  rangeBox: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
  },
  rangeDivider: {
    width: 1,
    backgroundColor: "#e0e0e0",
  },
  rangeLabel: {
    fontSize: 10,
    color: colors.light.mutedForeground,
    fontWeight: "500",
  },
  rangeVal: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.light.text,
    marginTop: 2,
  },
  notes: {
    fontSize: 11,
    color: "#5d4037",
    textAlign: "right",
    backgroundColor: "#fff8e1",
    borderRadius: 6,
    padding: 8,
    lineHeight: 17,
  },
});
