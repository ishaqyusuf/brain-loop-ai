import React, { createContext, useContext, useState, type ReactNode } from "react";

type GlobalSheetsContextType = {
  activeSheet: string | null;
  openSheet: (sheetId: string) => void;
  closeSheet: () => void;
};

const GlobalSheetsContext = createContext<GlobalSheetsContextType | undefined>(undefined);

export function GlobalSheetsProvider({ children }: { children: ReactNode }) {
  const [activeSheet, setActiveSheet] = useState<string | null>(null);

  const openSheet = (sheetId: string) => setActiveSheet(sheetId);
  const closeSheet = () => setActiveSheet(null);

  return (
    <GlobalSheetsContext.Provider value={{ activeSheet, openSheet, closeSheet }}>
      {children}
    </GlobalSheetsContext.Provider>
  );
}

export function useGlobalSheets() {
  const context = useContext(GlobalSheetsContext);
  if (!context) {
    throw new Error("useGlobalSheets must be used within a GlobalSheetsProvider");
  }
  return context;
}
