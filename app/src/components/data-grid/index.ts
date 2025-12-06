/**
 * DataGrid Component Library
 * A professional-grade data grid with virtualization, filtering, sorting, and more
 */

// Main component
export { DataGrid } from "./DataGrid";

// Context
export { DataGridProvider, useDataGridContext } from "./DataGridContext";

// Hooks
export { useDataGrid } from "./useDataGrid";
export { useVirtualization } from "./useVirtualization";

// Toolbar & Controls
export { DataGridToolbar } from "./DataGridToolbar";
export { DataGridPagination, SimplePagination, useInfiniteScroll } from "./Pagination";
export { ViewManager, useUrlStateSync } from "./ViewManager";

// Selection & Actions
export {
  BulkActionBar,
  createBulkDeleteAction,
  createBulkArchiveAction,
  createBulkEditAction,
  createBulkTagAction,
} from "./BulkActionBar";

export {
  ContextMenu,
  useContextMenu,
  createDefaultContextMenuItems,
} from "./ContextMenu";

// Cell Renderers
export {
  TextCell,
  NumberCell,
  CurrencyCell,
  DateCell,
  DateTimeCell,
  BooleanCell,
  BadgeCell,
  AvatarCell,
  ProgressCell,
  ActionsCell,
  LinkCell,
  getCellRenderer,
} from "./CellRenderers";

// Types
export type {
  // Core types
  ColumnDef,
  ColumnType,
  ColumnFilter,
  FilterOperator,
  SortState,
  SortDirection,
  EnumOption,

  // State types
  SelectionState,
  SelectionMode,
  PaginationState,
  GroupState,
  GroupedRow,
  DensityMode,
  ViewState,

  // Context types
  CellContext,
  HeaderContext,
  EditCellContext,
  ContextMenuItem,
  ContextMenuContext,
  BulkAction,

  // Component types
  DataGridProps,
  DataGridInstance,
  VirtualItem,
  ScrollState,
  ResizeState,
  DragState,
} from "./types";

export { DENSITY_CONFIG } from "./types";
