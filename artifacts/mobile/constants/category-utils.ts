import appData from "./data";

/**
 * Returns ancestor category codes ordered closest → farthest.
 * "01.4.1" → ["01.4", "01"]
 * "01.4"   → ["01"]
 * "01"     → []
 */
export function getParentCodes(code: string): string[] {
  const parts = code.trim().split(".");
  const parents: string[] = [];
  for (let i = parts.length - 1; i >= 1; i--) {
    parents.push(parts.slice(0, i).join("."));
  }
  return parents;
}

export interface ParentAdditives {
  code: string;
  lines: string[];
  allowsGeneral: boolean;
}

/**
 * Look up an item in appData by its row2.A code and return its permitted
 * additive lines. Returns null if no item with that code exists.
 */
export function getAdditivesByCode(code: string): ParentAdditives | null {
  const trimmed = code.trim();
  for (const cat of appData) {
    for (const item of cat.subItems) {
      if (item.data?.row2.A?.trim() === trimmed) {
        const lines = item.data.row2.D
          ? item.data.row2.D
              .split(/[\r\n]+/)
              .map((s: string) => s.trim())
              .filter(Boolean)
          : [];
        return {
          code: trimmed,
          lines,
          allowsGeneral: item.data.row2.C === "نعم",
        };
      }
    }
  }
  return null;
}

/**
 * Returns all ancestor additive sets for a given item code, ordered
 * closest first. Only includes ancestors that actually exist in appData.
 */
export function getInheritedAdditives(itemCode: string): ParentAdditives[] {
  return getParentCodes(itemCode)
    .map((c) => getAdditivesByCode(c))
    .filter((x): x is ParentAdditives => x !== null);
}
