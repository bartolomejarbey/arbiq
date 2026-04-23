"use client";

import { createContext, useContext, useState, useEffect } from "react";

type Mode = "mladsi" | "zkusenejsi";

type ModeContextType = {
  mode: Mode;
  setMode: (m: Mode) => void;
};

const ModeContext = createContext<ModeContextType>({
  mode: "zkusenejsi",
  setMode: () => {},
});

export function useMode() {
  return useContext(ModeContext);
}

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<Mode>("zkusenejsi");

  useEffect(() => {
    const saved = localStorage.getItem("arbiq-mode") as Mode | null;
    if (saved === "mladsi" || saved === "zkusenejsi") {
      setModeState(saved);
    }
  }, []);

  function setMode(m: Mode) {
    setModeState(m);
    localStorage.setItem("arbiq-mode", m);
  }

  return (
    <ModeContext.Provider value={{ mode, setMode }}>
      {children}
    </ModeContext.Provider>
  );
}
