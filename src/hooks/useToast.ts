import { useContext } from 'react';
import { ToastActionElement, ToastProps } from '../components/ui/toast';
import { ToastContext } from '../components/ui/toast';

export function useToast() {
  const context = useContext(ToastContext);

  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  const { toast, toasts } = context;

  return {
    toast,
    toasts,
    error: (message: string, action?: ToastActionElement) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: message,
        action,
      } as ToastProps);
    },
    success: (message: string, action?: ToastActionElement) => {
      toast({
        title: 'Success',
        description: message,
        action,
      } as ToastProps);
    }
  };
}