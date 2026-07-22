"use client";

import { AuthProvider } from "@/store/auth";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <LocaleProvider>
      <AuthProvider>{children}</AuthProvider>
    </LocaleProvider>
  );
}
