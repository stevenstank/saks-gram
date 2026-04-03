import { forwardRef, type InputHTMLAttributes } from "react";

type InputType = "text" | "email" | "password";

type InputFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  id: string;
  label: string;
  type: InputType;
  error?: string | null;
};

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(function InputField(
  { id, label, type, error, className, ...props },
  ref,
) {
  const errorId = `${id}-error`;

  return (
    <div className="space-y-2">
      {label ? (
        <label htmlFor={id} className="block text-sm font-medium text-white">
          {label}
        </label>
      ) : null}
      <input
        ref={ref}
        id={id}
        type={type}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={[
          "w-full rounded-xl border border-gray-800 bg-gray-900 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-gray-500",
          "focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/30",
          error ? "border-error-500 focus:border-error-500 focus:ring-error-500/30" : "",
          className ?? "",
        ].join(" ")}
        {...props}
      />
      {error ? (
        <p id={errorId} className="rounded-md border border-red-900/50 bg-red-950/30 px-2.5 py-1.5 text-sm text-red-300">
          {error}
        </p>
      ) : null}
    </div>
  );
});
