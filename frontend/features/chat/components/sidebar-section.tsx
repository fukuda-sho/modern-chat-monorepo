/**
 * @fileoverview Sidebar Section Component
 * @description アコーディオンサイドバーの個別セクション
 */

'use client';

import { ChevronRight, Plus } from 'lucide-react';
import {
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';

/** SidebarSection のプロップス */
interface SidebarSectionProps {
  /** セクションの値（Accordion の value として使用） */
  value: string;
  /** セクションのタイトル */
  title: string;
  /** タイトルの左に表示するアイコン */
  icon?: React.ReactNode;
  /** セクション内のコンテンツ */
  children: React.ReactNode;
  /** 追加ボタンのクリックハンドラ */
  onAddClick?: () => void;
  /** 追加ボタンのツールチップ */
  addButtonLabel?: string;
  /** アイテム数（バッジ表示用） */
  itemCount?: number;
  /** セクションが空の場合のメッセージ */
  emptyMessage?: string;
  /** セクションが空かどうか */
  isEmpty?: boolean;
}

/**
 * SidebarSection コンポーネント
 * @description アコーディオンの個別セクションを表示
 */
export function SidebarSection({
  value,
  title,
  icon,
  children,
  onAddClick,
  addButtonLabel = '追加',
  itemCount,
  emptyMessage = 'アイテムがありません',
  isEmpty = false,
}: SidebarSectionProps) {
  return (
    <AccordionItem value={value} className="border-b-0">
      <div className="flex items-center">
        <AccordionTrigger className="flex-1 py-2 px-2 hover:no-underline hover:bg-accent/50 rounded-md [&[data-state=open]>svg]:rotate-90">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ChevronRight className="h-4 w-4 shrink-0 transition-transform duration-200" />
            {icon}
            <span>{title}</span>
            {typeof itemCount === 'number' && itemCount > 0 && (
              <span className="text-xs text-muted-foreground">({itemCount})</span>
            )}
          </div>
        </AccordionTrigger>
        {onAddClick && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 mr-2"
            onClick={(e) => {
              e.stopPropagation();
              onAddClick();
            }}
            aria-label={addButtonLabel}
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>
      <AccordionContent className="pb-2">
        <div className="pl-4 pr-2 space-y-0.5">
          {isEmpty ? (
            <p className="text-xs text-muted-foreground py-2 px-2">{emptyMessage}</p>
          ) : (
            children
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
