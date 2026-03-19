export function useToast() {
  return { toast: () => {}, toasts: [] };
}
export function toast(msg: string) {}
