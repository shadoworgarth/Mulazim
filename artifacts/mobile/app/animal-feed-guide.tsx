import React, { useState } from "react";
import {
  Platform,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";

import colors from "@/constants/colors";
import ANIMAL_FEED_GUIDE, { FeedGuideRow } from "@/constants/animal-feed-guide";

const ACCENT = "#f57f17";
const ACCENT_LIGHT = "#fff8e1";

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
      {row.notes ? (
        <Text style={rowStyles.notes}>{row.notes}</Text>
      ) : null}
    </View>
  );
}

export default function AnimalFeedGuideScreen() {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggle = (id: string) =>
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));

  const sections = ANIMAL_FEED_GUIDE.map((s) => ({
    key: s.id,
    sectionCode: s.sectionCode,
    title: s.title,
    note: s.note,
    data: collapsed[s.id] ? [] : s.rows,
    isEmpty: s.rows.length === 0,
  }));

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item, i) => `${item.name}-${i}`}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      stickySectionHeadersEnabled={false}
      renderSectionHeader={({ section }) => (
        <Pressable
          style={({ pressed }) => [
            styles.sectionHeader,
            { opacity: pressed ? 0.82 : 1 },
          ]}
          onPress={() => toggle(section.key)}
        >
          <Text style={styles.chevron}>
            {collapsed[section.key] ? "▸" : "▾"}
          </Text>
          <View style={styles.sectionHeaderBody}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionCode}>{section.sectionCode}</Text>
          </View>
        </Pressable>
      )}
      renderSectionFooter={({ section }) => {
        if (collapsed[section.key]) return null;
        const showNote = section.note;
        const showEmpty = section.isEmpty && !collapsed[section.key];
        if (!showNote && !showEmpty) return null;
        return (
          <View style={{ paddingHorizontal: 16, marginBottom: 6 }}>
            {showNote && (
              <View style={styles.noteBox}>
                <Text style={styles.noteText}>{section.note}</Text>
              </View>
            )}
          </View>
        );
      }}
      renderItem={({ item, section }) => {
        if (collapsed[section.key]) return null;
        return (
          <View style={{ paddingHorizontal: 16, marginBottom: 6 }}>
            <RowCard row={item} />
          </View>
        );
      }}
      ListHeaderComponent={
        <View style={styles.headerBanner}>
          <Text style={styles.headerBannerText}>
            دليل المواد المضافة لعلف المواشي والدواجن
          </Text>
          <Text style={styles.headerBannerSub}>
            {ANIMAL_FEED_GUIDE.reduce((acc, s) => acc + s.rows.length, 0)} مادة
            في {ANIMAL_FEED_GUIDE.length} قسم
          </Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingTop: 12,
    paddingBottom: Platform.OS === "web" ? 40 : 32,
  },
  headerBanner: {
    marginHorizontal: 16,
    marginBottom: 12,
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
    marginTop: 10,
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
  sectionHeaderBody: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: ACCENT,
    textAlign: "right",
  },
  sectionCode: {
    fontSize: 11,
    fontWeight: "600",
    color: ACCENT,
    opacity: 0.65,
    textAlign: "right",
  },
  noteBox: {
    backgroundColor: "#fff9c4",
    borderWidth: 1,
    borderColor: "#f9a825",
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
    marginBottom: 6,
  },
  noteText: {
    fontSize: 12,
    color: "#5d4037",
    textAlign: "right",
    lineHeight: 19,
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
