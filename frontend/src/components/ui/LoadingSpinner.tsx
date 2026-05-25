import React from "react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  className?: string;
  text?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  className,
  text = "Loading defense details...",
  size = "md",
}) => {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4",
    xl: "w-16 h-16 border-4",
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-300",
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={text}
    >
      <div
        className={cn(
          "rounded-full border-amber-200 border-t-amber-700 animate-spin",
          sizeClasses[size]
        )}
      />
      {text && (
        <p className="text-gray-600 font-medium text-sm sm:text-base animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;
