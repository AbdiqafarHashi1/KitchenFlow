"use client";

import { useRef, useState } from "react";

type ActionResult = { success?: string; error?: string };

export function ActionForm({
  action,
  className,
  keepFields = [],
  children
}: {
  action: (formData: FormData) => Promise<ActionResult>;
  className?: string;
  keepFields?: string[];
  children: React.ReactNode;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [message, setMessage] = useState<ActionResult>({});

  return (
    <form
      ref={formRef}
      className={className}
      action={async (formData) => {
        const sticky = new Map<string, FormDataEntryValue>();
        keepFields.forEach((field) => {
          const value = formData.get(field);
          if (value !== null) sticky.set(field, value);
        });

        const result = await action(formData);
        setMessage(result ?? {});

        if (result?.success && formRef.current) {
          formRef.current.reset();
          sticky.forEach((value, key) => {
            const el = formRef.current?.elements.namedItem(key);
            if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) {
              el.value = String(value);
            }
          });
        }
      }}
    >
      {children}
      {message.success ? <p className="mt-2 text-xs text-emerald-300">{message.success}</p> : null}
      {message.error ? <p className="mt-2 text-xs text-red-300">{message.error}</p> : null}
    </form>
  );
}
