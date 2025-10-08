export interface ButtonVariants {
  variant?: "default" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export function buttonVariants({
  variant = "default",
  size = "default",
}: ButtonVariants = {}): string {
  const baseClasses = [
    "w-fit",
    "tracking-tight",
    "flex",
    "items-center",
    "justify-center",
    "whitespace-nowrap",
    "rounded-md",
    "text-[13px]",
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
    default: ["text-white", "bg-black/12", "hover:bg-[#4C43FC]"],
    ghost: ["text-white", "bg-[#4C43FC]/0", "hover:bg-[#4C43FC]"],
    link: ["text-white", "pb-0.5", "bg-[#4C43FC]/0"],
  };

  const sizeClasses = {
    default: ["h-[33px]", "px-2.5"],
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
