import * as React from 'react';

export type ToastActionElement = React.ReactNode;

export type ToastProps = {
  id?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  variant?: 'default' | 'destructive' | 'success';
  children?: React.ReactNode;
} & Omit<React.HTMLAttributes<HTMLLIElement>, 'title'>;

const variantClasses: Record<NonNullable<ToastProps['variant']>, string> = {
  default: 'bg-[var(--color-tinta)] text-crema border-[var(--color-tinta)]',
  destructive: 'bg-terracota-600 text-white border-terracota-700',
  success: 'bg-verde-600 text-white border-verde-700',
};

export const Toast = React.forwardRef<HTMLLIElement, ToastProps>(
  ({ className, variant = 'default', children, ...props }, ref) => (
    <li
      ref={ref}
      className={`group pointer-events-auto relative flex w-full items-center justify-between gap-4 overflow-hidden rounded-xl border p-4 shadow-lg transition-colors ${variantClasses[variant]} ${className ?? ''}`}
      {...props}
    >
      {children}
    </li>
  ),
);
Toast.displayName = 'Toast';

export function ToastTitle({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`text-sm font-semibold ${className ?? ''}`} {...props} />;
}

export function ToastDescription({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`text-sm opacity-90 ${className ?? ''}`} {...props} />;
}

export function ToastClose({
  className,
  onClick,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-label="Cerrar"
      className={`ml-auto rounded-md p-1 opacity-70 transition hover:opacity-100 ${className ?? ''}`}
      onClick={onClick}
      {...props}
    >
      ✕
    </button>
  );
}

export function ToastAction({ className, ...props }: React.HTMLAttributes<HTMLButtonElement>) {
  return <button type="button" className={`text-sm font-medium underline ${className ?? ''}`} {...props} />;
}
