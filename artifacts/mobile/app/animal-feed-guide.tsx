import React, { useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import colors from "@/constants/colors";
import ANIMAL_FEED_GUIDE, { FeedGuideRow } from "@/constants/animal-feed-guide";

const ACCENT = "#f57f17";
const ACCENT_LIGHT = "#fff8e1";

// Derive unique animal values from the data, preserving document order
const ANIMAL_FILTERS: string[] = (() => {
  const seen = new Set<string>();
  const result: string[] = [];
  ANIMAL_FEED_GUIDE.forEach((s) =>
    s.rows.forEach((r) => {
      if (!seen.has(r.animals)) {
        seen.add(r.animals);
        result.push(r.animals);
      }
    })
  );
  return result;
})();

interface FilterSection {
  sectionId: string;
  sectionTitle: string;
  note?: string;
  rows: { row: FeedGuideRow; rowIndex: number }[];
}

function RowCard({ row }: { row: FeedGuideRow }) {
  const hasValues =
    (row.min && row.min !== "—") || (row.max && row.max !== "—");
  return (
    <View style={rowStyles.card}>
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
      {row.notes ? <Text style={rowStyles.notes}>{row.notes}</Text> : null}
    </View>
  );
}

function SectionBlock({
  sectionId,
  sectionTitle,
  rows,
  note,
  collapsed,
  onToggle,
}: {
  sectionId: string;
  sectionTitle: string;
  rows: { row: FeedGuideRow; rowIndex: number }[];
  note?: string;
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <View>
      <Pressable
        style={({ pressed }) => [
          styles.sectionHeader,
          { opacity: pressed ? 0.82 : 1 },
        ]}
        onPress={onToggle}
      >
        <Text style={styles.chevron}>{collapsed ? "▸" : "▾"}</Text>
        <Text style={styles.sectionTitle}>{sectionTitle}</Text>
        <Text style={styles.sectionCount}>{rows.length}</Text>
      </Pressable>

      {!collapsed && (
        <View>
          {rows.map(({ row, rowIndex }) => (
            <View key={`${sectionId}-${rowIndex}`} style={styles.rowWrap}>
              <RowCard row={row} />
            </View>
          ))}
          {note && (
            <View style={styles.noteWrap}>
              <View style={styles.noteBox}>
                <Text style={styles.noteText}>{note}</Text>
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const ALL_COLLAPSED = Object.fromEntries(
  ANIMAL_FEED_GUIDE.map((s) => [s.id, true])
);

export default function AnimalFeedGuideScreen() {
  const [collapsed, setCollapsed] =
    useState<Record<string, boolean>>(ALL_COLLAPSED);
  const [filterCollapsed, setFilterCollapsed] = useState<
    Record<string, boolean>
  >({});
  const [selectedAnimal, setSelectedAnimal] = useState<string | null>(null);

  const toggle = (id: string) =>
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));

  const toggleFilter = (id: string) =>
    setFilterCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));

  const selectAnimal = (animal: string) => {
    if (selectedAnimal === animal) {
      setSelectedAnimal(null);
    } else {
      setSelectedAnimal(animal);
      setFilterCollapsed({});
    }
  };

  const filterSections = useMemo<FilterSection[]>(() => {
    if (!selectedAnimal) return [];
    const result: FilterSection[] = [];
    ANIMAL_FEED_GUIDE.forEach((section) => {
      const matched = section.rows
        .map((row, i) => ({ row, rowIndex: i }))
        .filter(({ row }) => row.animals === selectedAnimal);
      if (matched.length > 0) {
        result.push({
          sectionId: section.id,
          sectionTitle: section.title,
          note: section.note,
          rows: matched,
        });
      }
    });
    return result;
  }, [selectedAnimal]);

  const totalRows = ANIMAL_FEED_GUIDE.reduce(
    (acc, s) => acc + s.rows.length,
    0
  );

  const totalFilteredRows = filterSections.reduce(
    (acc, s) => acc + s.rows.length,
    0
  );

  const animalFilterBar = (
    <View style={styles.filterWrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}
      >
        {ANIMAL_FILTERS.map((animal) => {
          const isActive = selectedAnimal === animal;
          return (
            <Pressable
              key={animal}
              style={[styles.animalChip, isActive && styles.animalChipActive]}
              onPress={() => selectAnimal(animal)}
            >
              <Text
                style={[
                  styles.animalChipText,
                  isActive && styles.animalChipTextActive,
                ]}
              >
                {animal}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  if (selectedAnimal) {
    return (
      <View style={styles.container}>
        {animalFilterBar}
        <FlatList
          data={filterSections}
          keyExtractor={(item) => item.sectionId}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.countText}>
              {totalFilteredRows} مادة في {filterSections.length} قسم لـ «
              {selectedAnimal}»
            </Text>
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>لا توجد نتائج</Text>
            </View>
          }
          renderItem={({ item }) => (
            <SectionBlock
              sectionId={item.sectionId}
              sectionTitle={item.sectionTitle}
              rows={item.rows}
              note={item.note}
              collapsed={filterCollapsed[item.sectionId] !== false}
              onToggle={() => toggleFilter(item.sectionId)}
            />
          )}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {animalFilterBar}
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
        renderItem={({ item: section }) => (
          <SectionBlock
            sectionId={section.id}
            sectionTitle={section.title}
            rows={section.rows.map((row, i) => ({ row, rowIndex: i }))}
            note={section.note}
            collapsed={collapsed[section.id] !== false}
            onToggle={() => toggle(section.id)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  filterWrap: {
    paddingTop: 10,
    paddingBottom: 4,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: "row",
  },
  animalChip: {
    borderWidth: 1.5,
    borderColor: ACCENT,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#ffffff",
  },
  animalChipActive: {
    backgroundColor: ACCENT,
  },
  animalChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: ACCENT,
    textAlign: "center",
  },
  animalChipTextActive: {
    color: "#ffffff",
  },
  listContent: {
    paddingTop: 6,
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
  sectionCount: {
    fontSize: 11,
    fontWeight: "700",
    color: "#ffffff",
    backgroundColor: ACCENT,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: "hidden",
    minWidth: 22,
    textAlign: "center",
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
    marginBottom: 6,
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
