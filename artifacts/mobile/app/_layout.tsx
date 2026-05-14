import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import OtpAuthScreen from "@/components/OtpAuthScreen";
import { OtpAuthProvider, useOtpAuth } from "@/context/OtpAuthContext";

SplashScreen.preventAutoHideAsync();


function AuthGate() {
  const { isVerified, checkDone } = useOtpAuth();

  if (!checkDone) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0a5f5f", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  if (!isVerified) {
    return <OtpAuthScreen />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#0e7c7c" },
        headerTintColor: "#ffffff",
        headerTitleStyle: { fontFamily: "Inter_600SemiBold", fontSize: 17 },
        headerBackTitle: "رجوع",
        contentStyle: { backgroundColor: "#f2f6f8" },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="items" options={{ title: "الأصناف" }} />
      <Stack.Screen name="detail" options={{ title: "تفاصيل الصنف" }} />
      <Stack.Screen name="additive-search" options={{ title: "بحث عن مادة مضافة" }} />
      <Stack.Screen name="general-additives" options={{ title: "المضافات العامة" }} />
      <Stack.Screen name="food-guide" options={{ title: "دليل المضافات الغذائية" }} />
      <Stack.Screen name="inspector-library" options={{ title: "مكتبة المفتش" }} />
      <Stack.Screen name="regulations" options={{ title: "اللوائح الفنية والمواصفات القياسية" }} />
      <Stack.Screen name="food-standards" options={{ title: "قائمة اللوائح والمواصفات الغذائية" }} />
      <Stack.Screen name="medical-devices-standards" options={{ title: "مواصفات الأجهزة والمستلزمات الطبية" }} />
      <Stack.Screen name="toxins" options={{ title: "الملوثات والسموم في الأغذية والأعلاف" }} />
      <Stack.Screen name="toxin-detail" options={{ title: "تفاصيل الملوث" }} />
      <Stack.Screen name="pesticides" options={{ title: "الحدود القصوى لمتبقيات مبيدات الآفات" }} />
      <Stack.Screen name="pesticides-sfda" options={{ title: "SFDA — الحدود القصوى للمبيدات" }} />
      <Stack.Screen name="pesticides-fao" options={{ title: "FAO Codex — قائمة المبيدات" }} />
      <Stack.Screen name="pesticides-fao-detail" options={{ title: "تفاصيل المبيد" }} />
      <Stack.Screen name="pesticides-fao-commodity" options={{ title: "بحث حسب المنتج الغذائي" }} />
      <Stack.Screen name="pesticides-agriculture" options={{ title: "مبيدات المنتجات الزراعية والغذائية" }} />
      <Stack.Screen name="pesticides-agriculture-detail" options={{ title: "تفاصيل المبيد" }} />
      <Stack.Screen name="pesticides-dates" options={{ title: "مبيدات التمور" }} />
      <Stack.Screen name="pesticides-children" options={{ title: "مبيدات أغذية الأطفال" }} />
      <Stack.Screen name="pesticides-prohibited" options={{ title: "المبيدات المحظورة في أغذية الأطفال" }} />
      <Stack.Screen name="scan-result" options={{ title: "نتائج المسح" }} />
      <Stack.Screen name="animal-feed" options={{ title: "الأعلاف" }} />
      <Stack.Screen name="animal-feed-guide" options={{ title: "دليل المواد المضافة لعلف المواشي والدواجن" }} />
      <Stack.Screen name="animal-feed-additives" options={{ title: "المضافات العلفية المسموح بتداولها" }} />
      <Stack.Screen name="fines-guide" options={{ title: "جداول المخالفات والعقوبات" }} />
      <Stack.Screen name="fines-detail" options={{ title: "تفاصيل المخالفات" }} />
      <Stack.Screen name="food-fines" options={{ title: "مخالفات نظام الغذاء (2026)" }} />
      <Stack.Screen name="food-fines-search" options={{ title: "جدول المخالفات والعقوبات" }} />
      <Stack.Screen name="food-fines-guidelines" options={{ title: "البنود العامة والملاحق" }} />
      <Stack.Screen name="veterinary-fines-search" options={{ title: "مخالفات المستحضرات البيطرية" }} />
      <Stack.Screen name="cosmetics-fines-search" options={{ title: "مخالفات منتجات التجميل" }} />
      <Stack.Screen name="pharma-fines-search" options={{ title: "مخالفات المستحضرات الصيدلانية والعشبية" }} />
      <Stack.Screen name="narcotics" options={{ title: "المخدرات والمؤثرات العقلية" }} />
      <Stack.Screen name="private-labs" options={{ title: "المختبرات الخاصة" }} />
      <Stack.Screen name="private-labs-list" options={{ title: "قائمة المختبرات" }} />
      <Stack.Screen name="private-lab-detail" options={{ title: "تفاصيل المختبر" }} />
      <Stack.Screen name="lab-test-search" options={{ title: "مقارنة الاختبارات وحساب التكلفة" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <OtpAuthProvider>
            <AuthGate />
          </OtpAuthProvider>
        </GestureHandlerRootView>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

