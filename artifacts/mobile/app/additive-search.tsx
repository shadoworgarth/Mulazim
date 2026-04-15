import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import appData, { SubItem } from "@/constants/data";
import colors from "@/constants/colors";

const generalData = require("../assets/general-additives.json") as {
  table1: { rows: { ins: string; name: string }[] };
  table2: { rows: { ins: string; color: string; food: string }[] };
};

const comprehensiveData = require("../assets/comprehensive-additives.json") as {
  ins: string; name: string; funcClass?: string;
}[];

// Build a Set of INS codes that are in the general-additives list for badge display
const generalInsSet = new Set<string>([
  ...generalData.table1.rows.map((r) => r.ins.toLowerCase()),
  ...generalData.table2.rows.map((r) => r.ins.toLowerCase()),
]);

// ── Named additive families (same items permitted for all members) ─────────────
const FAMILY_GROUPS: { name: string; codes: string[] }[] = [
  // page 35
  { name: "ASCORBYL ESTERS",
    codes: ["304","305"] },
  // page 42
  { name: "BENZOATES",
    codes: ["210","211","212","213"] },
  // page 72
  // page 77
  { name: "CHLOROPHYLLS AND CHLOROPHYLLINS",
    codes: ["140","141(i)","141(ii)"] },
  // page 90
  { name: "ETHYLENE DIAMINE TETRA ACETATES",
    codes: ["385","386"] },
  // page 94
  { name: "FERROCYANIDES",
    codes: ["535","536","538"] },
  // page 103
  { name: "HYDROXYBENZOATES, PARA (PARABENS)",
    codes: ["214","218"] },
  // page 109
  { name: "IRON OXIDES AND HYDROXIDES",
    codes: ["172(i)","172(ii)","172(iii)"] },
  // page 133
  { name: "NITRITES",
    codes: ["249","250"] },
  // page 134
  { name: "ORTHO-PHENYLPHENOLS",
    codes: ["231","232"] },
  // page 137
  { name: "PHOSPHATES",
    codes: ["338",
            "339","339(i)","339(ii)","339(iii)",
            "340(i)","340(ii)","340(iii)",
            "341(i)","341(ii)","341(iii)",
            "342(i)","342(ii)",
            "343(i)","343(ii)","343(iii)",
            "450","450(i)","450(ii)","450(iii)","450(iv)","450(v)","450(vi)","450(vii)","450(ix)",
            "451(i)","451(ii)",
            "452","452(i)","452(ii)","452(iii)","452(iv)","452(v)",
            "542"] },
  // page 148
  { name: "POLYOXYETHYLENE STEARATES",
    codes: ["430","431"] },
  // page 148
  { name: "POLYSORBATES",
    codes: ["432","433","434","435","436"] },
  // page 163
  { name: "QUILLAIA EXTRACTS",
    codes: ["999(i)","999(ii)"] },
  // page 163
  { name: "RIBOFLAVINS",
    codes: ["101(i)","101(ii)","101(iii)"] },
  // page 166
  { name: "SACCHARINS",
    codes: ["954(i)","954(ii)","954(iii)","954(iv)"] },
  // page 173
  { name: "SODIUM ALUMINIUM PHOSPHATES",
    codes: ["541(i)","541(ii)"] },
  // page 183
  { name: "SORBATES",
    codes: ["200","201","202","203"] },
  // page 186
  { name: "SORBITAN ESTERS OF FATTY ACIDS",
    codes: ["491","492","493","494","495"] },
  // page 189
  { name: "STEAROYL LACTYLATES",
    codes: ["481(i)","482(i)"] },
  // page 191
  { name: "STEVIOL GLYCOSIDES",
    codes: ["960a","960b(i)"] },
  // page 201
  { name: "SULFITES",
    codes: ["220","221","222","223","224","225"] },
  // page 207
  { name: "TARTRATES",
    codes: ["334","335(ii)","337"] },
  // page 211
  { name: "THIODIPROPIONATES",
    codes: ["388","389"] },
  // page 211
  { name: "TOCOPHEROLS",
    codes: ["307","307a","307b","307c"] },
];

// Reverse map: INS code → index in FAMILY_GROUPS
const CODE_TO_FAMILY = new Map<string, number>(
  FAMILY_GROUPS.flatMap((fg, i) => fg.codes.map((c) => [c, i] as [string, number]))
);

// ─── Result types ─────────────────────────────────────────────────────────────
type ItemResult = {
  kind: "item";
  categoryIndex: number;
  categoryName: string;
  itemIndex: number;
  item: SubItem;
  matchedAdditive: string;
};

type GeneralMatchResult = {
  kind: "general-match";
  ins: string;
  label: string;
  detail: string;
};

type ComprehensiveMatchResult = {
  kind: "comprehensive-match";
  ins: string;
  name: string;
  funcClass?: string;
  isGeneral: boolean;
};

type SimilarGroupResult = {
  kind: "similar-group";
  baseCode: string;           // shared numeric prefix, e.g. "101"
  baseName: string;           // first member's name as group label
  funcClass?: string;
  members: ComprehensiveMatchResult[];
};

type AllowsGeneralResult = {
  kind: "allows-general";
  categoryIndex: number;
  categoryName: string;
  itemIndex: number;
  item: SubItem;
};

type SearchResult = ItemResult | GeneralMatchResult | ComprehensiveMatchResult | SimilarGroupResult | AllowsGeneralResult;

// ─── Range-aware matching ──────────────────────────────────────────────────────
const ROMAN: Record<string, number> = {
  i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, x: 10,
};
function romanToInt(r: string): number { return ROMAN[r.toLowerCase()] ?? 0; }

/** Strip spaces and lowercase — used for code-level comparisons */
function normCode(s: string): string {
  return s.replace(/\s+/g, "").toLowerCase();
}

/**
 * Normalise a user query before matching:
 *  • strip leading "INS" / "E" prefix (with optional space)
 *  • lowercase + trim
 * Returns the cleaned query string.
 */
function normalizeQuery(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^ins\s*/i, "")   // "INS 200" → "200"
    .replace(/^e(?=\d{3})/i, "") // "E200" → "200"  (only before 3-digit number)
    .trim();
}

/**
 * Given a query that looks like a code without a letter suffix (e.g. "160(i)"),
 * return candidate expansions that insert a letter between the digits and the
 * roman-numeral part: ["160a(i)", "160b(i)", "160c(i)", …]
 * This handles the known Excel data-entry issue where the letter was dropped.
 */
function missingLetterExpansions(q: string): string[] {
  const m = q.match(/^(\d{3,4})\(([ivx]+)\)$/i);
  if (!m) return [];
  return ["a", "b", "c", "d", "e", "f"].map((l) => `${m[1]}${l}(${m[2]})`);
}

/** Escape special regex chars */
function escRx(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Check whether a query code (e.g. "101(ii)") is present in a text that may
 * express it as:
 *   • Exact: "101(ii)"
 *   • Range: "101(i)-(iii)"
 *   • Comma list: "101(i),(ii),(iii)" or "101(i), (ii), (iii)"
 * prefix is the numeric+letter part before the first "(", e.g. "101" or "160a".
 * qVal is the integer value of the roman suffix.
 * Works on normalised (no-space, lower) text.
 */
function matchesPrefixRoman(tn: string, prefix: string, qVal: number): boolean {
  // (?<!\d) prevents "101" from matching inside "1101"
  const esc = "(?<!\\d)" + escRx(prefix);
  // Range: "101(i)-(iii)"
  const rangeRx = new RegExp(esc + "\\(([ivx]+)\\)-\\(([ivx]+)\\)", "gi");
  let m: RegExpExecArray | null;
  while ((m = rangeRx.exec(tn)) !== null) {
    if (qVal >= romanToInt(m[1]) && qVal <= romanToInt(m[2])) return true;
  }
  // Comma-separated list: "101(i),(ii),(iii)" — capture the whole block then
  // check each individual roman value
  const listRx = new RegExp(
    esc + "(?:\\(([ivx]+)\\),?\\s*)+",
    "gi"
  );
  while ((m = listRx.exec(tn)) !== null) {
    const block = m[0];
    const vals = [...block.matchAll(/\(([ivx]+)\)/gi)].map((x) =>
      romanToInt(x[1])
    );
    if (vals.includes(qVal)) return true;
  }
  return false;
}

function matchesQuery(text: string, q: string): boolean {
  const tl = text.toLowerCase();
  const tn = normCode(text);
  const qn = normCode(q);

  // 1. Direct substring — but guard against digit-embedded false positives.
  //    Only accept if NOT preceded/followed by a digit.
  if (tl.includes(q)) {
    const idx = tl.indexOf(q);
    const before = idx > 0 ? tl[idx - 1] : " ";
    const after = idx + q.length < tl.length ? tl[idx + q.length] : " ";
    if (!/\d/.test(before)) return true; // safe match
    // If preceded by a digit it's a false positive — keep going
  }

  // 2. Plain number (3-4 digits): word-boundary + dash-range check
  const queryNum = parseInt(q, 10);
  if (/^\d{3,4}$/.test(q) && !Number.isNaN(queryNum)) {
    const wordBound = new RegExp(`(?<!\\d)${q}(?!\\d)`, "g");
    if (wordBound.test(tl)) return true;
    const numRange = /\b(\d{3,4})-(\d{3,4})\b/g;
    let m: RegExpExecArray | null;
    while ((m = numRange.exec(tl)) !== null) {
      if (queryNum >= Number(m[1]) && queryNum <= Number(m[2])) return true;
    }
    return false;
  }

  // 3. Code with roman suffix: "101(ii)", "160a(ii)", "172(iii)"
  const romanQ = q.match(/^(\d{3,4}[a-z]?)\(([ivx]+)\)$/i);
  if (romanQ) {
    const prefix = romanQ[1].toLowerCase();
    const qVal = romanToInt(romanQ[2]);
    if (qVal > 0) {
      // 3a. Exact code word-boundary check (prevent "101(ii)" matching "1101(ii)")
      const exactRx = new RegExp(`(?<!\\d)${escRx(qn)}(?![\\w])`, "i");
      if (exactRx.test(tn)) return true;
      // 3b. Range / comma-list with same prefix
      if (matchesPrefixRoman(tn, prefix, qVal)) return true;
      // 3c. Missing-letter expansion: "160(ii)" → try "160a(ii)", "160b(ii)"…
      for (const exp of missingLetterExpansions(q)) {
        const expM = exp.match(/^(\d{3,4}[a-z])\(([ivx]+)\)$/i);
        if (!expM) continue;
        const expPfx = expM[1].toLowerCase();
        const expVal = romanToInt(expM[2]);
        if (matchesPrefixRoman(tn, expPfx, expVal)) return true;
      }
    }
    return false;
  }

  // 4. Generic roman-only query: "(ii)" → match any range/list containing it
  const genericQ = q.match(/^\(([ivx]+)\)$/i);
  if (genericQ) {
    const qVal = romanToInt(genericQ[1]);
    if (qVal > 0) {
      const anyRange = /\(([ivx]+)\)-\(([ivx]+)\)/gi;
      let m: RegExpExecArray | null;
      while ((m = anyRange.exec(tl)) !== null) {
        if (qVal >= romanToInt(m[1]) && qVal <= romanToInt(m[2])) return true;
      }
    }
    return false;
  }

  // 5. Name / free-text search (no code pattern) — plain substring on normalised
  if (qn.length >= 2 && tn.includes(qn)) return true;

  // 6. Abbreviated continuation lists: "160a(i),a(iii),e,f" also contains
  //    "160a(iii)", "160e", "160f". Check if any expansion of the abbreviated
  //    list equals the query code. Works for roman-suffix AND letter-suffix codes.
  {
    const numMatch = qn.match(/^(\d{3,4})/);
    if (numMatch) {
      const numBase = numMatch[1];
      const abbrevRx = new RegExp(
        `(?<!\\d)${escRx(numBase)}[a-z]?\\([ivx]+\\)((?:,\\s*[a-z]?(?:\\([ivx]+\\))?(?![a-z\\d]))+)`,
        "gi"
      );
      let am: RegExpExecArray | null;
      while ((am = abbrevRx.exec(tn)) !== null) {
        const contStr = am[1];
        for (const part of [...contStr.matchAll(/,\s*([a-z]?)(\([ivx]+\))?/gi)]) {
          const letter = part[1] || "";
          const roman  = part[2] || "";
          if (!letter && !roman) continue;
          if (`${numBase}${letter}${roman}`.toLowerCase() === qn) return true;
        }
      }
    }
  }

  return false;
}

// ─── Highlight helper ─────────────────────────────────────────────────────────
function highlight(text: string, rawQuery: string): React.ReactNode {
  if (!rawQuery.trim()) return <Text style={styles.matchText}>{text}</Text>;
  // Try to highlight using the normalised query (strips INS prefix etc.)
  const lq = normalizeQuery(rawQuery);
  const lt = text.toLowerCase();
  const idx = lq.length >= 2 ? lt.indexOf(lq) : -1;
  if (idx === -1) return <Text style={styles.matchText}>{text}</Text>;
  return (
    <Text style={styles.matchText}>
      {text.slice(0, idx)}
      <Text style={styles.matchHighlight}>{text.slice(idx, idx + lq.length)}</Text>
      {text.slice(idx + lq.length)}
    </Text>
  );
}

export default function AdditiveSearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");

  const results = useMemo<SearchResult[]>(() => {
    const raw = query.trim();
    if (!raw || raw.length < 2) return [];

    // Normalised query: strips "INS"/"E" prefix, lowercased
    const q = normalizeQuery(raw);
    if (!q || q.length < 2) return [];

    const itemResultKeys = new Set<string>(); // "catIdx-itemIdx"

    // ── 1. Comprehensive additives first (so badges appear at the top) ────────
    const seenIns = new Set<string>();
    const compMatches: ComprehensiveMatchResult[] = [];

    comprehensiveData.forEach((entry) => {
      const insNorm = normCode(entry.ins);
      const nameNorm = entry.name.toLowerCase();
      const qn = normCode(q);

      // Code match: INS code must START with query or be an exact/word-boundary match.
      // Using startsWith prevents "101(ii)" from matching "1101(ii)".
      const codeMatch =
        insNorm === qn ||
        insNorm.startsWith(qn + "(") ||
        insNorm.startsWith(qn + "a") ||
        insNorm.startsWith(qn + "b") ||
        insNorm.startsWith(qn + "c") ||
        insNorm.startsWith(qn + "d") ||
        insNorm.startsWith(qn + "e") ||
        insNorm.startsWith(qn + "f") ||
        (/^\d{3,4}$/.test(qn) &&
          new RegExp(`^${escRx(qn)}[^0-9]`).test(insNorm));

      const nameMatch = nameNorm.includes(q);

      const expansionMatch =
        !codeMatch &&
        missingLetterExpansions(q).some((exp) => {
          const en = normCode(exp);
          return insNorm === en || insNorm.startsWith(en);
        });

      if ((codeMatch || nameMatch || expansionMatch) && !seenIns.has(entry.ins)) {
        seenIns.add(entry.ins);
        compMatches.push({
          kind: "comprehensive-match",
          ins: entry.ins,
          name: entry.name,
          funcClass: entry.funcClass,
          isGeneral: generalInsSet.has(entry.ins.toLowerCase()),
        });
      }
    });

    // Family expansion: when any family member matched, pull in the rest
    const triggeredFamilies = new Set<number>();
    for (const m of compMatches) {
      const fi = CODE_TO_FAMILY.get(m.ins);
      if (fi !== undefined) triggeredFamilies.add(fi);
    }
    for (const fi of triggeredFamilies) {
      for (const code of FAMILY_GROUPS[fi].codes) {
        if (!seenIns.has(code)) {
          const entry = comprehensiveData.find((e) => e.ins === code);
          if (entry) {
            seenIns.add(entry.ins);
            compMatches.push({
              kind: "comprehensive-match",
              ins: entry.ins,
              name: entry.name,
              funcClass: entry.funcClass,
              isGeneral: generalInsSet.has(entry.ins.toLowerCase()),
            });
          }
        }
      }
    }

    // Group: named families use family key; roman-numeral sub-codes use base prefix
    const groupMap = new Map<string, ComprehensiveMatchResult[]>();
    for (const m of compMatches) {
      const fi = CODE_TO_FAMILY.get(m.ins);
      const groupKey = fi !== undefined
        ? `__family__${fi}`
        : m.ins.toLowerCase().replace(/\s*\([ivx]+\)$/i, "");
      if (!groupMap.has(groupKey)) groupMap.set(groupKey, []);
      groupMap.get(groupKey)!.push(m);
    }
    const compCards: SearchResult[] = [];
    for (const [groupKey, members] of groupMap) {
      if (members.length >= 2) {
        const isFamilyGroup = groupKey.startsWith("__family__");
        const fi = isFamilyGroup ? parseInt(groupKey.replace("__family__", ""), 10) : -1;
        const sortedMembers = isFamilyGroup
          ? [...members].sort(
              (a, b) =>
                FAMILY_GROUPS[fi].codes.indexOf(a.ins) -
                FAMILY_GROUPS[fi].codes.indexOf(b.ins)
            )
          : members;
        compCards.push({
          kind: "similar-group",
          baseCode: isFamilyGroup ? FAMILY_GROUPS[fi].name : members[0].ins,
          baseName: isFamilyGroup ? FAMILY_GROUPS[fi].name : members[0].name,
          funcClass: sortedMembers[0].funcClass,
          members: sortedMembers,
        });
      } else {
        compCards.push(members[0]);
      }
    }

    // ── 2. Food items that contain the additive ───────────────────────────────
    const itemCards: SearchResult[] = [];
    appData.forEach((category, categoryIndex) => {
      category.subItems.forEach((item, itemIndex) => {
        if (!item.data?.row2.D) return;
        const additivesText = item.data.row2.D.toLowerCase();
        if (!matchesQuery(additivesText, q)) return;

        const lines = item.data.row2.D
          .split(/[\r\n]+/)
          .map((s) => s.trim())
          .filter(Boolean);
        const matchedLine =
          lines.find((l) => matchesQuery(l.toLowerCase(), q)) ??
          item.data!.row2.D.slice(0, 80);

        itemCards.push({
          kind: "item",
          categoryIndex,
          categoryName: category.name.trim(),
          itemIndex,
          item,
          matchedAdditive: matchedLine,
        });
        itemResultKeys.add(`${categoryIndex}-${itemIndex}`);
      });
    });

    // Comp/badge cards first, food items below
    const found: SearchResult[] = [...compCards, ...itemCards];

    // ── 3. Search General Additives table2 food description ──────────────────
    const generalMatches: GeneralMatchResult[] = [];
    generalData.table2.rows.forEach((row) => {
      if (row.food.toLowerCase().includes(q) && !seenIns.has(row.ins)) {
        seenIns.add(row.ins);
        generalMatches.push({
          kind: "general-match",
          ins: row.ins,
          label: row.color,
          detail: row.food,
        });
      }
    });
    found.push(...generalMatches);

    // ── 4. If any general additive matched → show items with "نعم" ────────────
    const anyGeneralMatch =
      compMatches.some((m) => m.isGeneral) || generalMatches.length > 0;
    if (anyGeneralMatch) {
      appData.forEach((category, categoryIndex) => {
        category.subItems.forEach((item, itemIndex) => {
          const key = `${categoryIndex}-${itemIndex}`;
          if (itemResultKeys.has(key)) return;
          if (item.data?.row2.C !== "نعم") return;
          found.push({
            kind: "allows-general",
            categoryIndex,
            categoryName: category.name.trim(),
            itemIndex,
            item,
          });
        });
      });
    }

    return found;
  }, [query]);

  const handleItemResult = useCallback(
    (categoryIndex: number, itemIndex: number) => {
      router.push({ pathname: "/detail", params: { categoryIndex, itemIndex } });
    },
    [router]
  );

  const renderItem = ({ item: result }: { item: SearchResult }) => {
    // ── Regular item match ───────────────────────────────────────────────────
    if (result.kind === "item") {
      return (
        <Pressable
          style={({ pressed }) => [styles.resultCard, { opacity: pressed ? 0.84 : 1 }]}
          onPress={() => handleItemResult(result.categoryIndex, result.itemIndex)}
        >
          <View style={styles.resultHeader}>
            <Feather name="chevron-left" size={16} color={colors.light.mutedForeground} />
            <Text style={styles.resultItemName} numberOfLines={2}>{result.item.name.trim()}</Text>
          </View>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText} numberOfLines={1}>{result.categoryName}</Text>
          </View>
          <View style={styles.matchRow}>
            <Feather name="check-circle" size={14} color="#0e7c7c" style={styles.matchIcon} />
            <View style={styles.matchTextWrap}>{highlight(result.matchedAdditive, query.trim())}</View>
          </View>
          {result.item.data?.row2.A ? <Text style={styles.itemCode}>{result.item.data.row2.A}</Text> : null}
        </Pressable>
      );
    }

    // ── Comprehensive additive match ─────────────────────────────────────────
    if (result.kind === "comprehensive-match") {
      return (
        <View style={[styles.resultCard, result.isGeneral ? styles.generalCard : styles.compCard]}>
          <View style={styles.resultHeader}>
            <Feather name="tag" size={16} color={result.isGeneral ? "#7c4e0e" : "#0e5f5f"} />
            <Text style={[styles.resultItemName, { color: result.isGeneral ? "#7c4e0e" : colors.light.text }]} numberOfLines={2}>
              {highlight(result.name, query.trim()) as any}
            </Text>
          </View>
          <View style={styles.generalBadgeRow}>
            {result.isGeneral && (
              <View style={styles.generalGreenBadge}>
                <Text style={styles.generalGreenBadgeText}>مضاف عام</Text>
              </View>
            )}
            <View style={result.isGeneral ? styles.generalBadge : styles.compBadge}>
              <Text style={result.isGeneral ? styles.generalBadgeText : styles.compBadgeText}>
                INS {result.ins}
              </Text>
            </View>
          </View>
          {result.funcClass ? (
            <View style={styles.funcClassRow}>
              <Feather name="layers" size={12} color="#0e7c7c" style={{ marginTop: 1 }} />
              <Text style={styles.funcClassText} numberOfLines={2}>{result.funcClass}</Text>
            </View>
          ) : null}
        </View>
      );
    }

    // ── Similar-group chooser card ───────────────────────────────────────────
    if (result.kind === "similar-group") {
      return (
        <View style={styles.groupCard}>
          <View style={styles.resultHeader}>
            <Feather name="git-branch" size={16} color="#0e5f5f" />
            <Text style={[styles.resultItemName, { color: colors.light.text, flex: 1 }]} numberOfLines={2}>
              {result.baseName.split(",")[0]}
            </Text>
            <View style={styles.groupCountBadge}>
              <Text style={styles.groupCountText}>{result.members.length}</Text>
            </View>
          </View>
          {result.funcClass ? (
            <View style={[styles.funcClassRow, { marginBottom: 8 }]}>
              <Feather name="layers" size={12} color="#0e7c7c" style={{ marginTop: 1 }} />
              <Text style={styles.funcClassText} numberOfLines={2}>{result.funcClass}</Text>
            </View>
          ) : null}
          <Text style={styles.groupHint}>اختر رمز INS لعرض الأصناف الغذائية المسموحة</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.groupBadgeScroll} contentContainerStyle={styles.groupBadgeRow}>
            {result.members.map((m) => (
              <Pressable
                key={m.ins}
                style={({ pressed }) => [styles.groupInsBadge, { opacity: pressed ? 0.72 : 1 }]}
                onPress={() => setQuery(m.ins)}
              >
                <Text style={styles.groupInsBadgeText}>INS {m.ins}</Text>
                <Text style={styles.groupInsBadgeName} numberOfLines={1}>{m.name.split(",")[0]}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      );
    }

    // ── General additive match ───────────────────────────────────────────────
    if (result.kind === "general-match") {
      return (
        <Pressable
          style={({ pressed }) => [styles.resultCard, styles.generalCard, { opacity: pressed ? 0.84 : 1 }]}
          onPress={() => router.push("/general-additives")}
        >
          <View style={styles.resultHeader}>
            <Feather name="external-link" size={16} color="#7c4e0e" />
            <Text style={[styles.resultItemName, { color: "#7c4e0e" }]} numberOfLines={2}>
              {highlight(result.label, query.trim()) as any}
            </Text>
          </View>
          <View style={styles.generalBadgeRow}>
            <View style={styles.generalGreenBadge}>
              <Text style={styles.generalGreenBadgeText}>مضاف عام</Text>
            </View>
            <View style={styles.generalBadge}>
              <Text style={styles.generalBadgeText}>INS {result.ins}</Text>
            </View>
          </View>
          {result.detail ? (
            <View style={[styles.matchRow, { backgroundColor: "#fff8f0" }]}>
              <Feather name="info" size={14} color="#7c4e0e" style={styles.matchIcon} />
              <View style={styles.matchTextWrap}>
                <Text style={[styles.matchText, { color: "#7c4e0e" }]}>{result.detail}</Text>
              </View>
            </View>
          ) : null}
        </Pressable>
      );
    }

    // ── Item that allows general additives ────────────────────────────────────
    return (
      <Pressable
        style={({ pressed }) => [styles.resultCard, { opacity: pressed ? 0.84 : 1 }]}
        onPress={() => handleItemResult(result.categoryIndex, result.itemIndex)}
      >
        <View style={styles.resultHeader}>
          <Feather name="chevron-left" size={16} color={colors.light.mutedForeground} />
          <Text style={styles.resultItemName} numberOfLines={2}>{result.item.name.trim()}</Text>
        </View>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText} numberOfLines={1}>{result.categoryName}</Text>
        </View>
        <View style={[styles.matchRow, { backgroundColor: "#f0faf5" }]}>
          <Feather name="check-circle" size={14} color="#2e8b57" style={styles.matchIcon} />
          <View style={styles.matchTextWrap}>
            <Text style={[styles.matchText, { color: "#2e8b57" }]}>يسمح بالمضافات الغذائية العامة</Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={[styles.header, { paddingTop: Platform.OS === "web" ? 67 : insets.top + 12 }]}>
        <Text style={styles.headerTitle}>بحث عن مادة مضافة</Text>
        <Text style={styles.headerSubtitle}>
          ابحث باسم المادة المضافة لمعرفة المنتجات المسموح بها
        </Text>
        <View style={styles.searchBox}>
          <Feather name="search" size={18} color="#0e7c7c" />
          <TextInput
            style={styles.searchInput}
            placeholder="مثال: ASCORBYL ESTERS 304"
            placeholderTextColor="#9bb0b0"
            value={query}
            onChangeText={setQuery}
            autoFocus
            autoCapitalize="none"
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")}>
              <Feather name="x-circle" size={18} color={colors.light.mutedForeground} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Results */}
      <FlatList
        data={results}
        keyExtractor={(_, i) => i.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          query.trim().length >= 2 && results.length > 0 ? (
            <View style={styles.resultCountRow}>
              <Text style={styles.resultCount}>
                {results.filter((r) => r.kind === "item" || r.kind === "allows-general").length} بند
              </Text>
              {results.some((r) => r.kind === "comprehensive-match" || r.kind === "general-match") && (
                <View style={styles.generalGreenBadge}>
                  <Text style={styles.generalGreenBadgeText}>
                    {results.filter((r) => r.kind === "comprehensive-match" || r.kind === "general-match").length} مادة مضافة
                  </Text>
                </View>
              )}
            </View>
          ) : query.trim().length >= 2 ? (
            <Text style={styles.resultCount}>لا توجد نتائج</Text>
          ) : null
        }
        renderItem={renderItem}
        ListEmptyComponent={
          query.trim().length >= 2 ? (
            <View style={styles.emptyState}>
              <Feather name="search" size={48} color={colors.light.mutedForeground} />
              <Text style={styles.emptyTitle}>لا توجد نتائج</Text>
              <Text style={styles.emptySubtitle}>جرب البحث بجزء من اسم المادة المضافة</Text>
            </View>
          ) : query.trim().length > 0 ? (
            <View style={styles.emptyState}>
              <Feather name="type" size={48} color={colors.light.mutedForeground} />
              <Text style={styles.emptyTitle}>أدخل حرفين على الأقل</Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Feather name="search" size={48} color={colors.light.mutedForeground} />
              <Text style={styles.emptyTitle}>ابدأ البحث</Text>
              <Text style={styles.emptySubtitle}>
                اكتب اسم أي مادة مضافة للعثور على جميع المنتجات المرتبطة بها
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.background },
  header: { backgroundColor: "#0a5f5f", paddingHorizontal: 20, paddingBottom: 20 },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#ffffff", textAlign: "right", marginBottom: 4 },
  headerSubtitle: { fontSize: 12, color: "#b2d8d8", textAlign: "right", marginBottom: 14, lineHeight: 18 },
  searchBox: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#ffffff",
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.light.text, padding: 0 },
  listContent: { padding: 16, paddingBottom: Platform.OS === "web" ? 34 : 24, gap: 10 },
  resultCountRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "flex-end",
    gap: 8, marginBottom: 4, paddingHorizontal: 4,
  },
  resultCount: {
    fontSize: 12, fontWeight: "600", color: colors.light.mutedForeground,
    textAlign: "right",
  },
  resultCard: {
    backgroundColor: "#ffffff", borderRadius: 14, padding: 14, gap: 8,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  generalCard: {
    borderWidth: 1.5, borderColor: "#7c4e0e33", backgroundColor: "#fffaf6",
  },
  compCard: {
    borderWidth: 1.5, borderColor: "#0e7c7c33", backgroundColor: "#f5fafa",
  },
  compBadge: {
    backgroundColor: "#0e7c7c22", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
  },
  compBadgeText: { fontSize: 11, fontWeight: "500", color: "#0e5f5f", textAlign: "right" },
  resultHeader: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  resultItemName: { flex: 1, fontSize: 15, fontWeight: "600", color: colors.light.text, textAlign: "right", lineHeight: 22 },
  categoryBadge: {
    backgroundColor: "#0e7c7c22", borderRadius: 6, paddingHorizontal: 8,
    paddingVertical: 3, alignSelf: "flex-end",
  },
  categoryBadgeText: { fontSize: 11, fontWeight: "500", color: "#0e7c7c", textAlign: "right" },
  generalBadgeRow: {
    flexDirection: "row", gap: 6, justifyContent: "flex-end",
  },
  generalGreenBadge: {
    backgroundColor: "#1a7a4022", borderRadius: 6, paddingHorizontal: 8,
    paddingVertical: 3,
  },
  generalGreenBadgeText: { fontSize: 11, fontWeight: "700", color: "#1a7a40", textAlign: "right" },
  generalBadge: {
    backgroundColor: "#7c4e0e22", borderRadius: 6, paddingHorizontal: 8,
    paddingVertical: 3,
  },
  generalBadgeText: { fontSize: 11, fontWeight: "500", color: "#7c4e0e", textAlign: "right" },
  matchRow: {
    flexDirection: "row", alignItems: "flex-start", gap: 6,
    backgroundColor: "#f0faf8", borderRadius: 8, padding: 8,
  },
  matchIcon: { marginTop: 1, flexShrink: 0 },
  matchTextWrap: { flex: 1 },
  matchText: { fontSize: 12, color: colors.light.text, lineHeight: 18 },
  matchHighlight: { backgroundColor: "#ffe066", color: "#333", fontWeight: "700", borderRadius: 3 },
  itemCode: { fontSize: 11, color: "#0e7c7c", textAlign: "right" },
  funcClassRow: {
    flexDirection: "row", alignItems: "flex-start", gap: 5,
    backgroundColor: "#f0faf8", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 5,
  },
  funcClassText: { flex: 1, fontSize: 11, color: "#0e6060", textAlign: "right", lineHeight: 16 },
  // ── Similar-group card ────────────────────────────────────────────────────
  groupCard: {
    backgroundColor: "#fff", borderRadius: 14, padding: 14, marginBottom: 10,
    borderWidth: 1.5, borderColor: "#0e7c7c44",
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  groupCountBadge: {
    backgroundColor: "#0e7c7c", borderRadius: 12, minWidth: 24, height: 24,
    alignItems: "center", justifyContent: "center", paddingHorizontal: 7,
  },
  groupCountText: { fontSize: 12, fontWeight: "700", color: "#fff" },
  groupHint: { fontSize: 11, color: "#0e7c7c", textAlign: "right", marginBottom: 8, marginTop: 2 },
  groupBadgeScroll: { marginHorizontal: -2 },
  groupBadgeRow: { flexDirection: "row", gap: 8, paddingHorizontal: 2, paddingBottom: 2 },
  groupInsBadge: {
    backgroundColor: "#e8f5f5", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1.2, borderColor: "#0e7c7c55", alignItems: "center", minWidth: 90,
  },
  groupInsBadgeText: { fontSize: 13, fontWeight: "700", color: "#0e5f5f", textAlign: "center" },
  groupInsBadgeName: { fontSize: 10, color: "#0e7c7c", textAlign: "center", marginTop: 2, maxWidth: 120 },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 12, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 17, fontWeight: "600", color: colors.light.text, textAlign: "center" },
  emptySubtitle: { fontSize: 14, color: colors.light.mutedForeground, textAlign: "center", lineHeight: 22 },
});
