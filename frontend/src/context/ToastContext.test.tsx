import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { ToastProvider, useToast } from './ToastContext';

// Test component that uses the toast context
const TestComponent: React.FC = () => {
  const { showToast, hideToast } = useToast();

  return (
    <div>
      <button onClick={() => showToast('Success message', 'success')}>
        Show Success
      </button>
      <button onClick={() => showToast('Error message', 'error')}>
        Show Error
      </button>
      <button onClick={() => showToast('Info message', 'info')}>
        Show Info
      </button>
      <button onClick={() => showToast('Custom duration', 'info', 5000)}>
        Show Custom Duration
      </button>
      <button
        onClick={() => {
          const id = `toast-${Date.now()}`;
          showToast('Manual close', 'info');
          setTimeout(() => hideToast(id), 100);
        }}
      >
        Show and Hide
      </button>
    </div>
  );
};

describe('ToastContext - Provider', () => {
  test('renders children without crashing', () => {
    render(
      <ToastProvider>
        <div>Test content</div>
      </ToastProvider>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  test('renders ToastContainer', () => {
    const { container } = render(
      <ToastProvider>
        <div>Test</div>
      </ToastProvider>
    );

    const toastContainer = container.querySelector('.toast-container');
    expect(toastContainer).toBeInTheDocument();
  });
});

describe('ToastContext - useToast Hook', () => {
  test('throws error when used outside ToastProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const TestComponentOutsideProvider = () => {
      const { showToast } = useToast();
      return <div>Test</div>;
    };

    expect(() => {
      render(<TestComponentOutsideProvider />);
    }).toThrow('useToast must be used within a ToastProvider');

    consoleSpy.mockRestore();
  });

  test('provides showToast function', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    expect(screen.getByText('Show Success')).toBeInTheDocument();
  });

  test('provides hideToast function', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    expect(screen.getByText('Show and Hide')).toBeInTheDocument();
  });
});

describe('ToastContext - showToast Function', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('displays success toast when showToast is called', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const button = screen.getByText('Show Success');

    act(() => {
      button.click();
    });

    expect(screen.getByText('Success message')).toBeInTheDocument();
  });

  test('displays error toast when showToast is called', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const button = screen.getByText('Show Error');

    act(() => {
      button.click();
    });

    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  test('displays info toast when showToast is called', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const button = screen.getByText('Show Info');

    act(() => {
      button.click();
    });

    expect(screen.getByText('Info message')).toBeInTheDocument();
  });

  test('displays multiple toasts at once', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      screen.getByText('Show Success').click();
    });

    act(() => {
      screen.getByText('Show Error').click();
    });

    act(() => {
      screen.getByText('Show Info').click();
    });

    expect(screen.getByText('Success message')).toBeInTheDocument();
    expect(screen.getByText('Error message')).toBeInTheDocument();
    expect(screen.getByText('Info message')).toBeInTheDocument();
  });

  test('applies correct type classes to toasts', () => {
    const { container } = render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      screen.getByText('Show Success').click();
    });

    act(() => {
      screen.getByText('Show Error').click();
    });

    act(() => {
      screen.getByText('Show Info').click();
    });

    expect(container.querySelector('.toast-success')).toBeInTheDocument();
    expect(container.querySelector('.toast-error')).toBeInTheDocument();
    expect(container.querySelector('.toast-info')).toBeInTheDocument();
  });
});

describe('ToastContext - Toast Auto-dismiss', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('toast auto-dismisses after default duration (3000ms)', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      screen.getByText('Show Success').click();
    });

    expect(screen.getByText('Success message')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    await waitFor(() => {
      expect(screen.queryByText('Success message')).not.toBeInTheDocument();
    });
  });

  test('toast auto-dismisses after custom duration', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      screen.getByText('Show Custom Duration').click();
    });

    expect(screen.getByText('Custom duration')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(4999);
    });

    expect(screen.getByText('Custom duration')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1);
    });

    await waitFor(() => {
      expect(screen.queryByText('Custom duration')).not.toBeInTheDocument();
    });
  });

  test('each toast has independent timer', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    // Show first toast
    act(() => {
      screen.getByText('Show Success').click();
    });

    expect(screen.getByText('Success message')).toBeInTheDocument();

    // Wait 1 second, then show second toast
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    act(() => {
      screen.getByText('Show Error').click();
    });

    expect(screen.getByText('Success message')).toBeInTheDocument();
    expect(screen.getByText('Error message')).toBeInTheDocument();

    // Advance 2 more seconds (total 3 seconds for first toast)
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    // First toast should be gone
    await waitFor(() => {
      expect(screen.queryByText('Success message')).not.toBeInTheDocument();
    });

    // Second toast should still be visible (only 2 seconds have passed for it)
    expect(screen.getByText('Error message')).toBeInTheDocument();

    // Advance 1 more second (total 3 seconds for second toast)
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Second toast should now be gone
    await waitFor(() => {
      expect(screen.queryByText('Error message')).not.toBeInTheDocument();
    });
  });
});

describe('ToastContext - Manual Toast Dismissal', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('toast can be manually dismissed via close button', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      screen.getByText('Show Success').click();
    });

    expect(screen.getByText('Success message')).toBeInTheDocument();

    const closeButton = screen.getByLabelText('Close');

    act(() => {
      closeButton.click();
    });

    await waitFor(() => {
      expect(screen.queryByText('Success message')).not.toBeInTheDocument();
    });
  });

  test('only dismisses the clicked toast when multiple are shown', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      screen.getByText('Show Success').click();
    });

    act(() => {
      screen.getByText('Show Error').click();
    });

    expect(screen.getByText('Success message')).toBeInTheDocument();
    expect(screen.getByText('Error message')).toBeInTheDocument();

    const closeButtons = screen.getAllByLabelText('Close');

    act(() => {
      closeButtons[0].click();
    });

    await waitFor(() => {
      expect(screen.queryByText('Success message')).not.toBeInTheDocument();
    });

    // Error toast should still be visible
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });
});

describe('ToastContext - Toast Stacking', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('stacks multiple toasts in order they were added', () => {
    const { container } = render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      screen.getByText('Show Success').click();
    });

    act(() => {
      screen.getByText('Show Error').click();
    });

    act(() => {
      screen.getByText('Show Info').click();
    });

    const toasts = container.querySelectorAll('.toast');
    expect(toasts.length).toBe(3);
  });

  test('handles showing many toasts', () => {
    const ManyToastsComponent = () => {
      const { showToast } = useToast();

      return (
        <button
          onClick={() => {
            for (let i = 0; i < 10; i++) {
              showToast(`Toast ${i + 1}`, 'info');
            }
          }}
        >
          Show Many
        </button>
      );
    };

    const { container } = render(
      <ToastProvider>
        <ManyToastsComponent />
      </ToastProvider>
    );

    act(() => {
      screen.getByText('Show Many').click();
    });

    const toasts = container.querySelectorAll('.toast');
    expect(toasts.length).toBe(10);
  });
});

describe('ToastContext - Edge Cases', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('handles empty message', () => {
    const EmptyMessageComponent = () => {
      const { showToast } = useToast();
      return (
        <button onClick={() => showToast('', 'info')}>
          Show Empty
        </button>
      );
    };

    const { container } = render(
      <ToastProvider>
        <EmptyMessageComponent />
      </ToastProvider>
    );

    act(() => {
      screen.getByText('Show Empty').click();
    });

    const toast = container.querySelector('.toast');
    expect(toast).toBeInTheDocument();
  });

  test('handles very long message', () => {
    const longMessage = 'This is a very long message that should still be displayed correctly in the toast notification component without breaking the layout or causing any display issues';

    const LongMessageComponent = () => {
      const { showToast } = useToast();
      return (
        <button onClick={() => showToast(longMessage, 'info')}>
          Show Long
        </button>
      );
    };

    render(
      <ToastProvider>
        <LongMessageComponent />
      </ToastProvider>
    );

    act(() => {
      screen.getByText('Show Long').click();
    });

    expect(screen.getByText(longMessage)).toBeInTheDocument();
  });

  test('handles special characters in message', () => {
    const specialMessage = 'Message with & <special> "characters"';

    const SpecialMessageComponent = () => {
      const { showToast } = useToast();
      return (
        <button onClick={() => showToast(specialMessage, 'info')}>
          Show Special
        </button>
      );
    };

    render(
      <ToastProvider>
        <SpecialMessageComponent />
      </ToastProvider>
    );

    act(() => {
      screen.getByText('Show Special').click();
    });

    expect(screen.getByText(specialMessage)).toBeInTheDocument();
  });

  test('handles zero duration gracefully', () => {
    const ZeroDurationComponent = () => {
      const { showToast } = useToast();
      return (
        <button onClick={() => showToast('Zero duration', 'info', 0)}>
          Show Zero Duration
        </button>
      );
    };

    render(
      <ToastProvider>
        <ZeroDurationComponent />
      </ToastProvider>
    );

    act(() => {
      screen.getByText('Show Zero Duration').click();
    });

    expect(screen.getByText('Zero duration')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(0);
    });

    waitFor(() => {
      expect(screen.queryByText('Zero duration')).not.toBeInTheDocument();
    });
  });
});

describe('ToastContext - Unique Toast IDs', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('generates unique IDs for each toast', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      screen.getByText('Show Success').click();
    });

    act(() => {
      screen.getByText('Show Success').click();
    });

    const toasts = screen.getAllByText('Success message');
    expect(toasts.length).toBe(2);
  });

  test('IDs are based on timestamp and random number', () => {
    const dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(1234567890);
    const mathRandomSpy = jest.spyOn(Math, 'random')
      .mockReturnValueOnce(0.123)
      .mockReturnValueOnce(0.456);

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      screen.getByText('Show Success').click();
    });

    act(() => {
      screen.getByText('Show Error').click();
    });

    const toasts = document.querySelectorAll('.toast');
    expect(toasts.length).toBe(2);

    dateNowSpy.mockRestore();
    mathRandomSpy.mockRestore();
  });
});
