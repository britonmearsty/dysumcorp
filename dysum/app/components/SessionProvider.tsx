"use client";

import { createContext, useContext, ReactNode } from "react";
import { useSession } from "../lib/auth-client";

interface SessionContextType {
  session: any;
  isLoading: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession();

  return (
    <SessionContext.Provider value={{ session, isLoading: isPending }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSessionContext() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSessionContext must be used within a SessionProvider");
  }
  return context;
}
