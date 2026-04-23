const raw = require("../assets/pesticides.json");

export interface AgEntry {
  commodity: string;
  mrl: string;
  remark: string;
}

export interface AgSubstance {
  substance: string;
  entries: AgEntry[];
}

export interface SimpleItem {
  name: string;
  mrl?: string;
}

export interface PesticidesData {
  source: string;
  standard: string;
  sections: {
    agriculture: { title: string; substances: AgSubstance[] };
    dates: { title: string; items: SimpleItem[] };
    children: { title: string; items: SimpleItem[] };
    prohibited: { title: string; items: SimpleItem[] };
  };
}

const pesticides: PesticidesData = raw;
export default pesticides;
