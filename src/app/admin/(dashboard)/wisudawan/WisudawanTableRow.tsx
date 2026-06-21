"use client";

import { useRouter } from "next/navigation";
import { ReactNode } from "react";

export default function WisudawanTableRow({ href, children, className }: { href: string, children: ReactNode, className?: string }) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    // If the click is on a button or a link, do not trigger row navigation
    if ((e.target as HTMLElement).closest("button, a")) {
      return;
    }
    router.push(href);
  };

  return (
    <tr 
      onClick={handleClick} 
      className={`cursor-pointer ${className || ""}`}
    >
      {children}
    </tr>
  );
}
