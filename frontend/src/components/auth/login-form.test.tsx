import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginForm } from './LoginForm';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

// Mock api and useRouter
jest.mock('@/lib/api');
jest.mock('next/navigation');

describe('LoginForm', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  it('renders form elements', () => {
    render(<LoginForm />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('displays validation error when submitting empty form', async () => {
    render(<LoginForm />);

    const submitButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(submitButton);

    // Wait for validation messages
    await waitFor(() => {
      // These might differ depending on Zod schema default error messages or browser language,
      // but typically "Required" or "Invalid email"
      // Zod email check
      const emailError =
        screen.queryByText(/Invalid email/i) || screen.queryByText(/Required/i);
      // Zod min(6) check
      const passwordError =
        screen.queryByText(/String must contain at least 6 character\(s\)/i) ||
        screen.queryByText(/at least 6 characters/i);

      // We can check using more resilient queries or just verify something appeared.
      // Since we defined "Password must be at least 6 characters" in schema (in previous step), expect that.
      // For email, zod default is "Invalid email".
    });

    // Since we didn't put custom messages for all, let's just check the input is invalid if possible or texts appear
    // In React Hook Form, texts appear.
    // In Zod: email() -> "Invalid email"

    expect(await screen.findByText(/Invalid email/i)).toBeInTheDocument();
    expect(
      await screen.findByText(/Password must be at least 6 characters/i)
    ).toBeInTheDocument();

    expect(api.post).not.toHaveBeenCalled();
  });

  it('calls api.post and redirects on successful login', async () => {
    (api.post as jest.Mock).mockResolvedValue({
      data: { access_token: 'fake-token' },
    });

    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      });
    });

    expect(localStorage.getItem('accessToken')).toBe('fake-token');
    expect(mockPush).toHaveBeenCalledWith('/');
  });
});
