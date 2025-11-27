/**
 * @fileoverview Sidebar Accordion Component
 * @description Slack ライクなアコーディオンサイドバー
 */

'use client';

import { useState } from 'react';
import { Star, Hash, MessageCircle } from 'lucide-react';
import { Accordion } from '@/components/ui/accordion';
import { useSidebarStore, type SidebarSection as SectionType } from '../store/sidebar-store';
import { useCategorizedChannels } from '../hooks/use-channels';
import { SidebarSection } from './sidebar-section';
import { ChannelItem } from './channel-item';
import { BrowseChannelsDialog } from './browse-channels-dialog';
import { CreateRoomDialog } from './create-room-dialog';

/**
 * SidebarAccordion コンポーネント
 * @description スター付き、チャンネル、DM の3セクションを持つアコーディオンサイドバー
 */
export function SidebarAccordion() {
  const { expandedSections, setExpandedSections } = useSidebarStore();
  const { starred, channels, dms, isLoading, error } = useCategorizedChannels();

  const [isBrowseDialogOpen, setIsBrowseDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const handleValueChange = (value: string[]) => {
    setExpandedSections(value as SectionType[]);
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-8 bg-muted animate-pulse rounded" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-destructive">
        チャンネルの読み込みに失敗しました
      </div>
    );
  }

  return (
    <>
      <Accordion
        type="multiple"
        value={expandedSections}
        onValueChange={handleValueChange}
        className="w-full"
      >
        {/* Starred Section */}
        <SidebarSection
          value="starred"
          title="Starred"
          icon={<Star className="h-4 w-4 text-yellow-500" />}
          itemCount={starred.length}
          isEmpty={starred.length === 0}
          emptyMessage="スター付きチャンネルはありません"
        >
          {starred.map((channel) => (
            <ChannelItem key={channel.id} channel={channel} />
          ))}
        </SidebarSection>

        {/* Channels Section */}
        <SidebarSection
          value="channels"
          title="Channels"
          icon={<Hash className="h-4 w-4" />}
          itemCount={channels.length}
          onAddClick={() => setIsCreateDialogOpen(true)}
          addButtonLabel="チャンネルを作成"
          isEmpty={channels.length === 0}
          emptyMessage="参加チャンネルがありません"
        >
          {channels.map((channel) => (
            <ChannelItem key={channel.id} channel={channel} />
          ))}
          <button
            onClick={() => setIsBrowseDialogOpen(true)}
            className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Hash className="h-4 w-4" />
            <span>チャンネルを探す</span>
          </button>
        </SidebarSection>

        {/* Direct Messages Section */}
        <SidebarSection
          value="dms"
          title="Direct Messages"
          icon={<MessageCircle className="h-4 w-4" />}
          itemCount={dms.length}
          isEmpty={dms.length === 0}
          emptyMessage="DMはまだありません"
        >
          {dms.map((channel) => (
            <ChannelItem key={channel.id} channel={channel} compact />
          ))}
        </SidebarSection>
      </Accordion>

      {/* Dialogs */}
      <BrowseChannelsDialog
        open={isBrowseDialogOpen}
        onOpenChange={setIsBrowseDialogOpen}
      />
      <CreateRoomDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </>
  );
}
