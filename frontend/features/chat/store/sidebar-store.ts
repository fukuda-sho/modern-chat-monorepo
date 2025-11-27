/**
 * @fileoverview Sidebar Store
 * @description アコーディオンサイドバーの状態を管理する Zustand ストア
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';

/** サイドバーセクションの種類 */
export type SidebarSection = 'starred' | 'channels' | 'dms';

/** サイドバー状態の型 */
export interface SidebarState {
  /** 展開されているセクションの配列 */
  expandedSections: SidebarSection[];
  /** セクションの展開状態を切り替える */
  toggleSection: (section: SidebarSection) => void;
  /** セクションの展開状態を設定する */
  setExpandedSections: (sections: SidebarSection[]) => void;
  /** 特定のセクションを展開する */
  expandSection: (section: SidebarSection) => void;
  /** 特定のセクションを折りたたむ */
  collapseSection: (section: SidebarSection) => void;
  /** 全セクションを展開する */
  expandAll: () => void;
  /** 全セクションを折りたたむ */
  collapseAll: () => void;
}

/** 全セクションのリスト */
const ALL_SECTIONS: SidebarSection[] = ['starred', 'channels', 'dms'];

/** デフォルトで展開するセクション */
const DEFAULT_EXPANDED: SidebarSection[] = ['channels'];

/**
 * サイドバー状態管理ストア
 * - localStorage に永続化
 * - 展開/折りたたみ状態を管理
 */
export const useSidebarStore = create<SidebarState>()(
  devtools(
    persist(
      (set) => ({
        expandedSections: DEFAULT_EXPANDED,

        toggleSection: (section) =>
          set(
            (state) => ({
              expandedSections: state.expandedSections.includes(section)
                ? state.expandedSections.filter((s) => s !== section)
                : [...state.expandedSections, section],
            }),
            false,
            'sidebar/toggleSection',
          ),

        setExpandedSections: (sections) =>
          set(
            { expandedSections: sections },
            false,
            'sidebar/setExpandedSections',
          ),

        expandSection: (section) =>
          set(
            (state) => ({
              expandedSections: state.expandedSections.includes(section)
                ? state.expandedSections
                : [...state.expandedSections, section],
            }),
            false,
            'sidebar/expandSection',
          ),

        collapseSection: (section) =>
          set(
            (state) => ({
              expandedSections: state.expandedSections.filter((s) => s !== section),
            }),
            false,
            'sidebar/collapseSection',
          ),

        expandAll: () =>
          set(
            { expandedSections: ALL_SECTIONS },
            false,
            'sidebar/expandAll',
          ),

        collapseAll: () =>
          set(
            { expandedSections: [] },
            false,
            'sidebar/collapseAll',
          ),
      }),
      {
        name: 'sidebar-accordion-state',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({ expandedSections: state.expandedSections }),
      },
    ),
    { name: 'SidebarStore' },
  ),
);
