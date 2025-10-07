import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ToastContainer } from '../components/Toast';
import { ToastType, ToastProps } from '../components/Toast';

interface ToastContextType {
  showToast: (message: string, type: ToastType, duration?: number) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

/**
 * ToastProvider manages toast notifications state and provides
 * showToast function to display notifications
 */
export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  // Hide a toast notification
  const hideToast = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  // Show a new toast notification
  const showToast = useCallback((message: string, type: ToastType, duration = 3000) => {
    const id = `toast-${Date.now()}-${Math.random()}`;

    const newToast: ToastProps = {
      id,
      message,
      type,
      duration,
      onClose: (toastId: string) => hideToast(toastId),
    };

    setToasts((prevToasts) => [...prevToasts, newToast]);
  }, [hideToast]);

  const value: ToastContextType = {
    showToast,
    hideToast,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} />
    </ToastContext.Provider>
  );
};

/**
 * Custom hook to use toast notifications
 */
export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
