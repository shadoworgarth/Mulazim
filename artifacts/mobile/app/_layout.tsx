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
      <Stack.Screen name="pesticides-agriculture" options={{ title: "مبيدات المنتجات الزراعية والغذائية" }} />
      <Stack.Screen name="pesticides-agriculture-detail" options={{ title: "تفاصيل المبيد" }} />
      <Stack.Screen name="pesticides-dates" options={{ title: "مبيدات التمور" }} />
      <Stack.Screen name="pesticides-children" options={{ title: "مبيدات أغذية الأطفال" }} />
      <Stack.Screen name="pesticides-prohibited" options={{ title: "المبيدات المحظورة في أغذية الأطفال" }} />
      <Stack.Screen name="scan-result" options={{ title: "نتائج المسح" }} />
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

