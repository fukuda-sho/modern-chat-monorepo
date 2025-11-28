/**
 * @fileoverview 追加読み込みトリガーコンポーネント
 * @description IntersectionObserver を使った無限スクロールトリガー
 */

'use client';

import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface LoadMoreTriggerProps {
  /** 交差時に呼び出されるコールバック */
  onIntersect: () => void;
  /** 読み込み中かどうか */
  isLoading: boolean;
}

/**
 * IntersectionObserver を使った追加読み込みトリガー
 * このコンポーネントが画面に表示されると onIntersect が呼び出される
 *
 * @param props - トリガー用 props
 * @returns トリガー要素の JSX
 */
export function LoadMoreTrigger({
  onIntersect,
  isLoading,
}: LoadMoreTriggerProps): React.JSX.Element {
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading) {
          onIntersect();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(trigger);

    return () => observer.disconnect();
  }, [onIntersect, isLoading]);

  return (
    <div ref={triggerRef} className="flex justify-center py-4">
      {isLoading && (
        <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
      )}
    </div>
  );
}
