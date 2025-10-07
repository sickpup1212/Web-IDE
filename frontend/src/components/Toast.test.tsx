import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import Toast, { ToastContainer, ToastProps } from './Toast';

describe('Toast Component - Basic Rendering', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('renders toast with message', () => {
    render(
      <Toast
        id="test-toast"
        message="Test message"
        type="info"
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  test('applies correct type class for success toast', () => {
    const { container } = render(
      <Toast
        id="test-toast"
        message="Success message"
        type="success"
        onClose={mockOnClose}
      />
    );

    const toast = container.querySelector('.toast');
    expect(toast).toHaveClass('toast-success');
  });

  test('applies correct type class for error toast', () => {
    const { container } = render(
      <Toast
        id="test-toast"
        message="Error message"
        type="error"
        onClose={mockOnClose}
      />
    );

    const toast = container.querySelector('.toast');
    expect(toast).toHaveClass('toast-error');
  });

  test('applies correct type class for info toast', () => {
    const { container } = render(
      <Toast
        id="test-toast"
        message="Info message"
        type="info"
        onClose={mockOnClose}
      />
    );

    const toast = container.querySelector('.toast');
    expect(toast).toHaveClass('toast-info');
  });

  test('renders close button', () => {
    render(
      <Toast
        id="test-toast"
        message="Test message"
        type="info"
        onClose={mockOnClose}
      />
    );

    const closeButton = screen.getByLabelText('Close');
    expect(closeButton).toBeInTheDocument();
  });

  test('renders icon for toast type', () => {
    const { container } = render(
      <Toast
        id="test-toast"
        message="Test message"
        type="success"
        onClose={mockOnClose}
      />
    );

    const icon = container.querySelector('.toast-icon');
    expect(icon).toBeInTheDocument();
  });
});

describe('Toast Component - Icon Rendering', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('renders success icon for success type', () => {
    const { container } = render(
      <Toast
        id="test-toast"
        message="Success"
        type="success"
        onClose={mockOnClose}
      />
    );

    const icon = container.querySelector('.toast-icon svg');
    expect(icon).toBeInTheDocument();
  });

  test('renders error icon for error type', () => {
    const { container } = render(
      <Toast
        id="test-toast"
        message="Error"
        type="error"
        onClose={mockOnClose}
      />
    );

    const icon = container.querySelector('.toast-icon svg');
    expect(icon).toBeInTheDocument();
  });

  test('renders info icon for info type', () => {
    const { container } = render(
      <Toast
        id="test-toast"
        message="Info"
        type="info"
        onClose={mockOnClose}
      />
    );

    const icon = container.querySelector('.toast-icon svg');
    expect(icon).toBeInTheDocument();
  });
});

describe('Toast Component - Close Button Interaction', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('calls onClose with toast id when close button is clicked', () => {
    render(
      <Toast
        id="test-toast-123"
        message="Test message"
        type="info"
        onClose={mockOnClose}
      />
    );

    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledWith('test-toast-123');
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('close button is clickable', () => {
    render(
      <Toast
        id="test-toast"
        message="Test message"
        type="info"
        onClose={mockOnClose}
      />
    );

    const closeButton = screen.getByLabelText('Close');
    expect(closeButton).not.toBeDisabled();
  });
});

describe('Toast Component - Auto-dismiss', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('auto-dismisses after default duration (3000ms)', () => {
    render(
      <Toast
        id="test-toast"
        message="Test message"
        type="info"
        onClose={mockOnClose}
      />
    );

    expect(mockOnClose).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(mockOnClose).toHaveBeenCalledWith('test-toast');
  });

  test('auto-dismisses after custom duration', () => {
    render(
      <Toast
        id="test-toast"
        message="Test message"
        type="info"
        onClose={mockOnClose}
        duration={5000}
      />
    );

    expect(mockOnClose).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(4999);
    });

    expect(mockOnClose).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(mockOnClose).toHaveBeenCalledWith('test-toast');
  });

  test('does not auto-dismiss before duration expires', () => {
    render(
      <Toast
        id="test-toast"
        message="Test message"
        type="info"
        onClose={mockOnClose}
        duration={3000}
      />
    );

    act(() => {
      jest.advanceTimersByTime(2999);
    });

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  test('cleans up timer when component unmounts', () => {
    const { unmount } = render(
      <Toast
        id="test-toast"
        message="Test message"
        type="info"
        onClose={mockOnClose}
        duration={3000}
      />
    );

    unmount();

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    // onClose should not be called after unmount
    expect(mockOnClose).not.toHaveBeenCalled();
  });
});

describe('Toast Component - Message Content', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('displays short message', () => {
    render(
      <Toast
        id="test-toast"
        message="Short"
        type="info"
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Short')).toBeInTheDocument();
  });

  test('displays long message', () => {
    const longMessage = 'This is a very long message that should still be displayed correctly in the toast notification component without any issues';

    render(
      <Toast
        id="test-toast"
        message={longMessage}
        type="info"
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText(longMessage)).toBeInTheDocument();
  });

  test('displays message with special characters', () => {
    const specialMessage = 'Message with & <special> "characters"';

    render(
      <Toast
        id="test-toast"
        message={specialMessage}
        type="info"
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText(specialMessage)).toBeInTheDocument();
  });

  test('displays empty message', () => {
    const { container } = render(
      <Toast
        id="test-toast"
        message=""
        type="info"
        onClose={mockOnClose}
      />
    );

    const messageElement = container.querySelector('.toast-message');
    expect(messageElement).toBeInTheDocument();
    expect(messageElement?.textContent).toBe('');
  });
});

describe('Toast Component - Structure', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('has proper toast structure', () => {
    const { container } = render(
      <Toast
        id="test-toast"
        message="Test"
        type="info"
        onClose={mockOnClose}
      />
    );

    expect(container.querySelector('.toast')).toBeInTheDocument();
    expect(container.querySelector('.toast-icon')).toBeInTheDocument();
    expect(container.querySelector('.toast-message')).toBeInTheDocument();
    expect(container.querySelector('.toast-close')).toBeInTheDocument();
  });

  test('close button has proper aria-label', () => {
    render(
      <Toast
        id="test-toast"
        message="Test"
        type="info"
        onClose={mockOnClose}
      />
    );

    const closeButton = screen.getByLabelText('Close');
    expect(closeButton).toHaveClass('toast-close');
  });
});

describe('ToastContainer Component', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('renders empty container when no toasts', () => {
    const { container } = render(<ToastContainer toasts={[]} />);

    const toastContainer = container.querySelector('.toast-container');
    expect(toastContainer).toBeInTheDocument();
    expect(toastContainer?.children.length).toBe(0);
  });

  test('renders single toast', () => {
    const toasts: ToastProps[] = [
      {
        id: 'toast-1',
        message: 'Test toast',
        type: 'info',
        onClose: mockOnClose,
      },
    ];

    render(<ToastContainer toasts={toasts} />);

    expect(screen.getByText('Test toast')).toBeInTheDocument();
  });

  test('renders multiple toasts', () => {
    const toasts: ToastProps[] = [
      {
        id: 'toast-1',
        message: 'First toast',
        type: 'success',
        onClose: mockOnClose,
      },
      {
        id: 'toast-2',
        message: 'Second toast',
        type: 'error',
        onClose: mockOnClose,
      },
      {
        id: 'toast-3',
        message: 'Third toast',
        type: 'info',
        onClose: mockOnClose,
      },
    ];

    render(<ToastContainer toasts={toasts} />);

    expect(screen.getByText('First toast')).toBeInTheDocument();
    expect(screen.getByText('Second toast')).toBeInTheDocument();
    expect(screen.getByText('Third toast')).toBeInTheDocument();
  });

  test('each toast has unique key', () => {
    const toasts: ToastProps[] = [
      {
        id: 'toast-1',
        message: 'First',
        type: 'info',
        onClose: mockOnClose,
      },
      {
        id: 'toast-2',
        message: 'Second',
        type: 'info',
        onClose: mockOnClose,
      },
    ];

    const { container } = render(<ToastContainer toasts={toasts} />);

    const toastElements = container.querySelectorAll('.toast');
    expect(toastElements.length).toBe(2);
  });

  test('stacks toasts vertically', () => {
    const toasts: ToastProps[] = [
      {
        id: 'toast-1',
        message: 'First',
        type: 'info',
        onClose: mockOnClose,
      },
      {
        id: 'toast-2',
        message: 'Second',
        type: 'info',
        onClose: mockOnClose,
      },
    ];

    const { container } = render(<ToastContainer toasts={toasts} />);

    const toastContainer = container.querySelector('.toast-container');
    expect(toastContainer).toBeInTheDocument();

    const toastElements = container.querySelectorAll('.toast');
    expect(toastElements.length).toBe(2);
  });

  test('renders toasts with different types', () => {
    const toasts: ToastProps[] = [
      {
        id: 'toast-1',
        message: 'Success',
        type: 'success',
        onClose: mockOnClose,
      },
      {
        id: 'toast-2',
        message: 'Error',
        type: 'error',
        onClose: mockOnClose,
      },
      {
        id: 'toast-3',
        message: 'Info',
        type: 'info',
        onClose: mockOnClose,
      },
    ];

    const { container } = render(<ToastContainer toasts={toasts} />);

    expect(container.querySelector('.toast-success')).toBeInTheDocument();
    expect(container.querySelector('.toast-error')).toBeInTheDocument();
    expect(container.querySelector('.toast-info')).toBeInTheDocument();
  });
});

describe('ToastContainer Component - Dynamic Updates', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('updates when toast is added', () => {
    const initialToasts: ToastProps[] = [
      {
        id: 'toast-1',
        message: 'First',
        type: 'info',
        onClose: mockOnClose,
      },
    ];

    const { rerender } = render(<ToastContainer toasts={initialToasts} />);

    expect(screen.getByText('First')).toBeInTheDocument();

    const updatedToasts: ToastProps[] = [
      ...initialToasts,
      {
        id: 'toast-2',
        message: 'Second',
        type: 'success',
        onClose: mockOnClose,
      },
    ];

    rerender(<ToastContainer toasts={updatedToasts} />);

    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });

  test('updates when toast is removed', () => {
    const initialToasts: ToastProps[] = [
      {
        id: 'toast-1',
        message: 'First',
        type: 'info',
        onClose: mockOnClose,
      },
      {
        id: 'toast-2',
        message: 'Second',
        type: 'info',
        onClose: mockOnClose,
      },
    ];

    const { rerender } = render(<ToastContainer toasts={initialToasts} />);

    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();

    const updatedToasts: ToastProps[] = [initialToasts[1]];

    rerender(<ToastContainer toasts={updatedToasts} />);

    expect(screen.queryByText('First')).not.toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });

  test('handles clearing all toasts', () => {
    const initialToasts: ToastProps[] = [
      {
        id: 'toast-1',
        message: 'First',
        type: 'info',
        onClose: mockOnClose,
      },
      {
        id: 'toast-2',
        message: 'Second',
        type: 'info',
        onClose: mockOnClose,
      },
    ];

    const { rerender, container } = render(<ToastContainer toasts={initialToasts} />);

    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();

    rerender(<ToastContainer toasts={[]} />);

    expect(screen.queryByText('First')).not.toBeInTheDocument();
    expect(screen.queryByText('Second')).not.toBeInTheDocument();

    const toastContainer = container.querySelector('.toast-container');
    expect(toastContainer?.children.length).toBe(0);
  });
});
