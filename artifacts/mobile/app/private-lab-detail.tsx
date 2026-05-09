import { useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Linking,
  Platform,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";

import colors from "@/constants/colors";
import { LabField, PRIVATE_LABS } from "@/constants/private-labs";
import { LAB_CONTACTS } from "@/constants/private-labs-contact";

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
  // All fields collapsed by default
  const [expandedFields, setExpandedFields] = useState<Set<LabField>>(new Set());

  const lab = useMemo(
    () => PRIVATE_LABS.find((l) => String(l.id) === id),
    [id]
  );

  const sections = useMemo<Section[]>(() => {
    if (!lab) return [];
    const grouped: Map<string, Section> = new Map();

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

  const toggleField = (field: LabField) => {
    setExpandedFields((prev) => {
      const next = new Set(prev);
      next.has(field) ? next.delete(field) : next.add(field);
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
      ListHeaderComponent={(() => {
        const contact = LAB_CONTACTS[lab.id];
        return (
          <View style={styles.labHeader}>
            <Text style={styles.labName}>{lab.name}</Text>
            <Text style={styles.labMeta}>
              {lab.tests.length} اختبار ·{" "}
              {byField.map((g) => FIELD_LABELS[g.field]).join(" · ")}
            </Text>

            {contact && (
              <View style={styles.contactCard}>
                {contact.address && (
                  <View style={styles.contactRow}>
                    <Text style={styles.contactIcon}>📍</Text>
                    <Text style={styles.contactValue}>{contact.address}</Text>
                  </View>
                )}
                {contact.phones?.map((p, i) => (
                  <Pressable
                    key={i}
                    style={({ pressed }) => [styles.contactRow, { opacity: pressed ? 0.7 : 1 }]}
                    onPress={() => Linking.openURL(`tel:${p.replace(/\s/g, "")}`)}
                  >
                    <Text style={styles.contactIcon}>📞</Text>
                    <Text style={[styles.contactValue, styles.contactLink]}>{p}</Text>
                  </Pressable>
                ))}
                {contact.emails?.map((e, i) => (
                  <Pressable
                    key={i}
                    style={({ pressed }) => [styles.contactRow, { opacity: pressed ? 0.7 : 1 }]}
                    onPress={() => Linking.openURL(`mailto:${e}`)}
                  >
                    <Text style={styles.contactIcon}>✉️</Text>
                    <Text style={[styles.contactValue, styles.contactLink, styles.contactLtr]}>{e}</Text>
                  </Pressable>
                ))}
                {contact.website && (
                  <Pressable
                    style={({ pressed }) => [styles.contactRow, { opacity: pressed ? 0.7 : 1 }]}
                    onPress={() => {
                      const url = contact.website!.startsWith("http")
                        ? contact.website!
                        : `https://${contact.website}`;
                      Linking.openURL(url);
                    }}
                  >
                    <Text style={styles.contactIcon}>🌐</Text>
                    <Text style={[styles.contactValue, styles.contactLink, styles.contactLtr]}>
                      {contact.website}
                    </Text>
                  </Pressable>
                )}
              </View>
            )}

            {/* Field toggle buttons rendered here in the header */}
            <View style={styles.fieldTogglesWrap}>
              {byField.map((g) => {
                const fc = FIELD_COLORS[g.field];
                const isExpanded = expandedFields.has(g.field);
                const totalTests = g.sections.reduce((a, s) => a + s.data.length, 0);
                return (
                  <Pressable
                    key={g.field}
                    style={({ pressed }) => [
                      styles.fieldToggle,
                      { backgroundColor: isExpanded ? fc.badge : "#fff", borderColor: fc.badge },
                      pressed && { opacity: 0.85 },
                    ]}
                    onPress={() => toggleField(g.field)}
                  >
                    <Text style={[styles.fieldToggleLabel, { color: isExpanded ? "#fff" : fc.badge }]}>
                      {FIELD_LABELS[g.field]}
                    </Text>
                    <Text style={[styles.fieldToggleCount, { color: isExpanded ? "rgba(255,255,255,0.85)" : fc.text }]}>
                      {totalTests} اختبار
                    </Text>
                    <Text style={[styles.fieldToggleChevron, { color: isExpanded ? "#fff" : fc.badge }]}>
                      {isExpanded ? "▲" : "▼"}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      })()}
      renderSectionHeader={({ section }) => {
        const sec = section as Section & { key: string };
        const fc = FIELD_COLORS[sec.field];
        const isFieldExpanded = expandedFields.has(sec.field);
        if (!isFieldExpanded) return null;
        return (
          <View style={[styles.productRow, { backgroundColor: fc.light }]}>
            <View style={styles.productBody}>
              <Text style={styles.productName}>{sec.product}</Text>
              <Text style={[styles.productCount, { color: fc.text }]}>
                {sec.data.length} اختبار
              </Text>
            </View>
          </View>
        );
      }}
      renderItem={({ item, section }) => {
        const sec = section as Section & { key: string };
        const isFieldExpanded = expandedFields.has(sec.field);
        if (!isFieldExpanded) return null;
        const fc = FIELD_COLORS[sec.field];
        return (
          <View style={styles.testRow}>
            <View style={styles.testLeft}>
              <Text style={styles.testParam}>{item.parameter}</Text>
            </View>
            {item.price ? (
              <View style={styles.priceWrap}>
                <View style={[styles.priceBadge, { borderColor: fc.badge }]}>
                  <Text style={[styles.priceText, { color: fc.badge }]}>
                    {item.price.replace("*", "")}
                  </Text>
                  <Text style={[styles.priceCurrency, { color: fc.badge }]}>ر.س</Text>
                </View>
                {item.price.includes("*") && (
                  <Text style={styles.priceNote}>* السعر للمكرر الواحد</Text>
                )}
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
  contactCard: {
    marginTop: 10,
    backgroundColor: "#f8fffe",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#b2dfdb",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 7,
    alignSelf: "stretch",
  },
  contactRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
  },
  contactIcon: { fontSize: 14, flexShrink: 0 },
  contactValue: {
    flex: 1,
    fontSize: 13,
    color: colors.light.text,
    textAlign: "right",
  },
  contactLink: { color: "#00695c", fontWeight: "500" },
  contactLtr: { writingDirection: "ltr", textAlign: "left" },

  fieldTogglesWrap: {
    alignSelf: "stretch",
    marginTop: 12,
    gap: 8,
  },
  fieldToggle: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1.5,
    gap: 8,
  },
  fieldToggleLabel: {
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
    textAlign: "right",
  },
  fieldToggleCount: { fontSize: 12 },
  fieldToggleChevron: { fontSize: 10 },

  productRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  productBody: { flex: 1, alignItems: "flex-end", gap: 2 },
  productName: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.light.text,
    textAlign: "right",
    writingDirection: "ltr",
  },
  productCount: { fontSize: 11, fontWeight: "500" },

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
  priceWrap: { alignItems: "flex-end", gap: 3, flexShrink: 0 },
  priceBadge: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  priceText: { fontSize: 13, fontWeight: "700", writingDirection: "ltr" },
  priceCurrency: { fontSize: 10, fontWeight: "500" },
  priceNote: { fontSize: 9, color: "#9ca3af", textAlign: "right" },
});
