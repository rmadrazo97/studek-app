/**
 * DataGrid Context
 * Provides the DataGrid instance to all child components
 */

"use client";

import { createContext, useContext, ReactNode } from "react";
import type { DataGridInstance } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DataGridContext = createContext<DataGridInstance<any> | null>(null);

export interface DataGridProviderProps<TData> {
  children: ReactNode;
  instance: DataGridInstance<TData>;
}

export function DataGridProvider<TData>({
  children,
  instance,
}: DataGridProviderProps<TData>) {
  return (
    <DataGridContext.Provider value={instance}>
      {children}
    </DataGridContext.Provider>
  );
}

export function useDataGridContext<TData = unknown>(): DataGridInstance<TData> {
  const context = useContext(DataGridContext);
  if (!context) {
    throw new Error(
      "useDataGridContext must be used within a DataGridProvider"
    );
  }
  return context as DataGridInstance<TData>;
}
