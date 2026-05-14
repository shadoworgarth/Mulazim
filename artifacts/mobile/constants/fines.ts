export interface FinesCategory {
  id: string;
  title: string;
  shortTitle: string;
  subtitle?: string;
  emoji: string;
  bg: string;
  enabled: boolean;
  pageCount?: number;
  pageAspect?: number;
  route?: string;
}

export const DEFAULT_PAGE_ASPECT = 2105 / 1490;

export const FINES_CATEGORIES: FinesCategory[] = [
  {
    id: "food",
    title: "مخالفات نظام الغذاء ولائحته التنفيذية",
    shortTitle: "نظام الغذاء",
    subtitle: "274 مخالفة",
    emoji: "🍽️",
    bg: "#fff3e0",
    enabled: true,
    route: "/food-fines-search",
  },
  {
    id: "veterinary",
    title: "تصنيف المخالفات والعقوبات المقررة لها في نظام المستحضرات البيطرية",
    shortTitle: "المستحضرات البيطرية",
    subtitle: "136 مخالفة",
    emoji: "🐾",
    bg: "#e8f5e9",
    enabled: true,
    route: "/veterinary-fines-search",
  },
  {
    id: "medical-devices",
    title: "جدول تصنيف المخالفات والعقوبات المقررة لها وفقا لنظام الأجهزة والمستلزمات الطبية ولائحته التنفيذية",
    shortTitle: "الأجهزة والمستلزمات الطبية",
    emoji: "🩺",
    bg: "#e3f2fd",
    enabled: true,
    pageCount: 43,
    pageAspect: 2105 / 1488,
  },
  {
    id: "cosmetics",
    title: "جدول مخالفات نظام منتجات التجميل ولائحته التنفيذية والعقوبات المقررة لها",
    shortTitle: "منتجات التجميل",
    subtitle: "115 مخالفة",
    emoji: "💄",
    bg: "#fce4ec",
    enabled: true,
    route: "/cosmetics-fines-search",
  },
  {
    id: "pharma",
    title: "جدول تصنيف مخالفات أحكام نظام المنشآت والمستحضرات الصيدلانية والعشبية ولائحته التنفيذية",
    shortTitle: "المستحضرات الصيدلانية والعشبية",
    subtitle: "129 مخالفة",
    emoji: "💊",
    bg: "#f3e5f5",
    enabled: true,
    route: "/pharma-fines-search",
  },
  {
    id: "animal-feed",
    title: "جدول تصنيف المخالفات والعقوبات المقررة لها وفقاً لنظام الأعلاف ولائحته التنفيذية",
    shortTitle: "نظام الأعلاف",
    emoji: "🌾",
    bg: "#fff8e1",
    enabled: true,
    pageCount: 27,
    pageAspect: 2105 / 1490,
  },
  {
    id: "guidelines",
    title: "البنود العامة والملاحق",
    shortTitle: "البنود العامة والملاحق",
    subtitle: "آلية الضبط · العقوبات غير المالية · تصنيف المنشآت والمناطق",
    emoji: "📖",
    bg: "#e8f0fe",
    enabled: true,
    route: "/food-fines-guidelines",
  },
];
