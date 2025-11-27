/**
 * MessageInput コンポーネントのテスト
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { MessageInput } from './message-input';

// socketService のモック
vi.mock('@/lib/socket', () => ({
  socketService: {
    startTyping: vi.fn(),
    stopTyping: vi.fn(),
  },
}));

const TEST_ROOM_ID = 1;

describe('MessageInput', () => {
  it('テキストを入力して送信ボタンをクリックすると onSend が呼ばれ、入力がクリアされる', async () => {
    const user = userEvent.setup();
    const handleSend = vi.fn();

    render(<MessageInput roomId={TEST_ROOM_ID} onSend={handleSend} />);

    const textarea = screen.getByPlaceholderText('メッセージを入力...');
    const button = screen.getByRole('button', { name: '送信' });

    await user.type(textarea, 'hello world');
    await user.click(button);

    expect(handleSend).toHaveBeenCalledTimes(1);
    expect(handleSend).toHaveBeenCalledWith('hello world');
    expect(textarea).toHaveValue('');
  });

  it('空文字や空白のみの場合は送信されない', async () => {
    const user = userEvent.setup();
    const handleSend = vi.fn();

    render(<MessageInput roomId={TEST_ROOM_ID} onSend={handleSend} />);

    const textarea = screen.getByPlaceholderText('メッセージを入力...');
    const button = screen.getByRole('button', { name: '送信' });

    // 空白のみを入力して送信
    await user.type(textarea, '   ');
    await user.click(button);

    expect(handleSend).not.toHaveBeenCalled();
  });

  it('Enter キー（Shift なし）で送信される', async () => {
    const user = userEvent.setup();
    const handleSend = vi.fn();

    render(<MessageInput roomId={TEST_ROOM_ID} onSend={handleSend} />);

    const textarea = screen.getByPlaceholderText('メッセージを入力...');

    await user.type(textarea, 'Enter で送信');
    await user.keyboard('{Enter}');

    expect(handleSend).toHaveBeenCalledTimes(1);
    expect(handleSend).toHaveBeenCalledWith('Enter で送信');
  });

  it('Shift+Enter では送信されない（改行用）', async () => {
    const user = userEvent.setup();
    const handleSend = vi.fn();

    render(<MessageInput roomId={TEST_ROOM_ID} onSend={handleSend} />);

    const textarea = screen.getByPlaceholderText('メッセージを入力...');

    await user.type(textarea, '改行テスト');
    await user.keyboard('{Shift>}{Enter}{/Shift}');

    expect(handleSend).not.toHaveBeenCalled();
  });

  it('disabled 時はボタンが無効化され、接続中メッセージが表示される', async () => {
    const handleSend = vi.fn();

    render(
      <MessageInput roomId={TEST_ROOM_ID} onSend={handleSend} disabled />
    );

    const button = screen.getByRole('button', { name: '送信' });
    const textarea = screen.getByPlaceholderText('メッセージを入力...');

    // ボタンとテキストエリアが無効化されている
    expect(button).toBeDisabled();
    expect(textarea).toBeDisabled();

    // 接続中メッセージが表示される
    expect(
      screen.getByText('接続中... しばらくお待ちください')
    ).toBeInTheDocument();
  });

  it('入力値の前後の空白はトリムされて送信される', async () => {
    const user = userEvent.setup();
    const handleSend = vi.fn();

    render(<MessageInput roomId={TEST_ROOM_ID} onSend={handleSend} />);

    const textarea = screen.getByPlaceholderText('メッセージを入力...');
    const button = screen.getByRole('button', { name: '送信' });

    await user.type(textarea, '  トリムされる  ');
    await user.click(button);

    expect(handleSend).toHaveBeenCalledWith('トリムされる');
  });
});
