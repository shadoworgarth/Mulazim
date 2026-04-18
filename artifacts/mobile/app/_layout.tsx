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
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import OtpAuthScreen from "@/components/OtpAuthScreen";
import { OtpAuthProvider, useOtpAuth } from "@/context/OtpAuthContext";

SplashScreen.preventAutoHideAsync();

const WATERMARK_EMAIL = "example@sfda.gov.sa";
const ROWS = 10;
const COLS = 4;

function Watermark() {
  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: "none" }]}>
      {Array.from({ length: ROWS }).map((_, row) =>
        Array.from({ length: COLS }).map((_, col) => (
          <Text
            key={`${row}-${col}`}
            style={[
              styles.watermarkText,
              {
                top: row * 110 - 30,
                left: col * 260 - 60,
              },
            ]}
          >
            {WATERMARK_EMAIL}
          </Text>
        ))
      )}
    </View>
  );
}

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
    <View style={{ flex: 1 }}>
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
        <Stack.Screen name="scan-result" options={{ title: "نتائج المسح" }} />
      </Stack>
      <Watermark />
    </View>
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

const styles = StyleSheet.create({
  watermarkText: {
    position: "absolute",
    fontSize: 13,
    color: "rgba(0,0,0,0.10)",
    fontWeight: "600",
    transform: [{ rotate: "-35deg" }],
    letterSpacing: 1,
  },
});
