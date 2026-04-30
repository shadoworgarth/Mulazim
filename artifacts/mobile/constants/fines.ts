export interface FineEntry {
  number: string;
  violation: string;
  fines: Record<string, string | null>;
  closure: string | null;
  notes: string | null;
}

export interface FinesCategory {
  id: string;
  title: string;
  shortTitle: string;
  emoji: string;
  bg: string;
  enabled: boolean;
  data?: {
    category: string;
    entityTypes: string[];
    violations: FineEntry[];
  };
}

import veterinaryData from "@/assets/fines-veterinary.json";

export const FINES_CATEGORIES: FinesCategory[] = [
  {
    id: "veterinary",
    title: "تصنيف المخالفات والعقوبات المقررة لها في نظام المستحضرات البيطرية",
    shortTitle: "المستحضرات البيطرية",
    emoji: "🐾",
    bg: "#e8f5e9",
    enabled: true,
    data: veterinaryData as FinesCategory["data"],
  },
  {
    id: "medical-devices",
    title: "جدول تصنيف المخالفات والعقوبات المقررة لها وفقا لنظام الأجهزة والمستلزمات الطبية ولائحته التنفيذية",
    shortTitle: "الأجهزة والمستلزمات الطبية",
    emoji: "🩺",
    bg: "#e3f2fd",
    enabled: false,
  },
  {
    id: "cosmetics",
    title: "جدول مخالفات نظام منتجات التجميل ولائحته التنفيذية والعقوبات المقررة لها",
    shortTitle: "منتجات التجميل",
    emoji: "💄",
    bg: "#fce4ec",
    enabled: false,
  },
  {
    id: "pharma",
    title: "جدول تصنيف مخالفات أحكام نظام المنشآت والمستحضرات الصيدلانية والعشبية ولائحته التنفيذية",
    shortTitle: "المستحضرات الصيدلانية والعشبية",
    emoji: "💊",
    bg: "#f3e5f5",
    enabled: false,
  },
  {
    id: "animal-feed",
    title: "جدول تصنيف المخالفات والعقوبات المقررة لها وفقاً لنظام الأعلاف ولائحته التنفيذية",
    shortTitle: "نظام الأعلاف",
    emoji: "🌾",
    bg: "#fff8e1",
    enabled: false,
  },
  {
    id: "food",
    title: "جدول تصنيف المخالفات والعقوبات المقررة لها وفقاً لنظام الغذاء ولائحته التنفيذية",
    shortTitle: "نظام الغذاء",
    emoji: "🍽️",
    bg: "#fff3e0",
    enabled: false,
  },
];
