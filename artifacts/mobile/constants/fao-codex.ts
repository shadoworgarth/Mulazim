import faoData from "../assets/fao-codex-pesticides.json";

export interface FaoMrl {
  mrl: string;
  cacYear: string;
  jmpr: string;
  commodity: string;
  commodityId: string;
  commodityCode: string;
  footnote: string;
  step: string;
}

export interface FaoPesticide {
  id: string;
  name: string;
  functionalClass: string;
  adi: string;
  adiUnit: string;
  adiNote: string;
  residue: string;
  mrls: FaoMrl[];
  error?: string;
}

interface FaoData {
  pesticides: FaoPesticide[];
}

const data = faoData as FaoData;

export const faoPesticides: FaoPesticide[] = data.pesticides
  .slice()
  .sort((a, b) => a.name.localeCompare(b.name));

export function getFaoPesticideById(id: string): FaoPesticide | undefined {
  return faoPesticides.find((p) => p.id === id);
}

export interface FaoCommodityHit {
  pesticide: string;
  pesticideId: string;
  mrl: string;
  cacYear: string;
  commodity: string;
  footnote: string;
}

export function searchByCommodity(query: string, limit = 500): FaoCommodityHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const hits: FaoCommodityHit[] = [];
  for (const p of faoPesticides) {
    for (const m of p.mrls) {
      if (m.commodity.toLowerCase().includes(q)) {
        hits.push({
          pesticide: p.name,
          pesticideId: p.id,
          mrl: m.mrl,
          cacYear: m.cacYear,
          commodity: m.commodity,
          footnote: m.footnote,
        });
        if (hits.length >= limit) return hits;
      }
    }
  }
  return hits;
}

export default { faoPesticides, getFaoPesticideById, searchByCommodity };
