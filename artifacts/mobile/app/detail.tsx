import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import appData from "@/constants/data";
import colors from "@/constants/colors";
import { API_BASE } from "@/constants/api";

// The specific item that supports label scanning (code 14.1.2.1 = catIdx 13, itemIdx 4)
const SCAN_CAT = 13;
const SCAN_ITEM = 4;

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

  const [scanning, setScanning] = useState(false);

  const canScan = catIdx === SCAN_CAT && itemIdx === SCAN_ITEM;

  useEffect(() => {
    if (item) {
      navigation.setOptions({ title: item.name.trim().slice(0, 30) });
    }
  }, [item, navigation]);

  async function handleScan(source: "camera" | "gallery") {
    try {
      let result: ImagePicker.ImagePickerResult;
      if (source === "camera") {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          Alert.alert("إذن مرفوض", "يرجى السماح بالوصول إلى الكاميرا من الإعدادات");
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          quality: 0.55,
          base64: true,
          allowsEditing: false,
        });
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert("إذن مرفوض", "يرجى السماح بالوصول إلى معرض الصور من الإعدادات");
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          quality: 0.55,
          base64: true,
          allowsEditing: false,
        });
      }

      if (result.canceled || !result.assets?.[0]?.base64) return;

      const base64 = result.assets[0].base64;
      setScanning(true);

      const resp = await fetch(`${API_BASE}/ocr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType: "image/jpeg" }),
      });

      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error ?? "OCR failed");

      router.push({
        pathname: "/scan-result",
        params: {
          catIdx: String(catIdx),
          itemIdx: String(itemIdx),
          ocrText: json.text ?? "",
          confidence: String(json.confidence ?? 0),
        },
      });
    } catch (err: any) {
      Alert.alert("خطأ", err?.message ?? "فشل الاتصال بالخادم");
    } finally {
      setScanning(false);
    }
  }

  function showScanOptions() {
    if (Platform.OS === "web") {
      handleScan("gallery");
      return;
    }
    Alert.alert("مسح المكونات", "اختر مصدر الصورة", [
      { text: "الكاميرا", onPress: () => handleScan("camera") },
      { text: "المعرض", onPress: () => handleScan("gallery") },
      { text: "إلغاء", style: "cancel" },
    ]);
  }

  if (!item || !item.data) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>لا تتوفر بيانات لهذا الصنف</Text>
      </View>
    );
  }

  const { row1, row2 } = item.data;

  const additives = row2.D
    ? row2.D.split(/[\r\n]+/).map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { paddingBottom: Platform.OS === "web" ? 34 : 24 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Item Name Banner */}
      <View style={styles.nameBanner}>
        <Text style={styles.itemName}>{item.name.trim()}</Text>
        {row2.A ? (
          <View style={styles.codeBadge}>
            <Text style={styles.codeBadgeText}>{row2.A}</Text>
          </View>
        ) : null}
      </View>

      {/* Scan Button — only for fruit juice item */}
      {canScan && (
        <Pressable
          style={({ pressed }) => [styles.scanButton, pressed && { opacity: 0.8 }]}
          onPress={showScanOptions}
          disabled={scanning}
        >
          {scanning ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Feather name="camera" size={18} color="#fff" />
          )}
          <Text style={styles.scanButtonText}>
            {scanning ? "جارٍ تحليل الصورة..." : "مسح قائمة المكونات"}
          </Text>
        </Pressable>
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
                <Text
                  style={[
                    styles.infoValue,
                    (row2.C === "نعم" || row2.C === "لا") && styles.infoValueBold,
                    row2.C === "نعم" && styles.infoValueLink,
                  ]}
                >
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
        <Text style={styles.sectionTitle}>
          {row1.D || "المواد المضافة المسموح بها"}
        </Text>
        {additives.length > 0 ? (
          <View style={styles.card}>
            {additives.map((additive, i) => (
              <View
                key={i}
                style={[
                  styles.additiveRow,
                  i < additives.length - 1 && styles.additiveDivider,
                ]}
              >
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
  itemName: {
    fontSize: 18, fontWeight: "700", color: "#ffffff", textAlign: "right", lineHeight: 28,
  },
  codeBadge: {
    backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
  },
  codeBadgeText: { fontSize: 13, fontWeight: "600", color: "#ffffff" },
  scanButton: {
    backgroundColor: "#1a5276",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 13,
    paddingHorizontal: 20,
  },
  scanButtonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
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
  additiveRow: {
    flexDirection: "row", alignItems: "flex-start",
    paddingHorizontal: 14, paddingVertical: 10, gap: 10,
  },
  additiveDivider: { borderBottomWidth: 1, borderBottomColor: colors.light.border },
  additiveDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: "#0e7c7c",
    marginTop: 6, flexShrink: 0,
  },
  additiveText: { flex: 1, fontSize: 13, color: colors.light.text, textAlign: "right", lineHeight: 20 },
  noAddText: {
    fontSize: 14, color: colors.light.mutedForeground, textAlign: "right", padding: 14, lineHeight: 22,
  },
  categoryText: { fontSize: 14, color: colors.light.text, textAlign: "right", padding: 14, lineHeight: 22 },
});
