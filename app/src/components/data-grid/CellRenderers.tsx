/**
 * Cell Renderers
 * Pre-built cell renderers for common data types
 */

"use client";

import { ReactNode, memo } from "react";
import { motion } from "framer-motion";
import {
  Check,
  X,
  Circle,
  Clock,
  Calendar,
  User,
  MoreHorizontal,
} from "lucide-react";
import type { CellContext, EnumOption } from "./types";

// ============================================
// TEXT CELL
// ============================================

interface TextCellProps {
  value: unknown;
  truncate?: boolean;
  className?: string;
}

export const TextCell = memo(function TextCell({
  value,
  truncate = true,
  className = "",
}: TextCellProps) {
  const displayValue = value === null || value === undefined ? "—" : String(value);

  return (
    <span
      className={`
        text-foreground
        ${truncate ? "truncate block" : ""}
        ${className}
      `}
      title={truncate ? displayValue : undefined}
    >
      {displayValue}
    </span>
  );
});

// ============================================
// NUMBER CELL
// ============================================

interface NumberCellProps {
  value: unknown;
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  className?: string;
}

export const NumberCell = memo(function NumberCell({
  value,
  locale = "en-US",
  minimumFractionDigits = 0,
  maximumFractionDigits = 2,
  className = "",
}: NumberCellProps) {
  if (value === null || value === undefined) {
    return <span className="text-gray-500">—</span>;
  }

  const numValue = Number(value);
  if (isNaN(numValue)) {
    return <span className="text-gray-500">—</span>;
  }

  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(numValue);

  return (
    <span
      className={`
        text-foreground font-mono text-right tabular-nums
        ${className}
      `}
    >
      {formatted}
    </span>
  );
});

// ============================================
// CURRENCY CELL
// ============================================

interface CurrencyCellProps {
  value: unknown;
  currency?: string;
  locale?: string;
  className?: string;
}

export const CurrencyCell = memo(function CurrencyCell({
  value,
  currency = "USD",
  locale = "en-US",
  className = "",
}: CurrencyCellProps) {
  if (value === null || value === undefined) {
    return <span className="text-gray-500">—</span>;
  }

  const numValue = Number(value);
  if (isNaN(numValue)) {
    return <span className="text-gray-500">—</span>;
  }

  const formatted = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(numValue);

  return (
    <span
      className={`
        text-foreground font-mono text-right tabular-nums
        ${className}
      `}
    >
      {formatted}
    </span>
  );
});

// ============================================
// DATE CELL
// ============================================

interface DateCellProps {
  value: unknown;
  format?: "short" | "medium" | "long" | "relative";
  locale?: string;
  className?: string;
}

export const DateCell = memo(function DateCell({
  value,
  format = "medium",
  locale = "en-US",
  className = "",
}: DateCellProps) {
  if (!value) {
    return <span className="text-gray-500">—</span>;
  }

  const date = new Date(value as string | number | Date);
  if (isNaN(date.getTime())) {
    return <span className="text-gray-500">Invalid date</span>;
  }

  let formatted: string;

  if (format === "relative") {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      formatted = "Today";
    } else if (diffDays === 1) {
      formatted = "Yesterday";
    } else if (diffDays === -1) {
      formatted = "Tomorrow";
    } else if (diffDays < 7 && diffDays > 0) {
      formatted = `${diffDays} days ago`;
    } else if (diffDays > -7 && diffDays < 0) {
      formatted = `In ${Math.abs(diffDays)} days`;
    } else {
      formatted = date.toLocaleDateString(locale, {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      });
    }
  } else {
    const options: Intl.DateTimeFormatOptions =
      format === "short"
        ? { month: "numeric", day: "numeric" }
        : format === "long"
        ? { month: "long", day: "numeric", year: "numeric" }
        : { month: "short", day: "numeric", year: "numeric" };

    formatted = date.toLocaleDateString(locale, options);
  }

  return (
    <span
      className={`
        text-foreground flex items-center gap-1.5
        ${className}
      `}
    >
      <Calendar className="w-3.5 h-3.5 text-gray-500" />
      {formatted}
    </span>
  );
});

// ============================================
// DATETIME CELL
// ============================================

interface DateTimeCellProps {
  value: unknown;
  locale?: string;
  className?: string;
}

export const DateTimeCell = memo(function DateTimeCell({
  value,
  locale = "en-US",
  className = "",
}: DateTimeCellProps) {
  if (!value) {
    return <span className="text-gray-500">—</span>;
  }

  const date = new Date(value as string | number | Date);
  if (isNaN(date.getTime())) {
    return <span className="text-gray-500">Invalid date</span>;
  }

  const formatted = date.toLocaleString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <span
      className={`
        text-foreground flex items-center gap-1.5
        ${className}
      `}
    >
      <Clock className="w-3.5 h-3.5 text-gray-500" />
      {formatted}
    </span>
  );
});

// ============================================
// BOOLEAN CELL
// ============================================

interface BooleanCellProps {
  value: unknown;
  trueLabel?: string;
  falseLabel?: string;
  showLabel?: boolean;
  className?: string;
}

export const BooleanCell = memo(function BooleanCell({
  value,
  trueLabel = "Yes",
  falseLabel = "No",
  showLabel = false,
  className = "",
}: BooleanCellProps) {
  const boolValue = Boolean(value);

  return (
    <span
      className={`
        flex items-center gap-1.5
        ${className}
      `}
    >
      {boolValue ? (
        <>
          <span className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
            <Check className="w-3 h-3 text-green-400" />
          </span>
          {showLabel && <span className="text-green-400">{trueLabel}</span>}
        </>
      ) : (
        <>
          <span className="w-5 h-5 rounded-full bg-gray-500/20 flex items-center justify-center">
            <X className="w-3 h-3 text-gray-500" />
          </span>
          {showLabel && <span className="text-gray-500">{falseLabel}</span>}
        </>
      )}
    </span>
  );
});

// ============================================
// BADGE/ENUM CELL
// ============================================

interface BadgeCellProps {
  value: unknown;
  options?: EnumOption[];
  colorMap?: Record<string, string>;
  className?: string;
}

const defaultColors: Record<string, string> = {
  default: "bg-gray-500/20 text-gray-400",
  success: "bg-green-500/20 text-green-400",
  warning: "bg-yellow-500/20 text-yellow-400",
  error: "bg-red-500/20 text-red-400",
  info: "bg-blue-500/20 text-blue-400",
  purple: "bg-purple-500/20 text-purple-400",
  cyan: "bg-cyan-500/20 text-cyan-400",
};

export const BadgeCell = memo(function BadgeCell({
  value,
  options,
  colorMap,
  className = "",
}: BadgeCellProps) {
  if (value === null || value === undefined) {
    return <span className="text-gray-500">—</span>;
  }

  const stringValue = String(value);
  const option = options?.find((opt) => opt.value === stringValue);
  const label = option?.label ?? stringValue;
  const colorClass =
    option?.color ??
    colorMap?.[stringValue] ??
    defaultColors[stringValue.toLowerCase()] ??
    defaultColors.default;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium
        ${colorClass}
        ${className}
      `}
    >
      {option?.icon ?? <Circle className="w-2 h-2 fill-current" />}
      {label}
    </span>
  );
});

// ============================================
// AVATAR CELL
// ============================================

interface AvatarCellProps {
  value: unknown;
  name?: string;
  imageUrl?: string;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "w-5 h-5 text-xs",
  md: "w-6 h-6 text-xs",
  lg: "w-8 h-8 text-sm",
};

export const AvatarCell = memo(function AvatarCell({
  value,
  name,
  imageUrl,
  size = "md",
  showName = true,
  className = "",
}: AvatarCellProps) {
  const displayName = name ?? String(value ?? "");
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <span className={`flex items-center gap-2 ${className}`}>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={displayName}
          className={`${sizeClasses[size]} rounded-full object-cover`}
        />
      ) : (
        <span
          className={`
            ${sizeClasses[size]} rounded-full
            bg-gradient-to-br from-cyan-500 to-purple-500
            flex items-center justify-center text-white font-medium
          `}
        >
          {initials || <User className="w-3 h-3" />}
        </span>
      )}
      {showName && displayName && (
        <span className="text-foreground truncate">{displayName}</span>
      )}
    </span>
  );
});

// ============================================
// PROGRESS CELL
// ============================================

interface ProgressCellProps {
  value: unknown;
  max?: number;
  showLabel?: boolean;
  colorThresholds?: { value: number; color: string }[];
  className?: string;
}

export const ProgressCell = memo(function ProgressCell({
  value,
  max = 100,
  showLabel = true,
  colorThresholds = [
    { value: 30, color: "bg-red-500" },
    { value: 70, color: "bg-yellow-500" },
    { value: 100, color: "bg-green-500" },
  ],
  className = "",
}: ProgressCellProps) {
  const numValue = Number(value) || 0;
  const percentage = Math.min(100, Math.max(0, (numValue / max) * 100));

  const colorClass =
    colorThresholds.find((t) => percentage <= t.value)?.color ?? "bg-cyan-500";

  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <span className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <motion.span
          className={`h-full ${colorClass} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </span>
      {showLabel && (
        <span className="text-xs text-gray-400 font-mono tabular-nums w-10 text-right">
          {Math.round(percentage)}%
        </span>
      )}
    </span>
  );
});

// ============================================
// ACTIONS CELL
// ============================================

interface ActionsCellProps<TData> {
  context: CellContext<TData>;
  actions?: {
    id: string;
    icon: ReactNode;
    label: string;
    onClick: (row: TData) => void;
    disabled?: boolean;
  }[];
  className?: string;
}

export function ActionsCell<TData>({
  context,
  actions = [],
  className = "",
}: ActionsCellProps<TData>) {
  const visibleActions = actions.slice(0, 2);
  const overflowActions = actions.slice(2);

  return (
    <span className={`flex items-center gap-1 ${className}`}>
      {visibleActions.map((action) => (
        <motion.button
          key={action.id}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            action.onClick(context.row);
          }}
          disabled={action.disabled}
          className={`
            p-1.5 rounded-md
            text-gray-400 hover:text-foreground
            hover:bg-white/5
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
          `}
          whileTap={{ scale: 0.95 }}
          title={action.label}
        >
          {action.icon}
        </motion.button>
      ))}
      {overflowActions.length > 0 && (
        <motion.button
          type="button"
          className={`
            p-1.5 rounded-md
            text-gray-400 hover:text-foreground
            hover:bg-white/5
            transition-colors
          `}
          whileTap={{ scale: 0.95 }}
          title="More actions"
        >
          <MoreHorizontal className="w-4 h-4" />
        </motion.button>
      )}
    </span>
  );
}

// ============================================
// LINK CELL
// ============================================

interface LinkCellProps {
  value: unknown;
  href?: string;
  external?: boolean;
  className?: string;
}

export const LinkCell = memo(function LinkCell({
  value,
  href,
  external = false,
  className = "",
}: LinkCellProps) {
  const url = href ?? String(value ?? "");
  const displayValue = String(value ?? url);

  return (
    <a
      href={url}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      onClick={(e) => e.stopPropagation()}
      className={`
        text-cyan-400 hover:text-cyan-300
        hover:underline underline-offset-2
        truncate block
        ${className}
      `}
    >
      {displayValue}
    </a>
  );
});

// ============================================
// CELL FACTORY
// ============================================

export function getCellRenderer<TData>(
  type: string
): (context: CellContext<TData>) => ReactNode {
  switch (type) {
    case "text":
      return (ctx) => <TextCell value={ctx.value} />;
    case "number":
      return (ctx) => <NumberCell value={ctx.value} />;
    case "currency":
      return (ctx) => <CurrencyCell value={ctx.value} />;
    case "date":
      return (ctx) => <DateCell value={ctx.value} />;
    case "datetime":
      return (ctx) => <DateTimeCell value={ctx.value} />;
    case "boolean":
      return (ctx) => <BooleanCell value={ctx.value} />;
    case "badge":
    case "enum":
      return (ctx) => (
        <BadgeCell value={ctx.value} options={ctx.column.options} />
      );
    case "avatar":
      return (ctx) => <AvatarCell value={ctx.value} />;
    case "progress":
      return (ctx) => <ProgressCell value={ctx.value} />;
    default:
      return (ctx) => <TextCell value={ctx.value} />;
  }
}
