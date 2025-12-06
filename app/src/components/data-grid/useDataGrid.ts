/**
 * useDataGrid Hook
 * Core state management and logic for the DataGrid component
 */

"use client";

import {
  useCallback,
  useMemo,
  useReducer,
  useRef,
  useEffect,
} from "react";
import type {
  ColumnDef,
  ColumnFilter,
  DataGridInstance,
  DataGridProps,
  DensityMode,
  GroupedRow,
  GroupState,
  PaginationState,
  SelectionState,
  SortState,
  ViewState,
  FilterOperator,
} from "./types";

// ============================================
// STATE TYPES
// ============================================

interface DataGridState<TData> {
  density: DensityMode;
  sortState: SortState[];
  filterState: ColumnFilter[];
  globalFilter: string;
  selectionState: SelectionState;
  columnVisibility: Record<string, boolean>;
  columnOrder: string[];
  columnWidths: Record<string, number>;
  groupState: GroupState;
  paginationState: PaginationState;
  editingCell: { rowId: string; columnId: string } | null;
  currentView: ViewState | null;
}

type DataGridAction<TData> =
  | { type: "SET_DENSITY"; payload: DensityMode }
  | { type: "SET_SORT"; payload: SortState[] }
  | { type: "SET_FILTER"; payload: ColumnFilter[] }
  | { type: "SET_GLOBAL_FILTER"; payload: string }
  | { type: "SET_SELECTION"; payload: Partial<SelectionState> }
  | { type: "SET_COLUMN_VISIBILITY"; payload: Record<string, boolean> }
  | { type: "SET_COLUMN_ORDER"; payload: string[] }
  | { type: "SET_COLUMN_WIDTH"; payload: { columnId: string; width: number } }
  | { type: "SET_GROUP_STATE"; payload: Partial<GroupState> }
  | { type: "SET_PAGINATION"; payload: Partial<PaginationState> }
  | { type: "SET_EDITING_CELL"; payload: { rowId: string; columnId: string } | null }
  | { type: "SET_CURRENT_VIEW"; payload: ViewState | null }
  | { type: "LOAD_VIEW"; payload: ViewState };

// ============================================
// REDUCER
// ============================================

function createReducer<TData>() {
  return function reducer(
    state: DataGridState<TData>,
    action: DataGridAction<TData>
  ): DataGridState<TData> {
    switch (action.type) {
      case "SET_DENSITY":
        return { ...state, density: action.payload };

      case "SET_SORT":
        return { ...state, sortState: action.payload };

      case "SET_FILTER":
        return { ...state, filterState: action.payload };

      case "SET_GLOBAL_FILTER":
        return { ...state, globalFilter: action.payload };

      case "SET_SELECTION":
        return {
          ...state,
          selectionState: { ...state.selectionState, ...action.payload },
        };

      case "SET_COLUMN_VISIBILITY":
        return { ...state, columnVisibility: action.payload };

      case "SET_COLUMN_ORDER":
        return { ...state, columnOrder: action.payload };

      case "SET_COLUMN_WIDTH":
        return {
          ...state,
          columnWidths: {
            ...state.columnWidths,
            [action.payload.columnId]: action.payload.width,
          },
        };

      case "SET_GROUP_STATE":
        return {
          ...state,
          groupState: { ...state.groupState, ...action.payload },
        };

      case "SET_PAGINATION":
        return {
          ...state,
          paginationState: { ...state.paginationState, ...action.payload },
        };

      case "SET_EDITING_CELL":
        return { ...state, editingCell: action.payload };

      case "SET_CURRENT_VIEW":
        return { ...state, currentView: action.payload };

      case "LOAD_VIEW":
        return {
          ...state,
          filterState: action.payload.config.filters,
          sortState: action.payload.config.sorting,
          groupState: {
            ...state.groupState,
            groupByColumnId: action.payload.config.grouping,
          },
          columnVisibility: action.payload.config.columnVisibility,
          columnOrder: action.payload.config.columnOrder,
          columnWidths: action.payload.config.columnWidths,
          density: action.payload.config.density,
          currentView: action.payload,
        };

      default:
        return state;
    }
  };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function getNestedValue(obj: unknown, path: string): unknown {
  return path.split(".").reduce((acc, part) => {
    if (acc === null || acc === undefined) return undefined;
    return (acc as Record<string, unknown>)[part];
  }, obj);
}

function compareValues(a: unknown, b: unknown, direction: "asc" | "desc"): number {
  const multiplier = direction === "asc" ? 1 : -1;

  if (a === null || a === undefined) return 1 * multiplier;
  if (b === null || b === undefined) return -1 * multiplier;

  if (typeof a === "string" && typeof b === "string") {
    return a.localeCompare(b) * multiplier;
  }

  if (typeof a === "number" && typeof b === "number") {
    return (a - b) * multiplier;
  }

  if (a instanceof Date && b instanceof Date) {
    return (a.getTime() - b.getTime()) * multiplier;
  }

  return String(a).localeCompare(String(b)) * multiplier;
}

function matchesFilter(value: unknown, filter: ColumnFilter): boolean {
  const { operator, value: filterValue } = filter;

  if (value === null || value === undefined) {
    if (operator === "is_empty") return true;
    if (operator === "is_not_empty") return false;
    return false;
  }

  switch (operator) {
    case "is":
      return value === filterValue;
    case "is_not":
      return value !== filterValue;
    case "is_any_of":
      return Array.isArray(filterValue) && filterValue.includes(value);
    case "contains":
      return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
    case "not_contains":
      return !String(value).toLowerCase().includes(String(filterValue).toLowerCase());
    case "starts_with":
      return String(value).toLowerCase().startsWith(String(filterValue).toLowerCase());
    case "ends_with":
      return String(value).toLowerCase().endsWith(String(filterValue).toLowerCase());
    case "is_empty":
      return value === "" || value === null || value === undefined;
    case "is_not_empty":
      return value !== "" && value !== null && value !== undefined;
    case "gt":
      return Number(value) > Number(filterValue);
    case "gte":
      return Number(value) >= Number(filterValue);
    case "lt":
      return Number(value) < Number(filterValue);
    case "lte":
      return Number(value) <= Number(filterValue);
    case "eq":
      return Number(value) === Number(filterValue);
    case "neq":
      return Number(value) !== Number(filterValue);
    case "before":
      return new Date(value as string) < new Date(filterValue as string);
    case "after":
      return new Date(value as string) > new Date(filterValue as string);
    case "between":
      if (Array.isArray(filterValue) && filterValue.length === 2) {
        const date = new Date(value as string);
        return date >= new Date(filterValue[0]) && date <= new Date(filterValue[1]);
      }
      return false;
    default:
      return true;
  }
}

// ============================================
// MAIN HOOK
// ============================================

export function useDataGrid<TData>(
  props: DataGridProps<TData>
): DataGridInstance<TData> {
  const {
    data,
    columns,
    getRowId = (row, index) => String(index),
    selectionMode = "none",
    enablePagination = false,
    pageSize = 50,
    defaultSort = [],
    defaultFilters = [],
    defaultSelected = [],
    totalRows,
    density: defaultDensity = "default",
  } = props;

  // Stable ID generator
  const getRowIdRef = useRef(getRowId);
  getRowIdRef.current = getRowId;

  // Initial state
  const initialState: DataGridState<TData> = useMemo(
    () => ({
      density: defaultDensity,
      sortState: defaultSort,
      filterState: defaultFilters,
      globalFilter: "",
      selectionState: {
        selectedRowIds: new Set(defaultSelected),
        anchorRowId: null,
        focusedRowId: null,
        focusedColumnId: null,
      },
      columnVisibility: columns.reduce(
        (acc, col) => ({ ...acc, [col.id]: true }),
        {}
      ),
      columnOrder: columns.map((col) => col.id),
      columnWidths: columns.reduce(
        (acc, col) => ({ ...acc, [col.id]: col.width || 150 }),
        {}
      ),
      groupState: {
        groupByColumnId: null,
        expandedGroups: new Set<string>(),
      },
      paginationState: {
        pageIndex: 0,
        pageSize,
        totalRows: totalRows ?? data.length,
      },
      editingCell: null,
      currentView: null,
    }),
    // Only use stable defaults
    []
  );

  const [state, dispatch] = useReducer(createReducer<TData>(), initialState);

  // Update total rows when data changes
  useEffect(() => {
    dispatch({
      type: "SET_PAGINATION",
      payload: { totalRows: totalRows ?? data.length },
    });
  }, [data.length, totalRows]);

  // ============================================
  // DENSITY
  // ============================================

  const setDensity = useCallback((density: DensityMode) => {
    dispatch({ type: "SET_DENSITY", payload: density });
  }, []);

  // ============================================
  // SORTING
  // ============================================

  const setSortState = useCallback((sortState: SortState[]) => {
    dispatch({ type: "SET_SORT", payload: sortState });
  }, []);

  const toggleSort = useCallback(
    (columnId: string, multi = false) => {
      const column = columns.find((c) => c.id === columnId);
      if (!column?.sortable) return;

      const existingIndex = state.sortState.findIndex(
        (s) => s.columnId === columnId
      );
      let newSort: SortState[];

      if (existingIndex === -1) {
        // Not currently sorted - add ascending
        const newSortItem: SortState = { columnId, direction: "asc" };
        newSort = multi ? [...state.sortState, newSortItem] : [newSortItem];
      } else {
        const existing = state.sortState[existingIndex];
        if (existing.direction === "asc") {
          // Ascending -> Descending
          const updated = { ...existing, direction: "desc" as const };
          newSort = multi
            ? state.sortState.map((s, i) => (i === existingIndex ? updated : s))
            : [updated];
        } else {
          // Descending -> Remove
          newSort = multi
            ? state.sortState.filter((_, i) => i !== existingIndex)
            : [];
        }
      }

      dispatch({ type: "SET_SORT", payload: newSort });
    },
    [columns, state.sortState]
  );

  const clearSort = useCallback(() => {
    dispatch({ type: "SET_SORT", payload: [] });
  }, []);

  // ============================================
  // FILTERING
  // ============================================

  const setFilterState = useCallback((filterState: ColumnFilter[]) => {
    dispatch({ type: "SET_FILTER", payload: filterState });
  }, []);

  const addFilter = useCallback(
    (filter: ColumnFilter) => {
      const existing = state.filterState.findIndex(
        (f) => f.columnId === filter.columnId
      );
      let newFilters: ColumnFilter[];
      if (existing !== -1) {
        newFilters = state.filterState.map((f, i) =>
          i === existing ? filter : f
        );
      } else {
        newFilters = [...state.filterState, filter];
      }
      dispatch({ type: "SET_FILTER", payload: newFilters });
    },
    [state.filterState]
  );

  const removeFilter = useCallback(
    (columnId: string) => {
      dispatch({
        type: "SET_FILTER",
        payload: state.filterState.filter((f) => f.columnId !== columnId),
      });
    },
    [state.filterState]
  );

  const clearFilters = useCallback(() => {
    dispatch({ type: "SET_FILTER", payload: [] });
  }, []);

  const setGlobalFilter = useCallback((filter: string) => {
    dispatch({ type: "SET_GLOBAL_FILTER", payload: filter });
  }, []);

  // ============================================
  // SELECTION
  // ============================================

  const selectRow = useCallback(
    (rowId: string, toggle = true) => {
      if (selectionMode === "none") return;

      const newSelection = new Set(state.selectionState.selectedRowIds);

      if (selectionMode === "single") {
        if (toggle && newSelection.has(rowId)) {
          newSelection.delete(rowId);
        } else {
          newSelection.clear();
          newSelection.add(rowId);
        }
      } else {
        if (toggle && newSelection.has(rowId)) {
          newSelection.delete(rowId);
        } else {
          newSelection.add(rowId);
        }
      }

      dispatch({
        type: "SET_SELECTION",
        payload: {
          selectedRowIds: newSelection,
          anchorRowId: rowId,
        },
      });
    },
    [selectionMode, state.selectionState.selectedRowIds]
  );

  const selectRange = useCallback(
    (fromRowId: string, toRowId: string) => {
      if (selectionMode !== "multiple") return;

      const rowIds = data.map((row, i) => getRowIdRef.current(row, i));
      const fromIndex = rowIds.indexOf(fromRowId);
      const toIndex = rowIds.indexOf(toRowId);

      if (fromIndex === -1 || toIndex === -1) return;

      const start = Math.min(fromIndex, toIndex);
      const end = Math.max(fromIndex, toIndex);

      const newSelection = new Set(state.selectionState.selectedRowIds);
      for (let i = start; i <= end; i++) {
        newSelection.add(rowIds[i]);
      }

      dispatch({
        type: "SET_SELECTION",
        payload: { selectedRowIds: newSelection },
      });
    },
    [data, selectionMode, state.selectionState.selectedRowIds]
  );

  const selectAll = useCallback(() => {
    if (selectionMode !== "multiple") return;

    const allIds = data.map((row, i) => getRowIdRef.current(row, i));
    dispatch({
      type: "SET_SELECTION",
      payload: { selectedRowIds: new Set(allIds) },
    });
  }, [data, selectionMode]);

  const clearSelection = useCallback(() => {
    dispatch({
      type: "SET_SELECTION",
      payload: { selectedRowIds: new Set() },
    });
  }, []);

  const isRowSelected = useCallback(
    (rowId: string) => state.selectionState.selectedRowIds.has(rowId),
    [state.selectionState.selectedRowIds]
  );

  const getSelectedRows = useCallback(() => {
    return data.filter((row, i) =>
      state.selectionState.selectedRowIds.has(getRowIdRef.current(row, i))
    );
  }, [data, state.selectionState.selectedRowIds]);

  // ============================================
  // FOCUS
  // ============================================

  const focusRow = useCallback((rowId: string) => {
    dispatch({
      type: "SET_SELECTION",
      payload: { focusedRowId: rowId },
    });
  }, []);

  const focusCell = useCallback((rowId: string, columnId: string) => {
    dispatch({
      type: "SET_SELECTION",
      payload: { focusedRowId: rowId, focusedColumnId: columnId },
    });
  }, []);

  const moveFocus = useCallback(
    (direction: "up" | "down" | "left" | "right") => {
      const { focusedRowId, focusedColumnId } = state.selectionState;
      const visibleColumns = columns.filter(
        (c) => state.columnVisibility[c.id] !== false
      );
      const rowIds = data.map((row, i) => getRowIdRef.current(row, i));

      const currentRowIndex = focusedRowId ? rowIds.indexOf(focusedRowId) : 0;
      const currentColIndex = focusedColumnId
        ? visibleColumns.findIndex((c) => c.id === focusedColumnId)
        : 0;

      let newRowIndex = currentRowIndex;
      let newColIndex = currentColIndex;

      switch (direction) {
        case "up":
          newRowIndex = Math.max(0, currentRowIndex - 1);
          break;
        case "down":
          newRowIndex = Math.min(rowIds.length - 1, currentRowIndex + 1);
          break;
        case "left":
          newColIndex = Math.max(0, currentColIndex - 1);
          break;
        case "right":
          newColIndex = Math.min(visibleColumns.length - 1, currentColIndex + 1);
          break;
      }

      dispatch({
        type: "SET_SELECTION",
        payload: {
          focusedRowId: rowIds[newRowIndex],
          focusedColumnId: visibleColumns[newColIndex]?.id,
        },
      });
    },
    [columns, data, state.columnVisibility, state.selectionState]
  );

  // ============================================
  // COLUMN VISIBILITY
  // ============================================

  const setColumnVisibility = useCallback(
    (visibility: Record<string, boolean>) => {
      dispatch({ type: "SET_COLUMN_VISIBILITY", payload: visibility });
    },
    []
  );

  const toggleColumn = useCallback(
    (columnId: string) => {
      dispatch({
        type: "SET_COLUMN_VISIBILITY",
        payload: {
          ...state.columnVisibility,
          [columnId]: !state.columnVisibility[columnId],
        },
      });
    },
    [state.columnVisibility]
  );

  const getVisibleColumns = useCallback(() => {
    const orderedColumns = state.columnOrder
      .map((id) => columns.find((c) => c.id === id))
      .filter((c): c is ColumnDef<TData> => c !== undefined);

    return orderedColumns.filter(
      (col) => state.columnVisibility[col.id] !== false
    );
  }, [columns, state.columnOrder, state.columnVisibility]);

  // ============================================
  // COLUMN ORDER
  // ============================================

  const setColumnOrder = useCallback((order: string[]) => {
    dispatch({ type: "SET_COLUMN_ORDER", payload: order });
  }, []);

  const moveColumn = useCallback(
    (columnId: string, targetIndex: number) => {
      const currentIndex = state.columnOrder.indexOf(columnId);
      if (currentIndex === -1) return;

      const newOrder = [...state.columnOrder];
      newOrder.splice(currentIndex, 1);
      newOrder.splice(targetIndex, 0, columnId);

      dispatch({ type: "SET_COLUMN_ORDER", payload: newOrder });
    },
    [state.columnOrder]
  );

  // ============================================
  // COLUMN WIDTHS
  // ============================================

  const setColumnWidth = useCallback((columnId: string, width: number) => {
    dispatch({ type: "SET_COLUMN_WIDTH", payload: { columnId, width } });
  }, []);

  const resetColumnWidths = useCallback(() => {
    const defaultWidths = columns.reduce(
      (acc, col) => ({ ...acc, [col.id]: col.width || 150 }),
      {}
    );
    columns.forEach((col) => {
      dispatch({
        type: "SET_COLUMN_WIDTH",
        payload: { columnId: col.id, width: col.width || 150 },
      });
    });
  }, [columns]);

  // ============================================
  // GROUPING
  // ============================================

  const setGroupBy = useCallback((columnId: string | null) => {
    dispatch({
      type: "SET_GROUP_STATE",
      payload: { groupByColumnId: columnId },
    });
  }, []);

  const toggleGroup = useCallback(
    (groupKey: string) => {
      const newExpanded = new Set(state.groupState.expandedGroups);
      if (newExpanded.has(groupKey)) {
        newExpanded.delete(groupKey);
      } else {
        newExpanded.add(groupKey);
      }
      dispatch({
        type: "SET_GROUP_STATE",
        payload: { expandedGroups: newExpanded },
      });
    },
    [state.groupState.expandedGroups]
  );

  const expandAllGroups = useCallback(() => {
    // Will be computed based on processed data
    const allGroups = new Set<string>();
    dispatch({
      type: "SET_GROUP_STATE",
      payload: { expandedGroups: allGroups },
    });
  }, []);

  const collapseAllGroups = useCallback(() => {
    dispatch({
      type: "SET_GROUP_STATE",
      payload: { expandedGroups: new Set() },
    });
  }, []);

  // ============================================
  // PAGINATION
  // ============================================

  const setPageIndex = useCallback((pageIndex: number) => {
    dispatch({ type: "SET_PAGINATION", payload: { pageIndex } });
  }, []);

  const setPageSize = useCallback((pageSize: number) => {
    dispatch({ type: "SET_PAGINATION", payload: { pageSize, pageIndex: 0 } });
  }, []);

  const nextPage = useCallback(() => {
    const maxPage = Math.ceil(
      state.paginationState.totalRows / state.paginationState.pageSize
    ) - 1;
    if (state.paginationState.pageIndex < maxPage) {
      dispatch({
        type: "SET_PAGINATION",
        payload: { pageIndex: state.paginationState.pageIndex + 1 },
      });
    }
  }, [state.paginationState]);

  const previousPage = useCallback(() => {
    if (state.paginationState.pageIndex > 0) {
      dispatch({
        type: "SET_PAGINATION",
        payload: { pageIndex: state.paginationState.pageIndex - 1 },
      });
    }
  }, [state.paginationState.pageIndex]);

  const canNextPage =
    state.paginationState.pageIndex <
    Math.ceil(state.paginationState.totalRows / state.paginationState.pageSize) - 1;

  const canPreviousPage = state.paginationState.pageIndex > 0;

  // ============================================
  // EDITING
  // ============================================

  const startEditing = useCallback((rowId: string, columnId: string) => {
    const column = columns.find((c) => c.id === columnId);
    if (!column?.editable) return;

    dispatch({ type: "SET_EDITING_CELL", payload: { rowId, columnId } });
  }, [columns]);

  const stopEditing = useCallback(() => {
    dispatch({ type: "SET_EDITING_CELL", payload: null });
  }, []);

  const updateCell = useCallback(
    (rowId: string, columnId: string, value: unknown) => {
      // This should be handled by the parent component through onCellEdit callback
      stopEditing();
    },
    [stopEditing]
  );

  // ============================================
  // DATA PROCESSING
  // ============================================

  const processedData = useMemo(() => {
    let result = [...data];

    // Apply global filter
    if (state.globalFilter) {
      const searchLower = state.globalFilter.toLowerCase();
      result = result.filter((row) =>
        columns.some((col) => {
          const value = col.accessorFn
            ? col.accessorFn(row)
            : col.accessorKey
            ? getNestedValue(row, col.accessorKey as string)
            : null;
          return String(value).toLowerCase().includes(searchLower);
        })
      );
    }

    // Apply column filters
    if (state.filterState.length > 0) {
      result = result.filter((row) =>
        state.filterState.every((filter) => {
          const column = columns.find((c) => c.id === filter.columnId);
          if (!column) return true;

          const value = column.accessorFn
            ? column.accessorFn(row)
            : column.accessorKey
            ? getNestedValue(row, column.accessorKey as string)
            : null;

          return matchesFilter(value, filter);
        })
      );
    }

    // Apply sorting
    if (state.sortState.length > 0) {
      result.sort((a, b) => {
        for (const sort of state.sortState) {
          const column = columns.find((c) => c.id === sort.columnId);
          if (!column) continue;

          const aValue = column.accessorFn
            ? column.accessorFn(a)
            : column.accessorKey
            ? getNestedValue(a, column.accessorKey as string)
            : null;

          const bValue = column.accessorFn
            ? column.accessorFn(b)
            : column.accessorKey
            ? getNestedValue(b, column.accessorKey as string)
            : null;

          const comparison = compareValues(aValue, bValue, sort.direction);
          if (comparison !== 0) return comparison;
        }
        return 0;
      });
    }

    // Apply grouping
    if (state.groupState.groupByColumnId) {
      const column = columns.find(
        (c) => c.id === state.groupState.groupByColumnId
      );
      if (column) {
        const groups = new Map<string, TData[]>();

        result.forEach((row) => {
          const value = column.accessorFn
            ? column.accessorFn(row)
            : column.accessorKey
            ? getNestedValue(row, column.accessorKey as string)
            : null;
          const key = String(value ?? "null");

          if (!groups.has(key)) {
            groups.set(key, []);
          }
          groups.get(key)!.push(row);
        });

        const groupedResult: (TData | GroupedRow<TData>)[] = [];

        groups.forEach((rows, key) => {
          const isExpanded = state.groupState.expandedGroups.has(key);

          groupedResult.push({
            type: "group",
            groupKey: key,
            groupValue: key,
            count: rows.length,
            rows,
            aggregates: {},
            isExpanded,
          } as GroupedRow<TData>);

          if (isExpanded) {
            groupedResult.push(...rows);
          }
        });

        return groupedResult;
      }
    }

    // Apply pagination
    if (enablePagination) {
      const start = state.paginationState.pageIndex * state.paginationState.pageSize;
      const end = start + state.paginationState.pageSize;
      result = result.slice(start, end);
    }

    return result as (TData | GroupedRow<TData>)[];
  }, [
    data,
    columns,
    state.globalFilter,
    state.filterState,
    state.sortState,
    state.groupState,
    state.paginationState,
    enablePagination,
  ]);

  // ============================================
  // VIEWS
  // ============================================

  const saveView = useCallback(
    (name: string, type: ViewState["type"]): ViewState => {
      const view: ViewState = {
        id: `view_${Date.now()}`,
        name,
        type,
        config: {
          filters: state.filterState,
          sorting: state.sortState,
          grouping: state.groupState.groupByColumnId,
          columnVisibility: state.columnVisibility,
          columnOrder: state.columnOrder,
          columnWidths: state.columnWidths,
          density: state.density,
        },
      };
      dispatch({ type: "SET_CURRENT_VIEW", payload: view });
      return view;
    },
    [state]
  );

  const loadView = useCallback((view: ViewState) => {
    dispatch({ type: "LOAD_VIEW", payload: view });
  }, []);

  const deleteView = useCallback((viewId: string) => {
    if (state.currentView?.id === viewId) {
      dispatch({ type: "SET_CURRENT_VIEW", payload: null });
    }
  }, [state.currentView]);

  // ============================================
  // RETURN INSTANCE
  // ============================================

  return {
    // Data
    data,
    columns,
    getRowId: getRowIdRef.current,

    // State
    density: state.density,
    setDensity,

    // Sorting
    sortState: state.sortState,
    setSortState,
    toggleSort,
    clearSort,

    // Filtering
    filterState: state.filterState,
    setFilterState,
    addFilter,
    removeFilter,
    clearFilters,
    globalFilter: state.globalFilter,
    setGlobalFilter,

    // Selection
    selectionMode,
    selectionState: state.selectionState,
    selectRow,
    selectRange,
    selectAll,
    clearSelection,
    isRowSelected,
    getSelectedRows,

    // Focus
    focusRow,
    focusCell,
    moveFocus,

    // Column visibility
    columnVisibility: state.columnVisibility,
    setColumnVisibility,
    toggleColumn,
    getVisibleColumns,

    // Column order
    columnOrder: state.columnOrder,
    setColumnOrder,
    moveColumn,

    // Column widths
    columnWidths: state.columnWidths,
    setColumnWidth,
    resetColumnWidths,

    // Grouping
    groupState: state.groupState,
    setGroupBy,
    toggleGroup,
    expandAllGroups,
    collapseAllGroups,

    // Pagination
    paginationState: state.paginationState,
    setPageIndex,
    setPageSize,
    nextPage,
    previousPage,
    canNextPage,
    canPreviousPage,

    // Editing
    editingCell: state.editingCell,
    startEditing,
    stopEditing,
    updateCell,

    // Computed
    processedData,
    totalRowCount: state.paginationState.totalRows,
    selectedRowCount: state.selectionState.selectedRowIds.size,

    // Views
    currentView: state.currentView,
    saveView,
    loadView,
    deleteView,
  };
}
