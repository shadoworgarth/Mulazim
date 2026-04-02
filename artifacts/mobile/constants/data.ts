const rawData = require("../assets/app-data.json");

export interface CellData {
  A: string;
  B: string;
  C: string;
  D: string;
}

export interface SubItem {
  name: string;
  targetSheet: string | null;
  targetCell: string | null;
  data?: {
    row1: CellData;
    row2: CellData;
  };
}

export interface Category {
  name: string;
  subItems: SubItem[];
}

const appData: Category[] = rawData;

export default appData;
