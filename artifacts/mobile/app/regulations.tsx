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
import regulationsData from "@/constants/regulations.json";

type Regulation = {
  standard: string;
  english: string;
  arabic: string;
};

const extractStandardKey = (standard: string): [number, number] => {
  const stripped = standard.replace(/[:/]\d{4}\s*$/, "").trim();
  const matches = stripped.match(/\d+/g);
  if (!matches || matches.length === 0) return [Number.MAX_SAFE_INTEGER, 0];
  const main = parseInt(matches[0], 10);
  const part = matches.length > 1 ? parseInt(matches[1], 10) : 0;
  return [main, part];
};

const ALL: Regulation[] = (regulationsData as Regulation[])
  .slice()
  .sort((a, b) => {
    const [ma, pa] = extractStandardKey(a.standard);
    const [mb, pb] = extractStandardKey(b.standard);
    if (ma !== mb) return ma - mb;
    if (pa !== pb) return pa - pb;
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

const extractStandardNumberStr = (standard: string): string => {
  const stripped = standard.replace(/[:/]\d{4}\s*$/, "").trim();
  const tokens = stripped.split(/\s+/);
  const last = tokens[tokens.length - 1] || "";
  return /\d/.test(last) ? last : "";
};

const isNumericToken = (t: string) => /^[\d][\d\-]*$/.test(t);

export default function RegulationsScreen() {
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
