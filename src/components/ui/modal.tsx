import type { ReactNode } from "react";

export function Modal({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-bg/60 p-3 sm:items-center sm:p-4">
      <div className="w-full max-w-md pb-[env(safe-area-inset-bottom)] sm:pb-0">{children}</div>
    </div>
  );
}
