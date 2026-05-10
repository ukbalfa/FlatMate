"use client";

interface SourceToggleProps {
  value: string;
  onChange: (value: string) => void;
}

export const SourceToggle = ({ value, onChange }: SourceToggleProps) => {
  const options = [
    { label: "Market", value: "market" },
    { label: "Central Bank", value: "central" },
    { label: "Commercial", value: "commercial" },
  ];

  return (
    <div className="mb-6">
      <div className="flex bg-[#1E293B]/50 rounded-lg p-1 w-full md:w-1/2">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              value === option.value
                ? "bg-gold-400 text-[#0A0A12]"
                : "text-[#E0E0E0] hover:bg-white/10"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};