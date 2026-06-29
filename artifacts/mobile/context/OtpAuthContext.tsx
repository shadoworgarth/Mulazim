import React, { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { API_BASE } from "@/constants/api";

const DEVICE_TOKEN_KEY = "sfda_device_token";

// Set to true to re-enable OTP / admin-password authentication.
const AUTH_ENABLED = true;

type OtpAuthContextType = {
  isVerified: boolean;
  checkDone: boolean;
  requestOtp: (email: string) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  adminLogin: (password: string) => Promise<void>;
};

const OtpAuthContext = createContext<OtpAuthContextType | null>(null);

async function storeToken(token: string) {
  if (Platform.OS === "web") {
    localStorage.setItem(DEVICE_TOKEN_KEY, token);
  } else {
    await SecureStore.setItemAsync(DEVICE_TOKEN_KEY, token);
  }
}

async function getStoredToken(): Promise<string | null> {
  if (Platform.OS === "web") {
    return localStorage.getItem(DEVICE_TOKEN_KEY);
  }
  return SecureStore.getItemAsync(DEVICE_TOKEN_KEY);
}

export function OtpAuthProvider({ children }: { children: React.ReactNode }) {
  const [isVerified, setIsVerified] = useState(false);
  const [checkDone, setCheckDone] = useState(false);

  useEffect(() => {
    if (!AUTH_ENABLED) {
      setIsVerified(true);
      setCheckDone(true);
      return;
    }
    checkStoredToken();
  }, []);

  async function checkStoredToken() {
    try {
      const token = await getStoredToken();
      if (!token) {
        setCheckDone(true);
        return;
      }
      // Retry up to 4 times with increasing delays to handle server restarts
      // that happen right after a publish (server briefly unavailable).
      const delays = [0, 2000, 4000, 6000];
      let lastError: unknown;
      for (const delay of delays) {
        if (delay > 0) await new Promise((r) => setTimeout(r, delay));
        try {
          const res = await fetch(`${API_BASE}/auth/check-device`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
          });
          const data = await res.json();
          setIsVerified(data.valid === true);
          setCheckDone(true);
          return;
        } catch (err) {
          lastError = err;
        }
      }
      console.error("check-device failed after retries:", lastError);
      setIsVerified(false);
    } catch {
      setIsVerified(false);
    } finally {
      setCheckDone(true);
    }
  }

  async function requestOtp(email: string) {
    const res = await fetch(`${API_BASE}/auth/request-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "فشل إرسال الرمز");
  }

  async function verifyOtp(email: string, otp: string) {
    const res = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    });
    const data = await res.json();
    if (!res.ok || !data.token) throw new Error(data.error ?? "فشل التحقق");
    await storeToken(data.token);
    setIsVerified(true);
  }

  async function adminLogin(password: string) {
    const res = await fetch(`${API_BASE}/auth/admin-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (!res.ok || !data.token) throw new Error(data.error ?? "كلمة المرور غير صحيحة");
    await storeToken(data.token);
    setIsVerified(true);
  }

  return (
    <OtpAuthContext.Provider value={{ isVerified, checkDone, requestOtp, verifyOtp, adminLogin }}>
      {children}
    </OtpAuthContext.Provider>
  );
}

export function useOtpAuth() {
  const ctx = useContext(OtpAuthContext);
  if (!ctx) throw new Error("useOtpAuth must be used inside OtpAuthProvider");
  return ctx;
}
