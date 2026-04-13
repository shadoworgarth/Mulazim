import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

const PASSCODE_KEY = "app_passcode_hash";
const UNLOCKED_KEY = "app_unlocked_with";
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
    (async () => {
      let storedHash = await AsyncStorage.getItem(PASSCODE_KEY);

      if (!storedHash) {
        storedHash = simpleHash(DEFAULT_PASSCODE);
        await AsyncStorage.setItem(PASSCODE_KEY, storedHash);
      }

      setHasPasscode(true);

      // Check if this device already unlocked with the current passcode
      const unlockedWith = await AsyncStorage.getItem(UNLOCKED_KEY);
      if (unlockedWith === storedHash) {
        setIsLocked(false);
      } else {
        setIsLocked(true);
      }
    })();
  }, []);

  const unlock = useCallback(async (code: string): Promise<boolean> => {
    const stored = await AsyncStorage.getItem(PASSCODE_KEY);
    if (!stored) { setIsLocked(false); return true; }
    if (simpleHash(code) === stored) {
      // Remember that this device unlocked with this passcode
      await AsyncStorage.setItem(UNLOCKED_KEY, stored);
      setIsLocked(false);
      return true;
    }
    return false;
  }, []);

  const setPasscode = useCallback(async (code: string) => {
    const newHash = simpleHash(code);
    await AsyncStorage.setItem(PASSCODE_KEY, newHash);
    // Also update the unlocked-with record so the current device stays unlocked
    await AsyncStorage.setItem(UNLOCKED_KEY, newHash);
    setHasPasscode(true);
    setIsLocked(false);
  }, []);

  const clearPasscode = useCallback(async () => {
    await AsyncStorage.multiRemove([PASSCODE_KEY, UNLOCKED_KEY]);
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
