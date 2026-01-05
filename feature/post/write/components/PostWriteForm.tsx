'use client';

import type { PostWriteDraft, PostWriteErrors } from '@/feature/post/write/validatePostWrite';
import { FileText, MapPin, Navigation, Tag, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

type Props = {
  draft: PostWriteDraft;
  errors: PostWriteErrors;
  submitting: boolean;
  onChange: <K extends keyof PostWriteDraft>(key: K, value: string) => void;
  onSubmit: () => void;
};

export default function PostWriteForm({ draft, errors, submitting, onChange, onSubmit }: Props) {
  // 좌표 쌍 규칙 에러는 좌표 섹션에서만 보여주기
  const coordinatePairError =
    errors.form === '위도와 경도는 함께 제공되어야 합니다.' ? errors.form : undefined;

  // 좌표 에러가 아닌 form 에러만 하단 박스로 보여주기
  const formError = coordinatePairError ? undefined : errors.form;

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto max-w-3xl px-4">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/posts"
              className="rounded-lg p-2 transition-colors hover:bg-white hover:shadow-sm"
              aria-label="목록으로"
            >
              <ArrowLeft className="h-5 w-5 text-slate-600" />
            </Link>
            <h1 className="text-2xl font-bold text-slate-900">새 글 쓰기</h1>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit();
            }}
          >
            <div className="space-y-6 p-6">
              {/* Title field */}
              <div className="space-y-2">
                <label
                  htmlFor="title"
                  className="flex items-center gap-2 text-sm font-medium text-slate-700"
                >
                  <FileText className="h-4 w-4 text-slate-500" />
                  제목
                  <span className="text-red-500">*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
                  placeholder="제목을 입력하세요"
                  value={draft.title}
                  onChange={(e) => onChange('title', e.target.value)}
                  disabled={submitting}
                  maxLength={120}
                />
                {errors.title && <p className="text-sm text-red-600">{errors.title}</p>}
              </div>

              {/* Content field */}
              <div className="space-y-2">
                <label
                  htmlFor="content"
                  className="flex items-center gap-2 text-sm font-medium text-slate-700"
                >
                  <FileText className="h-4 w-4 text-slate-500" />
                  내용
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="content"
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
                  rows={12}
                  placeholder="내용을 입력하세요"
                  value={draft.content}
                  onChange={(e) => onChange('content', e.target.value)}
                  disabled={submitting}
                  maxLength={4000}
                />
                <div className="flex items-center justify-between">
                  {errors.content ? (
                    <p className="text-sm text-red-600">{errors.content}</p>
                  ) : (
                    <p className="text-xs text-slate-500">{draft.content.length} / 4000자</p>
                  )}
                </div>
              </div>

              {/* Region field */}
              <div className="space-y-2">
                <label
                  htmlFor="region"
                  className="flex items-center gap-2 text-sm font-medium text-slate-700"
                >
                  <MapPin className="h-4 w-4 text-slate-500" />
                  지역 (선택)
                </label>
                <input
                  id="region"
                  type="text"
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
                  placeholder="예: 서울특별시 강남구"
                  value={draft.region}
                  onChange={(e) => onChange('region', e.target.value)}
                  disabled={submitting}
                  maxLength={120}
                />
                {errors.region && <p className="text-sm text-red-600">{errors.region}</p>}
              </div>

              {/* Latitude & Longitude fields */}
              <fieldset className="space-y-2">
                <legend className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Navigation className="h-4 w-4 text-slate-500" />
                  좌표 (선택)
                </legend>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="latitude" className="sr-only">
                      위도
                    </label>
                    <input
                      id="latitude"
                      type="text"
                      className="h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
                      placeholder="위도 (Latitude)"
                      value={draft.latitude}
                      onChange={(e) => onChange('latitude', e.target.value)}
                      disabled={submitting}
                    />
                    {errors.latitude && (
                      <p className="mt-1 text-sm text-red-600">{errors.latitude}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="longitude" className="sr-only">
                      경도
                    </label>
                    <input
                      id="longitude"
                      type="text"
                      className="h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
                      placeholder="경도 (Longitude)"
                      value={draft.longitude}
                      onChange={(e) => onChange('longitude', e.target.value)}
                      disabled={submitting}
                    />
                    {errors.longitude && (
                      <p className="mt-1 text-sm text-red-600">{errors.longitude}</p>
                    )}
                  </div>
                </div>

                {coordinatePairError ? (
                  <p className="text-sm text-red-600">{coordinatePairError}</p>
                ) : (
                  <p className="text-xs text-slate-500">위도와 경도는 함께 입력해야 합니다.</p>
                )}
              </fieldset>

              {/* Tags field */}
              <div className="space-y-2">
                <label
                  htmlFor="tagsText"
                  className="flex items-center gap-2 text-sm font-medium text-slate-700"
                >
                  <Tag className="h-4 w-4 text-slate-500" />
                  태그 (선택)
                </label>
                <input
                  id="tagsText"
                  type="text"
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
                  placeholder="태그를 쉼표로 구분하여 입력하세요 (예: 드라이브, 맛집, 여행)"
                  value={draft.tagsText}
                  onChange={(e) => onChange('tagsText', e.target.value)}
                  disabled={submitting}
                />
                {errors.tagsText ? (
                  <p className="text-sm text-red-600">{errors.tagsText}</p>
                ) : (
                  <p className="text-xs text-slate-500">
                    태그는 쉼표로 구분하며, 중복 태그는 자동으로 제거됩니다.
                  </p>
                )}
              </div>

              {/* Form error (좌표 에러 제외) */}
              {formError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {formError}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
              {submitting ? (
                <Button variant="outline" disabled>
                  취소
                </Button>
              ) : (
                <Button variant="outline" asChild>
                  <Link href="/posts">취소</Link>
                </Button>
              )}

              <Button type="submit" disabled={submitting}>
                {submitting ? '등록 중...' : '등록하기'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
