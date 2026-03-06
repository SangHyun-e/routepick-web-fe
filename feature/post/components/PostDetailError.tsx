import { AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface PostDetailErrorProps {
  error: string;
}

export default function PostDetailError({ error }: PostDetailErrorProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-red-50 p-3">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>
        <h2 className="mb-2 text-xl font-bold text-slate-900">오류가 발생했습니다</h2>
        <p className="mb-6 text-slate-600">{error}</p>
        <Button asChild>
          <Link href="/posts">목록으로 돌아가기</Link>
        </Button>
      </div>
    </div>
  );
}
