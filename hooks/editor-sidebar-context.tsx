"use client";

import { createContext, useContext } from "react";

interface EditorSidebarContextType {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const EditorSidebarContext = createContext<EditorSidebarContextType | null>(null);

export function useEditorSidebar() {
  const ctx = useContext(EditorSidebarContext);
  if (!ctx) throw new Error("useEditorSidebar must be used inside EditorClient");
  return ctx;
}
