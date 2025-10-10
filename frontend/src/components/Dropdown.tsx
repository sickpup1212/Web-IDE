import React, { useState, useRef, useEffect, ReactNode } from 'react';
import '../styles/Dropdown.css';

export interface DropdownMenuItem {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

interface DropdownProps {
  trigger: ReactNode;
  items: DropdownMenuItem[];
  align?: 'left' | 'right';
}

/**
 * Reusable Dropdown component with click-outside-to-close functionality
 * Displays a menu when the trigger element is clicked
 */
const Dropdown: React.FC<DropdownProps> = ({ trigger, items, align = 'right' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Toggle dropdown open/close
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    // Add event listener when dropdown is open
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Cleanup event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle menu item click
  const handleMenuItemClick = (item: DropdownMenuItem) => {
    item.onClick();
    setIsOpen(false);
  };

  // Close dropdown on Escape key
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen]);

  return (
    <div className="dropdown" ref={dropdownRef}>
      {React.isValidElement(trigger)
        ? React.cloneElement(trigger, {
            // Assert props as 'any' to allow spreading
            ...(trigger.props as any),
            onClick: (e: React.MouseEvent) => {
              // Assert props as 'any' to access onClick
              if ((trigger.props as any)?.onClick) {
                (trigger.props as any).onClick(e);
              }
              toggleDropdown();
            },
            'aria-haspopup': 'true',
            'aria-expanded': isOpen,
          })
        : trigger}



      {isOpen && (
        <div className={`dropdown-menu dropdown-menu-${align}`}>
          {items.map((item, index) => (
            <button
              key={index}
              className={`dropdown-item ${item.variant === 'danger' ? 'dropdown-item-danger' : ''}`}
              onClick={() => handleMenuItemClick(item)}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
