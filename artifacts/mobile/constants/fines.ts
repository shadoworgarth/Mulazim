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
    subtitle: "273 مخالفة · جدول + بنود عامة",
    emoji: "🍽️",
    bg: "#fff3e0",
    enabled: true,
    route: "/food-fines",
  },
  {
    id: "veterinary",
    title: "تصنيف المخالفات والعقوبات المقررة لها في نظام المستحضرات البيطرية",
    shortTitle: "المستحضرات البيطرية",
    emoji: "🐾",
    bg: "#e8f5e9",
    enabled: true,
    pageCount: 5,
    pageAspect: 2103 / 1485,
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
    emoji: "💄",
    bg: "#fce4ec",
    enabled: true,
    pageCount: 14,
    pageAspect: 2105 / 1490,
  },
  {
    id: "pharma",
    title: "جدول تصنيف مخالفات أحكام نظام المنشآت والمستحضرات الصيدلانية والعشبية ولائحته التنفيذية",
    shortTitle: "المستحضرات الصيدلانية والعشبية",
    emoji: "💊",
    bg: "#f3e5f5",
    enabled: true,
    pageCount: 23,
    pageAspect: 2113 / 1483,
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
];
