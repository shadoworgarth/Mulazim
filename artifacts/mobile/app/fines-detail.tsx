import { useLocalSearchParams } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import colors from "@/constants/colors";
import { DEFAULT_PAGE_ASPECT, FINES_CATEGORIES } from "@/constants/fines";
import FINES_PAGES from "@/constants/fines-pages";

export default function FinesDetailScreen() {
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const [currentPage, setCurrentPage] = useState(1);
  const scrollRef = useRef<ScrollView>(null);

  const screenWidth = Dimensions.get("window").width;
  const category = FINES_CATEGORIES.find((c) => c.id === categoryId);
  const pages = FINES_PAGES[categoryId ?? ""] ?? [];

  if (!category || pages.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>المحتوى غير متاح</Text>
      </View>
    );
  }

  const pageAspect = category.pageAspect ?? DEFAULT_PAGE_ASPECT;
  const pageWidth = screenWidth;
  const pageHeight = pageWidth / pageAspect;

  const handleScroll = (e: any) => {
    const offsetY = e.nativeEvent.contentOffset.y;
    const page = Math.round(offsetY / pageHeight) + 1;
    if (page !== currentPage && page >= 1 && page <= pages.length) {
      setCurrentPage(page);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        maximumZoomScale={Platform.OS === "ios" ? 5 : 1}
        minimumZoomScale={1}
        bouncesZoom={Platform.OS === "ios"}
      >
        {pages.map((src, i) => (
          <Image
            key={i}
            source={src}
            style={{ width: pageWidth, height: pageHeight }}
            resizeMode="contain"
          />
        ))}
      </ScrollView>

      <View style={styles.pageIndicator}>
        <Text style={styles.pageText}>
          {currentPage} / {pages.length}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  scroll: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.light.background,
  },
  emptyText: {
    fontSize: 15,
    color: colors.light.mutedForeground,
  },
  pageIndicator: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 34 : 18,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  pageText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
  },
});
