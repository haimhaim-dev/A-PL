import { toast } from "react-hot-toast";

export function useToast() {
  const showSuccess = (title: string, message?: string) => {
    toast.success(message || title);
  };

  const showError = (title: string, message?: string) => {
    toast.error(message || title);
  };

  const showInfo = (title: string, message?: string) => {
    toast(message || title);
  };

  const showLoading = (message: string) => {
    return toast.loading(message);
  };

  const dismiss = (toastId: string) => {
    toast.dismiss(toastId);
  };

  return {
    showSuccess,
    showError,
    showInfo,
    showLoading,
    dismiss
  };
}