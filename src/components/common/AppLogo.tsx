'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface AppLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  customUrl?: string;
  altText?: string;
}

export default function AppLogo({
  className = '',
  size = 'md',
  customUrl,
  altText = 'SAP Logo',
}: AppLogoProps) {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    sm: 'h-7 w-auto max-w-[80px]',
    md: 'h-9 w-auto max-w-[110px]',
    lg: 'h-12 w-auto max-w-[140px]',
    xl: 'h-16 w-auto max-w-[180px]',
  };

  const badgeSizeClasses = {
    sm: 'px-2.5 py-1 text-xs font-black',
    md: 'px-3 py-1.5 text-sm font-black',
    lg: 'px-4 py-2 text-base font-black',
    xl: 'px-5 py-2.5 text-lg font-black',
  };

  const logoSrc = customUrl || '/logo.png';

  if (imgError) {
    return (
      <div
        className={`bg-blue-600 text-white rounded-xl shadow-xs tracking-wider inline-flex items-center justify-center select-none ${badgeSizeClasses[size]} ${className}`}
      >
        SAP
      </div>
    );
  }

  return (
    <img
      src={logoSrc}
      alt={altText}
      onError={() => setImgError(true)}
      className={`object-contain rounded-lg transition-transform hover:scale-102 ${sizeClasses[size]} ${className}`}
    />
  );
}
