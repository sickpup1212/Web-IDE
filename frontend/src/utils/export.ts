// src/utils/export.ts

export interface Project {
  name: string;
  html_code: string;
  css_code: string;
  js_code: string;
}

export interface ExportOptions {
  format: 'separate' | 'single';
}

/**
 * Creates a Blob from text content and triggers a browser download.
 * @param filename - The name of the file to be downloaded (e.g., "index.html").
 * @param content - The text content of the file.
 */
export const createAndDownloadFile = (filename: string, content: string) => {
  // Step 1.3: Create a Blob from the content
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);

  // Step 1.4: Use the anchor download trick
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a); // Append the anchor to the DOM
  a.click(); // Programmatically click the anchor to trigger the download

  // Clean up by removing the anchor and revoking the Object URL
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const exportProject = async (project: Project, options: ExportOptions): Promise<void> => {
  if (options.format === 'separate') {
    // This part remains unchanged
    if (project.html_code?.trim()) {
      createAndDownloadFile(`${project.name}.html`, project.html_code);
    }
    if (project.css_code?.trim()) {
      createAndDownloadFile(`${project.name}.css`, project.css_code);
    }
    if (project.js_code?.trim()) {
      createAndDownloadFile(`${project.name}.js`, project.js_code);
    }
  } else if (options.format === 'single') {
    // NEW: Logic for single file export
    const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project.name}</title>
  <style>
    ${project.css_code}
  </style>
</head>
<body>
  ${project.html_code}
  <script>
    ${project.js_code}
  </script>
</body>
</html>
    `;
    
    createAndDownloadFile(`${project.name}.html`, fullHtml.trim());
  }
};


