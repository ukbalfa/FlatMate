'use client';

export default function SectionDivider() {
  return (
    <div className="relative h-16 overflow-hidden">
      <svg
        className="absolute w-full h-full"
        viewBox="0 0 1440 64"
        preserveAspectRatio="none"
      >
        <path
          d="M0,32 C240,64 480,64 720,32 C960,0 1200,0 1440,32 L1440,64 L0,64 Z"
          className="fill-bg-page dark:fill-dark-bg-page"
        />
      </svg>
    </div>
  );
}