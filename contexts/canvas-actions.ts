import { createContext, useContext } from "react";

export const NodeLabelContext = createContext<
  (id: string, label: string) => void
>(() => {});

export function useUpdateNodeLabel() {
  return useContext(NodeLabelContext);
}

export const NodeColorContext = createContext<
  (id: string, bg: string, text: string) => void
>(() => {});

export function useUpdateNodeColor() {
  return useContext(NodeColorContext);
}

export const EdgeLabelContext = createContext<
  (id: string, label: string) => void
>(() => {});

export function useUpdateEdgeLabel() {
  return useContext(EdgeLabelContext);
}
