import { useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";
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

const FIELD_COLORS: Record<LabField, { bg: string; text: string; badge: string }> = {
  Food:      { bg: "#e8f5e9", text: "#1b5e20", badge: "#2e7d32" },
  Cosmetics: { bg: "#fce4ec", text: "#880e4f", badge: "#ad1457" },
  Feed:      { bg: "#fff3e0", text: "#bf360c", badge: "#e64a19" },
  Tobacco:   { bg: "#efebe9", text: "#3e2723", badge: "#4e342e" },
};

const FIELD_ORDER: LabField[] = ["Food", "Cosmetics", "Feed", "Tobacco"];

// Each row in the flat list
interface TestRow {
  parameter: string;
  price?: string;
  product?: string; // only shown when price differs for this parameter across products
}

interface Section {
  field: LabField;
  data: TestRow[];
}

function normPrice(p: string | undefined): string {
  return (p ?? "").replace("*", "").trim();
}

export default function PrivateLabDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const lab = useMemo(
    () => PRIVATE_LABS.find((l) => String(l.id) === id),
    [id]
  );

  const sections = useMemo<Section[]>(() => {
    if (!lab) return [];
    const result: Section[] = [];

    for (const field of FIELD_ORDER) {
      const fieldTests = lab.tests.filter((t) => t.field === field);
      if (fieldTests.length === 0) continue;

      // Group by parameter
      const byParam = new Map<string, { product: string; price?: string }[]>();
      for (const t of fieldTests) {
        if (!byParam.has(t.parameter)) byParam.set(t.parameter, []);
        byParam.get(t.parameter)!.push({ product: t.product, price: t.price });
      }

      const rows: TestRow[] = [];
      for (const [parameter, entries] of byParam.entries()) {
        const prices = entries.map((e) => normPrice(e.price));
        const allSame = prices.every((p) => p === prices[0]);

        if (allSame) {
          // All products share the same price — show once with no product label
          rows.push({ parameter, price: entries[0].price });
        } else {
          // Prices differ — show each unique product+price combination
          const seen = new Set<string>();
          for (const e of entries) {
            const key = `${e.product}||${normPrice(e.price)}`;
            if (seen.has(key)) continue;
            seen.add(key);
            rows.push({ parameter, price: e.price, product: e.product });
          }
        }
      }

      // Sort alphabetically by parameter
      rows.sort((a, b) => a.parameter.localeCompare(b.parameter));

      result.push({ field, data: rows });
    }

    return result;
  }, [lab]);

  if (!lab) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>المختبر غير موجود</Text>
      </View>
    );
  }

  const totalRows = sections.reduce((a, s) => a + s.data.length, 0);
  const contact = LAB_CONTACTS[lab.id];

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item, index) =>
        `${item.parameter}-${item.product ?? ""}-${index}`
      }
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      stickySectionHeadersEnabled={false}
      ListHeaderComponent={
        <View style={styles.labHeader}>
          <Text style={styles.labName}>{lab.name}</Text>
          <Text style={styles.labMeta}>
            {totalRows} اختبار ·{" "}
            {sections.map((s) => FIELD_LABELS[s.field]).join(" · ")}
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
        </View>
      }
      renderSectionHeader={({ section }) => {
        const sec = section as Section;
        const fc = FIELD_COLORS[sec.field];
        return (
          <View style={[styles.fieldHeader, { backgroundColor: fc.badge }]}>
            <Text style={styles.fieldHeaderText}>{FIELD_LABELS[sec.field]}</Text>
            <Text style={styles.fieldHeaderCount}>{sec.data.length} اختبار</Text>
          </View>
        );
      }}
      renderItem={({ item, section }) => {
        const sec = section as Section;
        const fc = FIELD_COLORS[sec.field];
        return (
          <View style={styles.testRow}>
            <View style={styles.testLeft}>
              <Text style={styles.testParam}>{item.parameter}</Text>
              {item.product && (
                <Text style={styles.testProduct} numberOfLines={1}>{item.product}</Text>
              )}
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
                  <Text style={styles.priceNote}>* للمكرر</Text>
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

  // Test row (flat, no product collapsing)
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
  testLeft: { flex: 1, alignItems: "flex-end", gap: 2 },
  testParam: {
    fontSize: 13,
    color: colors.light.text,
    textAlign: "left",
    writingDirection: "ltr",
  },
  testProduct: {
    fontSize: 10,
    color: colors.light.mutedForeground,
    textAlign: "left",
    writingDirection: "ltr",
    fontStyle: "italic",
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
