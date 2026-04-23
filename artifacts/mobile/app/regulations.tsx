import React from "react";
import { StyleSheet, Text, View } from "react-native";

import colors from "@/constants/colors";

export default function RegulationsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>اللوائح الفنية والمواصفات القياسية</Text>
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
    fontSize: 20,
    fontWeight: "700",
    color: colors.light.text,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: colors.light.mutedForeground,
  },
});
