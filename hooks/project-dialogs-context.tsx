"use client";

import { createContext, useContext } from "react";
import { useProjectDialogs } from "./useProjectDialogs";

type ProjectDialogsContextType = ReturnType<typeof useProjectDialogs>;

export const ProjectDialogsContext = createContext<ProjectDialogsContextType | null>(null);

export function useProjectDialogsContext() {
  const context = useContext(ProjectDialogsContext);
  if (!context) {
    throw new Error("useProjectDialogsContext must be used inside EditorLayout");
  }
  return context;
}
