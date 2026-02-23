'use client';

import { useMemo, useState } from 'react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import type { AdminUserStatus } from '@/feature/admin/user/types';

type ActionType = 'BLOCK' | 'UNBLOCK' | 'DELETE';

type Props = {
  status: AdminUserStatus;
  disabled?: boolean;
  allowDelete?: boolean;
  onChangeStatus: (status: AdminUserStatus, reason?: string | null) => void;
};

type ActionConfig = {
  label: string;
  nextStatus: AdminUserStatus;
  title: string;
  description: string;
  confirmText: string;
  variant?: 'default' | 'destructive';
};

const ACTION_CONFIG: Record<ActionType, ActionConfig> = {
  BLOCK: {
    label: '정지',
    nextStatus: 'BLOCKED',
    title: '사용자를 정지하시겠습니까?',
    description: '정지된 사용자는 로그인 및 서비스 이용이 제한됩니다.',
    confirmText: '정지',
    variant: 'destructive',
  },
  UNBLOCK: {
    label: '정지 해제',
    nextStatus: 'ACTIVE',
    title: '정지를 해제하시겠습니까?',
    description: '정지 해제 시 사용자가 다시 로그인할 수 있습니다.',
    confirmText: '해제',
  },
  DELETE: {
    label: '탈퇴 처리',
    nextStatus: 'DELETED',
    title: '탈퇴 처리하시겠습니까?',
    description: '탈퇴 처리된 사용자는 복구할 수 없습니다.',
    confirmText: '탈퇴 처리',
    variant: 'destructive',
  },
};

export default function UserStatusAction({
  status,
  disabled = false,
  allowDelete = false,
  onChangeStatus,
}: Props) {
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState<ActionType | null>(null);
  const [reason, setReason] = useState('');

  const availableActions = useMemo(() => {
    if (status === 'DELETED') return [];
    const actions: ActionType[] = [];
    if (status === 'ACTIVE') actions.push('BLOCK');
    if (status === 'BLOCKED') actions.push('UNBLOCK');
    if (allowDelete) actions.push('DELETE');
    return actions;
  }, [allowDelete, status]);

  if (availableActions.length === 0) {
    return null;
  }

  const startAction = (nextAction: ActionType) => {
    setAction(nextAction);
    setReason('');
    setOpen(true);
  };

  const confirm = () => {
    if (!action) return;
    const config = ACTION_CONFIG[action];
    const trimmed = reason.trim();
    onChangeStatus(config.nextStatus, trimmed.length > 0 ? trimmed : null);
    setOpen(false);
  };

  const selected = action ? ACTION_CONFIG[action] : null;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {availableActions.map((actionType) => {
          const config = ACTION_CONFIG[actionType];
          const isDestructive = config.variant === 'destructive';
          return (
            <button
              key={actionType}
              onClick={() => startAction(actionType)}
              disabled={disabled}
              className={`rounded-md border px-3 py-1 text-xs font-medium ${
                isDestructive
                  ? 'border-red-200 text-red-700 hover:bg-red-50'
                  : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {config.label}
            </button>
          );
        })}
      </div>

      {selected && (
        <ConfirmDialog
          open={open}
          onOpenChange={setOpen}
          title={selected.title}
          description={
            <div className="space-y-3">
              <p>{selected.description}</p>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">사유(선택)</label>
                <textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                  placeholder="변경 사유를 입력하세요"
                />
              </div>
            </div>
          }
          confirmText={selected.confirmText}
          onConfirm={confirm}
          confirmDisabled={disabled}
          variant={selected.variant}
        />
      )}
    </>
  );
}
