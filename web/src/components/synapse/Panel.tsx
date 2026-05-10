import type { ReactNode } from "react";

export function Panel({
  id,
  title,
  children,
  className = "",
}: {
  id?: string;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`panel group h-full p-7 md:p-8 ${className}`}>
      <h3 className="text-xl font-semibold tracking-tight text-foreground">
        {title}
      </h3>
      <div className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
        {children}
      </div>
    </div>
  );
}
