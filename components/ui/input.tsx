import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-md border border-[#d9dee8] bg-white px-3 text-sm outline-none transition focus:border-[#2358ff] focus:ring-2 focus:ring-[#2358ff]/20",
        className
      )}
      {...props}
    />
  );
}
