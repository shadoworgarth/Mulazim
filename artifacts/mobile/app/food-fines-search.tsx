import React, { useMemo, useState } from "react";
import {
  Linking,
  Modal,
  Platform,
  Pressable,
  SectionList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import colors from "@/constants/colors";
import {
  EstablishmentFines,
  FOOD_FINES_V2,
  FoodFineV2,
} from "@/constants/food-fines-v2";

/* ─── section colours ───────────────────────────────────────────────────── */

const SECTION_COLORS: Record<number, { bg: string; badgeBg: string; text: string; header: string }> = {
  1: { bg: "#e3f2fd", badgeBg: "#64b5f6", text: "#0d47a1", header: "#1565c0" },
  2: { bg: "#e8f5e9", badgeBg: "#66bb6a", text: "#1b5e20", header: "#2e7d32" },
  3: { bg: "#fff3e0", badgeBg: "#ffa726", text: "#bf360c", header: "#e65100" },
  4: { bg: "#f3e5f5", badgeBg: "#ab47bc", text: "#4a148c", header: "#6a1b9a" },
  5: { bg: "#fce4ec", badgeBg: "#ec407a", text: "#880e4f", header: "#ad1457" },
};

const SECTION_BG: Record<number, string> = {
  1: "#bbdefb", 2: "#c8e6c9", 3: "#ffe0b2", 4: "#e1bee7", 5: "#f8bbd0",
};

/* ─── context picker data ───────────────────────────────────────────────── */

const REVENUE_SIZES = [
  {
    key: "large" as const,
    label: "منشأة كبيرة",
    desc: "إيرادات 200 مليون ر.س فأكثر",
    employees: "250 موظفاً فأكثر",
    color: "#b71c1c",
    bg: "#ffebee",
  },
  {
    key: "medium" as const,
    label: "منشأة متوسطة",
    desc: "إيرادات 40 – 200 مليون ر.س",
    employees: "50 – 249 موظفاً",
    color: "#e65100",
    bg: "#fff3e0",
  },
  {
    key: "small" as const,
    label: "منشأة صغيرة / متناهية الصغر",
    desc: "إيرادات أقل من 40 مليون ر.س",
    employees: "أقل من 50 موظفاً",
    color: "#2e7d32",
    bg: "#e8f5e9",
  },
];

const CITIES_BY_REGION = [
  {
    region: "a" as const,
    label: "الفئة (أ)",
    color: "#b71c1c",
    bg: "#ffebee",
    cities: ["الرياض", "جدة", "الدمام", "مكة المكرمة", "الخبر", "المدينة المنورة"],
  },
  {
    region: "b" as const,
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
    region: "c" as const,
    label: "الفئة (ج)",
    color: "#2e7d32",
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
    region: "d" as const,
    label: "الفئة (د)",
    color: "#1a237e",
    bg: "#e8eaf6",
    cities: ["مدن وأحياء أخرى (الفئة د)"],
  },
];

/* ─── types ─────────────────────────────────────────────────────────────── */

type SizeKey = keyof EstablishmentFines;
type RegionKey = "a" | "b" | "c" | "d";

type InspectorCtx = {
  size: SizeKey | null;
  region: RegionKey | null;
  cityLabel: string | null;
};

type SectionFilter = "all" | 1 | 2 | 3 | 4 | 5;

type ListSection = {
  key: string;
  section: number;
  sectionLabel: string;
  chapter: number;
  chapterLabel: string;
  showSectionHeader: boolean;
  data: FoodFineV2[];
};

/* ─── table data ─────────────────────────────────────────────────────────── */

const SIZE_LABELS: { key: SizeKey; label: string }[] = [
  { key: "small", label: "صغيرة" },
  { key: "medium", label: "متوسطة" },
  { key: "large", label: "كبيرة" },
];
const CAT_KEYS = ["a", "b", "c", "d"] as const;
const CAT_LABELS = ["أ", "ب", "ج", "د"];

/* ─── helpers ────────────────────────────────────────────────────────────── */

function fmt(n: number | null): string {
  if (n === null) return "—";
  return n.toLocaleString("ar-SA");
}

function allSame(fines: EstablishmentFines): boolean {
  const vals: (number | null)[] = [];
  for (const size of SIZE_LABELS)
    for (const cat of CAT_KEYS) vals.push(fines[size.key][cat]);
  const nonNull = vals.filter((v) => v !== null) as number[];
  return nonNull.length > 0 && new Set(nonNull).size === 1;
}

/* ─── FineTable ──────────────────────────────────────────────────────────── */

function FineTable({
  finesMin,
  finesMax,
  fineType,
  activeSize,
  activeRegion,
}: {
  finesMin: EstablishmentFines;
  finesMax: EstablishmentFines;
  fineType: "fixed" | "range";
  activeSize?: SizeKey | null;
  activeRegion?: RegionKey | null;
}) {
  const hasCtx = !!(activeSize && activeRegion);

  return (
    <View style={tableStyles.container}>
      {/* header row */}
      <View style={tableStyles.row}>
        <View style={[tableStyles.sizeCell, tableStyles.headerCell]}>
          <Text style={tableStyles.headerText}>الفئة</Text>
        </View>
        {CAT_KEYS.map((cat, ci) => {
          const isActiveCol = hasCtx && cat === activeRegion;
          return (
            <View
              key={cat}
              style={[
                tableStyles.amtCell,
                tableStyles.headerCell,
                isActiveCol && tableStyles.activeColHeader,
              ]}
            >
              <Text style={[tableStyles.headerText, isActiveCol && tableStyles.activeHeaderText]}>
                {CAT_LABELS[ci]}
              </Text>
              {isActiveCol && (
                <View style={tableStyles.activeColDot} />
              )}
            </View>
          );
        })}
      </View>

      {/* data rows */}
      {SIZE_LABELS.map(({ key, label }, si) => {
        const isActiveRow = hasCtx && key === activeSize;
        return (
          <View
            key={key}
            style={[
              tableStyles.row,
              si % 2 === 1 && !isActiveRow && tableStyles.rowAlt,
              isActiveRow && tableStyles.activeRow,
            ]}
          >
            {/* row header (size) */}
            <View style={[tableStyles.sizeCell, isActiveRow && tableStyles.activeSizeCell]}>
              <Text style={[tableStyles.sizeText, isActiveRow && tableStyles.activeSizeText]}>
                {label}
              </Text>
              {isActiveRow && <View style={tableStyles.activeRowDot} />}
            </View>

            {/* amount cells */}
            {CAT_KEYS.map((cat) => {
              const isActiveCol = hasCtx && cat === activeRegion;
              const isHit = isActiveRow && isActiveCol;
              const hi = finesMax[key][cat];
              const lo = finesMin[key][cat];
              const isRange = fineType === "range" && hi !== lo;
              return (
                <View
                  key={cat}
                  style={[
                    tableStyles.amtCell,
                    isActiveCol && !isActiveRow && tableStyles.activeColCell,
                    isHit && tableStyles.hitCell,
                  ]}
                >
                  {isRange ? (
                    <>
                      <Text style={[tableStyles.amtHi, isHit && tableStyles.hitText]}>{fmt(hi)}</Text>
                      <Text style={[tableStyles.amtSep, isHit && { color: "#fff" }]}>–</Text>
                      <Text style={[tableStyles.amtLo, isHit && tableStyles.hitText]}>{fmt(lo)}</Text>
                    </>
                  ) : (
                    <Text style={[tableStyles.amtFixed, isHit && tableStyles.hitText]}>{fmt(hi)}</Text>
                  )}
                </View>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

/* ─── FineCard ───────────────────────────────────────────────────────────── */

function FineCard({ item, ctx }: { item: FoodFineV2; ctx: InspectorCtx }) {
  const [expanded, setExpanded] = useState(false);
  const sc = SECTION_COLORS[item.section];

  const allVals: number[] = [];
  for (const size of SIZE_LABELS) {
    for (const cat of CAT_KEYS) {
      const lo = item.finesMin[size.key][cat];
      const hi = item.finesMax[size.key][cat];
      if (lo !== null) allVals.push(lo);
      if (hi !== null) allVals.push(hi);
    }
  }
  const overallMin = allVals.length ? Math.min(...allVals) : 0;
  const overallMax = allVals.length ? Math.max(...allVals) : 0;
  const uniformFines = allSame(item.finesMax) && allSame(item.finesMin);
  const summaryLabel =
    overallMin === overallMax
      ? `${fmt(overallMax)} ر.س`
      : `${fmt(overallMin)} – ${fmt(overallMax)} ر.س`;

  /* highlighted fine for context badge */
  const ctxFine =
    ctx.size && ctx.region && !uniformFines
      ? item.finesMax[ctx.size][ctx.region]
      : null;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, { backgroundColor: sc.bg, opacity: pressed ? 0.9 : 1 }]}
      onPress={() => setExpanded((e) => !e)}
    >
      <View style={styles.cardTop}>
        <View style={styles.topRight}>
          <View style={[styles.codeBadge, { backgroundColor: sc.badgeBg }]}>
            <Text style={[styles.codeText, { color: "#ffffff" }]}>
              {item.articleCode}
            </Text>
          </View>
          {/* context fine badge */}
          {ctxFine !== null && (
            <View style={styles.ctxBadge}>
              <Text style={styles.ctxBadgeText}>{fmt(ctxFine)} ر.س</Text>
            </View>
          )}
        </View>
        <Text
          style={styles.violationText}
          numberOfLines={expanded ? undefined : 3}
        >
          {item.violation}
        </Text>
      </View>

      {item.warningApplicable && (
        <View style={styles.metaRow}>
          <View style={styles.warningBadge}>
            <Text style={styles.warningText}>إنذار</Text>
          </View>
        </View>
      )}

      {expanded && (
        <View style={styles.expandedBlock}>
          <View style={styles.expandedMeta}>
            <View style={styles.expandedMetaRow}>
              <Text style={styles.expandedLabel}>وحدة الغرامة</Text>
              <Text style={styles.expandedValue}>{item.unit || "—"}</Text>
            </View>
            <View style={styles.expandedMetaRow}>
              <Text style={styles.expandedLabel}>نوع العقوبة</Text>
              <Text style={styles.expandedValue}>
                {item.fineType === "fixed" ? "قيمة ثابتة" : "حد أدنى / أعلى"}
              </Text>
            </View>
            {item.warningApplicable && (
              <View style={styles.expandedMetaRow}>
                <Text style={styles.expandedLabel}>الإنذار</Text>
                <Text style={[styles.expandedValue, { color: "#e65100" }]}>
                  ينطبق
                </Text>
              </View>
            )}
          </View>

          <View style={styles.tableSection}>
            <Text style={styles.tableTitle}>
              {item.fineType === "range"
                ? "قيمة الغرامة (الحد الأدنى – الأعلى) بالريال"
                : "قيمة الغرامة بالريال"}
            </Text>
            {uniformFines ? (
              <View style={styles.uniformFine}>
                <Text style={styles.uniformFineText}>{summaryLabel}</Text>
                <Text style={styles.uniformFineNote}>
                  (موحدة لجميع الفئات والأحجام)
                </Text>
              </View>
            ) : (
              <FineTable
                finesMin={item.finesMin}
                finesMax={item.finesMax}
                fineType={item.fineType}
                activeSize={ctx.size}
                activeRegion={ctx.region}
              />
            )}
          </View>
        </View>
      )}

      <Text style={styles.expandHint}>{expanded ? "▲" : "▼"}</Text>
    </Pressable>
  );
}

/* ─── Context Picker Modal ───────────────────────────────────────────────── */

function ContextPickerModal({
  visible,
  onDone,
  onClose,
}: {
  visible: boolean;
  onDone: (ctx: InspectorCtx) => void;
  onClose: () => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedSize, setSelectedSize] = useState<SizeKey | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<RegionKey | null>(null);
  const [cityQuery, setCityQuery] = useState("");

  const filteredGroups = useMemo(() => {
    if (!cityQuery.trim()) return CITIES_BY_REGION;
    return CITIES_BY_REGION.map((g) => ({
      ...g,
      cities: g.cities.filter((c) => c.includes(cityQuery.trim())),
    })).filter((g) => g.cities.length > 0);
  }, [cityQuery]);

  function reset() {
    setStep(1);
    setSelectedSize(null);
    setSelectedCity(null);
    setSelectedRegion(null);
    setCityQuery("");
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleConfirm() {
    onDone({ size: selectedSize, region: selectedRegion, cityLabel: selectedCity });
    reset();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={modal.backdrop}>
        <View style={modal.sheet}>
          {/* header */}
          <View style={modal.header}>
            <Pressable onPress={handleClose} style={modal.closeBtn}>
              <Text style={modal.closeTxt}>✕</Text>
            </Pressable>
            <Text style={modal.title}>
              {step === 1 ? "حجم المنشأة" : "المدينة / المنطقة"}
            </Text>
            {step === 2 && (
              <Pressable onPress={() => setStep(1)} style={modal.backBtn}>
                <Text style={modal.backTxt}>رجوع</Text>
              </Pressable>
            )}
          </View>

          <Text style={modal.subtitle}>
            {step === 1
              ? "اختر حجم المنشأة"
              : "اختر مدينة المنشأة لتحديد الفئة الجغرافية"}
          </Text>

          {/* Link to company lookup */}
          <Pressable
            style={modal.linkRow}
            onPress={() => Linking.openURL("https://mc.gov.sa/ar/eservices/Pages/Commercial-data.aspx")}
          >
            <Text style={modal.linkText}>🔍 ابحث عن بيانات المنشأة التجارية (وزارة التجارة)</Text>
          </Pressable>

          {/* Step 1: Size picker */}
          {step === 1 && (
            <ScrollView style={modal.body} showsVerticalScrollIndicator={false}>
              <View style={{ gap: 10 }}>
                {REVENUE_SIZES.map((s) => {
                  const active = selectedSize === s.key;
                  return (
                    <Pressable
                      key={s.key}
                      style={[modal.sizeCard, { borderColor: s.color, backgroundColor: active ? s.color : s.bg }]}
                      onPress={() => setSelectedSize(s.key)}
                    >
                      <View style={modal.sizeCardRight}>
                        <Text style={[modal.sizeLabel, active && { color: "#fff" }]}>{s.label}</Text>
                        <Text style={[modal.sizeDesc, active && { color: "#fff" }]}>{s.desc}</Text>
                        <Text style={[modal.sizeEmployees, active && { color: "rgba(255,255,255,0.8)" }]}>
                          {s.employees}
                        </Text>
                      </View>
                      <View style={[modal.sizeRadio, active && { borderColor: "#fff" }]}>
                        {active && <View style={[modal.sizeRadioFill, { backgroundColor: "#fff" }]} />}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
              <Pressable
                style={[modal.nextBtn, !selectedSize && modal.nextBtnDisabled]}
                onPress={() => selectedSize && setStep(2)}
              >
                <Text style={modal.nextBtnText}>التالي: اختيار المدينة ←</Text>
              </Pressable>
            </ScrollView>
          )}

          {/* Step 2: City picker */}
          {step === 2 && (
            <>
              <TextInput
                style={modal.citySearch}
                placeholder="ابحث عن مدينة..."
                placeholderTextColor="#9ca3af"
                value={cityQuery}
                onChangeText={setCityQuery}
                textAlign="right"
              />
              <ScrollView style={modal.body} showsVerticalScrollIndicator={false}>
                {filteredGroups.map((g) => (
                  <View key={g.region} style={{ marginBottom: 14 }}>
                    <View style={[modal.regionHeader, { backgroundColor: g.bg }]}>
                      <Text style={[modal.regionLabel, { color: g.color }]}>{g.label}</Text>
                    </View>
                    <View style={{ gap: 6, marginTop: 6 }}>
                      {g.cities.map((city) => {
                        const active = selectedCity === city;
                        return (
                          <Pressable
                            key={city}
                            style={[modal.cityRow, active && { backgroundColor: g.color }]}
                            onPress={() => { setSelectedCity(city); setSelectedRegion(g.region); }}
                          >
                            <Text style={[modal.cityText, active && { color: "#fff", fontWeight: "700" }]}>
                              {city}
                            </Text>
                            {active && <Text style={modal.cityCheck}>✓</Text>}
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                ))}
              </ScrollView>
              <Pressable
                style={[modal.nextBtn, (!selectedCity || !selectedRegion) && modal.nextBtnDisabled]}
                onPress={() => selectedCity && selectedRegion && handleConfirm()}
              >
                <Text style={modal.nextBtnText}>تأكيد الاختيار</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

/* ─── Main screen ────────────────────────────────────────────────────────── */

const SECTION_NUMS = [1, 2, 3, 4, 5] as const;
const SECTION_SHORT: Record<number, string> = {
  1: "المصانع", 2: "المستودعات", 3: "المستوردون",
  4: "المختبرات", 5: "المكاتب",
};

const SIZE_SHORT: Record<SizeKey, string> = {
  large: "كبيرة", medium: "متوسطة", small: "صغيرة",
};
const REGION_LABEL: Record<RegionKey, string> = {
  a: "الفئة (أ)", b: "الفئة (ب)", c: "الفئة (ج)", d: "الفئة (د)",
};

export default function FoodFinesSearchScreen() {
  const [query, setQuery] = useState("");
  const [activeSection, setActiveSection] = useState<SectionFilter>("all");
  const [collapsedChapters, setCollapsedChapters] = useState<Set<string>>(() => {
    const keys = new Set<string>();
    for (const item of FOOD_FINES_V2) keys.add(`${item.section}-${item.chapter}`);
    return keys;
  });
  const [ctx, setCtx] = useState<InspectorCtx>({ size: null, region: null, cityLabel: null });
  const [showPicker, setShowPicker] = useState(false);

  const hasCtx = !!(ctx.size && ctx.region);

  const toggleChapter = (key: string) => {
    setCollapsedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const q = query.trim();

  const filtered = useMemo(() => {
    return FOOD_FINES_V2.filter((item) => {
      if (activeSection !== "all" && item.section !== activeSection) return false;
      if (!q) return true;
      return (
        item.violation.includes(q) ||
        item.articleCode.toLowerCase().includes(q.toLowerCase()) ||
        item.chapterLabel.includes(q) ||
        item.sectionLabel.includes(q)
      );
    });
  }, [q, activeSection]);

  const rawSections = useMemo<(ListSection & { totalCount: number })[]>(() => {
    const map = new Map<string, ListSection & { totalCount: number }>();
    for (const item of filtered) {
      const key = `${item.section}-${item.chapter}`;
      if (!map.has(key)) {
        map.set(key, {
          key, section: item.section, sectionLabel: item.sectionLabel,
          chapter: item.chapter, chapterLabel: item.chapterLabel,
          showSectionHeader: false, totalCount: 0, data: [],
        });
      }
      const entry = map.get(key)!;
      entry.totalCount += 1;
      entry.data.push(item);
    }
    const list = Array.from(map.values());
    let lastSec = -1;
    for (const s of list) {
      if (s.section !== lastSec) { s.showSectionHeader = true; lastSec = s.section; }
    }
    return list;
  }, [filtered]);

  const sections = useMemo<(ListSection & { totalCount: number; collapsed: boolean })[]>(() => {
    return rawSections.map((s) => {
      const collapsed = collapsedChapters.has(s.key);
      return { ...s, collapsed, data: collapsed ? [] : s.data };
    });
  }, [rawSections, collapsedChapters]);

  const totalCount = filtered.length;

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder="ابحث بوصف المخالفة أو رقم المادة (مثال: 1/1/1)"
          placeholderTextColor={colors.light.mutedForeground}
          value={query}
          onChangeText={setQuery}
          clearButtonMode="while-editing"
          textAlign="right"
          returnKeyType="search"
        />
      </View>

      {/* Section tabs */}
      <View style={styles.tabsWrap}>
        <View style={styles.tabs}>
          {(["all", ...SECTION_NUMS] as SectionFilter[]).map((val) => {
            const active = activeSection === val;
            const sc = typeof val === "number" ? SECTION_COLORS[val] : null;
            return (
              <Pressable
                key={String(val)}
                style={[styles.tab, active && { backgroundColor: sc ? sc.bg : "#0e7c7c" }]}
                onPress={() => setActiveSection(val)}
              >
                <Text style={[styles.tabText, active && { color: sc ? sc.text : "#ffffff", fontWeight: "700" }]}>
                  {val === "all" ? "الكل" : SECTION_SHORT[val]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Inspector context banner */}
      {hasCtx ? (
        <View style={styles.ctxBanner}>
          <Pressable onPress={() => setCtx({ size: null, region: null, cityLabel: null })} style={styles.ctxClear}>
            <Text style={styles.ctxClearTxt}>✕</Text>
          </Pressable>
          <View style={styles.ctxInfo}>
            <Text style={styles.ctxInfoText}>
              {SIZE_SHORT[ctx.size!]} · {ctx.cityLabel} · {REGION_LABEL[ctx.region!]}
            </Text>
            <Text style={styles.ctxInfoHint}>الغرامة المحددة محاطة بإطار أحمر في الجدول</Text>
          </View>
          <Pressable onPress={() => setShowPicker(true)} style={styles.ctxEdit}>
            <Text style={styles.ctxEditTxt}>تعديل</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable style={styles.ctxPrompt} onPress={() => setShowPicker(true)}>
          <Text style={styles.ctxPromptText}>📍 حدد المنشأة لتمييز الغرامة المنطبقة عليها</Text>
        </Pressable>
      )}

      {/* Results bar */}
      <View style={styles.resultsBar}>
        <Text style={styles.resultsCount}>{totalCount} مخالفة</Text>
        <Text style={styles.tapHint}>اضغط على البطاقة لعرض جدول الغرامات</Text>
      </View>

      {/* List */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => `${item.articleCode}-${item.section}`}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        stickySectionHeadersEnabled={false}
        renderItem={({ item }) => (
          <View style={styles.cardWrap}>
            <FineCard item={item} ctx={ctx} />
          </View>
        )}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeaderWrap}>
            {section.showSectionHeader && (
              <View style={[styles.sectionBanner, { backgroundColor: SECTION_BG[section.section] }]}>
                <Text style={[styles.sectionBannerText, { color: SECTION_COLORS[section.section].header }]}>
                  {section.sectionLabel}
                </Text>
              </View>
            )}
            <Pressable
              style={({ pressed }) => [styles.chapterHeader, pressed && { opacity: 0.7 }]}
              onPress={() => toggleChapter(section.key)}
            >
              <Text style={[styles.chapterArrow, { color: SECTION_COLORS[section.section].header }]}>
                {section.collapsed ? "◀" : "▼"}
              </Text>
              <Text style={styles.chapterHeaderText} numberOfLines={2}>
                {section.chapterLabel}
              </Text>
              <View style={[styles.chapterAccent, { backgroundColor: SECTION_COLORS[section.section].header }]} />
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>لا توجد نتائج</Text>
          </View>
        }
      />

      <ContextPickerModal
        visible={showPicker}
        onClose={() => setShowPicker(false)}
        onDone={(newCtx) => { setCtx(newCtx); setShowPicker(false); }}
      />
    </View>
  );
}

/* ─── Styles ─────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f6f9" },
  searchWrap: { padding: 14, paddingBottom: 8 },
  searchInput: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    fontSize: 14,
    color: colors.light.text,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    textAlign: "right",
  },
  tabsWrap: { paddingBottom: 4, paddingHorizontal: 14 },
  tabs: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 6 },
  tab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: "#f3f4f6" },
  tabText: { fontSize: 12, color: colors.light.mutedForeground, fontWeight: "500" },

  /* context prompt */
  ctxPrompt: {
    marginHorizontal: 14,
    marginBottom: 8,
    backgroundColor: "#dc2626",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  ctxPromptText: { fontSize: 14, color: "#ffffff", textAlign: "right", fontWeight: "700" },

  /* context banner */
  ctxBanner: {
    marginHorizontal: 14,
    marginBottom: 8,
    backgroundColor: "#fef2f2",
    borderWidth: 1.5,
    borderColor: "#ef4444",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
  },
  ctxInfo: { flex: 1, gap: 2 },
  ctxInfoText: { fontSize: 13, fontWeight: "700", color: "#991b1b", textAlign: "right" },
  ctxInfoHint: { fontSize: 11, color: "#b91c1c", textAlign: "right" },
  ctxEdit: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  ctxEditTxt: { fontSize: 12, color: "#fff", fontWeight: "700" },
  ctxClear: { padding: 4 },
  ctxClearTxt: { fontSize: 14, color: "#ef4444", fontWeight: "700" },

  /* ctx fine badge on card */
  ctxBadge: {
    marginTop: 4,
    backgroundColor: "#ef4444",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  ctxBadgeText: { fontSize: 11, color: "#fff", fontWeight: "700", textAlign: "center" },

  resultsBar: {
    paddingHorizontal: 16, paddingBottom: 8,
    flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center",
  },
  resultsCount: { fontSize: 12, color: colors.light.mutedForeground },
  tapHint: { fontSize: 11, color: colors.light.mutedForeground, fontStyle: "italic" },
  list: { paddingHorizontal: 14, paddingBottom: Platform.OS === "web" ? 40 : 28 },
  sectionHeaderWrap: { marginTop: 12 },
  sectionBanner: { borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14, marginBottom: 8 },
  sectionBannerText: { fontSize: 15, fontWeight: "800", textAlign: "right" },
  chapterHeader: {
    flexDirection: "row-reverse", alignItems: "center", gap: 8,
    paddingVertical: 8, paddingHorizontal: 4, marginBottom: 6, borderRadius: 8,
  },
  chapterAccent: { width: 3, height: 18, borderRadius: 2, flexShrink: 0 },
  chapterHeaderText: { fontSize: 13, fontWeight: "700", color: "#374151", textAlign: "right", flex: 1 },
  chapterArrow: { fontSize: 11, fontWeight: "700", flexShrink: 0, width: 16, textAlign: "center" },
  cardWrap: { marginBottom: 8 },
  card: {
    borderRadius: 14, padding: 14,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 3, elevation: 2, gap: 8,
  },
  cardTop: { flexDirection: "row-reverse", alignItems: "flex-start", gap: 10 },
  topRight: { flexShrink: 0, gap: 4 },
  codeBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  codeText: { fontSize: 13, fontWeight: "700", letterSpacing: 0.3 },
  violationText: { flex: 1, fontSize: 14, color: colors.light.text, textAlign: "right", lineHeight: 21 },
  metaRow: { flexDirection: "row-reverse", alignItems: "center", gap: 6 },
  warningBadge: { backgroundColor: "#fff3e0", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  warningText: { fontSize: 11, color: "#e65100", fontWeight: "600" },
  expandedBlock: { borderTopWidth: 1, borderTopColor: "#f0f0f0", paddingTop: 10, gap: 12 },
  expandedMeta: { gap: 6 },
  expandedMetaRow: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  expandedLabel: { fontSize: 12, color: colors.light.mutedForeground, flexShrink: 0 },
  expandedValue: { fontSize: 13, color: colors.light.text, textAlign: "right", flex: 1, lineHeight: 19 },
  tableSection: { gap: 6 },
  tableTitle: { fontSize: 12, color: colors.light.mutedForeground, textAlign: "right", fontWeight: "600" },
  uniformFine: { alignItems: "flex-end", gap: 2 },
  uniformFineText: { fontSize: 16, fontWeight: "700", color: "#0e7c7c" },
  uniformFineNote: { fontSize: 11, color: colors.light.mutedForeground },
  expandHint: { textAlign: "center", fontSize: 10, color: "#d1d5db", marginTop: -2 },
  empty: { paddingVertical: 60, alignItems: "center" },
  emptyText: { fontSize: 15, color: colors.light.mutedForeground },
});

const tableStyles = StyleSheet.create({
  container: { borderWidth: 1.5, borderColor: "#9ca3af", borderRadius: 8, overflow: "hidden" },
  row: { flexDirection: "row-reverse", borderBottomWidth: 1, borderBottomColor: "#9ca3af" },
  rowAlt: { backgroundColor: "rgba(0,0,0,0.03)" },
  activeRow: { backgroundColor: "#fef2f2" },
  headerCell: { backgroundColor: "rgba(0,0,0,0.07)" },
  activeColHeader: { backgroundColor: "#ef4444" },
  activeHeaderText: { color: "#ffffff" },
  activeSizeCell: { backgroundColor: "#ef4444" },
  activeSizeText: { color: "#ffffff" },
  activeColCell: { backgroundColor: "#fee2e2" },
  hitCell: { backgroundColor: "#dc2626" },
  hitText: { color: "#ffffff" },
  activeRowDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "#fff", marginTop: 2 },
  activeColDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "#fff", marginTop: 2 },
  sizeCell: {
    width: 52, paddingVertical: 6, paddingHorizontal: 4,
    justifyContent: "center", alignItems: "flex-end",
    borderLeftWidth: 1, borderLeftColor: "#9ca3af",
  },
  amtCell: {
    flex: 1, paddingVertical: 5, paddingHorizontal: 3,
    alignItems: "center", justifyContent: "center",
    borderLeftWidth: 1, borderLeftColor: "#9ca3af",
  },
  headerText: { fontSize: 11, fontWeight: "700", color: colors.light.text, textAlign: "center" },
  sizeText: { fontSize: 11, fontWeight: "600", color: colors.light.text, textAlign: "right" },
  amtFixed: { fontSize: 11, color: "#0e7c7c", fontWeight: "600", textAlign: "center" },
  amtHi: { fontSize: 10, color: "#c62828", fontWeight: "600", textAlign: "center" },
  amtSep: { fontSize: 9, color: "#9ca3af" },
  amtLo: { fontSize: 10, color: "#2e7d32", fontWeight: "600", textAlign: "center" },
});

const modal = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "88%",
    paddingBottom: Platform.OS === "ios" ? 34 : 16,
  },
  header: {
    flexDirection: "row-reverse",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  title: { flex: 1, fontSize: 17, fontWeight: "700", color: colors.light.text, textAlign: "right" },
  closeBtn: { padding: 4 },
  closeTxt: { fontSize: 16, color: colors.light.mutedForeground },
  backBtn: { paddingHorizontal: 10, paddingVertical: 4 },
  backTxt: { fontSize: 13, color: "#0e7c7c", fontWeight: "600" },
  subtitle: { fontSize: 13, color: colors.light.mutedForeground, textAlign: "right", paddingHorizontal: 16, paddingTop: 8 },
  linkRow: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    backgroundColor: "#eff6ff",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  linkText: { fontSize: 13, color: "#1d4ed8", fontWeight: "600", textAlign: "right" },
  body: { padding: 16, paddingTop: 8 },
  sizeCard: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 14,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
  },
  sizeCardRight: { flex: 1, gap: 3 },
  sizeLabel: { fontSize: 15, fontWeight: "700", color: colors.light.text, textAlign: "right" },
  sizeDesc: { fontSize: 13, color: "#4b5563", textAlign: "right" },
  sizeEmployees: { fontSize: 12, color: "#6b7280", textAlign: "right" },
  sizeRadio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: "#9ca3af",
    alignItems: "center", justifyContent: "center",
  },
  sizeRadioFill: { width: 10, height: 10, borderRadius: 5 },
  nextBtn: {
    marginTop: 16, marginHorizontal: 0,
    backgroundColor: "#0e7c7c", borderRadius: 12,
    paddingVertical: 14, alignItems: "center",
  },
  nextBtnDisabled: { backgroundColor: "#d1d5db" },
  nextBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  citySearch: {
    marginHorizontal: 16, marginTop: 8,
    backgroundColor: "#f3f4f6", borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: colors.light.text,
    textAlign: "right",
  },
  regionHeader: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  regionLabel: { fontSize: 13, fontWeight: "700", textAlign: "right" },
  cityRow: {
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 8, backgroundColor: "#f9fafb",
    flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between",
  },
  cityText: { fontSize: 14, color: colors.light.text, textAlign: "right" },
  cityCheck: { fontSize: 14, color: "#fff", fontWeight: "700" },
});
