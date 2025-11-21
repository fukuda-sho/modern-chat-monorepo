import { render, screen } from '@testing-library/react';
import { ChatMessage } from './ChatMessage';

describe('ChatMessage', () => {
  const mockProps = {
    content: 'Hello World',
    username: 'testuser',
    createdAt: '2023-01-01T10:00:00Z',
    isOwnMessage: false,
  };

  it('renders message content correctly', () => {
    render(<ChatMessage {...mockProps} />);

    expect(screen.getByText('Hello World')).toBeInTheDocument();
    expect(screen.getByText('testuser')).toBeInTheDocument();
    // Time check might depend on locale, but we can check it renders something
  });

  it('applies different styles for own message', () => {
    const { rerender } = render(
      <ChatMessage {...mockProps} isOwnMessage={true} />
    );

    const container = screen.getByTestId('chat-message-container');
    expect(container).toHaveClass('flex-row-reverse');

    const messageBubble = screen.getByText('Hello World').closest('div');
    expect(messageBubble).toHaveClass('bg-blue-500');
  });

  it('applies different styles for other user message', () => {
    render(<ChatMessage {...mockProps} isOwnMessage={false} />);

    const container = screen.getByTestId('chat-message-container');
    expect(container).toHaveClass('flex-row');

    const messageBubble = screen.getByText('Hello World').closest('div');
    expect(messageBubble).toHaveClass('bg-gray-200');
  });
});
