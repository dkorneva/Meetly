// Тип определяет цвет и значок уведомления независимо от его текста.
export type ToastType = "info" | "success" | "error";

// Один показ уведомления. null в состоянии означает, что уведомление закрыто.
export type ToastNotification = {
  id: number; 
  type: ToastType;
  message: string;
};
