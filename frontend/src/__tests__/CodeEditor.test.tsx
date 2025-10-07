import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CodeEditor from '../components/CodeEditor';

describe('CodeEditor Component', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render textarea element', () => {
      render(
        <CodeEditor
          value=""
          onChange={mockOnChange}
          language="html"
        />
      );

      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeInTheDocument();
    });

    it('should render with initial value', () => {
      render(
        <CodeEditor
          value="<h1>Hello</h1>"
          onChange={mockOnChange}
          language="html"
        />
      );

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue('<h1>Hello</h1>');
    });

    it('should have monospace font class', () => {
      render(
        <CodeEditor
          value=""
          onChange={mockOnChange}
          language="html"
        />
      );

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('code-editor__textarea');
    });

    it('should have language-specific class', () => {
      render(
        <CodeEditor
          value=""
          onChange={mockOnChange}
          language="css"
        />
      );

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('code-editor__textarea--css');
    });
  });

  describe('Placeholder Text', () => {
    it('should show HTML placeholder for HTML language', () => {
      render(
        <CodeEditor
          value=""
          onChange={mockOnChange}
          language="html"
        />
      );

      const textarea = screen.getByPlaceholderText('<!-- Write your HTML here -->');
      expect(textarea).toBeInTheDocument();
    });

    it('should show CSS placeholder for CSS language', () => {
      render(
        <CodeEditor
          value=""
          onChange={mockOnChange}
          language="css"
        />
      );

      const textarea = screen.getByPlaceholderText('/* Write your CSS here */');
      expect(textarea).toBeInTheDocument();
    });

    it('should show JavaScript placeholder for JavaScript language', () => {
      render(
        <CodeEditor
          value=""
          onChange={mockOnChange}
          language="javascript"
        />
      );

      const textarea = screen.getByPlaceholderText('// Write your JavaScript here');
      expect(textarea).toBeInTheDocument();
    });

    it('should use custom placeholder if provided', () => {
      render(
        <CodeEditor
          value=""
          onChange={mockOnChange}
          language="html"
          placeholder="Custom placeholder"
        />
      );

      const textarea = screen.getByPlaceholderText('Custom placeholder');
      expect(textarea).toBeInTheDocument();
    });
  });

  describe('User Input', () => {
    it('should call onChange when typing', () => {
      render(
        <CodeEditor
          value=""
          onChange={mockOnChange}
          language="html"
        />
      );

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: '<div>Test</div>' } });

      expect(mockOnChange).toHaveBeenCalledWith('<div>Test</div>');
    });

    it('should update value when changed', () => {
      const { rerender } = render(
        <CodeEditor
          value="initial"
          onChange={mockOnChange}
          language="html"
        />
      );

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue('initial');

      rerender(
        <CodeEditor
          value="updated"
          onChange={mockOnChange}
          language="html"
        />
      );

      expect(textarea).toHaveValue('updated');
    });
  });

  describe('Tab Key Behavior', () => {
    it('should insert 2 spaces when Tab is pressed', () => {
      render(
        <CodeEditor
          value="hello"
          onChange={mockOnChange}
          language="html"
        />
      );

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;

      // Set cursor position at the end
      textarea.selectionStart = 5;
      textarea.selectionEnd = 5;

      // Press Tab key
      fireEvent.keyDown(textarea, { key: 'Tab', code: 'Tab' });

      // Should call onChange with 2 spaces inserted
      expect(mockOnChange).toHaveBeenCalledWith('hello  ');
    });

    it('should insert spaces at cursor position', () => {
      render(
        <CodeEditor
          value="hello world"
          onChange={mockOnChange}
          language="html"
        />
      );

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;

      // Set cursor position in the middle (after "hello")
      textarea.selectionStart = 5;
      textarea.selectionEnd = 5;

      // Press Tab key
      fireEvent.keyDown(textarea, { key: 'Tab', code: 'Tab' });

      // Should insert spaces at cursor position
      expect(mockOnChange).toHaveBeenCalledWith('hello   world');
    });

    it('should replace selected text with spaces', () => {
      render(
        <CodeEditor
          value="hello world"
          onChange={mockOnChange}
          language="html"
        />
      );

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;

      // Select "world"
      textarea.selectionStart = 6;
      textarea.selectionEnd = 11;

      // Press Tab key
      fireEvent.keyDown(textarea, { key: 'Tab', code: 'Tab' });

      // Should replace selection with spaces
      expect(mockOnChange).toHaveBeenCalledWith('hello   ');
    });

    it('should prevent default Tab behavior', () => {
      render(
        <CodeEditor
          value=""
          onChange={mockOnChange}
          language="html"
        />
      );

      const textarea = screen.getByRole('textbox');
      const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

      fireEvent.keyDown(textarea, event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should not interfere with other keys', () => {
      render(
        <CodeEditor
          value=""
          onChange={mockOnChange}
          language="html"
        />
      );

      const textarea = screen.getByRole('textbox');

      // Press Enter key (should not trigger special behavior)
      fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });

      // onChange should not be called by keyDown for non-Tab keys
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('Textarea Attributes', () => {
    it('should have spellCheck disabled', () => {
      render(
        <CodeEditor
          value=""
          onChange={mockOnChange}
          language="html"
        />
      );

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('spellcheck', 'false');
    });

    it('should have autoComplete disabled', () => {
      render(
        <CodeEditor
          value=""
          onChange={mockOnChange}
          language="html"
        />
      );

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('autocomplete', 'off');
    });

    it('should have autoCorrect disabled', () => {
      render(
        <CodeEditor
          value=""
          onChange={mockOnChange}
          language="html"
        />
      );

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('autocorrect', 'off');
    });

    it('should have autoCapitalize disabled', () => {
      render(
        <CodeEditor
          value=""
          onChange={mockOnChange}
          language="html"
        />
      );

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('autocapitalize', 'off');
    });
  });

  describe('Different Languages', () => {
    it('should work with HTML language', () => {
      render(
        <CodeEditor
          value="<div></div>"
          onChange={mockOnChange}
          language="html"
        />
      );

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue('<div></div>');
      expect(textarea).toHaveClass('code-editor__textarea--html');
    });

    it('should work with CSS language', () => {
      render(
        <CodeEditor
          value="body { margin: 0; }"
          onChange={mockOnChange}
          language="css"
        />
      );

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue('body { margin: 0; }');
      expect(textarea).toHaveClass('code-editor__textarea--css');
    });

    it('should work with JavaScript language', () => {
      render(
        <CodeEditor
          value="console.log('test');"
          onChange={mockOnChange}
          language="javascript"
        />
      );

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue("console.log('test');");
      expect(textarea).toHaveClass('code-editor__textarea--javascript');
    });
  });
});
