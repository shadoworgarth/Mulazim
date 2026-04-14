import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useNavigation } from "expo-router";
import React, { useEffect, useMemo } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import appData from "@/constants/data";
import colors from "@/constants/colors";

// ─── Parse all INS numbers out of a permitted additive line ───────────────────
function expandLine(line: string): number[] {
  const nums: number[] = [];
  // Ranges like 200-203
  for (const m of line.matchAll(/\b(\d+)-(\d+)\b/g)) {
    for (let i = parseInt(m[1]); i <= parseInt(m[2]); i++) nums.push(i);
  }
  // Standalone INS numbers (3-4 digits)
  for (const m of line.matchAll(/\b(\d{3,4})\b/g)) {
    const n = parseInt(m[1]);
    if (!nums.includes(n)) nums.push(n);
  }
  return nums;
}

export default function ScanResultScreen() {
  const { catIdx, itemIdx, ocrText, confidence } = useLocalSearchParams<{
    catIdx: string;
    itemIdx: string;
    ocrText: string;
    confidence: string;
  }>();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const category = appData[parseInt(catIdx ?? "0")];
  const item = category?.subItems[parseInt(itemIdx ?? "0")];

  useEffect(() => {
    navigation.setOptions({ title: "نتائج المسح" });
  }, [navigation]);

  const { permitted, notPermitted, notFound, foundNumbers } = useMemo(() => {
    if (!item?.data?.row2.D || !ocrText) {
      return { permitted: [], notPermitted: [], notFound: [], foundNumbers: [] };
    }

    const additiveLines = item.data.row2.D
      .split(/[\r\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    // Build map: INS number → additive line
    const numToLine = new Map<number, string>();
    for (const line of additiveLines) {
      for (const n of expandLine(line)) numToLine.set(n, line);
    }

    // Extract all E-numbers from the OCR text
    const rawNums: number[] = [];
    for (const m of ocrText.matchAll(/\bE\s*(\d{3,4})\b/gi)) {
      rawNums.push(parseInt(m[1]));
    }
    // Also plain 3-4 digit numbers surrounded by spaces/punctuation
    for (const m of ocrText.matchAll(/(?<![a-zA-Z])(\d{3,4})(?![a-zA-Z\d])/g)) {
      const n = parseInt(m[1]);
      if (!rawNums.includes(n)) rawNums.push(n);
    }

    const seenLines = new Set<string>();
    const permitted: { line: string; matchedNum: number }[] = [];
    const notPermitted: number[] = [];

    for (const num of rawNums) {
      const line = numToLine.get(num);
      if (line) {
        if (!seenLines.has(line)) {
          seenLines.add(line);
          permitted.push({ line, matchedNum: num });
        }
      } else {
        if (!notPermitted.includes(num)) notPermitted.push(num);
      }
    }

    // Additives permitted but not detected in the scan
    const notFound = additiveLines.filter((l) => !seenLines.has(l));

    return { permitted, notPermitted, notFound, foundNumbers: rawNums };
  }, [item, ocrText]);

  if (!item) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>خطأ في تحميل البيانات</Text>
      </View>
    );
  }

  const conf = parseFloat(confidence ?? "0");

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 24 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Summary Banner */}
      <View style={styles.summaryBanner}>
        <Text style={styles.summaryTitle}>{item.name.trim()}</Text>
        <Text style={styles.summaryItem}>رقم الصنف: {item.data?.row2.A}</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryChip}>
            <Text style={styles.summaryChipText}>
              {foundNumbers.length} مادة مكتشفة
            </Text>
          </View>
          {conf > 0 && (
            <View style={[styles.summaryChip, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
              <Text style={styles.summaryChipText}>دقة {conf.toFixed(0)}%</Text>
            </View>
          )}
        </View>
      </View>

      {/* Permitted found in scan */}
      {permitted.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>مضافات مسموح بها ✓</Text>
          <View style={styles.card}>
            {permitted.map((r, i) => (
              <View
                key={i}
                style={[styles.resultRow, styles.resultGreen, i < permitted.length - 1 && styles.rowDivider]}
              >
                <View style={styles.resultLeft}>
                  <Feather name="check-circle" size={16} color="#1a7a40" />
                </View>
                <View style={styles.resultRight}>
                  <Text style={[styles.resultLine, { color: "#1a7a40" }]}>{r.line}</Text>
                  <Text style={styles.resultNum}>E{r.matchedNum}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Not permitted */}
      {notPermitted.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>مضافات غير مسموح بها ✗</Text>
          <View style={styles.card}>
            {notPermitted.map((num, i) => (
              <View
                key={i}
                style={[styles.resultRow, styles.resultRed, i < notPermitted.length - 1 && styles.rowDivider]}
              >
                <View style={styles.resultLeft}>
                  <Feather name="x-circle" size={16} color="#b91c1c" />
                </View>
                <View style={styles.resultRight}>
                  <Text style={[styles.resultLine, { color: "#b91c1c" }]}>E{num}</Text>
                  <Text style={styles.resultNum}>غير موجود في قائمة المسموح به</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Nothing detected */}
      {foundNumbers.length === 0 && (
        <View style={styles.section}>
          <View style={styles.card}>
            <View style={styles.emptyState}>
              <Feather name="alert-circle" size={32} color={colors.light.mutedForeground} />
              <Text style={styles.emptyText}>
                لم يتم اكتشاف أي مواد مضافة في النص الممسوح
              </Text>
              <Text style={styles.emptySubtext}>
                تأكد من وضوح الصورة وأن قائمة المكونات مرئية بالكامل
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Raw OCR Text */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>النص المقروء من الصورة</Text>
        <View style={styles.card}>
          <Text style={styles.ocrText} selectable>
            {ocrText || "—"}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  errorText: { fontSize: 16, color: colors.light.mutedForeground, textAlign: "center" },
  container: { padding: 16, gap: 16 },
  summaryBanner: {
    backgroundColor: "#0e7c7c", borderRadius: 16, padding: 18, gap: 8, alignItems: "flex-end",
  },
  summaryTitle: { fontSize: 16, fontWeight: "700", color: "#fff", textAlign: "right" },
  summaryItem: { fontSize: 12, color: "#b2e0e0", textAlign: "right" },
  summaryRow: { flexDirection: "row", gap: 8, justifyContent: "flex-end" },
  summaryChip: {
    backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  summaryChipText: { fontSize: 12, fontWeight: "600", color: "#fff" },
  section: { gap: 8 },
  sectionTitle: {
    fontSize: 12, fontWeight: "600", color: colors.light.mutedForeground,
    textAlign: "right", paddingHorizontal: 4, textTransform: "uppercase",
  },
  card: {
    backgroundColor: "#fff", borderRadius: 14, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  resultRow: { flexDirection: "row", alignItems: "flex-start", padding: 14, gap: 12 },
  resultGreen: { backgroundColor: "#f0faf5" },
  resultRed: { backgroundColor: "#fff5f5" },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.light.border },
  resultLeft: { paddingTop: 1 },
  resultRight: { flex: 1, alignItems: "flex-end", gap: 2 },
  resultLine: { fontSize: 13, fontWeight: "600", textAlign: "right", lineHeight: 20 },
  resultNum: { fontSize: 11, color: colors.light.mutedForeground, textAlign: "right" },
  emptyState: { alignItems: "center", padding: 24, gap: 10 },
  emptyText: { fontSize: 14, fontWeight: "600", color: colors.light.text, textAlign: "center" },
  emptySubtext: { fontSize: 12, color: colors.light.mutedForeground, textAlign: "center", lineHeight: 18 },
  ocrText: { fontSize: 12, color: colors.light.text, padding: 14, lineHeight: 20, textAlign: "left" },
});
