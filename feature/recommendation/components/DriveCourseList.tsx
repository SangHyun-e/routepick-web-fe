'use client';

import DriveCourseCard from './DriveCourseCard';
import type { CourseSummary } from '../types/recommendation';

type DriveCourseListProps = {
  courses: CourseSummary[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  isLoggedIn: boolean;
  remainingCount: number | null;
  onRemainingChange: (remainingCount: number) => void;
};

export default function DriveCourseList({
  courses,
  selectedIndex,
  onSelect,
  isLoggedIn,
  remainingCount,
  onRemainingChange,
}: DriveCourseListProps) {
  return (
    <div className="grid gap-3 sm:gap-4">
      {courses.map((course, index) => (
        <DriveCourseCard
          key={course.courseId ?? `${course.title}-${index}`}
          course={course}
          selected={index === selectedIndex}
          onSelect={() => onSelect(index)}
          isLoggedIn={isLoggedIn}
          remainingCount={remainingCount}
          onRemainingChange={onRemainingChange}
        />
      ))}
    </div>
  );
}
