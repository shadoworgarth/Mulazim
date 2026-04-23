import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Stack } from "expo-router";

import colors from "@/constants/colors";

export default function InspectorLibraryScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "مكتبة المفتش" }} />
      <Text style={styles.title}>مكتبة المفتش</Text>
      <Text style={styles.subtitle}>قريباً</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.light.background,
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.light.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.light.mutedForeground,
  },
});
