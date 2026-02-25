import React from "react";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  barClassName?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  className,
  barClassName,
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn("h-2 bg-muted rounded-full overflow-hidden", className)}>
      {/* Inline style is required for dynamic width calculation at runtime */}
      <div
        className={cn("h-full transition-all duration-300", barClassName)}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};
