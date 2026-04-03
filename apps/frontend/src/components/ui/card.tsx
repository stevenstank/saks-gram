import { type HTMLAttributes, type ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function Card({ children, className, ...props }: CardProps) {
  return (
    <div
      {...props}
      className={[
        "min-w-0 overflow-hidden rounded-2xl border border-gray-800 bg-[#111111] p-5 shadow-soft",
        "transition-all duration-200 hover:border-gray-800 hover:shadow-medium",
        "space-y-4",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </div>
  );
}
