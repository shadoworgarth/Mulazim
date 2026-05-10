import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import colors from "@/constants/colors";

/* ─── data ──────────────────────────────────────────────────────────────── */

const SECTIONS = [
  {
    id: "first",
    title: "أولاً: تصنيف المخالفات والغرامات",
    cardBg: "#fffbeb",
    headerBg: "#fde68a",
    accentColor: "#92400e",
    items: [
      {
        label: "١. حجم المنشأة",
        body: "يحدد حجم المنشأة وفقاً لمعياري عدد الموظفين بالدوام الكامل وحجم الإيرادات معاً (استرشاداً بتصنيف الهيئة العامة للمنشآت الصغيرة والمتوسطة) كما هو موضح في الملحق الأول.",
      },
      {
        label: "٢. المنطقة",
        body: "قُسِّمت المناطق جغرافياً إلى 4 مجموعات (أ، ب، ج، د) كما هو موضح في الملحق الثاني.",
      },
      {
        label: "٣. النشاط الاقتصادي",
        body: "قُسِّمت الأنشطة الاقتصادية إلى: مصانع الأغذية، مستودعات ومراكز توزيع الأغذية، مستوردي الأغذية، المختبرات الخاصة لتحليل الأغذية، المكاتب الاستشارية.",
      },
      {
        label: "٤. تصنيف المخالفات",
        body: "تم تصنيف المخالفات إلى مخالفات جسيمة ومخالفات غير جسيمة. وتُعدّ المخالفة جسيمة في حال أنها أدت إلى وقوع ضرر على صحة المستهلك أو سلامته أو على الصحة العامة أو توقع حدوثه، بما في ذلك تداول الغذاء المحظور تداوله وفق نصوص النظام.",
      },
    ],
  },
  {
    id: "second",
    title: "ثانياً: آلية ضبط المخالفات وإيقاع العقوبات",
    cardBg: "#eff6ff",
    headerBg: "#bfdbfe",
    accentColor: "#1e40af",
    items: [
      {
        label: "١. المخالفات الجسيمة",
        body: "يتم ضبط المخالفة وإيقاع العقوبة بشكل مباشر وفقاً لما هو مقرر في جدول تصنيف المخالفات والعقوبات، ويتم مضاعفة قيمة الغرامة في حال تكرار المخالفة خلال سنة من تاريخ ارتكاب المخالفة السابقة.",
      },
      {
        label: "٢. المخالفات غير الجسيمة",
        body: "تطبيق مبدأ الإنذار، ومنح المنشآت التجارية مهلة تصحيحية لمعالجة المخالفة التي صدر بشأنها إنذار أول قبل فرض الغرامة أو العقوبة.\n\n• في حال عدم التصحيح: تطبيق الحد الأدنى من الغرامة المقررة.\n• تكرار المخالفة خلال سنة: رفع قيمة الغرامة بنسبة 50%.\n• تكرار المخالفة للمرة الثانية خلال سنة: تطبيق الحد الأعلى لقيمة الغرامة المقررة.",
      },
    ],
  },
  {
    id: "third",
    title: "ثالثاً: العقوبات غير المالية",
    cardBg: "#fff1f2",
    headerBg: "#fecdd3",
    accentColor: "#9f1239",
    items: [
      {
        label: "",
        body: "إضافة إلى الغرامات المالية، يجوز للهيئة معاقبة مرتكب أي مخالفة لأحكام هذا النظام أو لوائحه بواحدة أو أكثر من العقوبات التالية:\n\n• منع المخالف من ممارسة أي عمل غذائي لمدة لا تتجاوز 180 يوماً.\n• تعليق الترخيص لمدة لا تتجاوز عاماً.\n• إلغاء الترخيص.",
      },
    ],
  },
];

const SIZE_ROWS = [
  { size: "منشآت كبيرة", employees: "250 شخصاً فأكثر", revenue: "200 مليون ر.س أو أكثر" },
  { size: "منشآت متوسطة", employees: "50 – 249 شخصاً", revenue: "40 – 200 مليون ر.س" },
  { size: "منشآت صغيرة / متناهية الصغر", employees: "1 – 49 شخصاً", revenue: "لا تزيد على 40 مليون ر.س" },
];

const REGION_GROUPS = [
  {
    label: "الفئة (أ)",
    color: "#b71c1c",
    bg: "#ffebee",
    cities: ["الرياض", "جدة", "الدمام", "مكة المكرمة", "الخبر", "المدينة المنورة"],
  },
  {
    label: "الفئة (ب)",
    color: "#e65100",
    bg: "#fff3e0",
    cities: [
      "بريدة", "أبها", "جازان", "حائل", "تبوك", "نجران",
      "عرعر", "الباحة", "الطائف", "الهفوف", "حفر الباطن",
      "الظهران", "الخرج", "ينبع", "سكاكا",
    ],
  },
  {
    label: "الفئة (ج)",
    color: "#1b5e20",
    bg: "#e8f5e9",
    cities: [
      "وادي الدواسر", "الدوادمي", "القطيف", "عنيزة", "خميس مشيط",
      "المجمعة", "الزلفي", "الدرعية", "شقراء", "عفيف",
      "القويعية", "العلا", "الخفجي", "بقيق", "الرس",
      "البكيرية", "المذنب", "محايل عسير", "بلجرشي", "تيماء",
      "صبيا", "رابغ", "الجبيل", "بيشة", "ظهران الجنوب",
      "النماص", "فيفا", "القريات",
    ],
  },
  {
    label: "الفئة (د)",
    color: "#1a237e",
    bg: "#e8eaf6",
    cities: ["جميع المدن والمحافظات والمراكز غير المذكورة في الفئات (أ، ب، ج)"],
  },
];

/* ─── components ─────────────────────────────────────────────────────────── */

function CollapsibleSection({
  title,
  children,
  cardBg = "#ffffff",
  headerBg = "#f3f4f6",
  accentColor = colors.light.text,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  cardBg?: string;
  headerBg?: string;
  accentColor?: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <View style={[sec.wrapper, { backgroundColor: cardBg }]}>
      <Pressable
        style={({ pressed }) => [sec.header, { backgroundColor: headerBg, opacity: pressed ? 0.85 : 1 }]}
        onPress={() => setOpen((o) => !o)}
      >
        <Text style={[sec.arrow, { color: accentColor }]}>{open ? "▼" : "◀"}</Text>
        <Text style={[sec.title, { color: accentColor }]}>{title}</Text>
      </Pressable>
      {open && <View style={sec.body}>{children}</View>}
    </View>
  );
}

function BulletItem({
  label,
  body,
  accentColor = "#0e7c7c",
}: {
  label: string;
  body: string;
  accentColor?: string;
}) {
  return (
    <View style={item.row}>
      {label ? (
        <Text style={[item.label, { color: accentColor }]}>{label}</Text>
      ) : null}
      <Text style={item.body}>{body}</Text>
    </View>
  );
}

/* ─── main screen ────────────────────────────────────────────────────────── */

export default function FoodFinesGuidelinesScreen() {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.light.background }}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── General sections ── */}
      {SECTIONS.map((s) => (
        <CollapsibleSection
          key={s.id}
          title={s.title}
          cardBg={s.cardBg}
          headerBg={s.headerBg}
          accentColor={s.accentColor}
        >
          {s.items.map((it, idx) => (
            <BulletItem
              key={idx}
              label={it.label}
              body={it.body}
              accentColor={s.accentColor}
            />
          ))}
        </CollapsibleSection>
      ))}

      {/* ── Appendix 1: Size classification ── */}
      <CollapsibleSection
        title="الملحق الأول: تصنيف المنشآت حسب الحجم"
        cardBg="#f0fdf4"
        headerBg="#bbf7d0"
        accentColor="#14532d"
      >
        <View style={tbl.container}>
          <View style={[tbl.row, tbl.headerRow]}>
            <Text style={[tbl.cell, tbl.headerCell, { flex: 1.4 }]}>حجم المنشأة</Text>
            <Text style={[tbl.cell, tbl.headerCell, { flex: 1 }]}>الموظفون</Text>
            <Text style={[tbl.cell, tbl.headerCell, { flex: 1.2 }]}>الإيرادات</Text>
          </View>
          {SIZE_ROWS.map((r, i) => (
            <View key={i} style={[tbl.row, i % 2 === 1 && tbl.altRow]}>
              <Text style={[tbl.cell, { flex: 1.4, fontFamily: "Inter_600SemiBold" }]}>{r.size}</Text>
              <Text style={[tbl.cell, { flex: 1 }]}>{r.employees}</Text>
              <Text style={[tbl.cell, { flex: 1.2 }]}>{r.revenue}</Text>
            </View>
          ))}
        </View>
      </CollapsibleSection>

      {/* ── Appendix 2: Region classification ── */}
      <CollapsibleSection
        title="الملحق الثاني: تصنيف المناطق والمدن"
        cardBg="#faf5ff"
        headerBg="#e9d5ff"
        accentColor="#4c1d95"
      >
        <View style={{ gap: 10 }}>
          {REGION_GROUPS.map((g) => (
            <View key={g.label} style={[reg.card, { borderRightColor: g.color, backgroundColor: g.bg }]}>
              <View style={[reg.badge, { backgroundColor: g.color }]}>
                <Text style={reg.badgeText}>{g.label}</Text>
              </View>
              <Text style={reg.cities}>{g.cities.join(" • ")}</Text>
            </View>
          ))}
        </View>
      </CollapsibleSection>
    </ScrollView>
  );
}

/* ─── styles ─────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  content: { padding: 14, gap: 12, paddingBottom: 40 },
});

const sec = StyleSheet.create({
  wrapper: {
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  header: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    padding: 14,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    textAlign: "right",
  },
  arrow: { fontSize: 12 },
  body: { padding: 14, paddingTop: 8, gap: 14 },
});

const item = StyleSheet.create({
  row: { gap: 5 },
  label: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    textAlign: "right",
  },
  body: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: colors.light.text,
    textAlign: "right",
    lineHeight: 26,
  },
});

const tbl = StyleSheet.create({
  container: {
    borderWidth: 1.5,
    borderColor: "#9ca3af",
    borderRadius: 8,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row-reverse",
    borderBottomWidth: 1,
    borderBottomColor: "#9ca3af",
  },
  headerRow: { backgroundColor: "rgba(0,0,0,0.08)" },
  altRow: { backgroundColor: "rgba(0,0,0,0.04)" },
  cell: {
    padding: 10,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: colors.light.text,
    textAlign: "right",
    borderRightWidth: 1,
    borderRightColor: "#9ca3af",
  },
  headerCell: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
  },
});

const reg = StyleSheet.create({
  card: {
    borderRightWidth: 4,
    borderRadius: 8,
    padding: 12,
    gap: 7,
  },
  badge: {
    alignSelf: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: "#ffffff",
  },
  cities: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: colors.light.text,
    textAlign: "right",
    lineHeight: 24,
  },
});
