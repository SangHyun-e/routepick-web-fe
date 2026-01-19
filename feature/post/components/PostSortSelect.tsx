'use client';

import React from 'react';
import { PostSortOption } from '@/feature/post/types';
import { Clock, Heart, Eye, ChevronDown, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface PostSortSelectProps {
  value: PostSortOption;
  onChange: (value: PostSortOption) => void;
}

const sortOptions: { value: PostSortOption; label: string; icon: React.ElementType }[] = [
  { value: 'latest', label: '최신순', icon: Clock },
  { value: 'popular', label: '인기순', icon: Heart },
  { value: 'views', label: '조회순', icon: Eye },
];

export default function PostSortSelect({ value, onChange }: PostSortSelectProps) {
  const currentOption = sortOptions.find((opt) => opt.value === value) ?? sortOptions[0];
  const CurrentIcon = currentOption.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 bg-white px-4">
          <CurrentIcon className="h-4 w-4 text-slate-600" />
          <span className="text-sm font-medium">{currentOption.label}</span>
          <ChevronDown className="ml-1 h-4 w-4 text-slate-400" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-36 rounded-lg p-1">
        {sortOptions.map((option) => {
          const Icon = option.icon;
          const selected = value === option.value;

          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onChange(option.value)}
              className={`flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm ${
                selected
                  ? 'bg-slate-100 font-semibold text-slate-900'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1">{option.label}</span>
              {selected && <Check className="h-4 w-4 text-slate-600" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
