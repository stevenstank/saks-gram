import { type HTMLAttributes } from "react";

type AvatarSize = "sm" | "md" | "lg";

type AvatarProps = HTMLAttributes<HTMLDivElement> & {
  src?: string | null;
  alt: string;
  name?: string;
  size?: AvatarSize;
};

const sizeClasses: Record<AvatarSize, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-20 w-20 text-2xl",
};

function getInitials(name?: string): string {
  if (!name) {
    return "?";
  }

  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) {
    return "?";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 1).toUpperCase();
  }

  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase();
}

export function Avatar({ src, alt, name, size = "md", className, ...props }: AvatarProps) {
  const initials = getInitials(name);

  if (src) {
    return (
      <div className={["overflow-hidden rounded-full border border-gray-800", sizeClasses[size], className ?? ""].join(" ")} {...props}>
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className={[
        "flex items-center justify-center rounded-full border border-gray-800 bg-gray-800 font-semibold text-white",
        sizeClasses[size],
        className ?? "",
      ].join(" ")}
      {...props}
    >
      {initials}
    </div>
  );
}
