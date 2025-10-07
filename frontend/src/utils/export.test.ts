// src/utils/export.test.ts
/**
 * @jest-environment jsdom
 */

import { exportProject, Project, ExportOptions, createAndDownloadFile } from './export';

describe('exportProject', () => {
  let mockCreateElement: jest.SpyInstance;
  let mockAppendChild: jest.SpyInstance;
  let mockRemoveChild: jest.SpyInstance;
  let mockAnchorClick: jest.Mock;
  let mockCreateObjectURL: jest.Mock;
  let mockRevokeObjectURL: jest.Mock;
  let mockAnchor: any;
  let capturedBlobs: Blob[] = [];

  beforeEach(() => {
    capturedBlobs = [];
    
    // Create a mock anchor element
    mockAnchorClick = jest.fn();
    mockAnchor = {
      href: '',
      download: '',
      click: mockAnchorClick,
      style: {},
    };

    // Mock document.createElement
    mockCreateElement = jest.spyOn(document, 'createElement').mockReturnValue(mockAnchor);
    
    // Mock document.body methods
    mockAppendChild = jest.spyOn(document.body, 'appendChild').mockImplementation(() => mockAnchor);
    mockRemoveChild = jest.spyOn(document.body, 'removeChild').mockImplementation(() => mockAnchor);
    
    // Mock URL methods and capture blobs
    mockCreateObjectURL = jest.fn((blob: Blob) => {
      capturedBlobs.push(blob);
      return 'blob:mock-url';
    });
    mockRevokeObjectURL = jest.fn();
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Helper function to read blob content
  const readBlobAsText = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(blob);
    });
  };

  describe('separate file export', () => {
    it('should trigger a download for three separate files', async () => {
      const project: Project = {
        name: 'test-project',
        html_code: '<div>Hello</div>',
        css_code: 'body { margin: 0; }',
        js_code: 'console.log("test");',
      };

      await exportProject(project, { format: 'separate' });

      // Verify createElement was called 3 times (once for each file)
      expect(mockCreateElement).toHaveBeenCalledTimes(3);
      expect(mockCreateElement).toHaveBeenCalledWith('a');
      
      // Verify click was called 3 times
      expect(mockAnchorClick).toHaveBeenCalledTimes(3);
      
      // Verify createObjectURL was called 3 times
      expect(mockCreateObjectURL).toHaveBeenCalledTimes(3);
      
      // Verify revokeObjectURL was called 3 times
      expect(mockRevokeObjectURL).toHaveBeenCalledTimes(3);
      
      // Verify appendChild and removeChild were called
      expect(mockAppendChild).toHaveBeenCalledTimes(3);
      expect(mockRemoveChild).toHaveBeenCalledTimes(3);
    });

    it('should generate correct file names for separate files', async () => {
      const project: Project = {
        name: 'my-project',
        html_code: '<div>Test</div>',
        css_code: 'body {}',
        js_code: 'alert("hi");',
      };

      await exportProject(project, { format: 'separate' });

      // Check that the download attribute was set correctly for each file
      // The mock anchor's download property gets overwritten, so we need to capture all calls
      expect(mockAnchor.download).toBe('my-project.js'); // Last file
    });

    it('should not trigger a download for empty code fields', async () => {
      const project: Project = {
        name: 'test-project',
        html_code: '<div>Hello</div>',
        css_code: '',  // Empty
        js_code: '   ', // Whitespace only
      };

      await exportProject(project, { format: 'separate' });

      // Only HTML should be downloaded
      expect(mockCreateElement).toHaveBeenCalledTimes(1);
      expect(mockAnchorClick).toHaveBeenCalledTimes(1);
      expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
      expect(mockRevokeObjectURL).toHaveBeenCalledTimes(1);
    });

    it('should handle all empty code fields', async () => {
      const project: Project = {
        name: 'empty-project',
        html_code: '',
        css_code: '',
        js_code: '',
      };

      await exportProject(project, { format: 'separate' });

      // No downloads should occur
      expect(mockCreateElement).not.toHaveBeenCalled();
      expect(mockAnchorClick).not.toHaveBeenCalled();
    });

    it('should handle special characters in project name', async () => {
      const project: Project = {
        name: 'my-project <>&"\'',
        html_code: '<div>Test</div>',
        css_code: '',
        js_code: '',
      };

      await exportProject(project, { format: 'separate' });

      // Verify file was created with special characters in name
      expect(mockAnchor.download).toBe('my-project <>&"\'.html');
    });
  });

  describe('single file export', () => {
    it('should trigger a single download for combined file', async () => {
      const project: Project = {
        name: 'test-project',
        html_code: '<div>Hello</div>',
        css_code: 'body { margin: 0; }',
        js_code: 'console.log("test");',
      };

      await exportProject(project, { format: 'single' });

      // Should only create one file
      expect(mockCreateElement).toHaveBeenCalledTimes(1);
      expect(mockAnchorClick).toHaveBeenCalledTimes(1);
      
      // Verify the blob was created with the combined HTML
      expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
      expect(mockRevokeObjectURL).toHaveBeenCalledTimes(1);
    });

    it('should generate correct single file with all code combined', async () => {
      const project: Project = {
        name: 'combined',
        html_code: '<h1>Title</h1>',
        css_code: 'h1 { color: red; }',
        js_code: 'console.log("loaded");',
      };

      await exportProject(project, { format: 'single' });

      // Verify the blob was created
      expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
      const blob = capturedBlobs[0];
      
      // Read the blob content
      const text = await readBlobAsText(blob);
      
      // Verify content includes all parts
      expect(text).toContain('<!DOCTYPE html>');
      expect(text).toContain('<h1>Title</h1>');
      expect(text).toContain('h1 { color: red; }');
      expect(text).toContain('console.log("loaded");');
      expect(text).toContain('<title>combined</title>');
    });

    it('should handle single file with empty CSS and JS', async () => {
      const project: Project = {
        name: 'html-only',
        html_code: '<p>Content</p>',
        css_code: '',
        js_code: '',
      };

      await exportProject(project, { format: 'single' });

      expect(mockCreateElement).toHaveBeenCalledTimes(1);
      const blob = capturedBlobs[0];
      const text = await readBlobAsText(blob);
      
      expect(text).toContain('<p>Content</p>');
      expect(text).toContain('<style>');
      expect(text).toContain('<script>');
    });

    it('should use correct filename for single file export', async () => {
      const project: Project = {
        name: 'single-file',
        html_code: '<div>Test</div>',
        css_code: 'body {}',
        js_code: 'console.log("test");',
      };

      await exportProject(project, { format: 'single' });

      expect(mockAnchor.download).toBe('single-file.html');
    });
  });

  describe('Blob and download functionality', () => {
    it('should create blob with correct type', async () => {
      const project: Project = {
        name: 'blob-test',
        html_code: '<div>Test</div>',
        css_code: '',
        js_code: '',
      };

      await exportProject(project, { format: 'separate' });

      const blob = capturedBlobs[0];
      expect(blob.type).toBe('text/plain');
      expect(blob.size).toBeGreaterThan(0);
    });

    it('should properly clean up URL after download', async () => {
      const project: Project = {
        name: 'cleanup-test',
        html_code: '<div>Test</div>',
        css_code: '',
        js_code: '',
      };

      await exportProject(project, { format: 'separate' });

      // Verify URL was created and then revoked
      expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
      expect(mockRevokeObjectURL).toHaveBeenCalledTimes(1);
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    it('should append and remove anchor from DOM', async () => {
      const project: Project = {
        name: 'dom-test',
        html_code: '<div>Test</div>',
        css_code: '',
        js_code: '',
      };

      await exportProject(project, { format: 'separate' });

      expect(mockAppendChild).toHaveBeenCalledWith(mockAnchor);
      expect(mockRemoveChild).toHaveBeenCalledWith(mockAnchor);
      expect(mockAnchorClick).toHaveBeenCalled();
    });
  });

  describe('createAndDownloadFile', () => {
    it('should create and download a file with given filename and content', () => {
      createAndDownloadFile('test.txt', 'Hello World');

      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockAnchor.download).toBe('test.txt');
      expect(mockAnchor.href).toBe('blob:mock-url');
      expect(mockAnchorClick).toHaveBeenCalled();
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });
  });
});
