const rawToxins = require("../assets/toxins.json");

export interface ToxinRow {
  product: string;
  max_level: string;
  unit: string;
  applicable_part: string;
  notes: string;
}

export interface Toxin {
  toxin: string;
  rows: ToxinRow[];
}

const toxins: Toxin[] = rawToxins;

export default toxins;
