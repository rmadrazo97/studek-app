/**
 * DataGrid Toolbar
 * Search, filters, density controls, and view management
 */

"use client";

import {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
  ReactNode,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  X,
  Columns,
  LayoutGrid,
  AlignJustify,
  List,
  Check,
  Eye,
  EyeOff,
} from "lucide-react";
import type {
  ColumnDef,
  ColumnFilter,
  DataGridInstance,
  DensityMode,
  FilterOperator,
} from "./types";
import { useDataGridContext } from "./DataGridContext";

// ============================================
// TYPES
// ============================================

interface DataGridToolbarProps<TData> {
  instance?: DataGridInstance<TData>;
  showSearch?: boolean;
  showFilters?: boolean;
  showDensity?: boolean;
  showColumnToggle?: boolean;
  showViewManagement?: boolean;
  actions?: ReactNode;
  className?: string;
}

// ============================================
// SEARCH INPUT
// ============================================

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = useCallback(
    (newValue: string) => {
      setLocalValue(newValue);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        onChange(newValue);
      }, 300);
    },
    [onChange]
  );

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
      <input
        type="text"
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="
          w-64 pl-9 pr-8 py-2
          bg-background-secondary
          border border-white/10
          rounded-lg
          text-sm text-foreground
          placeholder:text-gray-500
          focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50
          transition-all
        "
      />
      {localValue && (
        <button
          type="button"
          onClick={() => handleChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded"
        >
          <X className="w-3 h-3 text-gray-500" />
        </button>
      )}
    </div>
  );
}

// ============================================
// FILTER CHIP
// ============================================

interface FilterChipProps {
  filter: ColumnFilter;
  column: ColumnDef<unknown> | undefined;
  onEdit: () => void;
  onRemove: () => void;
}

const operatorLabels: Record<FilterOperator, string> = {
  is: "is",
  is_not: "is not",
  is_any_of: "is any of",
  contains: "contains",
  not_contains: "doesn't contain",
  starts_with: "starts with",
  ends_with: "ends with",
  before: "before",
  after: "after",
  between: "between",
  is_empty: "is empty",
  is_not_empty: "is not empty",
  gt: ">",
  gte: ">=",
  lt: "<",
  lte: "<=",
  eq: "=",
  neq: "!=",
};

function FilterChip({ filter, column, onRemove }: FilterChipProps) {
  const displayValue = useMemo(() => {
    if (filter.operator === "is_empty" || filter.operator === "is_not_empty") {
      return "";
    }

    if (Array.isArray(filter.value)) {
      if (column?.options) {
        return filter.value
          .map((v) => column.options?.find((o) => o.value === v)?.label ?? v)
          .join(", ");
      }
      return filter.value.join(", ");
    }

    if (column?.options) {
      const option = column.options.find((o) => o.value === filter.value);
      return option?.label ?? String(filter.value);
    }

    return String(filter.value ?? "");
  }, [filter, column]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="
        inline-flex items-center gap-1.5
        pl-2.5 pr-1.5 py-1
        bg-cyan-500/10 border border-cyan-500/20
        rounded-full
        text-xs text-cyan-400
      "
    >
      <span className="font-medium">{column?.header ?? filter.columnId}</span>
      <span className="text-cyan-300/60">{operatorLabels[filter.operator]}</span>
      {displayValue && <span className="text-cyan-200">{displayValue}</span>}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="p-0.5 hover:bg-cyan-500/20 rounded-full transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
    </motion.div>
  );
}

// ============================================
// FILTER MENU
// ============================================

interface FilterMenuProps<TData> {
  columns: ColumnDef<TData>[];
  onAddFilter: (filter: ColumnFilter) => void;
  onClose: () => void;
}

function FilterMenu<TData>({
  columns,
  onAddFilter,
  onClose,
}: FilterMenuProps<TData>) {
  const [selectedColumn, setSelectedColumn] = useState<ColumnDef<TData> | null>(null);
  const [operator, setOperator] = useState<FilterOperator>("is");
  const [value, setValue] = useState<unknown>("");
  const [searchQuery, setSearchQuery] = useState("");

  const filterableColumns = useMemo(
    () => columns.filter((col) => col.filterable !== false),
    [columns]
  );

  const filteredColumns = useMemo(() => {
    if (!searchQuery) return filterableColumns;
    return filterableColumns.filter((col) =>
      String(col.header).toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [filterableColumns, searchQuery]);

  const availableOperators = useMemo((): FilterOperator[] => {
    if (!selectedColumn) return [];

    switch (selectedColumn.type) {
      case "text":
        return ["contains", "not_contains", "is", "is_not", "starts_with", "ends_with", "is_empty", "is_not_empty"];
      case "number":
      case "currency":
        return ["eq", "neq", "gt", "gte", "lt", "lte", "is_empty", "is_not_empty"];
      case "date":
      case "datetime":
        return ["is", "is_not", "before", "after", "between", "is_empty", "is_not_empty"];
      case "boolean":
        return ["is"];
      case "enum":
      case "badge":
        return ["is", "is_not", "is_any_of"];
      default:
        return ["is", "is_not", "contains"];
    }
  }, [selectedColumn]);

  const handleApply = useCallback(() => {
    if (!selectedColumn) return;

    onAddFilter({
      columnId: selectedColumn.id,
      operator,
      value,
    });
    onClose();
  }, [selectedColumn, operator, value, onAddFilter, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="
        absolute top-full left-0 mt-2
        w-80 p-3
        bg-background-secondary
        border border-white/10
        rounded-lg shadow-xl
        z-50
      "
      onClick={(e) => e.stopPropagation()}
    >
      {!selectedColumn ? (
        <>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search columns..."
            className="
              w-full px-3 py-2 mb-2
              bg-background
              border border-white/10
              rounded-md
              text-sm text-foreground
              placeholder:text-gray-500
              focus:outline-none focus:ring-2 focus:ring-cyan-500/30
            "
            autoFocus
          />
          <div className="max-h-60 overflow-y-auto">
            {filteredColumns.map((column) => (
              <button
                key={column.id}
                type="button"
                onClick={() => setSelectedColumn(column)}
                className="
                  w-full px-3 py-2 text-left
                  text-sm text-foreground
                  hover:bg-white/5
                  rounded-md
                  transition-colors
                "
              >
                {column.header}
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              {selectedColumn.header}
            </span>
            <button
              type="button"
              onClick={() => setSelectedColumn(null)}
              className="text-xs text-gray-400 hover:text-foreground"
            >
              Change
            </button>
          </div>

          <select
            value={operator}
            onChange={(e) => setOperator(e.target.value as FilterOperator)}
            className="
              w-full px-3 py-2
              bg-background
              border border-white/10
              rounded-md
              text-sm text-foreground
              focus:outline-none focus:ring-2 focus:ring-cyan-500/30
            "
          >
            {availableOperators.map((op) => (
              <option key={op} value={op}>
                {operatorLabels[op]}
              </option>
            ))}
          </select>

          {operator !== "is_empty" && operator !== "is_not_empty" && (
            <>
              {selectedColumn.type === "enum" ||
              selectedColumn.type === "badge" ? (
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {selectedColumn.options?.map((option) => {
                    const isSelected = operator === "is_any_of"
                      ? (value as string[])?.includes(option.value)
                      : value === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          if (operator === "is_any_of") {
                            const current = (value as string[]) || [];
                            if (isSelected) {
                              setValue(current.filter((v) => v !== option.value));
                            } else {
                              setValue([...current, option.value]);
                            }
                          } else {
                            setValue(option.value);
                          }
                        }}
                        className={`
                          w-full px-3 py-2 flex items-center gap-2
                          text-sm text-foreground
                          rounded-md
                          transition-colors
                          ${isSelected ? "bg-cyan-500/20" : "hover:bg-white/5"}
                        `}
                      >
                        {operator === "is_any_of" && (
                          <div
                            className={`
                              w-4 h-4 rounded border flex items-center justify-center
                              ${isSelected ? "bg-cyan-500 border-cyan-500" : "border-gray-500"}
                            `}
                          >
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                        )}
                        {option.icon}
                        <span>{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              ) : selectedColumn.type === "boolean" ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setValue(true)}
                    className={`
                      flex-1 px-3 py-2 rounded-md text-sm
                      transition-colors
                      ${value === true ? "bg-cyan-500/20 text-cyan-400" : "bg-background hover:bg-white/5"}
                    `}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setValue(false)}
                    className={`
                      flex-1 px-3 py-2 rounded-md text-sm
                      transition-colors
                      ${value === false ? "bg-cyan-500/20 text-cyan-400" : "bg-background hover:bg-white/5"}
                    `}
                  >
                    No
                  </button>
                </div>
              ) : selectedColumn.type === "date" ||
                selectedColumn.type === "datetime" ? (
                <input
                  type="date"
                  value={value as string}
                  onChange={(e) => setValue(e.target.value)}
                  className="
                    w-full px-3 py-2
                    bg-background
                    border border-white/10
                    rounded-md
                    text-sm text-foreground
                    focus:outline-none focus:ring-2 focus:ring-cyan-500/30
                  "
                />
              ) : selectedColumn.type === "number" ||
                selectedColumn.type === "currency" ? (
                <input
                  type="number"
                  value={value as number}
                  onChange={(e) => setValue(parseFloat(e.target.value))}
                  className="
                    w-full px-3 py-2
                    bg-background
                    border border-white/10
                    rounded-md
                    text-sm text-foreground
                    focus:outline-none focus:ring-2 focus:ring-cyan-500/30
                  "
                />
              ) : (
                <input
                  type="text"
                  value={value as string}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="Enter value..."
                  className="
                    w-full px-3 py-2
                    bg-background
                    border border-white/10
                    rounded-md
                    text-sm text-foreground
                    placeholder:text-gray-500
                    focus:outline-none focus:ring-2 focus:ring-cyan-500/30
                  "
                />
              )}
            </>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="
                flex-1 px-3 py-2
                bg-background
                border border-white/10
                rounded-md
                text-sm text-gray-400
                hover:text-foreground hover:bg-white/5
                transition-colors
              "
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="
                flex-1 px-3 py-2
                bg-cyan-500
                rounded-md
                text-sm text-white font-medium
                hover:bg-cyan-400
                transition-colors
              "
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ============================================
// DENSITY SELECTOR
// ============================================

interface DensitySelectorProps {
  value: DensityMode;
  onChange: (density: DensityMode) => void;
}

function DensitySelector({ value, onChange }: DensitySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const densityIcons: Record<DensityMode, ReactNode> = {
    compact: <List className="w-4 h-4" />,
    default: <AlignJustify className="w-4 h-4" />,
    comfort: <LayoutGrid className="w-4 h-4" />,
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="
          p-2
          bg-background-secondary
          border border-white/10
          rounded-lg
          text-gray-400 hover:text-foreground
          transition-colors
        "
        title="Row density"
      >
        {densityIcons[value]}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="
                absolute top-full right-0 mt-2
                p-1
                bg-background-secondary
                border border-white/10
                rounded-lg shadow-xl
                z-50
              "
            >
              {(["compact", "default", "comfort"] as DensityMode[]).map(
                (density) => (
                  <button
                    key={density}
                    type="button"
                    onClick={() => {
                      onChange(density);
                      setIsOpen(false);
                    }}
                    className={`
                      w-full px-3 py-2 flex items-center gap-2
                      text-sm capitalize
                      rounded-md
                      transition-colors
                      ${value === density
                        ? "bg-cyan-500/20 text-cyan-400"
                        : "text-foreground hover:bg-white/5"
                      }
                    `}
                  >
                    {densityIcons[density]}
                    {density}
                    {value === density && <Check className="w-4 h-4 ml-auto" />}
                  </button>
                )
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// COLUMN TOGGLE
// ============================================

interface ColumnToggleProps<TData> {
  columns: ColumnDef<TData>[];
  visibility: Record<string, boolean>;
  onToggle: (columnId: string) => void;
}

function ColumnToggle<TData>({
  columns,
  visibility,
  onToggle,
}: ColumnToggleProps<TData>) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleableColumns = columns.filter((col) => col.hideable !== false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="
          p-2
          bg-background-secondary
          border border-white/10
          rounded-lg
          text-gray-400 hover:text-foreground
          transition-colors
        "
        title="Toggle columns"
      >
        <Columns className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="
                absolute top-full right-0 mt-2
                w-56 p-2
                bg-background-secondary
                border border-white/10
                rounded-lg shadow-xl
                z-50
                max-h-80 overflow-y-auto
              "
            >
              <div className="px-2 py-1 text-xs text-gray-500 uppercase tracking-wider">
                Toggle Columns
              </div>
              {toggleableColumns.map((column) => {
                const isVisible = visibility[column.id] !== false;

                return (
                  <button
                    key={column.id}
                    type="button"
                    onClick={() => onToggle(column.id)}
                    className="
                      w-full px-2 py-2 flex items-center gap-2
                      text-sm text-foreground
                      rounded-md
                      hover:bg-white/5
                      transition-colors
                    "
                  >
                    {isVisible ? (
                      <Eye className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-gray-500" />
                    )}
                    <span className={isVisible ? "" : "text-gray-500"}>
                      {column.header}
                    </span>
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// MAIN TOOLBAR
// ============================================

export function DataGridToolbar<TData>({
  instance: externalInstance,
  showSearch = true,
  showFilters = true,
  showDensity = true,
  showColumnToggle = true,
  actions,
  className = "",
}: DataGridToolbarProps<TData>) {
  const contextInstance = useDataGridContext<TData>();
  const instance = externalInstance ?? contextInstance;

  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

  return (
    <div
      className={`
        flex items-center gap-3 p-3
        bg-background-secondary/50
        border-b border-white/5
        ${className}
      `}
    >
      {/* Search */}
      {showSearch && (
        <SearchInput
          value={instance.globalFilter}
          onChange={instance.setGlobalFilter}
          placeholder="Search..."
        />
      )}

      {/* Filters */}
      {showFilters && (
        <div className="flex items-center gap-2 flex-1">
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
              className="
                flex items-center gap-2 px-3 py-2
                bg-background-secondary
                border border-white/10
                rounded-lg
                text-sm text-gray-400 hover:text-foreground
                transition-colors
              "
            >
              <Filter className="w-4 h-4" />
              <span>Filter</span>
              {instance.filterState.length > 0 && (
                <span className="
                  w-5 h-5 flex items-center justify-center
                  bg-cyan-500 rounded-full
                  text-xs text-white font-medium
                ">
                  {instance.filterState.length}
                </span>
              )}
            </button>

            <AnimatePresence>
              {isFilterMenuOpen && (
                <FilterMenu
                  columns={instance.columns}
                  onAddFilter={instance.addFilter}
                  onClose={() => setIsFilterMenuOpen(false)}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Active Filters */}
          <AnimatePresence mode="popLayout">
            {instance.filterState.map((filter) => (
              <FilterChip
                key={filter.columnId}
                filter={filter}
                column={instance.columns.find((c) => c.id === filter.columnId)}
                onEdit={() => {
                  // TODO: Open edit modal
                }}
                onRemove={() => instance.removeFilter(filter.columnId)}
              />
            ))}
          </AnimatePresence>

          {instance.filterState.length > 0 && (
            <button
              type="button"
              onClick={instance.clearFilters}
              className="
                px-2 py-1
                text-xs text-gray-500 hover:text-foreground
                transition-colors
              "
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Spacer */}
      {!showFilters && <div className="flex-1" />}

      {/* Actions */}
      {actions}

      {/* Column Toggle */}
      {showColumnToggle && (
        <ColumnToggle
          columns={instance.columns}
          visibility={instance.columnVisibility}
          onToggle={instance.toggleColumn}
        />
      )}

      {/* Density */}
      {showDensity && (
        <DensitySelector
          value={instance.density}
          onChange={instance.setDensity}
        />
      )}
    </div>
  );
}
