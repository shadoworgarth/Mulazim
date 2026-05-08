import { useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";

import colors from "@/constants/colors";
import { LabField, PRIVATE_LABS } from "@/constants/private-labs";

const FIELD_LABELS: Record<LabField, string> = {
  Food: "الغذاء",
  Cosmetics: "مستحضرات التجميل",
  Feed: "الأعلاف",
  Tobacco: "التبغ",
};

const FIELD_COLORS: Record<LabField, { bg: string; text: string; badge: string; light: string }> = {
  Food:      { bg: "#e8f5e9", text: "#1b5e20", badge: "#2e7d32", light: "#f1f8e9" },
  Cosmetics: { bg: "#fce4ec", text: "#880e4f", badge: "#ad1457", light: "#fce4ec" },
  Feed:      { bg: "#fff3e0", text: "#bf360c", badge: "#e64a19", light: "#fff8e1" },
  Tobacco:   { bg: "#efebe9", text: "#3e2723", badge: "#4e342e", light: "#fafafa" },
};

const FIELD_ORDER: LabField[] = ["Food", "Cosmetics", "Feed", "Tobacco"];

interface Section {
  field: LabField;
  product: string;
  data: { parameter: string; price?: string }[];
}

export default function PrivateLabDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());

  const lab = useMemo(
    () => PRIVATE_LABS.find((l) => String(l.id) === id),
    [id]
  );

  const sections = useMemo<Section[]>(() => {
    if (!lab) return [];
    const grouped: Map<string, Section> = new Map();

    // Sort tests by field order, then product
    const sorted = [...lab.tests].sort((a, b) => {
      const fi = FIELD_ORDER.indexOf(a.field) - FIELD_ORDER.indexOf(b.field);
      if (fi !== 0) return fi;
      return a.product.localeCompare(b.product);
    });

    sorted.forEach((t) => {
      const key = `${t.field}||${t.product}`;
      if (!grouped.has(key)) {
        grouped.set(key, { field: t.field, product: t.product, data: [] });
      }
      grouped.get(key)!.data.push({ parameter: t.parameter, price: t.price });
    });

    return Array.from(grouped.values());
  }, [lab]);

  const toggleProduct = (key: string) => {
    setExpandedProducts((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  if (!lab) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>المختبر غير موجود</Text>
      </View>
    );
  }

  // Group sections by field for field headers
  const byField = FIELD_ORDER.map((field) => ({
    field,
    sections: sections.filter((s) => s.field === field),
  })).filter((g) => g.sections.length > 0);

  return (
    <SectionList
      sections={byField.flatMap((g) =>
        g.sections.map((s) => ({ ...s, key: `${s.field}||${s.product}` }))
      )}
      keyExtractor={(item, index) => `${item.parameter}-${index}`}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      stickySectionHeadersEnabled={false}
      ListHeaderComponent={
        <View style={styles.labHeader}>
          <Text style={styles.labName}>{lab.name}</Text>
          <Text style={styles.labMeta}>
            {lab.tests.length} اختبار ·{" "}
            {byField.map((g) => FIELD_LABELS[g.field]).join(" · ")}
          </Text>
          {(lab.phone || lab.email) && (
            <View style={styles.contactRow}>
              {lab.phone && <Text style={styles.contactText}>📞 {lab.phone}</Text>}
              {lab.email && <Text style={styles.contactText}>✉️ {lab.email}</Text>}
            </View>
          )}
        </View>
      }
      renderSectionHeader={({ section }) => {
        const sec = section as Section & { key: string };
        const fc = FIELD_COLORS[sec.field];
        const isExpanded = expandedProducts.has(sec.key);
        const isFirstInField =
          sections.findIndex((s) => s.field === sec.field) ===
          sections.findIndex((s) => s.field === sec.field && s.product === sec.product);

        return (
          <View>
            {/* Field header — only for the first product in each field */}
            {isFirstInField && (
              <View style={[styles.fieldHeader, { backgroundColor: fc.badge }]}>
                <Text style={styles.fieldHeaderText}>{FIELD_LABELS[sec.field]}</Text>
                <Text style={styles.fieldHeaderCount}>
                  {sections.filter((s) => s.field === sec.field).reduce((a, s) => a + s.data.length, 0)} اختبار
                </Text>
              </View>
            )}

            {/* Product row — tappable to expand/collapse */}
            <Pressable
              style={[styles.productRow, { backgroundColor: fc.light }]}
              onPress={() => toggleProduct(sec.key)}
            >
              <Text style={styles.expandChevron}>{isExpanded ? "▲" : "▼"}</Text>
              <View style={styles.productBody}>
                <Text style={styles.productName}>{sec.product}</Text>
                <Text style={[styles.productCount, { color: fc.text }]}>
                  {sec.data.length} اختبار
                </Text>
              </View>
            </Pressable>
          </View>
        );
      }}
      renderItem={({ item, section }) => {
        const sec = section as Section & { key: string };
        const isExpanded = expandedProducts.has(sec.key);
        if (!isExpanded) return null;
        const fc = FIELD_COLORS[sec.field];
        return (
          <View style={styles.testRow}>
            <View style={styles.testLeft}>
              <Text style={styles.testParam}>{item.parameter}</Text>
            </View>
            {item.price ? (
              <View style={[styles.priceBadge, { borderColor: fc.badge }]}>
                <Text style={[styles.priceText, { color: fc.badge }]}>{item.price}</Text>
                <Text style={[styles.priceCurrency, { color: fc.badge }]}>ر.س</Text>
              </View>
            ) : null}
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: Platform.OS === "web" ? 40 : 28,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  notFound: { fontSize: 16, color: colors.light.mutedForeground },

  // Lab header
  labHeader: {
    padding: 18,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    gap: 5,
    alignItems: "flex-end",
  },
  labName: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.light.text,
    textAlign: "right",
  },
  labMeta: {
    fontSize: 13,
    color: colors.light.mutedForeground,
    textAlign: "right",
  },
  contactRow: { gap: 6, alignItems: "flex-end", marginTop: 4 },
  contactText: { fontSize: 13, color: "#00695c", writingDirection: "ltr" },

  // Field header
  fieldHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 10,
  },
  fieldHeaderText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  fieldHeaderCount: { fontSize: 12, color: "rgba(255,255,255,0.85)" },

  // Product row
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    gap: 10,
  },
  expandChevron: { fontSize: 10, color: "#9ca3af", flexShrink: 0 },
  productBody: { flex: 1, alignItems: "flex-end", gap: 2 },
  productName: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.light.text,
    textAlign: "right",
    writingDirection: "ltr",
  },
  productCount: { fontSize: 11, fontWeight: "500" },

  // Test row
  testRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
    backgroundColor: "#fff",
    gap: 10,
  },
  testLeft: { flex: 1, alignItems: "flex-end" },
  testParam: {
    fontSize: 13,
    color: colors.light.text,
    textAlign: "left",
    writingDirection: "ltr",
  },
  priceBadge: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexShrink: 0,
  },
  priceText: { fontSize: 13, fontWeight: "700", writingDirection: "ltr" },
  priceCurrency: { fontSize: 10, fontWeight: "500" },
});
