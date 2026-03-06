'use client';

import React from 'react';
import { ChevronDown, Check } from 'lucide-react';
import type { NotificationSortOption } from '@/feature/notification/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface NotificationSortSelectProps {
  value: NotificationSortOption;
  onChange: (value: NotificationSortOption) => void;
}

const sortOptions: { value: NotificationSortOption; label: string }[] = [
  { value: 'latest', label: '최신순' },
  { value: 'oldest', label: '오래된순' },
];

export default function NotificationSortSelect({ value, onChange }: NotificationSortSelectProps) {
  const currentOption = sortOptions.find((opt) => opt.value === value) ?? sortOptions[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 bg-white px-4">
          <span className="text-sm font-medium">{currentOption.label}</span>
          <ChevronDown className="ml-1 h-4 w-4 text-slate-400" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-32 rounded-lg p-1">
        {sortOptions.map((option) => {
          const selected = value === option.value;

          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onChange(option.value)}
              className={`flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm ${
                selected
                  ? 'bg-slate-100 font-semibold text-slate-900'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>{option.label}</span>
              {selected && <Check className="h-4 w-4 text-slate-600" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
