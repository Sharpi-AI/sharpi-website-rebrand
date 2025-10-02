export interface ButtonHeroVariants {
  variant?: "default";
  size?: "default" | "sm" | "lg" | "icon";
}

export function buttonHeroVariants({
  variant = "default",
  size = "default",
}: ButtonHeroVariants = {}): string {
  const baseClasses = [
    "w-fit",
    "font-mono",
    "tracking-tight",
    "inline-flex",
    "items-center",
    "justify-center",
    "whitespace-nowrap",
    "rounded-xl",
    "text-[9px]",
    "font-normal",
    "ring-offset-background",
    "transition-colors",
    "focus-visible:outline-none",
    "focus-visible:ring-2",
    "focus-visible:ring-ring",
    "focus-visible:ring-offset-2",
    "disabled:pointer-events-none",
    "disabled:opacity-50",
    "cursor-pointer",
  ];

  const variantClasses = {
    default: ["bg-[#7171711F]", "text-primary-foreground", "hover:opacity-70"],
  };

  const sizeClasses = {
    default: ["h-7.5", "px-1.5", "py-2"],
    sm: ["h-9", "rounded-md", "px-3"],
    lg: ["h-11", "rounded-md", "px-8"],
    icon: ["h-10", "w-10"],
  };

  const classes = [
    ...baseClasses,
    ...variantClasses[variant],
    ...sizeClasses[size],
  ];

  return classes.join(" ");
}
