import * as prettier from 'prettier';
import parserHtml from 'prettier/parser-html';
import parserBabel from 'prettier/parser-babel';
import parserPostcss from 'prettier/parser-postcss';

// Define a type for the supported languages for clarity
type SupportedLanguage = 'html' | 'css' | 'javascript';

/**
 * Formats code asynchronously using Prettier.
 *
 * @param code - The source code string to format.
 * @param language - The language of the code.
 * @returns A Promise that resolves to the formatted code string.
 * Returns the original code if formatting fails.
 */
export const formatCode = async (
  code: string,
  language: SupportedLanguage
): Promise<string> => {
  // Return early for empty input
  if (!code.trim()) {
    return code;
  }

  try {
    // Determine the correct parser and plugins based on the language
    const options = {
      parser: '',
      plugins: [] as any[],
    };

    switch (language) {
      case 'html':
        options.parser = 'html';
        options.plugins = [parserHtml];
        break;
      case 'css':
        options.parser = 'css';
        options.plugins = [parserPostcss];
        break;
      case 'javascript':
        options.parser = 'babel';
        options.plugins = [parserBabel];
        break;
      default:
        // If the language is not supported, return the original code
        console.warn(`Unsupported language for formatting: ${language}`);
        return code;
    }

    // Await the asynchronous format function and return the result
    const formattedCode = await prettier.format(code, {
      ...options,
      printWidth: 80,
      tabWidth: 2,
      useTabs: false,
      semi: true,
      singleQuote: true,
      trailingComma: 'es5',
      bracketSpacing: true,
      arrowParens: 'avoid',
      htmlWhitespaceSensitivity: 'css',
    });

    return formattedCode;
  } catch (error) {
    console.error(`Failed to format ${language} code:`, error);
    // Return the original code as a fallback if an error occurs
    return code;
  }
};
