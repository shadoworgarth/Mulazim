import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import appData from "@/constants/data";
import colors from "@/constants/colors";

const CHECK_CAT = 13;
const CHECK_ITEM = 4;

type CheckResult = { raw: string; code: string; permitted: boolean; line: string };

function buildPermittedMap(additives: string[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const line of additives) {
    const rangeMatch = line.match(/E(\d+)\s*[-–]\s*E(\d+)/i);
    if (rangeMatch) {
      const from = parseInt(rangeMatch[1]);
      const to = parseInt(rangeMatch[2]);
      for (let n = from; n <= to; n++) {
        if (!map.has(String(n))) map.set(String(n), line);
      }
    }
    const singles = [...line.matchAll(/E(\d+[a-z]?)/gi)];
    for (const m of singles) {
      const key = m[1].toLowerCase();
      if (!map.has(key)) map.set(key, line);
      const numOnly = key.replace(/[a-z]$/, "");
      if (!map.has(numOnly)) map.set(numOnly, line);
    }
  }
  return map;
}

function parseUserInput(input: string): string[] {
  const matches = [...input.matchAll(/E(\d+[a-z]?)|(?<![a-zA-Z])(\d{3,4})(?![a-zA-Z0-9])/gi)];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const m of matches) {
    const raw = (m[1] || m[2]).toLowerCase();
    if (!seen.has(raw)) { seen.add(raw); result.push(raw); }
  }
  return result;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoValue}>{value || "—"}</Text>
      <View style={styles.infoLabelWrap}>
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
    </View>
  );
}

export default function DetailScreen() {
  const { categoryIndex, itemIndex } = useLocalSearchParams<{
    categoryIndex: string;
    itemIndex: string;
  }>();
  const navigation = useNavigation();
  const router = useRouter();

  const catIdx = parseInt(categoryIndex ?? "0", 10);
  const itemIdx = parseInt(itemIndex ?? "0", 10);
  const category = appData[catIdx];
  const item = category?.subItems[itemIdx];
  const showChecker = catIdx === CHECK_CAT && itemIdx === CHECK_ITEM;

  const [inputText, setInputText] = useState("");
  const [results, setResults] = useState<CheckResult[]>([]);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (item) navigation.setOptions({ title: item.name.trim().slice(0, 30) });
  }, [item, navigation]);

  if (!item || !item.data) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>لا تتوفر بيانات لهذا الصنف</Text>
      </View>
    );
  }

  const { row1, row2 } = item.data;
  const additives = row2.D
    ? row2.D.split(/[\r\n]+/).map(s => s.trim()).filter(Boolean)
    : [];

  function handleCheck() {
    const codes = parseUserInput(inputText);
    if (codes.length === 0) return;
    const map = buildPermittedMap(additives);
    const res: CheckResult[] = codes.map(code => {
      const line = map.get(code) ?? map.get(code.replace(/[a-z]$/, "")) ?? "";
      return { raw: "E" + code.toUpperCase(), code, permitted: !!line, line };
    });
    setResults(res);
    setChecked(true);
  }

  function handleReset() {
    setInputText("");
    setResults([]);
    setChecked(false);
  }

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { paddingBottom: Platform.OS === "web" ? 34 : 24 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Name Banner */}
      <View style={styles.nameBanner}>
        <Text style={styles.itemName}>{item.name.trim()}</Text>
        {row2.A ? (
          <View style={styles.codeBadge}>
            <Text style={styles.codeBadgeText}>{row2.A}</Text>
          </View>
        ) : null}
      </View>

      {/* E-Number Checker — only for the test item */}
      {showChecker && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>التحقق من المواد المضافة</Text>
          <View style={[styles.card, { padding: 14, gap: 12 }]}>
            <Text style={styles.checkerHint}>
              أدخل أرقام E الموجودة على المنتج مفصولة بمسافة أو فاصلة
            </Text>
            <TextInput
              style={styles.checkerInput}
              value={inputText}
              onChangeText={t => { setInputText(t); setChecked(false); setResults([]); }}
              placeholder="مثال: E211  E202  E330  150"
              placeholderTextColor="#aaa"
              textAlign="right"
              multiline
              autoCapitalize="characters"
              autoCorrect={false}
            />
            <View style={styles.checkerButtons}>
              {checked && (
                <Pressable
                  style={({ pressed }) => [styles.resetButton, pressed && { opacity: 0.7 }]}
                  onPress={handleReset}
                >
                  <Text style={styles.resetButtonText}>مسح</Text>
                </Pressable>
              )}
              <Pressable
                style={({ pressed }) => [
                  styles.checkButton,
                  !inputText.trim() && styles.checkButtonDisabled,
                  pressed && { opacity: 0.8 },
                ]}
                onPress={handleCheck}
                disabled={!inputText.trim()}
              >
                <Feather name="check-circle" size={16} color="#fff" />
                <Text style={styles.checkButtonText}>تحقق</Text>
              </Pressable>
            </View>

            {/* Results */}
            {results.length > 0 && (
              <View style={styles.resultsWrap}>
                {results.map((r, i) => (
                  <View
                    key={i}
                    style={[
                      styles.resultRow,
                      r.permitted ? styles.resultRowGreen : styles.resultRowRed,
                    ]}
                  >
                    <View style={styles.resultLeft}>
                      <Feather
                        name={r.permitted ? "check-circle" : "x-circle"}
                        size={18}
                        color={r.permitted ? "#1a7a4a" : "#b91c1c"}
                      />
                      <Text style={[styles.resultStatus, r.permitted ? styles.statusGreen : styles.statusRed]}>
                        {r.permitted ? "مسموح" : "غير مسموح"}
                      </Text>
                    </View>
                    <View style={styles.resultRight}>
                      <Text style={styles.resultCode}>{r.raw}</Text>
                      {r.permitted && r.line ? (
                        <Text style={styles.resultName} numberOfLines={2}>{r.line}</Text>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      )}

      {/* Basic Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>المعلومات الأساسية</Text>
        <View style={styles.card}>
          {row1.B && row2.B ? (
            <>
              <InfoRow label={row1.B} value={row2.B} />
              <View style={styles.divider} />
            </>
          ) : null}
          {row1.C ? (
            <Pressable
              style={({ pressed }) => [
                styles.infoRow,
                row2.C === "نعم" && styles.infoRowGreen,
                row2.C === "لا" && styles.infoRowRed,
                row2.C === "نعم" && pressed && { opacity: 0.75 },
              ]}
              onPress={() => row2.C === "نعم" && router.push("/general-additives")}
            >
              <View style={styles.infoValueRow}>
                <Text style={[
                  styles.infoValue,
                  (row2.C === "نعم" || row2.C === "لا") && styles.infoValueBold,
                  row2.C === "نعم" && styles.infoValueLink,
                ]}>
                  {row2.C || "—"}
                </Text>
                {row2.C === "نعم" && (
                  <Feather name="external-link" size={14} color="#0e7c7c" style={{ marginTop: 2 }} />
                )}
              </View>
              <View style={styles.infoLabelWrap}>
                <Text style={styles.infoLabel}>{row1.C}</Text>
              </View>
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Additives */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{row1.D || "المواد المضافة المسموح بها"}</Text>
        {additives.length > 0 ? (
          <View style={styles.card}>
            {additives.map((additive, i) => (
              <View key={i} style={[styles.additiveRow, i < additives.length - 1 && styles.additiveDivider]}>
                <View style={styles.additiveDot} />
                <Text style={styles.additiveText}>{additive}</Text>
              </View>
            ))}
          </View>
        ) : row2.D ? (
          <View style={styles.card}>
            <Text style={styles.noAddText}>{row2.D}</Text>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.noAddText}>لا توجد مضافات مسجلة</Text>
          </View>
        )}
      </View>

      {/* Category */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>التصنيف الرئيسي</Text>
        <View style={styles.card}>
          <Text style={styles.categoryText}>{category.name.trim()}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  errorText: { fontSize: 16, color: colors.light.mutedForeground, textAlign: "center" },
  container: { padding: 16, gap: 16 },
  nameBanner: {
    backgroundColor: "#0e7c7c", borderRadius: 16, padding: 18, gap: 10, alignItems: "flex-end",
  },
  itemName: { fontSize: 18, fontWeight: "700", color: "#ffffff", textAlign: "right", lineHeight: 28 },
  codeBadge: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  codeBadgeText: { fontSize: 13, fontWeight: "600", color: "#ffffff" },
  section: { gap: 8 },
  sectionTitle: {
    fontSize: 12, fontWeight: "600", color: colors.light.mutedForeground,
    textAlign: "right", letterSpacing: 0.3, paddingHorizontal: 4, textTransform: "uppercase",
  },
  card: {
    backgroundColor: "#ffffff", borderRadius: 14, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  divider: { height: 1, backgroundColor: colors.light.border, marginHorizontal: 14 },
  infoRow: { flexDirection: "row", alignItems: "flex-start", padding: 14, gap: 12 },
  infoRowGreen: { backgroundColor: "#f0faf5" },
  infoRowRed: { backgroundColor: "#fff5f5" },
  infoLabelWrap: { flexShrink: 0, maxWidth: 160 },
  infoLabel: {
    fontSize: 12, fontWeight: "500", color: "#0e7c7c", textAlign: "right",
    backgroundColor: "#e0f4f4", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  infoValueRow: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 6 },
  infoValue: { fontSize: 14, color: colors.light.text, textAlign: "right", lineHeight: 20 },
  infoValueBold: { fontWeight: "700", fontSize: 15 },
  infoValueLink: { color: "#0e7c7c", textDecorationLine: "underline" },
  additiveRow: { flexDirection: "row", alignItems: "flex-start", paddingHorizontal: 14, paddingVertical: 10, gap: 10 },
  additiveDivider: { borderBottomWidth: 1, borderBottomColor: colors.light.border },
  additiveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#0e7c7c", marginTop: 6, flexShrink: 0 },
  additiveText: { flex: 1, fontSize: 13, color: colors.light.text, textAlign: "right", lineHeight: 20 },
  noAddText: { fontSize: 14, color: colors.light.mutedForeground, textAlign: "right", padding: 14, lineHeight: 22 },
  categoryText: { fontSize: 14, color: colors.light.text, textAlign: "right", padding: 14, lineHeight: 22 },

  checkerHint: { fontSize: 13, color: colors.light.mutedForeground, textAlign: "right", lineHeight: 20 },
  checkerInput: {
    borderWidth: 1, borderColor: colors.light.border, borderRadius: 10,
    padding: 12, fontSize: 15, color: colors.light.text,
    minHeight: 48, textAlignVertical: "top",
  },
  checkerButtons: { flexDirection: "row", justifyContent: "flex-start", gap: 10 },
  checkButton: {
    backgroundColor: "#0e7c7c", borderRadius: 10,
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingVertical: 11, paddingHorizontal: 20,
  },
  checkButtonDisabled: { backgroundColor: "#aac9c9" },
  checkButtonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  resetButton: {
    borderWidth: 1, borderColor: colors.light.border, borderRadius: 10,
    paddingVertical: 11, paddingHorizontal: 16,
  },
  resetButtonText: { fontSize: 14, color: colors.light.mutedForeground },
  resultsWrap: { gap: 8 },
  resultRow: {
    borderRadius: 10, padding: 12,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10,
  },
  resultRowGreen: { backgroundColor: "#f0faf5", borderWidth: 1, borderColor: "#bbf0d9" },
  resultRowRed: { backgroundColor: "#fff5f5", borderWidth: 1, borderColor: "#fecaca" },
  resultLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  resultStatus: { fontSize: 13, fontWeight: "700" },
  statusGreen: { color: "#1a7a4a" },
  statusRed: { color: "#b91c1c" },
  resultRight: { flex: 1, alignItems: "flex-end", gap: 2 },
  resultCode: { fontSize: 15, fontWeight: "700", color: colors.light.text, textAlign: "right" },
  resultName: { fontSize: 12, color: colors.light.mutedForeground, textAlign: "right", lineHeight: 18 },
});
