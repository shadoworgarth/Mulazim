
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
  emojis: [string, string, string, string];
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
    emojis: ["🍗", "🍎", "🥩", "🧀"],
    color: "#0e7c7c",
    bg: "#e0f4f4",
    route: "/food-guide",
    enabled: true,
  },
  {
    id: "inspector-library",
    title: "مكتبة المفتش",
    subtitle: "",
    emojis: ["📖", "📖", "📖", "📖"],
    color: "#7c5e0e",
    bg: "#f4ecd8",
    route: "/inspector-library",
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
        <Text style={styles.headerSubtitle}>مساعدك في الرقابة والتفتيش</Text>
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
              <View style={[styles.iconWrap, { backgroundColor: card.bg }]}>
                <View style={styles.emojiGrid}>
                  <Text style={styles.cardEmoji}>{card.emojis[0]}</Text>
                  <Text style={styles.cardEmoji}>{card.emojis[1]}</Text>
                  <Text style={styles.cardEmoji}>{card.emojis[2]}</Text>
                  <Text style={styles.cardEmoji}>{card.emojis[3]}</Text>
                </View>
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
    justifyContent: "space-evenly",
    rowGap: 14,
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
  emojiGrid: {
    width: "100%",
    height: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  cardEmoji: {
    fontSize: 22,
    width: "44%",
    textAlign: "center",
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
