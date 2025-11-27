/**
 * @fileoverview プレゼンスインジケーターコンポーネント
 * @description オンライン/オフライン状態を表示する緑/グレーのドット
 */

'use client';

import { cn } from '@/lib/utils';

/** サイズバリエーション */
type PresenceSize = 'sm' | 'md' | 'lg';

/** プレゼンスインジケーターの Props 型 */
type PresenceIndicatorProps = {
  /** オンライン状態かどうか */
  isOnline: boolean;
  /** サイズ */
  size?: PresenceSize;
  /** 追加の CSS クラス */
  className?: string;
};

const sizeClasses: Record<PresenceSize, string> = {
  sm: 'h-2 w-2',
  md: 'h-2.5 w-2.5',
  lg: 'h-3 w-3',
};

/**
 * プレゼンスインジケーターコンポーネント
 * オンライン状態を緑色、オフライン状態をグレーで表示
 *
 * @param props - プレゼンスインジケーターの props
 * @returns プレゼンスインジケーターの JSX 要素
 */
export function PresenceIndicator({
  isOnline,
  size = 'md',
  className,
}: PresenceIndicatorProps): React.JSX.Element {
  return (
    <span
      className={cn(
        'inline-block shrink-0 rounded-full',
        sizeClasses[size],
        isOnline ? 'bg-green-500' : 'bg-gray-400',
        className
      )}
      role="status"
      aria-label={isOnline ? 'オンライン' : 'オフライン'}
    />
  );
}
