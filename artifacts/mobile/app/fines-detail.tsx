import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  Dimensions,
  Image,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { FlatList, Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import colors from "@/constants/colors";
import { DEFAULT_PAGE_ASPECT, FINES_CATEGORIES } from "@/constants/fines";
import FINES_PAGES from "@/constants/fines-pages";

const SPRING = { damping: 18, stiffness: 250, mass: 0.6 };

interface ZoomablePageProps {
  src: ReturnType<typeof require>;
  pageWidth: number;
  pageHeight: number;
  onZoomChange: (zoomed: boolean) => void;
}

function ZoomablePage({
  src,
  pageWidth,
  pageHeight,
  onZoomChange,
}: ZoomablePageProps) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const savedTx = useSharedValue(0);
  const savedTy = useSharedValue(0);

  const clampTranslation = (val: number, s: number, dim: number) => {
    "worklet";
    const maxShift = (dim * (s - 1)) / 2;
    return Math.min(Math.max(val, -maxShift), maxShift);
  };

  const resetZoom = () => {
    "worklet";
    scale.value = withSpring(1, SPRING);
    savedScale.value = 1;
    tx.value = withSpring(0, SPRING);
    ty.value = withSpring(0, SPRING);
    savedTx.value = 0;
    savedTy.value = 0;
    runOnJS(onZoomChange)(false);
  };

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      const newScale = Math.min(Math.max(savedScale.value * e.scale, 1), 6);
      scale.value = newScale;
      if (newScale > 1) runOnJS(onZoomChange)(true);
    })
    .onEnd(() => {
      if (scale.value < 1.05) {
        resetZoom();
      } else {
        savedScale.value = scale.value;
      }
    });

  const pan = Gesture.Pan()
    .minDistance(1)
    .averageTouches(true)
    .onUpdate((e) => {
      if (scale.value <= 1) return;
      tx.value = clampTranslation(
        savedTx.value + e.translationX,
        scale.value,
        pageWidth
      );
      ty.value = clampTranslation(
        savedTy.value + e.translationY,
        scale.value,
        pageHeight
      );
    })
    .onEnd(() => {
      savedTx.value = tx.value;
      savedTy.value = ty.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((_e, success) => {
      if (!success) return;
      if (scale.value > 1) {
        resetZoom();
      } else {
        const newScale = 2.5;
        scale.value = withSpring(newScale, SPRING);
        savedScale.value = newScale;
        runOnJS(onZoomChange)(true);
      }
    });

  // Simultaneous for all three — no Exclusive wrapper, which was causing
  // Android to wait for double-tap recognition before allowing pan/pinch.
  const composed = Gesture.Simultaneous(pinch, pan, doubleTap);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[{ width: pageWidth, height: pageHeight }, animStyle]}>
        <Image
          source={src}
          style={{ width: pageWidth, height: pageHeight }}
          resizeMode="contain"
        />
      </Animated.View>
    </GestureDetector>
  );
}

export default function FinesDetailScreen() {
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const [currentPage, setCurrentPage] = useState(1);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const listRef = useRef<FlatList>(null);

  const screenWidth = Dimensions.get("window").width;
  const category = FINES_CATEGORIES.find((c) => c.id === categoryId);
  const pages = FINES_PAGES[categoryId ?? ""] ?? [];

  const handleZoomChange = useCallback((zoomed: boolean) => {
    setScrollEnabled(!zoomed);
  }, []);

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

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: any) => {
      if (viewableItems.length > 0) {
        setCurrentPage(viewableItems[0].index + 1);
      }
    },
    []
  );

  const viewabilityConfig = { itemVisiblePercentThreshold: 50 };

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={pages}
        keyExtractor={(_, i) => String(i)}
        scrollEnabled={scrollEnabled}
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: pageHeight,
          offset: pageHeight * index,
          index,
        })}
        renderItem={({ item }) => (
          <ZoomablePage
            src={item}
            pageWidth={pageWidth}
            pageHeight={pageHeight}
            onZoomChange={handleZoomChange}
          />
        )}
      />

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
