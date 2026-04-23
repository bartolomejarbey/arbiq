"use client";

import { createContext, useContext, useState } from "react";

type IntroContextType = {
  revealed: boolean;
  setRevealed: (v: boolean) => void;
};

export const IntroContext = createContext<IntroContextType>({
  revealed: false,
  setRevealed: () => {},
});

export function useIntro() {
  return useContext(IntroContext);
}

export function IntroContextProvider({ children }: { children: React.ReactNode }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <IntroContext.Provider value={{ revealed, setRevealed }}>
      {children}
    </IntroContext.Provider>
  );
}
