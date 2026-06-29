import { Feather } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useOtpAuth } from "@/context/OtpAuthContext";

const ALLOWED_DOMAIN = "sfda.gov.sa";

type Step = "email" | "otp" | "admin";

export default function OtpAuthScreen() {
  const insets = useSafeAreaInsets();
  const { requestOtp, verifyOtp, adminLogin } = useOtpAuth();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const otpRef = useRef<TextInput>(null);
  const adminPassRef = useRef<TextInput>(null);

  function validateEmail(e: string) {
    const trimmed = e.trim().toLowerCase();
    if (!trimmed.includes("@")) return "أدخل بريداً إلكترونياً صحيحاً";
    const domain = trimmed.split("@")[1];
    if (domain !== ALLOWED_DOMAIN) return `يُسمح فقط بنطاق @${ALLOWED_DOMAIN}`;
    return null;
  }

  async function handleSendOtp() {
    setError("");
    setSuccess("");
    const err = validateEmail(email);
    if (err) { setError(err); return; }
    setLoading(true);
    try {
      await requestOtp(email.trim().toLowerCase());
      setSuccess("تم إرسال رمز التحقق إلى بريدك الإلكتروني");
      setStep("otp");
      setTimeout(() => otpRef.current?.focus(), 300);
    } catch (e: any) {
      setError(e.message ?? "حدث خطأ، حاول مجدداً");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    setError("");
    if (otp.trim().length !== 6) { setError("أدخل الرمز المكوّن من 6 أرقام"); return; }
    setLoading(true);
    try {
      await verifyOtp(email.trim().toLowerCase(), otp.trim());
    } catch (e: any) {
      setError(e.message ?? "رمز التحقق غير صحيح");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdminLogin() {
    setError("");
    if (!adminPass) { setError("أدخل كلمة المرور"); return; }
    setLoading(true);
    try {
      await adminLogin(adminPass);
    } catch (e: any) {
      setError(e.message ?? "كلمة المرور غير صحيحة");
    } finally {
      setLoading(false);
    }
  }

  function handleBack() {
    setStep("email");
    setOtp("");
    setAdminPass("");
    setError("");
    setSuccess("");
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#0a5f5f" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Feather name="shield" size={36} color="#0e7c7c" />
          </View>
          <Text style={styles.title}>ملازم</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          {step === "email" && (
            <>
              <Text style={styles.cardTitle}>تسجيل الدخول</Text>
              <Text style={styles.cardDesc}>
                أدخل بريدك الإلكتروني على نطاق @{ALLOWED_DOMAIN} لتلقي رمز التحقق
              </Text>

              <View style={styles.inputWrap}>
                <Feather name="mail" size={18} color="#9bb0b0" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={t => { setEmail(t); setError(""); }}
                  placeholder={`example@${ALLOWED_DOMAIN}`}
                  placeholderTextColor="#aac8c8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="send"
                  onSubmitEditing={handleSendOtp}
                  textAlign="right"
                />
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <Pressable
                style={({ pressed }) => [styles.btn, loading && styles.btnDisabled, pressed && { opacity: 0.85 }]}
                onPress={handleSendOtp}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.btnText}>إرسال رمز التحقق</Text>
                }
              </Pressable>
            </>
          )}

          {step === "otp" && (
            <>
              <Pressable style={styles.backRow} onPress={handleBack}>
                <Feather name="arrow-right" size={18} color="#0e7c7c" />
                <Text style={styles.backText}>تغيير البريد</Text>
              </Pressable>

              <Text style={styles.cardTitle}>أدخل رمز التحقق</Text>
              <Text style={styles.cardDesc}>
                تم إرسال رمز مكوّن من 6 أرقام إلى{"\n"}
                <Text style={styles.emailHighlight}>{email}</Text>
              </Text>

              {success ? (
                <View style={styles.successRow}>
                  <Feather name="check-circle" size={15} color="#1a7a4a" />
                  <Text style={styles.successText}>{success}</Text>
                </View>
              ) : null}

              <View style={styles.inputWrap}>
                <Feather name="lock" size={18} color="#9bb0b0" style={styles.inputIcon} />
                <TextInput
                  ref={otpRef}
                  style={[styles.input, styles.otpInput]}
                  value={otp}
                  onChangeText={t => { setOtp(t.replace(/\D/g, "").slice(0, 6)); setError(""); }}
                  placeholder="• • • • • •"
                  placeholderTextColor="#aac8c8"
                  keyboardType="number-pad"
                  returnKeyType="done"
                  onSubmitEditing={handleVerifyOtp}
                  maxLength={6}
                  textAlign="center"
                />
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <Pressable
                style={({ pressed }) => [styles.btn, loading && styles.btnDisabled, pressed && { opacity: 0.85 }]}
                onPress={handleVerifyOtp}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.btnText}>تحقق وتفعيل التطبيق</Text>
                }
              </Pressable>

              <Pressable style={styles.resendBtn} onPress={handleSendOtp} disabled={loading}>
                <Text style={styles.resendText}>لم يصلك الرمز؟ أعد الإرسال</Text>
              </Pressable>
            </>
          )}

          {step === "admin" && (
            <>
              <Pressable style={styles.backRow} onPress={handleBack}>
                <Feather name="arrow-right" size={18} color="#0e7c7c" />
                <Text style={styles.backText}>رجوع</Text>
              </Pressable>

              <Text style={styles.cardTitle}>admin login</Text>

              <View style={styles.inputWrap}>
                <Pressable onPress={() => setShowAdminPass(p => !p)} style={styles.inputIcon}>
                  <Feather name={showAdminPass ? "eye-off" : "eye"} size={18} color="#9bb0b0" />
                </Pressable>
                <TextInput
                  ref={adminPassRef}
                  style={styles.input}
                  value={adminPass}
                  onChangeText={t => { setAdminPass(t); setError(""); }}
                  placeholder="كلمة المرور"
                  placeholderTextColor="#aac8c8"
                  secureTextEntry={!showAdminPass}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleAdminLogin}
                  textAlign="right"
                />
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <Pressable
                style={({ pressed }) => [styles.btn, loading && styles.btnDisabled, pressed && { opacity: 0.85 }]}
                onPress={handleAdminLogin}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.btnText}>دخول</Text>
                }
              </Pressable>
            </>
          )}
        </View>

        {/* Admin login — invisible tap zone, bottom-right corner only */}
        {step === "email" && (
          <Pressable
            onPress={() => { setStep("admin"); setError(""); }}
            style={styles.adminLink}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 24, gap: 28, alignItems: "stretch" },
  header: { alignItems: "center", gap: 12 },
  logoCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "#fff", alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 12, elevation: 6,
  },
  title: { fontSize: 22, fontWeight: "700", color: "#fff", textAlign: "center" },
  subtitle: { fontSize: 14, color: "#b2d8d8", textAlign: "center" },
  card: {
    backgroundColor: "#fff", borderRadius: 20, padding: 24,
    shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 16, elevation: 8,
    gap: 16,
  },
  cardTitle: { fontSize: 20, fontWeight: "700", color: "#0a5f5f", textAlign: "right" },
  cardDesc: { fontSize: 14, color: "#666", textAlign: "right", lineHeight: 22 },
  emailHighlight: { fontWeight: "700", color: "#0e7c7c" },
  inputWrap: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1.5, borderColor: "#d0e8e8", borderRadius: 12,
    backgroundColor: "#f8fbfb", overflow: "hidden",
  },
  inputIcon: { paddingHorizontal: 12 },
  input: { flex: 1, fontSize: 15, color: "#1a3a3a", paddingVertical: 14, paddingRight: 12 },
  otpInput: { fontSize: 26, fontWeight: "700", letterSpacing: 10, textAlign: "center" },
  btn: {
    backgroundColor: "#0e7c7c", borderRadius: 12,
    paddingVertical: 16, alignItems: "center", justifyContent: "center",
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  errorText: { fontSize: 13, color: "#b91c1c", textAlign: "right", lineHeight: 20 },
  successRow: { flexDirection: "row", alignItems: "center", gap: 6, justifyContent: "flex-end" },
  successText: { fontSize: 13, color: "#1a7a4a", textAlign: "right" },
  backRow: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-end" },
  backText: { fontSize: 14, color: "#0e7c7c", fontWeight: "600" },
  resendBtn: { alignItems: "center", paddingVertical: 4 },
  resendText: { fontSize: 13, color: "#0e7c7c", textDecorationLine: "underline" },
  footerNote: {
    fontSize: 12, color: "#b2d8d8", textAlign: "center", lineHeight: 18, paddingHorizontal: 8,
  },
  adminLink: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 36,
    height: 36,
    opacity: 0,
  },
});
