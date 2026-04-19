import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  ImageBackground,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const logoImage = require("../../assets/sfda-logo.png");

import colors from "@/constants/colors";

interface FeatureCard {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  iconLib: "feather" | "mci";
  icon2?: string;
  iconLib2?: "feather" | "mci";
  color: string;
  bg: string;
  route: string;
  enabled: boolean;
}

const FEATURE_CARDS: FeatureCard[] = [
  {
    id: "food-guide",
    title: "دليل المضافات الغذائية",
    subtitle: "15 تصنيفاً • أكثر من 182 مادة",
    icon: "food-drumstick",
    iconLib: "mci",
    icon2: "food-apple",
    iconLib2: "mci",
    color: "#0e7c7c",
    bg: "#e0f4f4",
    route: "/food-guide",
    enabled: true,
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <ImageBackground
        source={logoImage}
        style={[
          styles.header,
          { paddingTop: Platform.OS === "web" ? 52 : insets.top + 12 },
        ]}
        imageStyle={styles.headerImage}
        resizeMode="contain"
      >
        <Text style={styles.headerTitle}>ملازم</Text>
        <Text style={styles.headerSubtitle}>مساعدك في الرقابة الغذائية</Text>
      </ImageBackground>

      {/* Cards Grid */}
      <ScrollView
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>الأدوات</Text>
        <View style={styles.row}>
          {FEATURE_CARDS.map((card) => (
            <Pressable
              key={card.id}
              style={({ pressed }) => [
                styles.card,
                !card.enabled && styles.cardDisabled,
                { opacity: pressed && card.enabled ? 0.82 : 1 },
              ]}
              onPress={() => card.enabled && router.push(card.route as any)}
            >
              <View style={[styles.iconWrap, { backgroundColor: card.bg, flexDirection: card.icon2 ? "row" : undefined, gap: card.icon2 ? 2 : undefined }]}>
                {card.iconLib === "mci" ? (
                  <MaterialCommunityIcons name={card.icon as any} size={card.icon2 ? 28 : 38} color={card.enabled ? card.color : "#aaa"} />
                ) : (
                  <Feather name={card.icon as any} size={card.icon2 ? 24 : 34} color={card.enabled ? card.color : "#aaa"} />
                )}
                {card.icon2 && (
                  card.iconLib2 === "mci" ? (
                    <MaterialCommunityIcons name={card.icon2 as any} size={28} color={card.enabled ? card.color : "#aaa"} />
                  ) : (
                    <Feather name={card.icon2 as any} size={24} color={card.enabled ? card.color : "#aaa"} />
                  )
                )}
              </View>
              <Text
                style={[
                  styles.cardTitle,
                  !card.enabled && styles.cardTitleDisabled,
                ]}
                numberOfLines={2}
              >
                {card.title}
              </Text>
              <Text style={styles.cardSubtitle} numberOfLines={1}>
                {card.subtitle}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.footer}>اعداد وتصميم عبدالعزيز الدوسري</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  header: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 20,
    paddingBottom: 22,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e8e8",
  },
  headerImage: {
    opacity: 0.22,
    resizeMode: "contain",
    left: 0,
    bottom: 0,
    top: 0,
    width: "55%",
    height: "100%",
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#0b1e1e",
    textAlign: "right",
    marginBottom: 4,
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#2a4a4a",
    textAlign: "right",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 2,
  },
  grid: {
    padding: 18,
    paddingBottom: Platform.OS === "web" ? 40 : 32,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.light.mutedForeground,
    textAlign: "right",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 14,
  },
  card: {
    width: 150,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
    gap: 10,
  },
  cardDisabled: {
    backgroundColor: "#f5f5f5",
  },
  iconWrap: {
    width: 70,
    height: 70,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.light.text,
    textAlign: "center",
    lineHeight: 19,
  },
  cardTitleDisabled: {
    color: "#aaa",
  },
  cardSubtitle: {
    fontSize: 11,
    color: colors.light.mutedForeground,
    textAlign: "center",
  },
  footer: {
    textAlign: "center",
    fontSize: 12,
    color: colors.light.mutedForeground,
    paddingTop: 32,
    paddingBottom: 8,
  },
});
