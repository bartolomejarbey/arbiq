"use client";

import { useMode } from "@/lib/mode-context";

interface ModeTextProps {
  mladsi: React.ReactNode;
  zkusenejsi: React.ReactNode;
}

export default function ModeText({ mladsi, zkusenejsi }: ModeTextProps) {
  const { mode } = useMode();
  return <>{mode === "mladsi" ? mladsi : zkusenejsi}</>;
}
