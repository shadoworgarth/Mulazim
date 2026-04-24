import { useLocalSearchParams, useNavigation } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import colors from "@/constants/colors";
import { getFaoPesticideById } from "@/constants/fao-codex";

export default function PesticidesFaoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const pesticide = useMemo(() => getFaoPesticideById(id ?? ""), [id]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (pesticide) navigation.setOptions({ title: pesticide.name });
  }, [pesticide, navigation]);

  const filtered = useMemo(() => {
    if (!pesticide) return [];
    const q = query.trim().toLowerCase();
    const sorted = pesticide.mrls
      .slice()
      .sort((a, b) => a.commodity.localeCompare(b.commodity));
    if (!q) return sorted;
    return sorted.filter(
      (m) =>
        m.commodity.toLowerCase().includes(q) ||
        m.commodityCode.toLowerCase().includes(q),
    );
  }, [pesticide, query]);

  if (!pesticide) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>لم يتم العثور على المبيد</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={filtered}
      keyExtractor={(_, i) => i.toString()}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <View>
          <View style={styles.titleCard}>
            <Text style={styles.titleText}>{pesticide.name}</Text>
            {pesticide.functionalClass ? (
              <Text style={styles.classText}>{pesticide.functionalClass}</Text>
            ) : null}
            <Text style={styles.subtitleText}>
              {pesticide.mrls.length} MRL
            </Text>
          </View>

          {pesticide.adi || pesticide.residue ? (
            <View style={styles.infoCard}>
              {pesticide.adi ? (
                <View style={styles.infoBlock}>
                  <Text style={styles.infoLabel}>ADI</Text>
                  <Text style={styles.infoValue}>
                    {pesticide.adi} {pesticide.adiUnit}
                  </Text>
                  {pesticide.adiNote ? (
                    <Text style={styles.infoNote}>{pesticide.adiNote}</Text>
                  ) : null}
                </View>
              ) : null}
              {pesticide.residue ? (
                <View style={styles.infoBlock}>
                  <Text style={styles.infoLabel}>Residue Definition</Text>
                  <Text style={styles.infoValue}>{pesticide.residue}</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          <View style={styles.searchWrap}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search commodity…"
              placeholderTextColor="#9ca3af"
              style={styles.searchInput}
              textAlign="left"
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.center}>
          {pesticide.error ? (
            <>
              <Text style={{ fontSize: 36 }}>⚠️</Text>
              <Text style={styles.emptyText}>
                تعذّر تحميل بيانات هذا المبيد
              </Text>
            </>
          ) : (
            <>
              <Text style={{ fontSize: 36 }}>🔍</Text>
              <Text style={styles.emptyText}>لا توجد نتائج مطابقة</Text>
            </>
          )}
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.commodityText}>{item.commodity}</Text>
              {item.commodityCode ? (
                <Text style={styles.codeText}>{item.commodityCode}</Text>
              ) : null}
            </View>
            <View style={styles.limitPill}>
              <Text style={styles.limitValue}>{item.mrl}</Text>
            </View>
          </View>
          <View style={styles.metaRow}>
            {item.cacYear ? (
              <Text style={styles.metaText}>CAC {item.cacYear}</Text>
            ) : null}
            {item.step ? (
              <Text style={styles.metaText}>{item.step}</Text>
            ) : null}
          </View>
          {item.footnote ? (
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Footnote</Text>
              <Text style={styles.fieldValue}>{item.footnote}</Text>
            </View>
          ) : null}
        </View>
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
  errorText: {
    fontSize: 16,
    color: colors.light.mutedForeground,
  },
  emptyText: {
    fontSize: 14,
    color: colors.light.mutedForeground,
  },
  listContent: {
    padding: 16,
    paddingBottom: Platform.OS === "web" ? 34 : 24,
    gap: 10,
  },
  titleCard: {
    backgroundColor: "#1565c0",
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  titleText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
    textAlign: "left",
  },
  classText: {
    fontSize: 12,
    color: "#bbdefb",
    textAlign: "left",
    marginTop: 4,
  },
  subtitleText: {
    fontSize: 12,
    color: "#bbdefb",
    textAlign: "right",
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    gap: 10,
  },
  infoBlock: {
    gap: 4,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1565c0",
    textAlign: "left",
  },
  infoValue: {
    fontSize: 13,
    color: colors.light.text,
    textAlign: "left",
    lineHeight: 19,
  },
  infoNote: {
    fontSize: 11,
    color: colors.light.mutedForeground,
    textAlign: "left",
    fontStyle: "italic",
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
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    gap: 8,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  commodityText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.light.text,
    textAlign: "left",
    lineHeight: 20,
  },
  codeText: {
    fontSize: 11,
    color: colors.light.mutedForeground,
    textAlign: "left",
    marginTop: 2,
  },
  limitPill: {
    backgroundColor: "#e3f2fd",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: "center",
    minWidth: 90,
  },
  limitValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0d47a1",
    textAlign: "center",
  },
  metaRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  metaText: {
    fontSize: 11,
    color: colors.light.mutedForeground,
    backgroundColor: "#f3f4f6",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  fieldBlock: {
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    padding: 10,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6b7280",
    textAlign: "left",
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 12,
    color: colors.light.text,
    textAlign: "left",
    lineHeight: 18,
  },
});
