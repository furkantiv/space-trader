"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  className,
  pendingLabel,
  formAction,
}: {
  children: ReactNode;
  className?: string;
  pendingLabel: string;
  formAction?: (payload: FormData) => void;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      formAction={formAction}
      disabled={pending}
      className={className}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
