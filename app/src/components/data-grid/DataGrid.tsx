/**
 * DataGrid Component
 * Professional-grade data grid with virtualization, sorting, filtering, and more
 */

"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  MouseEvent,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Loader2,
  Inbox,
  ChevronRight,
} from "lucide-react";
import type {
  ColumnDef,
  DataGridInstance,
  DataGridProps,
  DensityMode,
  GroupedRow,
} from "./types";
import { DataGridProvider } from "./DataGridContext";
import { useDataGrid } from "./useDataGrid";
import { useVirtualization } from "./useVirtualization";
import { getCellRenderer } from "./CellRenderers";

// ============================================
// DENSITY CONFIG
// ============================================

const densityConfig: Record<
  DensityMode,
  {
    rowHeight: number;
    fontSize: string;
    padding: string;
    headerHeight: number;
  }
> = {
  compact: {
    rowHeight: 36,
    fontSize: "text-xs",
    padding: "px-2 py-1",
    headerHeight: 32,
  },
  default: {
    rowHeight: 44,
    fontSize: "text-sm",
    padding: "px-3 py-2",
    headerHeight: 40,
  },
  comfort: {
    rowHeight: 56,
    fontSize: "text-sm",
    padding: "px-4 py-3",
    headerHeight: 48,
  },
};

// ============================================
// HEADER CELL
// ============================================

interface HeaderCellProps<TData> {
  column: ColumnDef<TData>;
  sortDirection: "asc" | "desc" | null;
  onSort: () => void;
  onResize: (delta: number) => void;
  width: number;
  density: DensityMode;
}

function HeaderCell<TData>({
  column,
  sortDirection,
  onSort,
  onResize,
  width,
  density,
}: HeaderCellProps<TData>) {
  const resizeRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const handleResizeStart = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      startXRef.current = e.clientX;
      startWidthRef.current = width;

      const handleMouseMove = (moveEvent: globalThis.MouseEvent) => {
        const delta = moveEvent.clientX - startXRef.current;
        onResize(delta);
      };

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
    },
    [width, onResize]
  );

  const config = densityConfig[density];
  const align = column.align ?? (column.type === "number" || column.type === "currency" ? "right" : "left");

  return (
    <div
      role="columnheader"
      aria-sort={sortDirection ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
      className={`
        relative flex items-center gap-1
        ${config.padding}
        bg-background-secondary
        border-b border-white/5
        font-medium text-gray-400
        ${config.fontSize}
        ${align === "right" ? "justify-end" : align === "center" ? "justify-center" : "justify-start"}
        select-none
      `}
      style={{
        width,
        minWidth: column.minWidth ?? 50,
        maxWidth: column.maxWidth,
        flexShrink: 0,
        height: config.headerHeight,
      }}
    >
      {column.sortable ? (
        <button
          type="button"
          onClick={onSort}
          className={`
            flex items-center gap-1 hover:text-foreground transition-colors
            ${align === "right" ? "flex-row-reverse" : ""}
          `}
        >
          <span className="truncate">{column.header}</span>
          <span className="w-4 h-4 flex items-center justify-center">
            {sortDirection === "asc" ? (
              <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
            ) : sortDirection === "desc" ? (
              <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
            ) : (
              <ChevronsUpDown className="w-3.5 h-3.5 opacity-0 group-hover:opacity-50" />
            )}
          </span>
        </button>
      ) : (
        <span className="truncate">{column.header}</span>
      )}

      {column.resizable !== false && (
        <div
          ref={resizeRef}
          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-cyan-500/50 transition-colors"
          onMouseDown={handleResizeStart}
        />
      )}
    </div>
  );
}

// ============================================
// DATA CELL
// ============================================

interface DataCellProps<TData> {
  column: ColumnDef<TData>;
  row: TData;
  rowIndex: number;
  value: unknown;
  width: number;
  density: DensityMode;
  isSelected: boolean;
  isFocused: boolean;
  isEditing: boolean;
  table: DataGridInstance<TData>;
}

function DataCell<TData>({
  column,
  row,
  rowIndex,
  value,
  width,
  density,
  isSelected,
  isFocused,
  isEditing,
  table,
}: DataCellProps<TData>) {
  const config = densityConfig[density];
  const align = column.align ?? (column.type === "number" || column.type === "currency" ? "right" : "left");

  const cellContent = useMemo(() => {
    if (column.cell) {
      return column.cell({
        value,
        row,
        rowIndex,
        column,
        isSelected,
        isFocused,
        isEditing,
        table,
      });
    }

    if (column.format) {
      const formatted = column.format(value, row);
      if (typeof formatted === "string") {
        return <span className="truncate">{formatted}</span>;
      }
      return formatted;
    }

    const renderer = getCellRenderer<TData>(column.type);
    return renderer({
      value,
      row,
      rowIndex,
      column,
      isSelected,
      isFocused,
      isEditing,
      table,
    });
  }, [column, row, rowIndex, value, isSelected, isFocused, isEditing, table]);

  return (
    <div
      role="gridcell"
      className={`
        ${config.padding}
        ${config.fontSize}
        ${align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left"}
        ${isFocused ? "ring-2 ring-inset ring-cyan-500/50" : ""}
        overflow-hidden
        transition-colors
      `}
      style={{
        width,
        minWidth: column.minWidth ?? 50,
        maxWidth: column.maxWidth,
        flexShrink: 0,
      }}
    >
      {cellContent}
    </div>
  );
}

// ============================================
// ROW COMPONENT
// ============================================

interface RowProps<TData> {
  row: TData;
  rowIndex: number;
  rowId: string;
  columns: ColumnDef<TData>[];
  columnWidths: Record<string, number>;
  density: DensityMode;
  isSelected: boolean;
  isFocused: boolean;
  isEven: boolean;
  striped: boolean;
  table: DataGridInstance<TData>;
  onRowClick?: (row: TData, rowIndex: number) => void;
  onRowDoubleClick?: (row: TData, rowIndex: number) => void;
  onContextMenu?: (e: MouseEvent<HTMLDivElement>, row: TData, rowIndex: number) => void;
  style?: React.CSSProperties;
}

function Row<TData>({
  row,
  rowIndex,
  rowId,
  columns,
  columnWidths,
  density,
  isSelected,
  isFocused,
  isEven,
  striped,
  table,
  onRowClick,
  onRowDoubleClick,
  onContextMenu,
  style,
}: RowProps<TData>) {
  const config = densityConfig[density];

  const handleClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (e.shiftKey && table.selectionState.anchorRowId) {
        table.selectRange(table.selectionState.anchorRowId, rowId);
      } else if (e.ctrlKey || e.metaKey) {
        table.selectRow(rowId, true);
      } else {
        table.selectRow(rowId, false);
        onRowClick?.(row, rowIndex);
      }
      table.focusRow(rowId);
    },
    [row, rowIndex, rowId, table, onRowClick]
  );

  const handleDoubleClick = useCallback(() => {
    onRowDoubleClick?.(row, rowIndex);
  }, [row, rowIndex, onRowDoubleClick]);

  const handleContextMenuEvent = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      onContextMenu?.(e, row, rowIndex);
    },
    [row, rowIndex, onContextMenu]
  );

  const getNestedValue = (obj: unknown, path: string): unknown => {
    return path.split(".").reduce((acc, part) => {
      if (acc === null || acc === undefined) return undefined;
      return (acc as Record<string, unknown>)[part];
    }, obj);
  };

  return (
    <div
      role="row"
      aria-selected={isSelected}
      aria-rowindex={rowIndex + 1}
      className={`
        flex items-center
        border-b border-white/5
        cursor-pointer
        transition-colors duration-75
        ${isSelected ? "bg-cyan-500/10" : striped && isEven ? "bg-white/[0.02]" : "bg-transparent"}
        ${isFocused ? "bg-cyan-500/5" : ""}
        hover:bg-white/5
      `}
      style={{
        height: config.rowHeight,
        ...style,
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenuEvent}
    >
      {columns.map((column) => {
        const value = column.accessorFn
          ? column.accessorFn(row)
          : column.accessorKey
          ? getNestedValue(row, column.accessorKey as string)
          : null;

        return (
          <DataCell
            key={column.id}
            column={column}
            row={row}
            rowIndex={rowIndex}
            value={value}
            width={columnWidths[column.id] ?? column.width ?? 150}
            density={density}
            isSelected={isSelected}
            isFocused={isFocused && table.selectionState.focusedColumnId === column.id}
            isEditing={
              table.editingCell?.rowId === rowId &&
              table.editingCell?.columnId === column.id
            }
            table={table}
          />
        );
      })}
    </div>
  );
}

// ============================================
// GROUP ROW
// ============================================

interface GroupRowProps<TData> {
  group: GroupedRow<TData>;
  density: DensityMode;
  onToggle: () => void;
  totalWidth: number;
  style?: React.CSSProperties;
}

function GroupRow<TData>({
  group,
  density,
  onToggle,
  totalWidth,
  style,
}: GroupRowProps<TData>) {
  const config = densityConfig[density];

  return (
    <div
      role="row"
      aria-expanded={group.isExpanded}
      className={`
        flex items-center
        bg-background-tertiary
        border-b border-white/5
        cursor-pointer
        hover:bg-white/5
        transition-colors
      `}
      style={{
        height: config.rowHeight,
        width: totalWidth,
        ...style,
      }}
      onClick={onToggle}
    >
      <div className={`flex items-center gap-2 ${config.padding} ${config.fontSize}`}>
        <motion.span
          animate={{ rotate: group.isExpanded ? 90 : 0 }}
          transition={{ duration: 0.15 }}
        >
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </motion.span>
        <span className="font-medium text-foreground">{String(group.groupValue)}</span>
        <span className="text-gray-500">({group.count})</span>
      </div>
    </div>
  );
}

// ============================================
// EMPTY STATE
// ============================================

interface EmptyStateProps {
  children?: React.ReactNode;
}

function EmptyState({ children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-500">
      {children ?? (
        <>
          <Inbox className="w-12 h-12 mb-4 opacity-50" />
          <p className="text-sm">No data to display</p>
        </>
      )}
    </div>
  );
}

// ============================================
// LOADING STATE
// ============================================

interface LoadingStateProps {
  children?: React.ReactNode;
}

function LoadingState({ children }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-500">
      {children ?? (
        <>
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-cyan-400" />
          <p className="text-sm">Loading...</p>
        </>
      )}
    </div>
  );
}

// ============================================
// SELECTION CHECKBOX
// ============================================

interface SelectionCheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  density: DensityMode;
}

function SelectionCheckbox({
  checked,
  indeterminate,
  onChange,
  density,
}: SelectionCheckboxProps) {
  const config = densityConfig[density];

  return (
    <div
      className={`
        flex items-center justify-center
        ${config.padding}
      `}
      style={{ width: 40, flexShrink: 0 }}
    >
      <motion.button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onChange();
        }}
        className={`
          w-4 h-4 rounded border-2 flex items-center justify-center
          transition-colors
          ${
            checked || indeterminate
              ? "bg-cyan-500 border-cyan-500"
              : "border-gray-500 hover:border-gray-400"
          }
        `}
        whileTap={{ scale: 0.9 }}
      >
        <AnimatePresence mode="wait">
          {checked && (
            <motion.svg
              key="check"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="w-3 h-3 text-white"
              viewBox="0 0 12 12"
            >
              <path
                d="M2 6l3 3 5-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </motion.svg>
          )}
          {indeterminate && !checked && (
            <motion.div
              key="indeterminate"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="w-2 h-0.5 bg-white rounded-full"
            />
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}

// ============================================
// MAIN DATAGRID COMPONENT
// ============================================

function DataGridInner<TData>(
  props: DataGridProps<TData>,
  ref: React.Ref<DataGridInstance<TData>>
) {
  const {
    data,
    columns,
    getRowId = (row, index) => String(index),
    enableSelection = false,
    selectionMode = enableSelection ? "multiple" : "none",
    enableVirtualization = true,
    enableKeyboardNavigation = true,
    density: defaultDensity = "default",
    striped = false,
    stickyHeader = true,
    maxHeight = "100%",
    isLoading = false,
    emptyState,
    loadingState,
    onRowClick,
    onRowDoubleClick,
    onSelectionChange,
    className = "",
  } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Create data grid instance
  const table = useDataGrid<TData>({
    ...props,
    getRowId,
    selectionMode,
    density: defaultDensity,
  });

  // Expose instance via ref
  useImperativeHandle(ref, () => table, [table]);

  // Get visible columns
  const visibleColumns = table.getVisibleColumns();

  // Calculate total width
  const totalWidth = useMemo(() => {
    const selectionWidth = selectionMode !== "none" ? 40 : 0;
    const columnsWidth = visibleColumns.reduce(
      (sum, col) => sum + (table.columnWidths[col.id] ?? col.width ?? 150),
      0
    );
    return selectionWidth + columnsWidth;
  }, [visibleColumns, table.columnWidths, selectionMode]);

  // Virtualization
  const {
    virtualItems,
    totalSize,
    scrollToIndex,
  } = useVirtualization({
    count: table.processedData.length,
    getItemSize: () => densityConfig[table.density].rowHeight,
    overscan: 5,
    getScrollElement: () => scrollRef.current,
    enabled: enableVirtualization && table.processedData.length > 50,
  });

  // Keyboard navigation
  useEffect(() => {
    if (!enableKeyboardNavigation) return;

    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      if (!containerRef.current?.contains(target)) return;

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          table.moveFocus("up");
          break;
        case "ArrowDown":
          e.preventDefault();
          table.moveFocus("down");
          break;
        case "ArrowLeft":
          e.preventDefault();
          table.moveFocus("left");
          break;
        case "ArrowRight":
          e.preventDefault();
          table.moveFocus("right");
          break;
        case " ":
          e.preventDefault();
          if (table.selectionState.focusedRowId) {
            table.selectRow(table.selectionState.focusedRowId, true);
          }
          break;
        case "Enter":
          if (table.selectionState.focusedRowId) {
            const row = data.find(
              (r, i) => getRowId(r, i) === table.selectionState.focusedRowId
            );
            if (row) {
              onRowDoubleClick?.(row, data.indexOf(row));
            }
          }
          break;
        case "a":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            table.selectAll();
          }
          break;
        case "Escape":
          table.clearSelection();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [enableKeyboardNavigation, table, data, getRowId, onRowDoubleClick]);

  // Selection change callback
  useEffect(() => {
    if (onSelectionChange) {
      const selectedIds = Array.from(table.selectionState.selectedRowIds);
      const selectedRows = table.getSelectedRows();
      onSelectionChange(selectedIds, selectedRows);
    }
  }, [table.selectionState.selectedRowIds, onSelectionChange, table]);

  // Scroll focused row into view
  useEffect(() => {
    if (table.selectionState.focusedRowId && enableVirtualization) {
      const index = table.processedData.findIndex((item, i) => {
        if ((item as GroupedRow<TData>).type === "group") return false;
        return getRowId(item as TData, i) === table.selectionState.focusedRowId;
      });
      if (index !== -1) {
        scrollToIndex(index, { align: "center" });
      }
    }
  }, [table.selectionState.focusedRowId, enableVirtualization, scrollToIndex, table.processedData, getRowId]);

  // Handle column resize
  const handleColumnResize = useCallback(
    (columnId: string, delta: number) => {
      const currentWidth = table.columnWidths[columnId] ?? 150;
      const column = columns.find((c) => c.id === columnId);
      const minWidth = column?.minWidth ?? 50;
      const maxWidth = column?.maxWidth ?? Infinity;
      const newWidth = Math.min(maxWidth, Math.max(minWidth, currentWidth + delta));
      table.setColumnWidth(columnId, newWidth);
    },
    [table, columns]
  );

  // Check for indeterminate selection
  const isAllSelected =
    table.selectionState.selectedRowIds.size > 0 &&
    table.selectionState.selectedRowIds.size === data.length;
  const isIndeterminate =
    table.selectionState.selectedRowIds.size > 0 && !isAllSelected;

  return (
    <DataGridProvider instance={table}>
      <div
        ref={containerRef}
        role="grid"
        aria-rowcount={data.length}
        aria-colcount={visibleColumns.length + (selectionMode !== "none" ? 1 : 0)}
        tabIndex={0}
        className={`
          relative flex flex-col
          bg-background
          border border-white/10 rounded-lg
          overflow-hidden
          focus:outline-none focus:ring-2 focus:ring-cyan-500/30
          ${className}
        `}
        style={{ maxHeight }}
      >
        {/* Header */}
        <div
          className={`
            flex
            ${stickyHeader ? "sticky top-0 z-10" : ""}
          `}
          style={{ minWidth: totalWidth }}
        >
          {selectionMode !== "none" && (
            <SelectionCheckbox
              checked={isAllSelected}
              indeterminate={isIndeterminate}
              onChange={() => {
                if (isAllSelected) {
                  table.clearSelection();
                } else {
                  table.selectAll();
                }
              }}
              density={table.density}
            />
          )}
          {visibleColumns.map((column) => {
            const sortState = table.sortState.find(
              (s) => s.columnId === column.id
            );
            return (
              <HeaderCell
                key={column.id}
                column={column}
                sortDirection={sortState?.direction ?? null}
                onSort={() => table.toggleSort(column.id)}
                onResize={(delta) => handleColumnResize(column.id, delta)}
                width={table.columnWidths[column.id] ?? column.width ?? 150}
                density={table.density}
              />
            );
          })}
        </div>

        {/* Body */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-auto"
          style={{ minWidth: totalWidth }}
        >
          {isLoading ? (
            <LoadingState>{loadingState}</LoadingState>
          ) : data.length === 0 ? (
            <EmptyState>{emptyState}</EmptyState>
          ) : enableVirtualization && table.processedData.length > 50 ? (
            /* Virtualized rows */
            <div
              style={{
                height: totalSize,
                position: "relative",
              }}
            >
              {virtualItems.map((virtualRow) => {
                const item = table.processedData[virtualRow.index];
                const isGroup = (item as GroupedRow<TData>).type === "group";

                if (isGroup) {
                  const group = item as GroupedRow<TData>;
                  return (
                    <GroupRow
                      key={`group-${group.groupKey}`}
                      group={group}
                      density={table.density}
                      onToggle={() => table.toggleGroup(group.groupKey)}
                      totalWidth={totalWidth}
                      style={{
                        position: "absolute",
                        top: virtualRow.start,
                        left: 0,
                        right: 0,
                      }}
                    />
                  );
                }

                const row = item as TData;
                const rowId = getRowId(row, virtualRow.index);

                return (
                  <div
                    key={rowId}
                    style={{
                      position: "absolute",
                      top: virtualRow.start,
                      left: 0,
                      right: 0,
                      display: "flex",
                    }}
                  >
                    {selectionMode !== "none" && (
                      <SelectionCheckbox
                        checked={table.isRowSelected(rowId)}
                        onChange={() => table.selectRow(rowId, true)}
                        density={table.density}
                      />
                    )}
                    <Row
                      row={row}
                      rowIndex={virtualRow.index}
                      rowId={rowId}
                      columns={visibleColumns}
                      columnWidths={table.columnWidths}
                      density={table.density}
                      isSelected={table.isRowSelected(rowId)}
                      isFocused={table.selectionState.focusedRowId === rowId}
                      isEven={virtualRow.index % 2 === 0}
                      striped={striped}
                      table={table}
                      onRowClick={onRowClick}
                      onRowDoubleClick={onRowDoubleClick}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            /* Non-virtualized rows */
            <div>
              {table.processedData.map((item, index) => {
                const isGroup = (item as GroupedRow<TData>).type === "group";

                if (isGroup) {
                  const group = item as GroupedRow<TData>;
                  return (
                    <GroupRow
                      key={`group-${group.groupKey}`}
                      group={group}
                      density={table.density}
                      onToggle={() => table.toggleGroup(group.groupKey)}
                      totalWidth={totalWidth}
                    />
                  );
                }

                const row = item as TData;
                const rowId = getRowId(row, index);

                return (
                  <div key={rowId} className="flex">
                    {selectionMode !== "none" && (
                      <SelectionCheckbox
                        checked={table.isRowSelected(rowId)}
                        onChange={() => table.selectRow(rowId, true)}
                        density={table.density}
                      />
                    )}
                    <Row
                      row={row}
                      rowIndex={index}
                      rowId={rowId}
                      columns={visibleColumns}
                      columnWidths={table.columnWidths}
                      density={table.density}
                      isSelected={table.isRowSelected(rowId)}
                      isFocused={table.selectionState.focusedRowId === rowId}
                      isEven={index % 2 === 0}
                      striped={striped}
                      table={table}
                      onRowClick={onRowClick}
                      onRowDoubleClick={onRowDoubleClick}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DataGridProvider>
  );
}

// ============================================
// EXPORT
// ============================================

export const DataGrid = forwardRef(DataGridInner) as <TData>(
  props: DataGridProps<TData> & { ref?: React.Ref<DataGridInstance<TData>> }
) => React.ReactElement;
