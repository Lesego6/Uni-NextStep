import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

function normalizeOption(option) {
  if (typeof option === 'string') {
    return { value: option, label: option };
  }

  return option;
}

export default function SelectMenu({
  label,
  value,
  options,
  onChange,
  icon: Icon,
  className = '',
  buttonClassName = 'input-field',
  menuClassName = '',
}) {
  const [open, setOpen] = useState(false);
  const normalizedOptions = options.map(normalizeOption);
  const selected = normalizedOptions.find((option) => option.value === value);

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`${buttonClassName} flex items-center justify-between gap-3 text-left`}
      >
        <span className="flex min-w-0 items-center gap-2">
          {Icon && <Icon className="h-4 w-4 shrink-0 text-gray-400" />}
          <span className="truncate">{selected?.label || value}</span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className={`mt-2 max-h-56 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg ${menuClassName}`}>
          {normalizedOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-sm transition-colors ${
                option.value === value ? 'bg-accent/10 text-primary' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>{option.label}</span>
              {option.value === value && <Check className="h-4 w-4 text-accent" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
