'use client';

import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface DaySelectProps {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  placeholder?: string;
  name?: string;
}

export function DaySelect({
  value,
  onChange,
  disabled = false,
  placeholder = 'Select Day',
  name,
}: DaySelectProps) {
  const days = React.useMemo(() => {
    const list = [];
    for (let i = 1; i <= 31; i++) {
      list.push(i.toString());
    }
    return list;
  }, []);

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled} name={name}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {days.map((day) => (
          <SelectItem key={day} value={day}>
            {day}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
