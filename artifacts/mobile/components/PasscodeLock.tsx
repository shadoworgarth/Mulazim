import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ImageBackground,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  Vibration,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePasscode } from "@/context/PasscodeContext";

const LOGO = require("../assets/sfda-logo.png");
const PAD = ["1","2","3","4","5","6","7","8","9","","0","⌫"];
const CODE_LENGTH = 4;

export default function PasscodeLock() {
  const { unlock } = usePasscode();
  const insets = useSafeAreaInsets();
  const [code, setCode] = useState("");
  const [shake, setShake] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (code.length === CODE_LENGTH) {
      handleSubmit();
    }
  }, [code]);

  async function handleSubmit() {
    const ok = await unlock(code);
    if (!ok) {
      setError(true);
      setShake(true);
      if (Platform.OS !== "web") Vibration.vibrate(300);
      setTimeout(() => { setShake(false); setError(false); setCode(""); }, 700);
    }
  }

  function press(key: string) {
    if (key === "⌫") {
      setCode((c) => c.slice(0, -1));
      setError(false);
    } else if (key === "") {
      return;
    } else {
      if (code.length < CODE_LENGTH) setCode((c) => c + key);
    }
  }

  return (
    <View style={styles.container}>
      <ImageBackground source={LOGO} style={styles.logoBg} imageStyle={styles.logoImg} resizeMode="contain" />

      <View style={[styles.inner, { paddingTop: Platform.OS === "web" ? 80 : insets.top + 40 }]}>
        <Feather name="lock" size={36} color="#fff" style={{ marginBottom: 16 }} />
        <Text style={styles.title}>أدخل رمز المرور</Text>
        <Text style={styles.subtitle}>المضافات الغذائية</Text>

        {/* Dots */}
        <View style={[styles.dotsRow, shake && styles.shakeAnim]}>
          {Array.from({ length: CODE_LENGTH }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i < code.length && styles.dotFilled,
                error && styles.dotError,
              ]}
            />
          ))}
        </View>

        {error && <Text style={styles.errorText}>رمز المرور غير صحيح</Text>}

        {/* Numpad */}
        <View style={styles.pad}>
          {PAD.map((key, i) => (
            <Pressable
              key={i}
              style={({ pressed }) => [
                styles.key,
                key === "" && styles.keyEmpty,
                key === "⌫" && styles.keyBack,
                pressed && key !== "" && styles.keyPressed,
              ]}
              onPress={() => press(key)}
              disabled={key === ""}
            >
              <Text style={[styles.keyText, key === "⌫" && styles.keyBackText]}>{key}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a5f5f" },
  logoBg: { ...StyleSheet.absoluteFillObject, justifyContent: "center", alignItems: "center" },
  logoImg: { opacity: 0.1, width: "80%", height: "80%", alignSelf: "center" },
  inner: { flex: 1, alignItems: "center", paddingHorizontal: 32 },
  title: { fontSize: 22, fontWeight: "700", color: "#fff", textAlign: "center", marginBottom: 4 },
  subtitle: { fontSize: 14, color: "#b2d8d8", textAlign: "center", marginBottom: 40 },
  dotsRow: { flexDirection: "row", gap: 20, marginBottom: 12 },
  shakeAnim: { transform: [{ translateX: 8 }] },
  dot: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 2, borderColor: "#ffffffaa", backgroundColor: "transparent",
  },
  dotFilled: { backgroundColor: "#fff", borderColor: "#fff" },
  dotError: { borderColor: "#ff6b6b", backgroundColor: "#ff6b6b" },
  errorText: { color: "#ff9999", fontSize: 14, marginBottom: 16, textAlign: "center" },
  pad: {
    width: "100%", maxWidth: 300,
    flexDirection: "row", flexWrap: "wrap",
    justifyContent: "center", gap: 16, marginTop: 20,
  },
  key: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: "#ffffff18",
    justifyContent: "center", alignItems: "center",
  },
  keyEmpty: { backgroundColor: "transparent" },
  keyBack: { backgroundColor: "transparent" },
  keyPressed: { backgroundColor: "#ffffff35" },
  keyText: { fontSize: 26, fontWeight: "600", color: "#fff" },
  keyBackText: { fontSize: 22 },
});
