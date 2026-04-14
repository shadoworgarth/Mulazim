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

function expandLine(line: string): number[] {
  const nums: number[] = [];
  const rangeRe = /(\d+)-(\d+)/g;
  let m: RegExpExecArray | null;
  while ((m = rangeRe.exec(line)) !== null) {
    const lo = parseInt(m[1], 10);
    const hi = parseInt(m[2], 10);
    if (hi - lo < 100) {
      for (let i = lo; i <= hi; i++) nums.push(i);
    }
  }
  const standRe = /\b(\d{3,4})\b/g;
  while ((m = standRe.exec(line)) !== null) {
    const n = parseInt(m[1], 10);
    if (!nums.includes(n)) nums.push(n);
  }
  return nums;
}

type CodeResult = {
  code: number;
  permittedLine: string | null;
};

export default function ScanResultScreen() {
  const { catIdx, itemIdx, codesJson } = useLocalSearchParams<{
    catIdx: string;
    itemIdx: string;
    codesJson: string;
  }>();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const category = appData[parseInt(catIdx ?? "0")];
  const item = category?.subItems[parseInt(itemIdx ?? "0")];

  useEffect(() => {
    navigation.setOptions({ title: "نتائج المسح" });
  }, [navigation]);

  const { results, allowedCount, blockedCount } = useMemo(() => {
    if (!item?.data?.row2.D || !codesJson) {
      return { results: [], allowedCount: 0, blockedCount: 0 };
    }

    let codes: number[] = [];
    try { codes = JSON.parse(codesJson); } catch { codes = []; }

    const numToLine = new Map<number, string>();
    for (const line of item.data.row2.D.split(/[\r\n]+/).map(s => s.trim()).filter(Boolean)) {
      for (const n of expandLine(line)) numToLine.set(n, line);
    }

    const results: CodeResult[] = codes.map(code => ({
      code,
      permittedLine: numToLine.get(code) ?? null,
    }));

    return {
      results,
      allowedCount: results.filter(r => r.permittedLine !== null).length,
      blockedCount: results.filter(r => r.permittedLine === null).length,
    };
  }, [item, codesJson]);

  if (!item) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>خطأ في تحميل البيانات</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 24 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Summary banner */}
      <View style={styles.summaryBanner}>
        <Text style={styles.summaryTitle}>{item.name.trim()}</Text>
        <Text style={styles.summaryItem}>رقم الصنف: {item.data?.row2.A}</Text>
        <View style={styles.summaryRow}>
          <View style={[styles.summaryChip, allowedCount > 0 && styles.chipGreen]}>
            <Text style={styles.summaryChipText}>{allowedCount} مسموح</Text>
          </View>
          <View style={[styles.summaryChip, blockedCount > 0 ? styles.chipRed : styles.chipNeutral]}>
            <Text style={styles.summaryChipText}>{blockedCount} غير مسموح</Text>
          </View>
        </View>
      </View>

      {/* Per-code results */}
      {results.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>المواد المضافة المكتشفة في الصورة</Text>
          <View style={styles.card}>
            {results.map((r, i) => (
              <View
                key={r.code}
                style={[
                  styles.resultRow,
                  r.permittedLine ? styles.rowGreen : styles.rowRed,
                  i < results.length - 1 && styles.rowDivider,
                ]}
              >
                <View style={styles.iconCol}>
                  <Feather
                    name={r.permittedLine ? "check-circle" : "x-circle"}
                    size={18}
                    color={r.permittedLine ? "#1a7a40" : "#b91c1c"}
                  />
                </View>
                <View style={styles.textCol}>
                  <View style={styles.codeRow}>
                    <View style={[styles.codeBadge,
                      r.permittedLine ? styles.codeBadgeGreen : styles.codeBadgeRed]}>
                      <Text style={[styles.codeText,
                        { color: r.permittedLine ? "#1a7a40" : "#b91c1c" }]}>
                        E{r.code}
                      </Text>
                    </View>
                    <Text style={[styles.statusText,
                      { color: r.permittedLine ? "#1a7a40" : "#b91c1c" }]}>
                      {r.permittedLine ? "مسموح" : "غير مسموح"}
                    </Text>
                  </View>
                  {r.permittedLine && (
                    <Text style={styles.permittedLabel}>{r.permittedLine}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.section}>
          <View style={styles.card}>
            <View style={styles.emptyState}>
              <Feather name="alert-circle" size={32} color={colors.light.mutedForeground} />
              <Text style={styles.emptyText}>لم يُكتشف أي رقم E في الصورة</Text>
              <Text style={styles.emptySubtext}>
                تأكد من أن الصورة واضحة وأن أرقام المواد المضافة مثل E200 مرئية بوضوح
              </Text>
            </View>
          </View>
        </View>
      )}
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
  summaryRow: { flexDirection: "row", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" },
  summaryChip: {
    backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
  },
  chipGreen: { backgroundColor: "#166534" },
  chipRed: { backgroundColor: "#991b1b" },
  chipNeutral: { backgroundColor: "rgba(255,255,255,0.15)" },
  summaryChipText: { fontSize: 12, fontWeight: "600", color: "#fff" },

  section: { gap: 8 },
  sectionTitle: {
    fontSize: 12, fontWeight: "600", color: colors.light.mutedForeground,
    textAlign: "right", paddingHorizontal: 4,
  },
  card: {
    backgroundColor: "#fff", borderRadius: 14, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  resultRow: {
    flexDirection: "row", alignItems: "flex-start",
    paddingVertical: 12, paddingHorizontal: 14, gap: 12,
  },
  rowGreen: { backgroundColor: "#f0faf5" },
  rowRed: { backgroundColor: "#fff5f5" },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.light.border },
  iconCol: { paddingTop: 2 },
  textCol: { flex: 1, gap: 4, alignItems: "flex-end" },
  codeRow: { flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "flex-end" },
  codeBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1 },
  codeBadgeGreen: { backgroundColor: "#dcfce7", borderColor: "#86efac" },
  codeBadgeRed: { backgroundColor: "#fee2e2", borderColor: "#fca5a5" },
  codeText: { fontSize: 14, fontWeight: "700" },
  statusText: { fontSize: 12, fontWeight: "600" },
  permittedLabel: { fontSize: 11, color: "#374151", textAlign: "right", lineHeight: 16 },

  emptyState: { alignItems: "center", padding: 24, gap: 10 },
  emptyText: { fontSize: 14, fontWeight: "600", color: colors.light.text, textAlign: "center" },
  emptySubtext: { fontSize: 12, color: colors.light.mutedForeground, textAlign: "center", lineHeight: 18 },
});
