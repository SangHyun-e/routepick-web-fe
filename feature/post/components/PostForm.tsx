'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Editor } from '@tiptap/react';
import type { KakaoPlaceDocument } from '@/feature/place/types';
import type { PostFormDraft, PostFormErrors } from '@/feature/post/types';
import type { CourseRecommendationSaveResponse } from '@/feature/course/types';
import { parseTags } from '@/feature/post/validation';
import { FileText, MapPin, Navigation, Tag, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import PostEditor from '@/feature/post/components/PostEditor';
import PostImageUploader from '@/feature/post/components/PostImageUploader';
import PlaceSearchPanel from '@/feature/post/components/PlaceSearchPanel';
import { fetchSavedRecommendations } from '@/feature/course/api';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

type Props = {
  draft: PostFormDraft;
  errors: PostFormErrors;
  submitting: boolean;
  onChange: <K extends keyof PostFormDraft>(key: K, value: PostFormDraft[K]) => void;
  onSubmit: () => void;

  heading?: string;
  submitLabel?: string;
  cancelHref?: string;
  backHref?: string;
  postId?: number;
  showNoticeToggle?: boolean;
};

export default function PostForm({
  draft,
  errors,
  submitting,
  onChange,
  onSubmit,
  heading = '새 글쓰기',
  submitLabel = '등록하기',
  cancelHref = '/posts',
  backHref = '/posts',
  postId,
  showNoticeToggle = false,
}: Props) {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [savedCourses, setSavedCourses] = useState<CourseRecommendationSaveResponse[]>([]);
  const [savedCoursesLoading, setSavedCoursesLoading] = useState(false);
  const [savedCoursesError, setSavedCoursesError] = useState<string | null>(null);
  const [selectedStops, setSelectedStops] = useState<Record<number, number[]>>({});
  const [savedCoursesOpen, setSavedCoursesOpen] = useState(false);
  const lastImageInsertPosRef = useRef<number | null>(null);
  const parseOptionalNumber = useCallback((value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const numeric = Number(trimmed);
    return Number.isFinite(numeric) ? numeric : null;
  }, []);
  const previewTags = useMemo(() => parseTags(draft.tagsText), [draft.tagsText]);
  const previewLatitude = useMemo(
    () => parseOptionalNumber(draft.latitude),
    [draft.latitude, parseOptionalNumber],
  );
  const previewLongitude = useMemo(
    () => parseOptionalNumber(draft.longitude),
    [draft.longitude, parseOptionalNumber],
  );
  const contentLength = draft.content
    ? draft.content.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim().length
    : 0;
  const coordinatePairError =
    errors.form === '위도와 경도는 함께 제공되어야 합니다.' ? errors.form : undefined;
  const formError = coordinatePairError ? undefined : errors.form;

  useEffect(() => {
    if (!editor) return;
    const updateSelection = () => {
      lastImageInsertPosRef.current = editor.state.selection.to;
    };
    updateSelection();
    editor.on('selectionUpdate', updateSelection);
    return () => {
      editor.off('selectionUpdate', updateSelection);
    };
  }, [editor]);

  useEffect(() => {
    let mounted = true;
    setSavedCoursesLoading(true);
    (async () => {
      const result = await fetchSavedRecommendations(0, 10);
      if (!mounted) return;

      if (result.ok) {
        setSavedCourses(result.data.content);
        setSavedCoursesError(null);
      } else {
        setSavedCourses([]);
        setSavedCoursesError(result.message ?? '저장된 추천 코스를 불러오지 못했습니다.');
      }
      setSavedCoursesLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleInsertImage = useCallback(
    (url: string) => {
      if (!editor) return;
      const insertAt = lastImageInsertPosRef.current ?? editor.state.selection.to;
      editor
        .chain()
        .focus()
        .insertContentAt(insertAt, { type: 'image', attrs: { src: url } })
        .run();
      lastImageInsertPosRef.current = editor.state.selection.to;
    },
    [editor],
  );

  const handleInsertPlace = useCallback(
    (place: KakaoPlaceDocument) => {
      const address = place.roadAddressName || place.addressName || '';
      const link = place.placeUrl ?? '';
      const html = `
<div>
  <p><strong>${place.placeName}</strong></p>
  ${address ? `<p>${address}</p>` : ''}
  ${link ? `<p><a href="${link}" target="_blank" rel="noreferrer">카카오맵에서 보기</a></p>` : ''}
</div>
`;
      editor?.chain().focus().insertContent(html).run();
    },
    [editor],
  );

  const handleApplyLocation = useCallback(
    (place: KakaoPlaceDocument) => {
      if (place.roadAddressName || place.addressName) {
        onChange('region', (place.roadAddressName || place.addressName) ?? '');
      }
      if (place.y) {
        onChange('latitude', place.y);
      }
      if (place.x) {
        onChange('longitude', place.x);
      }
    },
    [onChange],
  );

  const toggleStopSelection = useCallback((courseId: number, stopIndex: number) => {
    setSelectedStops((prev) => {
      const current = new Set(prev[courseId] ?? []);
      if (current.has(stopIndex)) {
        current.delete(stopIndex);
      } else {
        current.add(stopIndex);
      }
      return { ...prev, [courseId]: Array.from(current) };
    });
  }, []);

  const handleInsertSavedStops = useCallback(
    (course: CourseRecommendationSaveResponse) => {
      const selectedIndexes = selectedStops[course.id] ?? [];
      const selected = selectedIndexes
        .map((index) => course.stops[index])
        .filter((stop) => Boolean(stop));

      if (selected.length === 0) {
        toast.error('추가할 장소를 선택해주세요.');
        return;
      }
      if (!editor) {
        toast.error('에디터가 준비되지 않았습니다.');
        return;
      }

      const stopItems = selected
        .map((stop) => `<li>${stop.name} - ${stop.address}</li>`)
        .join('');
      const html = `<div><p><strong>${course.origin} → ${course.destination}</strong></p><p>${course.theme} 추천 코스</p><ul>${stopItems}</ul></div>`;

      editor.chain().focus().insertContent(html).run();
      setSelectedStops((prev) => ({ ...prev, [course.id]: [] }));
      toast.success('선택한 장소를 본문에 추가했습니다.');
    },
    [editor, selectedStops],
  );

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto max-w-3xl px-4">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={backHref}
              className="rounded-lg p-2 transition-colors hover:bg-white hover:shadow-sm"
              aria-label="목록으로"
            >
              <ArrowLeft className="h-5 w-5 text-slate-600" />
            </Link>
            <h1 className="text-2xl font-bold text-slate-900">{heading}</h1>
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

              {showNoticeToggle && (
                <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50/60 px-4 py-3">
                  <label className="flex items-center gap-3 text-sm font-medium text-amber-900">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-2 focus:ring-amber-400/40"
                      checked={draft.isNotice}
                      onChange={(e) => onChange('isNotice', e.target.checked)}
                      disabled={submitting}
                    />
                    공지사항으로 등록
                  </label>
                  <span className="text-xs font-medium text-amber-700">관리자 전용</span>
                </div>
              )}

              <div className="space-y-2">
                <label
                  htmlFor="content"
                  className="flex items-center gap-2 text-sm font-medium text-slate-700"
                >
                  <FileText className="h-4 w-4 text-slate-500" />
                  내용
                  <span className="text-red-500">*</span>
                </label>
                <PostEditor
                  value={draft.content}
                  onChange={(value) => onChange('content', value)}
                  onReady={setEditor}
                  placeholder="내용을 입력하세요"
                  previewMeta={{
                    tags: previewTags,
                    latitude: previewLatitude,
                    longitude: previewLongitude,
                  }}
                />
                <div className="flex items-center justify-between">
                  {errors.content ? (
                    <p className="text-sm text-red-600">{errors.content}</p>
                  ) : (
                    <p className="text-xs text-slate-500">{contentLength} / 4000자</p>
                  )}
                </div>
              </div>

              <PostImageUploader postId={postId} onInsert={handleInsertImage} />

              <PlaceSearchPanel
                onInsert={handleInsertPlace}
                onApplyLocation={handleApplyLocation}
              />

              <AlertDialog open={savedCoursesOpen} onOpenChange={setSavedCoursesOpen}>
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">저장한 추천 코스</p>
                    <p className="text-xs text-slate-500">
                      추천 코스를 선택해 글 본문에 추가할 수 있습니다.
                    </p>
                  </div>
                  <AlertDialogTrigger asChild>
                    <Button type="button" size="sm" variant="outline">
                      추천 코스 보기
                    </Button>
                  </AlertDialogTrigger>
                </div>
                <AlertDialogContent className="max-w-3xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>저장한 추천 코스</AlertDialogTitle>
                    <AlertDialogDescription>
                      체크한 장소를 선택해 게시글 본문에 삽입할 수 있습니다.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="max-h-[60vh] space-y-3 overflow-y-auto">
                    {savedCoursesLoading && (
                      <p className="text-xs text-slate-500">추천 코스를 불러오는 중...</p>
                    )}
                    {!savedCoursesLoading && savedCoursesError && (
                      <p className="text-xs text-rose-500">{savedCoursesError}</p>
                    )}
                    {!savedCoursesLoading && !savedCoursesError && savedCourses.length === 0 && (
                      <p className="text-xs text-slate-500">저장된 추천 코스가 없습니다.</p>
                    )}
                    {!savedCoursesLoading && !savedCoursesError && savedCourses.length > 0 && (
                      <div className="space-y-3">
                        {savedCourses.map((course) => (
                          <div
                            key={course.id}
                            className="rounded-lg border border-slate-200 bg-white p-3"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold text-slate-900">
                                  {course.routeSummary}
                                </p>
                                <p className="text-xs text-slate-500">{course.theme}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleInsertSavedStops(course)}
                                className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
                              >
                                선택한 장소 추가
                              </button>
                            </div>
                            <div className="mt-3 grid gap-2 sm:grid-cols-2">
                              {course.stops.map((stop, index) => {
                                const selected = (selectedStops[course.id] ?? []).includes(index);
                                return (
                                  <label
                                    key={`${course.id}-${stop.name}-${stop.x}`}
                                    className={`flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 text-xs transition ${
                                      selected
                                        ? 'border-slate-900 bg-slate-900 text-white'
                                        : 'border-slate-200 bg-white text-slate-600'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      className="mt-0.5"
                                      checked={selected}
                                      onChange={() => toggleStopSelection(course.id, index)}
                                    />
                                    <span>
                                      <span className="block font-semibold">{stop.name}</span>
                                      <span className="block text-[11px] opacity-80">
                                        {stop.address}
                                      </span>
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>닫기</AlertDialogCancel>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

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
                  <Link href={cancelHref}>취소</Link>
                </Button>
              )}

              <Button type="submit" disabled={submitting}>
                {submitting ? '저장 중...' : submitLabel}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
