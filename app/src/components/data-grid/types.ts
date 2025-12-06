/**
 * DataGrid Types and Interfaces
 * Comprehensive type definitions for a professional-grade data grid component
 */

import { ReactNode } from "react";

// ============================================
// DENSITY MODES
// ============================================

export type DensityMode = "compact" | "default" | "comfort";

export const DENSITY_CONFIG: Record<
  DensityMode,
  {
    rowHeight: number;
    fontSize: number;
    padding: { x: number; y: number };
    avatarSize: number;
  }
> = {
  compact: {
    rowHeight: 36,
    fontSize: 12,
    padding: { x: 8, y: 4 },
    avatarSize: 20,
  },
  default: {
    rowHeight: 44,
    fontSize: 13,
    padding: { x: 12, y: 8 },
    avatarSize: 24,
  },
  comfort: {
    rowHeight: 56,
    fontSize: 14,
    padding: { x: 16, y: 12 },
    avatarSize: 32,
  },
};

// ============================================
// COLUMN DEFINITIONS
// ============================================

export type ColumnType =
  | "text"
  | "number"
  | "currency"
  | "date"
  | "datetime"
  | "boolean"
  | "enum"
  | "reference"
  | "badge"
  | "avatar"
  | "progress"
  | "actions"
  | "custom";

export type SortDirection = "asc" | "desc" | null;

export type FilterOperator =
  | "is"
  | "is_not"
  | "is_any_of"
  | "contains"
  | "not_contains"
  | "starts_with"
  | "ends_with"
  | "before"
  | "after"
  | "between"
  | "is_empty"
  | "is_not_empty"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "eq"
  | "neq";

export interface ColumnFilter {
  columnId: string;
  operator: FilterOperator;
  value: unknown;
}

export interface EnumOption {
  value: string;
  label: string;
  color?: string;
  icon?: ReactNode;
}

export interface ColumnDef<TData = unknown> {
  id: string;
  header: string | ReactNode;
  accessorKey?: keyof TData | string;
  accessorFn?: (row: TData) => unknown;
  type: ColumnType;

  // Sizing
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  flex?: number;

  // Features
  sortable?: boolean;
  filterable?: boolean;
  resizable?: boolean;
  hideable?: boolean;
  pinned?: "left" | "right" | false;
  frozen?: boolean;

  // Formatting
  align?: "left" | "center" | "right";
  format?: (value: unknown, row: TData) => string | ReactNode;
  cell?: (props: CellContext<TData>) => ReactNode;
  headerCell?: (props: HeaderContext<TData>) => ReactNode;

  // Enum/Select specific
  options?: EnumOption[];

  // Editing
  editable?: boolean;
  editCell?: (props: EditCellContext<TData>) => ReactNode;
  validate?: (value: unknown, row: TData) => boolean | string;

  // Grouping & Aggregation
  enableGrouping?: boolean;
  aggregate?: "sum" | "avg" | "count" | "min" | "max" | ((values: unknown[]) => unknown);
  aggregateLabel?: string;

  // Meta
  meta?: Record<string, unknown>;
}

// ============================================
// CELL CONTEXTS
// ============================================

export interface CellContext<TData = unknown> {
  value: unknown;
  row: TData;
  rowIndex: number;
  column: ColumnDef<TData>;
  isSelected: boolean;
  isFocused: boolean;
  isEditing: boolean;
  table: DataGridInstance<TData>;
}

export interface HeaderContext<TData = unknown> {
  column: ColumnDef<TData>;
  sortDirection: SortDirection;
  isSorted: boolean;
  table: DataGridInstance<TData>;
}

export interface EditCellContext<TData = unknown> extends CellContext<TData> {
  onSave: (value: unknown) => void;
  onCancel: () => void;
}

// ============================================
// SORTING
// ============================================

export interface SortState {
  columnId: string;
  direction: "asc" | "desc";
}

// ============================================
// SELECTION
// ============================================

export type SelectionMode = "none" | "single" | "multiple";

export interface SelectionState {
  selectedRowIds: Set<string>;
  anchorRowId: string | null;
  focusedRowId: string | null;
  focusedColumnId: string | null;
}

// ============================================
// PAGINATION
// ============================================

export interface PaginationState {
  pageIndex: number;
  pageSize: number;
  totalRows: number;
}

// ============================================
// GROUPING
// ============================================

export interface GroupState {
  groupByColumnId: string | null;
  expandedGroups: Set<string>;
}

export interface GroupedRow<TData = unknown> {
  type: "group";
  groupKey: string;
  groupValue: unknown;
  count: number;
  rows: TData[];
  aggregates: Record<string, unknown>;
  isExpanded: boolean;
}

// ============================================
// VIEW STATE
// ============================================

export interface ViewState {
  id: string;
  name: string;
  type: "system" | "personal" | "shared";
  config: {
    filters: ColumnFilter[];
    sorting: SortState[];
    grouping: string | null;
    columnVisibility: Record<string, boolean>;
    columnOrder: string[];
    columnWidths: Record<string, number>;
    density: DensityMode;
  };
}

// ============================================
// CONTEXT MENU
// ============================================

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  shortcut?: string;
  disabled?: boolean;
  danger?: boolean;
  separator?: boolean;
  children?: ContextMenuItem[];
  action?: (context: ContextMenuContext) => void;
}

export interface ContextMenuContext {
  row?: unknown;
  rowIndex?: number;
  column?: ColumnDef;
  cellValue?: unknown;
  selectedRows: unknown[];
}

// ============================================
// BULK ACTIONS
// ============================================

export interface BulkAction<TData = unknown> {
  id: string;
  label: string;
  icon?: ReactNode;
  variant?: "default" | "primary" | "danger";
  action: (selectedRows: TData[]) => void | Promise<void>;
  disabled?: (selectedRows: TData[]) => boolean;
}

// ============================================
// DATA GRID INSTANCE
// ============================================

export interface DataGridInstance<TData = unknown> {
  // Data
  data: TData[];
  columns: ColumnDef<TData>[];
  getRowId: (row: TData) => string;

  // State
  density: DensityMode;
  setDensity: (density: DensityMode) => void;

  // Sorting
  sortState: SortState[];
  setSortState: (state: SortState[]) => void;
  toggleSort: (columnId: string, multi?: boolean) => void;
  clearSort: () => void;

  // Filtering
  filterState: ColumnFilter[];
  setFilterState: (state: ColumnFilter[]) => void;
  addFilter: (filter: ColumnFilter) => void;
  removeFilter: (columnId: string) => void;
  clearFilters: () => void;
  globalFilter: string;
  setGlobalFilter: (filter: string) => void;

  // Selection
  selectionMode: SelectionMode;
  selectionState: SelectionState;
  selectRow: (rowId: string, toggle?: boolean) => void;
  selectRange: (fromRowId: string, toRowId: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  isRowSelected: (rowId: string) => boolean;
  getSelectedRows: () => TData[];

  // Focus
  focusRow: (rowId: string) => void;
  focusCell: (rowId: string, columnId: string) => void;
  moveFocus: (direction: "up" | "down" | "left" | "right") => void;

  // Column visibility
  columnVisibility: Record<string, boolean>;
  setColumnVisibility: (visibility: Record<string, boolean>) => void;
  toggleColumn: (columnId: string) => void;
  getVisibleColumns: () => ColumnDef<TData>[];

  // Column order
  columnOrder: string[];
  setColumnOrder: (order: string[]) => void;
  moveColumn: (columnId: string, targetIndex: number) => void;

  // Column widths
  columnWidths: Record<string, number>;
  setColumnWidth: (columnId: string, width: number) => void;
  resetColumnWidths: () => void;

  // Grouping
  groupState: GroupState;
  setGroupBy: (columnId: string | null) => void;
  toggleGroup: (groupKey: string) => void;
  expandAllGroups: () => void;
  collapseAllGroups: () => void;

  // Pagination
  paginationState: PaginationState;
  setPageIndex: (index: number) => void;
  setPageSize: (size: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  canNextPage: boolean;
  canPreviousPage: boolean;

  // Editing
  editingCell: { rowId: string; columnId: string } | null;
  startEditing: (rowId: string, columnId: string) => void;
  stopEditing: () => void;
  updateCell: (rowId: string, columnId: string, value: unknown) => void;

  // Computed
  processedData: (TData | GroupedRow<TData>)[];
  totalRowCount: number;
  selectedRowCount: number;

  // Views
  currentView: ViewState | null;
  saveView: (name: string, type: ViewState["type"]) => ViewState;
  loadView: (view: ViewState) => void;
  deleteView: (viewId: string) => void;
}

// ============================================
// COMPONENT PROPS
// ============================================

export interface DataGridProps<TData = unknown> {
  // Data
  data: TData[];
  columns: ColumnDef<TData>[];
  getRowId?: (row: TData, index: number) => string;

  // Features
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enableSelection?: boolean;
  selectionMode?: SelectionMode;
  enablePagination?: boolean;
  enableVirtualization?: boolean;
  enableGrouping?: boolean;
  enableColumnResize?: boolean;
  enableColumnReorder?: boolean;
  enableRowReorder?: boolean;
  enableInlineEditing?: boolean;
  enableContextMenu?: boolean;
  enableKeyboardNavigation?: boolean;

  // Appearance
  density?: DensityMode;
  striped?: boolean;
  bordered?: boolean;
  stickyHeader?: boolean;
  rowHeight?: number;
  maxHeight?: number | string;

  // Pagination
  pageSize?: number;
  pageSizeOptions?: number[];
  serverSidePagination?: boolean;
  totalRows?: number;
  onPageChange?: (pageIndex: number, pageSize: number) => void;

  // Sorting
  defaultSort?: SortState[];
  onSortChange?: (sortState: SortState[]) => void;
  serverSideSorting?: boolean;

  // Filtering
  defaultFilters?: ColumnFilter[];
  onFilterChange?: (filterState: ColumnFilter[]) => void;
  serverSideFiltering?: boolean;

  // Selection
  defaultSelected?: string[];
  onSelectionChange?: (selectedRowIds: string[], selectedRows: TData[]) => void;

  // Context Menu
  contextMenuItems?: ContextMenuItem[] | ((context: ContextMenuContext) => ContextMenuItem[]);

  // Bulk Actions
  bulkActions?: BulkAction<TData>[];

  // Callbacks
  onRowClick?: (row: TData, rowIndex: number) => void;
  onRowDoubleClick?: (row: TData, rowIndex: number) => void;
  onCellClick?: (row: TData, column: ColumnDef<TData>, value: unknown) => void;
  onCellEdit?: (row: TData, column: ColumnDef<TData>, oldValue: unknown, newValue: unknown) => void | Promise<void>;
  onColumnResize?: (columnId: string, width: number) => void;
  onColumnReorder?: (columnOrder: string[]) => void;

  // Empty/Loading states
  isLoading?: boolean;
  emptyState?: ReactNode;
  loadingState?: ReactNode;

  // Virtualization
  overscan?: number;

  // Views
  savedViews?: ViewState[];
  onViewSave?: (view: ViewState) => void;
  onViewDelete?: (viewId: string) => void;

  // Styling
  className?: string;
  headerClassName?: string;
  rowClassName?: string | ((row: TData, index: number) => string);
  cellClassName?: string | ((row: TData, column: ColumnDef<TData>) => string);
}

// ============================================
// INTERNAL TYPES
// ============================================

export interface VirtualItem {
  index: number;
  start: number;
  end: number;
  size: number;
  key: string;
}

export interface ScrollState {
  scrollTop: number;
  scrollLeft: number;
  scrollHeight: number;
  scrollWidth: number;
  clientHeight: number;
  clientWidth: number;
}

export interface ResizeState {
  columnId: string;
  startX: number;
  startWidth: number;
}

export interface DragState {
  type: "column" | "row";
  sourceId: string;
  targetId: string | null;
  isDragging: boolean;
}
