import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Dropdown, { DropdownMenuItem } from './Dropdown';

describe('Dropdown Component - Basic Rendering', () => {
  const mockItems: DropdownMenuItem[] = [
    { label: 'Item 1', onClick: jest.fn() },
    { label: 'Item 2', onClick: jest.fn() },
    { label: 'Item 3', onClick: jest.fn() },
  ];

  test('renders dropdown trigger', () => {
    render(
      <Dropdown
        trigger={<button>Menu</button>}
        items={mockItems}
      />
    );

    expect(screen.getByText('Menu')).toBeInTheDocument();
  });

  test('dropdown menu is hidden by default', () => {
    render(
      <Dropdown
        trigger={<button>Menu</button>}
        items={mockItems}
      />
    );

    expect(screen.queryByText('Item 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Item 2')).not.toBeInTheDocument();
    expect(screen.queryByText('Item 3')).not.toBeInTheDocument();
  });

  test('renders custom trigger element', () => {
    render(
      <Dropdown
        trigger={<div className="custom-trigger">Custom Trigger</div>}
        items={mockItems}
      />
    );

    expect(screen.getByText('Custom Trigger')).toBeInTheDocument();
    const trigger = screen.getByText('Custom Trigger').parentElement;
    expect(trigger).toHaveClass('dropdown-trigger');
  });
});

describe('Dropdown Component - Open and Close', () => {
  const mockItems: DropdownMenuItem[] = [
    { label: 'Open', onClick: jest.fn() },
    { label: 'Edit', onClick: jest.fn() },
    { label: 'Delete', onClick: jest.fn(), variant: 'danger' },
  ];

  test('opens dropdown when trigger is clicked', () => {
    render(
      <Dropdown
        trigger={<button>Menu</button>}
        items={mockItems}
      />
    );

    const trigger = screen.getByText('Menu');
    fireEvent.click(trigger);

    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  test('closes dropdown when trigger is clicked again', () => {
    render(
      <Dropdown
        trigger={<button>Menu</button>}
        items={mockItems}
      />
    );

    const trigger = screen.getByText('Menu');

    // Open dropdown
    fireEvent.click(trigger);
    expect(screen.getByText('Open')).toBeInTheDocument();

    // Close dropdown
    fireEvent.click(trigger);
    expect(screen.queryByText('Open')).not.toBeInTheDocument();
  });

  test('toggles dropdown open and close multiple times', () => {
    render(
      <Dropdown
        trigger={<button>Menu</button>}
        items={mockItems}
      />
    );

    const trigger = screen.getByText('Menu');

    // Open
    fireEvent.click(trigger);
    expect(screen.getByText('Open')).toBeInTheDocument();

    // Close
    fireEvent.click(trigger);
    expect(screen.queryByText('Open')).not.toBeInTheDocument();

    // Open again
    fireEvent.click(trigger);
    expect(screen.getByText('Open')).toBeInTheDocument();

    // Close again
    fireEvent.click(trigger);
    expect(screen.queryByText('Open')).not.toBeInTheDocument();
  });
});

describe('Dropdown Component - Click Outside Behavior', () => {
  const mockItems: DropdownMenuItem[] = [
    { label: 'Item 1', onClick: jest.fn() },
    { label: 'Item 2', onClick: jest.fn() },
  ];

  test('closes dropdown when clicking outside', async () => {
    render(
      <div>
        <Dropdown
          trigger={<button>Menu</button>}
          items={mockItems}
        />
        <div data-testid="outside">Outside Element</div>
      </div>
    );

    const trigger = screen.getByText('Menu');

    // Open dropdown
    fireEvent.click(trigger);
    expect(screen.getByText('Item 1')).toBeInTheDocument();

    // Click outside
    const outsideElement = screen.getByTestId('outside');
    fireEvent.mouseDown(outsideElement);

    await waitFor(() => {
      expect(screen.queryByText('Item 1')).not.toBeInTheDocument();
    });
  });

  test('does not close dropdown when clicking inside menu', () => {
    render(
      <Dropdown
        trigger={<button>Menu</button>}
        items={mockItems}
      />
    );

    const trigger = screen.getByText('Menu');

    // Open dropdown
    fireEvent.click(trigger);
    expect(screen.getByText('Item 1')).toBeInTheDocument();

    // Click on menu item (this will close via onClick handler, not click outside)
    const menuItem = screen.getByText('Item 1');
    fireEvent.click(menuItem);

    // Menu should close because item was clicked, not because of click outside
    expect(screen.queryByText('Item 1')).not.toBeInTheDocument();
  });

  test('does not close dropdown when clicking on trigger while open', () => {
    render(
      <Dropdown
        trigger={<button>Menu</button>}
        items={mockItems}
      />
    );

    const trigger = screen.getByText('Menu');

    // Open dropdown
    fireEvent.click(trigger);
    expect(screen.getByText('Item 1')).toBeInTheDocument();

    // Click trigger again - should toggle closed
    fireEvent.click(trigger);
    expect(screen.queryByText('Item 1')).not.toBeInTheDocument();
  });
});

describe('Dropdown Component - Escape Key Behavior', () => {
  const mockItems: DropdownMenuItem[] = [
    { label: 'Item 1', onClick: jest.fn() },
    { label: 'Item 2', onClick: jest.fn() },
  ];

  test('closes dropdown when Escape key is pressed', () => {
    render(
      <Dropdown
        trigger={<button>Menu</button>}
        items={mockItems}
      />
    );

    const trigger = screen.getByText('Menu');

    // Open dropdown
    fireEvent.click(trigger);
    expect(screen.getByText('Item 1')).toBeInTheDocument();

    // Press Escape key
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByText('Item 1')).not.toBeInTheDocument();
  });

  test('does not close dropdown when other keys are pressed', () => {
    render(
      <Dropdown
        trigger={<button>Menu</button>}
        items={mockItems}
      />
    );

    const trigger = screen.getByText('Menu');

    // Open dropdown
    fireEvent.click(trigger);
    expect(screen.getByText('Item 1')).toBeInTheDocument();

    // Press other keys
    fireEvent.keyDown(document, { key: 'Enter' });
    expect(screen.getByText('Item 1')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Tab' });
    expect(screen.getByText('Item 1')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Space' });
    expect(screen.getByText('Item 1')).toBeInTheDocument();
  });

  test('Escape key does nothing when dropdown is closed', () => {
    render(
      <Dropdown
        trigger={<button>Menu</button>}
        items={mockItems}
      />
    );

    // Dropdown is closed
    expect(screen.queryByText('Item 1')).not.toBeInTheDocument();

    // Press Escape key
    fireEvent.keyDown(document, { key: 'Escape' });

    // Should still be closed (no error)
    expect(screen.queryByText('Item 1')).not.toBeInTheDocument();
  });
});

describe('Dropdown Component - Menu Item Interaction', () => {
  test('calls onClick handler when menu item is clicked', () => {
    const mockOnClick = jest.fn();
    const items: DropdownMenuItem[] = [
      { label: 'Test Item', onClick: mockOnClick },
    ];

    render(
      <Dropdown
        trigger={<button>Menu</button>}
        items={items}
      />
    );

    // Open dropdown
    fireEvent.click(screen.getByText('Menu'));

    // Click menu item
    const menuItem = screen.getByText('Test Item');
    fireEvent.click(menuItem);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  test('closes dropdown after menu item is clicked', () => {
    const mockOnClick = jest.fn();
    const items: DropdownMenuItem[] = [
      { label: 'Test Item', onClick: mockOnClick },
    ];

    render(
      <Dropdown
        trigger={<button>Menu</button>}
        items={items}
      />
    );

    // Open dropdown
    fireEvent.click(screen.getByText('Menu'));
    expect(screen.getByText('Test Item')).toBeInTheDocument();

    // Click menu item
    fireEvent.click(screen.getByText('Test Item'));

    // Dropdown should close
    expect(screen.queryByText('Test Item')).not.toBeInTheDocument();
  });

  test('renders all menu items when opened', () => {
    const items: DropdownMenuItem[] = [
      { label: 'Item 1', onClick: jest.fn() },
      { label: 'Item 2', onClick: jest.fn() },
      { label: 'Item 3', onClick: jest.fn() },
      { label: 'Item 4', onClick: jest.fn() },
    ];

    render(
      <Dropdown
        trigger={<button>Menu</button>}
        items={items}
      />
    );

    // Open dropdown
    fireEvent.click(screen.getByText('Menu'));

    // All items should be rendered
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
    expect(screen.getByText('Item 4')).toBeInTheDocument();
  });

  test('each menu item has its own onClick handler', () => {
    const mockOnClick1 = jest.fn();
    const mockOnClick2 = jest.fn();
    const mockOnClick3 = jest.fn();

    const items: DropdownMenuItem[] = [
      { label: 'Item 1', onClick: mockOnClick1 },
      { label: 'Item 2', onClick: mockOnClick2 },
      { label: 'Item 3', onClick: mockOnClick3 },
    ];

    render(
      <Dropdown
        trigger={<button>Menu</button>}
        items={items}
      />
    );

    // Open dropdown
    fireEvent.click(screen.getByText('Menu'));

    // Click each item
    fireEvent.click(screen.getByText('Item 1'));
    expect(mockOnClick1).toHaveBeenCalledTimes(1);
    expect(mockOnClick2).not.toHaveBeenCalled();
    expect(mockOnClick3).not.toHaveBeenCalled();

    // Reopen and click another item
    fireEvent.click(screen.getByText('Menu'));
    fireEvent.click(screen.getByText('Item 2'));
    expect(mockOnClick1).toHaveBeenCalledTimes(1);
    expect(mockOnClick2).toHaveBeenCalledTimes(1);
    expect(mockOnClick3).not.toHaveBeenCalled();
  });
});

describe('Dropdown Component - Styling Variants', () => {
  test('applies danger variant class to menu item', () => {
    const items: DropdownMenuItem[] = [
      { label: 'Normal Item', onClick: jest.fn() },
      { label: 'Danger Item', onClick: jest.fn(), variant: 'danger' },
    ];

    render(
      <Dropdown
        trigger={<button>Menu</button>}
        items={items}
      />
    );

    // Open dropdown
    fireEvent.click(screen.getByText('Menu'));

    const normalItem = screen.getByText('Normal Item');
    const dangerItem = screen.getByText('Danger Item');

    expect(normalItem).not.toHaveClass('dropdown-item-danger');
    expect(dangerItem).toHaveClass('dropdown-item-danger');
  });

  test('applies correct alignment class', () => {
    const items: DropdownMenuItem[] = [
      { label: 'Item 1', onClick: jest.fn() },
    ];

    const { container, rerender } = render(
      <Dropdown
        trigger={<button>Menu</button>}
        items={items}
        align="right"
      />
    );

    // Open dropdown
    fireEvent.click(screen.getByText('Menu'));

    let menu = container.querySelector('.dropdown-menu');
    expect(menu).toHaveClass('dropdown-menu-right');

    // Close and rerender with left alignment
    fireEvent.click(screen.getByText('Menu'));

    rerender(
      <Dropdown
        trigger={<button>Menu</button>}
        items={items}
        align="left"
      />
    );

    // Open again
    fireEvent.click(screen.getByText('Menu'));

    menu = container.querySelector('.dropdown-menu');
    expect(menu).toHaveClass('dropdown-menu-left');
  });

  test('defaults to right alignment when not specified', () => {
    const items: DropdownMenuItem[] = [
      { label: 'Item 1', onClick: jest.fn() },
    ];

    const { container } = render(
      <Dropdown
        trigger={<button>Menu</button>}
        items={items}
      />
    );

    // Open dropdown
    fireEvent.click(screen.getByText('Menu'));

    const menu = container.querySelector('.dropdown-menu');
    expect(menu).toHaveClass('dropdown-menu-right');
  });
});

describe('Dropdown Component - Edge Cases', () => {
  test('handles empty items array', () => {
    render(
      <Dropdown
        trigger={<button>Menu</button>}
        items={[]}
      />
    );

    // Open dropdown
    fireEvent.click(screen.getByText('Menu'));

    // Menu should open but have no items
    const menu = document.querySelector('.dropdown-menu');
    expect(menu).toBeInTheDocument();
    expect(menu?.children.length).toBe(0);
  });

  test('handles single menu item', () => {
    const mockOnClick = jest.fn();
    const items: DropdownMenuItem[] = [
      { label: 'Only Item', onClick: mockOnClick },
    ];

    render(
      <Dropdown
        trigger={<button>Menu</button>}
        items={items}
      />
    );

    // Open dropdown
    fireEvent.click(screen.getByText('Menu'));

    expect(screen.getByText('Only Item')).toBeInTheDocument();

    // Click the item
    fireEvent.click(screen.getByText('Only Item'));
    expect(mockOnClick).toHaveBeenCalled();
  });

  test('handles very long menu item labels', () => {
    const longLabel = 'This is a very long menu item label that should still render correctly';
    const items: DropdownMenuItem[] = [
      { label: longLabel, onClick: jest.fn() },
    ];

    render(
      <Dropdown
        trigger={<button>Menu</button>}
        items={items}
      />
    );

    // Open dropdown
    fireEvent.click(screen.getByText('Menu'));

    expect(screen.getByText(longLabel)).toBeInTheDocument();
  });

  test('handles special characters in menu item labels', () => {
    const items: DropdownMenuItem[] = [
      { label: 'Item with & ampersand', onClick: jest.fn() },
      { label: 'Item with <brackets>', onClick: jest.fn() },
      { label: 'Item with "quotes"', onClick: jest.fn() },
    ];

    render(
      <Dropdown
        trigger={<button>Menu</button>}
        items={items}
      />
    );

    // Open dropdown
    fireEvent.click(screen.getByText('Menu'));

    expect(screen.getByText('Item with & ampersand')).toBeInTheDocument();
    expect(screen.getByText('Item with <brackets>')).toBeInTheDocument();
    expect(screen.getByText('Item with "quotes"')).toBeInTheDocument();
  });
});

describe('Dropdown Component - Accessibility', () => {
  const mockItems: DropdownMenuItem[] = [
    { label: 'Item 1', onClick: jest.fn() },
    { label: 'Item 2', onClick: jest.fn() },
  ];

  test('menu items are rendered as buttons', () => {
    render(
      <Dropdown
        trigger={<button>Menu</button>}
        items={mockItems}
      />
    );

    // Open dropdown
    fireEvent.click(screen.getByText('Menu'));

    const item1 = screen.getByText('Item 1');
    const item2 = screen.getByText('Item 2');

    expect(item1.tagName).toBe('BUTTON');
    expect(item2.tagName).toBe('BUTTON');
  });

  test('menu items have proper dropdown-item class', () => {
    render(
      <Dropdown
        trigger={<button>Menu</button>}
        items={mockItems}
      />
    );

    // Open dropdown
    fireEvent.click(screen.getByText('Menu'));

    const item1 = screen.getByText('Item 1');
    const item2 = screen.getByText('Item 2');

    expect(item1).toHaveClass('dropdown-item');
    expect(item2).toHaveClass('dropdown-item');
  });
});

describe('Dropdown Component - Event Listener Cleanup', () => {
  const mockItems: DropdownMenuItem[] = [
    { label: 'Item 1', onClick: jest.fn() },
  ];

  test('removes event listeners when component unmounts', () => {
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

    const { unmount } = render(
      <Dropdown
        trigger={<button>Menu</button>}
        items={mockItems}
      />
    );

    // Open dropdown to attach listeners
    fireEvent.click(screen.getByText('Menu'));

    // Unmount component
    unmount();

    // Should have called removeEventListener
    expect(removeEventListenerSpy).toHaveBeenCalled();

    removeEventListenerSpy.mockRestore();
  });

  test('removes event listeners when dropdown closes', () => {
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

    render(
      <Dropdown
        trigger={<button>Menu</button>}
        items={mockItems}
      />
    );

    // Open dropdown
    fireEvent.click(screen.getByText('Menu'));

    const callCountAfterOpen = removeEventListenerSpy.mock.calls.length;

    // Close dropdown
    fireEvent.click(screen.getByText('Menu'));

    // Should have removed listeners after closing
    expect(removeEventListenerSpy.mock.calls.length).toBeGreaterThan(callCountAfterOpen);

    removeEventListenerSpy.mockRestore();
  });
});
