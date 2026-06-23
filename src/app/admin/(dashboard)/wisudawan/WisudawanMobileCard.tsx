"use client";

import { useRouter } from "next/navigation";
import { ReactNode } from "react";

export default function WisudawanMobileCard({ href, children, className }: { href: string, children: ReactNode, className?: string }) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button, a")) {
      return;
    }
    router.push(href);
  };

  return (
    <div 
      onClick={handleClick} 
      className={`cursor-pointer ${className || ""}`}
    >
      {children}
    </div>
  );
}
