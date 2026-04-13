import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

const PASSCODE_KEY = "app_passcode_hash";
const UNLOCKED_KEY = "app_unlocked_with";
const PASSCODE_VERSION_KEY = "app_passcode_version";
const DEFAULT_PASSCODE = "0000";
const PASSCODE_VERSION = "2"; // bump this whenever the passcode is changed

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
      const storedVersion = await AsyncStorage.getItem(PASSCODE_VERSION_KEY);

      if (storedVersion !== PASSCODE_VERSION) {
        // Passcode has been updated — force reset on all devices
        const newHash = simpleHash(DEFAULT_PASSCODE);
        await AsyncStorage.multiSet([
          [PASSCODE_KEY, newHash],
          [PASSCODE_VERSION_KEY, PASSCODE_VERSION],
        ]);
        await AsyncStorage.removeItem(UNLOCKED_KEY);
        setHasPasscode(true);
        setIsLocked(true);
        return;
      }

      const storedHash = await AsyncStorage.getItem(PASSCODE_KEY) ?? simpleHash(DEFAULT_PASSCODE);
      setHasPasscode(true);

      const unlockedWith = await AsyncStorage.getItem(UNLOCKED_KEY);
      setIsLocked(unlockedWith !== storedHash);
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
