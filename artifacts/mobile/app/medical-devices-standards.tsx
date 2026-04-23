import React, { useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import colors from "@/constants/colors";
import medicalData from "@/constants/medical-standards.json";

type Regulation = {
  standard: string;
  english: string;
  arabic: string;
};

const stripStandardSuffixes = (s: string): string =>
  s
    .replace(/[/+]\s*Amd\s*\d+/gi, "")
    .replace(/:\d{4}/g, "")
    .replace(/\/\d{4}\b/g, "")
    .trim();

const extractStandardToken = (standard: string): string => {
  const stripped = stripStandardSuffixes(standard);
  const tokens = stripped.split(/\s+/);
  for (let i = tokens.length - 1; i >= 0; i--) {
    if (/^\d+(-\d+)*$/.test(tokens[i])) return tokens[i];
  }
  return "";
};

const extractStandardKey = (standard: string): [number, number, number] => {
  const stdToken = extractStandardToken(standard);
  if (!stdToken)
    return [Number.MAX_SAFE_INTEGER, 0, 0];
  const parts = stdToken.split("-").map((p) => parseInt(p, 10));
  return [parts[0], parts[1] || 0, parts[2] || 0];
};

const ALL: Regulation[] = (medicalData as Regulation[])
  .slice()
  .sort((a, b) => {
    const [ma, pa, sa] = extractStandardKey(a.standard);
    const [mb, pb, sb] = extractStandardKey(b.standard);
    if (ma !== mb) return ma - mb;
    if (pa !== pb) return pa - pb;
    if (sa !== sb) return sa - sb;
    return a.standard.localeCompare(b.standard);
  });

const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .replace(/[إأآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim();

const extractStandardNumberStr = (standard: string): string =>
  extractStandardToken(standard);

const isNumericToken = (t: string) => /^[\d][\d\-]*$/.test(t);

export default function MedicalDevicesStandardsScreen() {
  const [query, setQuery] = useState("");

  const normalizedAll = useMemo(
    () =>
      ALL.map((r) => ({
        ...r,
        _name: normalize(`${r.english} ${r.arabic}`),
        _num: extractStandardNumberStr(r.standard),
      })),
    []
  );

  const results = useMemo(() => {
    const q = normalize(query);
    if (!q) return normalizedAll.slice(0, 200);
    const tokens = q.split(" ").filter(Boolean);
    return normalizedAll.filter((r) =>
      tokens.every((t) =>
        isNumericToken(t) ? r._num.includes(t) : r._name.includes(t)
      )
    );
  }, [query, normalizedAll]);

  return (
    <View style={styles.container}>
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.input}
          placeholder="ابحث بالاسم أو رقم المواصفة (بدون السنة)"
          placeholderTextColor="#94a3a3"
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          autoCapitalize="none"
        />
        <Text style={styles.countText}>
          {query
            ? `${results.length} نتيجة من ${ALL.length}`
            : `إجمالي: ${ALL.length} مواصفة`}
        </Text>
      </View>

      <FlatList
        data={results}
        keyExtractor={(item, idx) => `${item.standard}-${idx}`}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.standard} numberOfLines={2}>
              {item.standard}
            </Text>
            {item.arabic ? (
              <Text style={styles.arabic} numberOfLines={4}>
                {item.arabic}
              </Text>
            ) : null}
            {item.english ? (
              <Text style={styles.english} numberOfLines={4}>
                {item.english}
              </Text>
            ) : null}
          </View>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.empty}>لا توجد نتائج مطابقة</Text>
        }
        keyboardShouldPersistTaps="handled"
        initialNumToRender={20}
        windowSize={10}
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
    padding: 14,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e8e8",
  },
  input: {
    backgroundColor: "#f2f6f8",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    fontSize: 14,
    color: colors.light.text,
    textAlign: "right",
  },
  countText: {
    marginTop: 8,
    fontSize: 12,
    color: colors.light.mutedForeground,
    textAlign: "right",
  },
  listContent: {
    padding: 14,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 6,
  },
  standard: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0e7c7c",
    textAlign: "left",
  },
  arabic: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.light.text,
    textAlign: "right",
    lineHeight: 22,
  },
  english: {
    fontSize: 12,
    color: colors.light.mutedForeground,
    textAlign: "left",
    lineHeight: 18,
  },
  empty: {
    textAlign: "center",
    color: colors.light.mutedForeground,
    paddingTop: 40,
    fontSize: 14,
  },
});
