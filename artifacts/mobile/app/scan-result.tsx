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

// ─── Expand a permitted-additive line into every individual INS number ─────────
// "SORBATES 200-203"  → [200, 201, 202, 203]
// "ASCORBIC ACID 300" → [300]
function expandLine(line: string): number[] {
  const nums: number[] = [];
  // Ranges first: "200-203"
  const rangeRe = /(\d+)-(\d+)/g;
  let m: RegExpExecArray | null;
  while ((m = rangeRe.exec(line)) !== null) {
    const lo = parseInt(m[1], 10);
    const hi = parseInt(m[2], 10);
    for (let i = lo; i <= hi; i++) nums.push(i);
  }
  // Standalone 3-4 digit numbers (not already covered by a range)
  const standRe = /\b(\d{3,4})\b/g;
  while ((m = standRe.exec(line)) !== null) {
    const n = parseInt(m[1], 10);
    if (!nums.includes(n)) nums.push(n);
  }
  return nums;
}

// ─── Extract every E-number written in the OCR text ───────────────────────────
// Handles "E200", "E 200", "e200", "(E211)", "E-211" etc.
// Returns deduplicated array of integer INS codes.
function extractENumbers(text: string): number[] {
  const found: number[] = [];
  // Match "E" (optional space or dash) followed by 3-4 digits
  const re = /[Ee][\s-]?(\d{3,4})/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const n = parseInt(m[1], 10);
    if (!found.includes(n)) found.push(n);
  }
  return found;
}

// ─── Key name words extracted from a permitted-additive line ──────────────────
// "SORBATES 200-203"  → ["sorbates"]
// "BENZOATES 210-213" → ["benzoates"]
// "SULFUR DIOXIDE AND SULPHITES 220-228" → ["sulfur", "dioxide", "sulphites"]
// Filters out numbers and short/generic filler words.
const STOP_WORDS = new Set(["and", "the", "with", "from", "acid", "salt", "mono", "free"]);
function nameTokens(line: string): string[] {
  return line
    .replace(/\d+[-\d]*/g, " ")   // strip numbers/ranges
    .split(/[\s,/()]+/)
    .map((w) => w.toLowerCase().replace(/[^a-z]/g, ""))
    .filter((w) => w.length >= 5 && !STOP_WORDS.has(w));
}

type MatchResult = { line: string; how: "e-number" | "name"; detail: string };

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

  const { allowed, notAllowed, nothingDetected } = useMemo(() => {
    if (!item?.data?.row2.D || !ocrText) {
      return { allowed: [], notAllowed: [], nothingDetected: true };
    }

    const ocr = ocrText;
    const ocrLower = ocr.toLowerCase();

    // 1. Extract E-numbers present in the OCR text
    const eNums = extractENumbers(ocr);
    const eNumSet = new Set(eNums);

    // 2. Build per-line data for every permitted additive
    const lines = item.data.row2.D
      .split(/[\r\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    // Build: permitted INS number → line (for "not allowed" check)
    const numToLine = new Map<number, string>();
    const lineData = lines.map((line) => {
      const nums = expandLine(line);
      const tokens = nameTokens(line);
      for (const n of nums) numToLine.set(n, line);
      return { line, nums, tokens };
    });

    // 3. For each permitted line, decide if it appears in the OCR
    const seenLines = new Set<string>();
    const allowed: MatchResult[] = [];

    for (const { line, nums, tokens } of lineData) {
      if (seenLines.has(line)) continue;

      // a) E-number match (most reliable)
      const matchedNum = nums.find((n) => eNumSet.has(n));
      if (matchedNum !== undefined) {
        seenLines.add(line);
        allowed.push({ line, how: "e-number", detail: `E${matchedNum}` });
        continue;
      }

      // b) Name token match (fallback when label uses substance name only)
      const matchedToken = tokens.find((t) => ocrLower.includes(t));
      if (matchedToken) {
        seenLines.add(line);
        allowed.push({ line, how: "name", detail: matchedToken.toUpperCase() });
      }
    }

    // 4. E-numbers in OCR that are NOT in the permitted list → alert
    const notAllowed: number[] = eNums.filter((n) => !numToLine.has(n));

    const nothingDetected = allowed.length === 0 && notAllowed.length === 0;

    return { allowed, notAllowed, nothingDetected };
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
              {allowed.length} مضاف مطابق
            </Text>
          </View>
          {notAllowed.length > 0 && (
            <View style={[styles.summaryChip, { backgroundColor: "#b91c1c" }]}>
              <Text style={styles.summaryChipText}>
                {notAllowed.length} غير مسموح
              </Text>
            </View>
          )}
          {conf > 0 && (
            <View style={[styles.summaryChip, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
              <Text style={styles.summaryChipText}>دقة {conf.toFixed(0)}%</Text>
            </View>
          )}
        </View>
      </View>

      {/* Permitted additives found in the scan */}
      {allowed.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>مضافات مسموح بها — موجودة في المنتج ✓</Text>
          <View style={styles.card}>
            {allowed.map((r, i) => (
              <View
                key={i}
                style={[
                  styles.resultRow,
                  styles.resultGreen,
                  i < allowed.length - 1 && styles.rowDivider,
                ]}
              >
                <View style={styles.resultLeft}>
                  <Feather name="check-circle" size={16} color="#1a7a40" />
                </View>
                <View style={styles.resultRight}>
                  <Text style={[styles.resultLine, { color: "#1a7a40" }]}>{r.line}</Text>
                  <Text style={styles.resultDetail}>
                    {r.how === "e-number" ? `تطابق رقم ${r.detail}` : `تطابق اسم "${r.detail}"`}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* E-numbers present in the scan but NOT permitted */}
      {notAllowed.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>مضافات غير مسموح بها ✗</Text>
          <View style={styles.card}>
            {notAllowed.map((num, i) => (
              <View
                key={i}
                style={[
                  styles.resultRow,
                  styles.resultRed,
                  i < notAllowed.length - 1 && styles.rowDivider,
                ]}
              >
                <View style={styles.resultLeft}>
                  <Feather name="x-circle" size={16} color="#b91c1c" />
                </View>
                <View style={styles.resultRight}>
                  <Text style={[styles.resultLine, { color: "#b91c1c" }]}>E{num}</Text>
                  <Text style={styles.resultDetail}>غير موجود في قائمة المسموح به لهذا الصنف</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Nothing detected at all */}
      {nothingDetected && (
        <View style={styles.section}>
          <View style={styles.card}>
            <View style={styles.emptyState}>
              <Feather name="alert-circle" size={32} color={colors.light.mutedForeground} />
              <Text style={styles.emptyText}>لم يُكتشف أي رقم E في النص</Text>
              <Text style={styles.emptySubtext}>
                تأكد من وضوح الصورة وأن أرقام المضافات مثل E200 مرئية
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Raw OCR text for verification */}
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
  summaryRow: { flexDirection: "row", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" },
  summaryChip: {
    backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
  },
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
  resultRow: { flexDirection: "row", alignItems: "flex-start", padding: 14, gap: 12 },
  resultGreen: { backgroundColor: "#f0faf5" },
  resultRed: { backgroundColor: "#fff5f5" },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.light.border },
  resultLeft: { paddingTop: 2 },
  resultRight: { flex: 1, alignItems: "flex-end", gap: 3 },
  resultLine: { fontSize: 13, fontWeight: "600", textAlign: "right", lineHeight: 20 },
  resultDetail: { fontSize: 11, color: colors.light.mutedForeground, textAlign: "right" },
  emptyState: { alignItems: "center", padding: 24, gap: 10 },
  emptyText: { fontSize: 14, fontWeight: "600", color: colors.light.text, textAlign: "center" },
  emptySubtext: { fontSize: 12, color: colors.light.mutedForeground, textAlign: "center", lineHeight: 18 },
  ocrText: { fontSize: 12, color: colors.light.text, padding: 14, lineHeight: 20, textAlign: "left" },
});
