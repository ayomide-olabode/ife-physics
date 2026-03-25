'use client';

import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface YearSelectProps {
  /**
   * Controlled value handling. Null means "Ongoing" if includeOngoing is true.
   */
  value: number | string | null;
  /**
   * Return the selected year, or null if "Ongoing" is selected (or if nothing valid is selected)
   */
  onChange: (val: number | null) => void;

  startYear?: number;
  endYear?: number;
  includeOngoing?: boolean;
  disabled?: boolean;
  placeholder?: string;
  name?: string;
}

export function YearSelect({
  value,
  onChange,
  startYear = 1960,
  endYear = new Date().getFullYear(),
  includeOngoing = false,
  disabled = false,
  placeholder = 'Select Year',
  name,
}: YearSelectProps) {
  // Generate options from endYear down to startYear
  const years = React.useMemo(() => {
    const list = [];
    for (let y = endYear; y >= startYear; y--) {
      list.push(y);
    }
    return list;
  }, [endYear, startYear]);

  // shadcn Select uses string values for internal state, so we cast everything safely.
  // We'll use "ongoing" as the string value for the null Ongoing option.
  const stringValue = value === null && includeOngoing ? 'ongoing' : value ? String(value) : '';

  const handleValueChange = (valStr: string) => {
    if (valStr === 'ongoing') {
      onChange(null);
    } else {
      const parsed = parseInt(valStr, 10);
      onChange(isNaN(parsed) ? null : parsed);
    }
  };

  return (
    <Select value={stringValue} onValueChange={handleValueChange} disabled={disabled} name={name}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {includeOngoing && <SelectItem value="ongoing">Ongoing</SelectItem>}
        {years.map((year) => (
          <SelectItem key={year.toString()} value={year.toString()}>
            {year}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
