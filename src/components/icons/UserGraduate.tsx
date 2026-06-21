import React from 'react';
import { LucideProps } from 'lucide-react';

export default function UserGraduate({
  size = 24,
  color = 'currentColor',
  strokeWidth = 2,
  className = '',
  ...props
}: LucideProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`lucide lucide-user-graduate ${className}`}
      {...props}
    >
      {/* Cap top */}
      <path d="M21.42 10.922a2 2 0 0 0-.019-3.838L12.83 4.3a2 2 0 0 0-1.66 0l-8.57 2.78a2 2 0 0 0-.02 3.84l8.39 2.92a2 2 0 0 0 1.66 0z" />
      {/* Tassel */}
      <path d="M22 10v6" />
      {/* Head / Cap base */}
      <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
      {/* Body */}
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    </svg>
  );
}
