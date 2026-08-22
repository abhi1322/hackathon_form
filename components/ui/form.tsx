import { cn } from "@/lib/cn";

export function Label({
  className,
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "block text-sm font-medium text-text mb-1.5",
        className,
      )}
      {...props}
    >
      {children}
    </label>
  );
}

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full min-h-11 rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-[border-color,box-shadow] duration-[var(--duration-fast)]",
        className,
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full min-h-11 rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-[border-color,box-shadow] duration-[var(--duration-fast)]",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Button({
  className,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  const variants = {
    primary:
      "bg-primary text-white hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed",
    secondary:
      "border border-border bg-surface text-text hover:bg-bg disabled:opacity-50",
    ghost: "text-text-muted hover:text-text hover:bg-bg disabled:opacity-50",
    danger:
      "border border-error/30 text-error hover:bg-error/5 disabled:opacity-50",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 min-h-11 px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-colors duration-[var(--duration-fast)] focus:outline-none focus:ring-2 focus:ring-primary/30",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-[var(--shadow-1)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-error">{message}</p>;
}
