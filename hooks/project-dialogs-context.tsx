"use client";

import { createContext, useContext } from "react";
import { useProjectActions } from "./useProjectActions";

type ProjectDialogsContextType = ReturnType<typeof useProjectActions>;

export const ProjectDialogsContext = createContext<ProjectDialogsContextType | null>(null);

export function useProjectDialogsContext() {
  const context = useContext(ProjectDialogsContext);
  if (!context) {
    throw new Error("useProjectDialogsContext must be used inside EditorClient");
  }
  return context;
}
