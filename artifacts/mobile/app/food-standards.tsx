import * as Clipboard from "expo-clipboard";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Linking,
  Modal,
  Platform,
  Pressable,
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

const stripStandardSuffixes = (s: string): string =>
  s
    .replace(/[/+]\s*Amd\s*\d+/gi, "")
    .replace(/:\s*\d{4}/g, "")
    .replace(/\/\s*\d{4}\b/g, "")
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
  if (!stdToken) return [Number.MAX_SAFE_INTEGER, 0, 0];
  const parts = stdToken.split("-").map((p) => parseInt(p, 10));
  return [parts[0], parts[1] || 0, parts[2] || 0];
};

const ALL: Regulation[] = (regulationsData as Regulation[])
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

const MWASFAH_URL = "https://mwasfah.sfda.gov.sa/Standard/Search";

export default function FoodStandardsScreen() {
  const [query, setQuery] = useState("");
  const [copiedItem, setCopiedItem] = useState<Regulation | null>(null);

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

  const handleCardPress = (item: Regulation) => {
    const searchTerm = item.arabic || item.english || item.standard;
    Clipboard.setStringAsync(searchTerm).catch(() => {});
    setCopiedItem(item);
  };

  const closeModal = () => setCopiedItem(null);

  const openStore = () => {
    Linking.openURL(MWASFAH_URL).catch(() => {});
    closeModal();
  };

  const searchTerm = copiedItem
    ? copiedItem.arabic || copiedItem.english || copiedItem.standard
    : "";

  return (
    <View style={styles.container}>
      <Modal
        visible={copiedItem !== null}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <Pressable style={styles.overlay} onPress={closeModal}>
          <Pressable style={styles.dialog} onPress={() => {}}>
            <Text style={styles.dialogTitle}>تم نسخ اسم المواصفة</Text>
            <Text style={styles.dialogName}>"{searchTerm}"</Text>
            <Text style={styles.dialogBody}>
              يمكنك لصقه في خانة البحث في متجر المواصفات.
            </Text>
            <View style={styles.dialogButtons}>
              <Pressable
                style={[styles.dialogBtn, styles.dialogBtnSecondary]}
                onPress={closeModal}
              >
                <Text style={styles.dialogBtnSecondaryText}>حسناً</Text>
              </Pressable>
              <Pressable
                style={[styles.dialogBtn, styles.dialogBtnPrimary]}
                onPress={openStore}
              >
                <Text style={styles.dialogBtnPrimaryText}>فتح المتجر 🔗</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

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
        <View style={styles.searchFooter}>
          <Text style={styles.countText}>
            {query
              ? `${results.length} نتيجة من ${ALL.length}`
              : `إجمالي: ${ALL.length} مواصفة`}
          </Text>
          <Text style={styles.tapHint}>اضغط للبحث في المتجر</Text>
        </View>
      </View>

      <FlatList
        data={results}
        keyExtractor={(item, idx) => `${item.standard}-${idx}`}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() => handleCardPress(item)}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.standard} numberOfLines={2}>
                {item.standard}
              </Text>
              <View style={styles.linkBadge}>
                <Text style={styles.linkBadgeText}>المتجر</Text>
              </View>
            </View>
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
          </Pressable>
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
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  dialog: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 24,
    width: "100%",
    maxWidth: 360,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 10,
  },
  dialogTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.light.text,
    textAlign: "right",
  },
  dialogName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0e7c7c",
    textAlign: "right",
    lineHeight: 22,
    backgroundColor: "#f0fafa",
    borderRadius: 10,
    padding: 10,
  },
  dialogBody: {
    fontSize: 14,
    color: colors.light.mutedForeground,
    textAlign: "right",
    lineHeight: 22,
  },
  dialogButtons: {
    flexDirection: "row-reverse",
    gap: 10,
    marginTop: 4,
  },
  dialogBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  dialogBtnPrimary: {
    backgroundColor: "#0e7c7c",
  },
  dialogBtnPrimaryText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
  },
  dialogBtnSecondary: {
    backgroundColor: "#f0f4f4",
  },
  dialogBtnSecondaryText: {
    color: colors.light.text,
    fontWeight: "600",
    fontSize: 14,
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
  searchFooter: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  countText: {
    fontSize: 12,
    color: colors.light.mutedForeground,
    textAlign: "right",
  },
  tapHint: {
    fontSize: 11,
    color: "#0e7c7c",
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
  cardPressed: {
    backgroundColor: "#f0fafa",
    shadowOpacity: 0.02,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  standard: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0e7c7c",
    textAlign: "left",
    flex: 1,
  },
  linkBadge: {
    backgroundColor: "#e0f2f1",
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    flexShrink: 0,
  },
  linkBadgeText: {
    fontSize: 12,
    color: "#00695c",
    fontWeight: "600",
    textAlign: "center",
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
