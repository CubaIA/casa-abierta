import * as React from 'react';
import { useToast } from '@/hooks/use-toast';
import { Toast, ToastAction, ToastClose, ToastDescription, ToastTitle } from './toast';

export function Toaster() {
  const { toasts, dismiss } = useToast();

  React.useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts
      .filter((t) => t.open)
      .map((t) => setTimeout(() => dismiss(t.id), 5000));
    return () => timers.forEach(clearTimeout);
  }, [toasts, dismiss]);

  return (
    <ol className="fixed bottom-4 right-4 z-[100] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          open={toast.open}
          variant={toast.variant}
          onClick={() => toast.onOpenChange?.(false)}
        >
          <div className="flex-1">
            {toast.title ? <ToastTitle>{toast.title}</ToastTitle> : null}
            {toast.description ? <ToastDescription>{toast.description}</ToastDescription> : null}
            {toast.action ? <div className="mt-1">{toast.action}</div> : null}
          </div>
          <ToastClose onClick={() => toast.onOpenChange?.(false)} />
        </Toast>
      ))}
    </ol>
  );
}
