import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

const PASSCODE_KEY = "app_passcode_hash";
const DEFAULT_PASSCODE = "2026";

function simpleHash(code: string): string {
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    hash = (hash * 31 + code.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16);
}

interface PasscodeContextType {
  isLocked: boolean;
  hasPasscode: boolean;
  unlock: (code: string) => Promise<boolean>;
  setPasscode: (code: string) => Promise<void>;
  clearPasscode: () => Promise<void>;
  lock: () => void;
}

const PasscodeContext = createContext<PasscodeContextType | null>(null);

export function PasscodeProvider({ children }: { children: React.ReactNode }) {
  const [isLocked, setIsLocked] = useState(true);
  const [hasPasscode, setHasPasscode] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(PASSCODE_KEY).then(async (val) => {
      if (!val) {
        // Seed the default passcode on first launch
        await AsyncStorage.setItem(PASSCODE_KEY, simpleHash(DEFAULT_PASSCODE));
        setHasPasscode(true);
        setIsLocked(true);
      } else {
        setHasPasscode(true);
        setIsLocked(true);
      }
    });
  }, []);

  const unlock = useCallback(async (code: string): Promise<boolean> => {
    const stored = await AsyncStorage.getItem(PASSCODE_KEY);
    if (!stored) { setIsLocked(false); return true; }
    if (simpleHash(code) === stored) {
      setIsLocked(false);
      return true;
    }
    return false;
  }, []);

  const setPasscode = useCallback(async (code: string) => {
    await AsyncStorage.setItem(PASSCODE_KEY, simpleHash(code));
    setHasPasscode(true);
    setIsLocked(false);
  }, []);

  const clearPasscode = useCallback(async () => {
    await AsyncStorage.removeItem(PASSCODE_KEY);
    setHasPasscode(false);
    setIsLocked(false);
  }, []);

  const lock = useCallback(() => {
    if (hasPasscode) setIsLocked(true);
  }, [hasPasscode]);

  return (
    <PasscodeContext.Provider value={{ isLocked, hasPasscode, unlock, setPasscode, clearPasscode, lock }}>
      {children}
    </PasscodeContext.Provider>
  );
}

export function usePasscode() {
  const ctx = useContext(PasscodeContext);
  if (!ctx) throw new Error("usePasscode must be inside PasscodeProvider");
  return ctx;
}
