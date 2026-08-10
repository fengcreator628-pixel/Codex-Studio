import { Project, FileSystemNode } from '../types';

export interface DocxExportOptions {
  headerText?: string;
  footerText?: string;
  fontSize?: string; // e.g. '12pt'
  lineHeight?: string; // e.g. '1.5'
  fontFamily?: string;
}

// Helper to convert HTML to Plain Text
export const htmlToPlainText = (html: string): string => {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  
  // Replace linebreaks / paragraphs with newlines
  const paragraphs = temp.querySelectorAll('p, div, h1, h2, h3, h4, h5, h6, li');
  if (paragraphs.length > 0) {
    let result = '';
    paragraphs.forEach(p => {
      const text = p.textContent || '';
      if (text.trim()) {
        if (/^h[1-6]$/i.test(p.tagName)) {
          result += `\n\n${text.toUpperCase()}\n${'='.repeat(text.length)}\n`;
        } else {
          result += `${text}\n\n`;
        }
      }
    });
    return result.trim();
  }
  
  return (temp.textContent || temp.innerText || '').trim();
};

// Helper to convert HTML to Markdown
export const htmlToMarkdown = (html: string): string => {
  const temp = document.createElement('div');
  temp.innerHTML = html;

  let markdown = '';
  
  const processNode = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return '';

    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();
    const children = Array.from(el.childNodes).map(processNode).join('');

    switch (tag) {
      case 'h1': return `\n# ${children}\n\n`;
      case 'h2': return `\n## ${children}\n\n`;
      case 'h3': return `\n### ${children}\n\n`;
      case 'h4': return `\n#### ${children}\n\n`;
      case 'p': return `${children}\n\n`;
      case 'br': return '\n';
      case 'strong':
      case 'b': return `**${children}**`;
      case 'em':
      case 'i': return `*${children}*`;
      case 'u': return `<u>${children}</u>`;
      case 's':
      case 'del':
      case 'strike': return `~~${children}~~`;
      case 'blockquote': return `\n> ${children.trim().replace(/\n/g, '\n> ')}\n\n`;
      case 'ul': return `\n${children}\n`;
      case 'ol': return `\n${children}\n`;
      case 'li': return `- ${children.trim()}\n`;
      case 'hr': return `\n---\n\n`;
      default: return children;
    }
  };

  Array.from(temp.childNodes).forEach(child => {
    markdown += processNode(child);
  });

  return markdown.replace(/\n{3,}/g, '\n\n').trim();
};

// Helper to compile all manuscript documents in a project into a structured manuscript
export const compileProjectManuscript = (project: Project): { title: string; html: string; text: string; markdown: string } => {
  const nodes = project.nodes || [];
  
  // Sort documents by order and folder structure
  const getOrderedDocuments = (parentId: string | null = null, depth = 1): { node: FileSystemNode; depth: number }[] => {
    const children = nodes
      .filter(n => n.parentId === parentId)
      .sort((a, b) => a.order - b.order);
      
    let result: { node: FileSystemNode; depth: number }[] = [];
    
    for (const child of children) {
      if (child.type === 'folder') {
        result.push({ node: child, depth });
        result = result.concat(getOrderedDocuments(child.id, depth + 1));
      } else if (child.type === 'document' || child.type === 'note') {
        result.push({ node: child, depth });
      }
    }
    return result;
  };

  const orderedItems = getOrderedDocuments(null);
  
  let manuscriptHtml = `<h1>${project.title}</h1>`;
  if (project.synopsis) {
    manuscriptHtml += `<p><em>${project.synopsis}</em></p><hr/>`;
  }

  orderedItems.forEach(({ node, depth }) => {
    if (node.type === 'folder') {
      const headingTag = Math.min(depth + 1, 6);
      manuscriptHtml += `<h${headingTag}>${node.title}</h${headingTag}>`;
    } else {
      manuscriptHtml += `<h2>${node.title}</h2>`;
      manuscriptHtml += node.content || '<p></p>';
    }
  });

  const text = htmlToPlainText(manuscriptHtml);
  const markdown = htmlToMarkdown(manuscriptHtml);

  return {
    title: project.title,
    html: manuscriptHtml,
    text,
    markdown
  };
};

// Trigger File Download
export const downloadFile = (filename: string, content: string | Blob, mimeType: string) => {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Export active node or full manuscript in chosen format
export const exportContent = (
  title: string, 
  htmlContent: string, 
  format: 'txt' | 'docx' | 'md',
  scopeTitle: string = 'Document',
  docxOptions?: DocxExportOptions
) => {
  const sanitizedTitle = (title || 'Manuscript').replace(/[^a-z0-9_\-\u4e00-\u9fa5]/gi, '_');
  const filename = `${sanitizedTitle}_${scopeTitle.replace(/\s+/g, '_')}.${format === 'docx' ? 'docx' : format}`;

  if (format === 'txt') {
    const text = htmlToPlainText(htmlContent);
    downloadFile(filename, text, 'text/plain;charset=utf-8');
  } else if (format === 'md') {
    const md = htmlToMarkdown(htmlContent);
    downloadFile(filename, md, 'text/markdown;charset=utf-8');
  } else if (format === 'docx') {
    const fSize = docxOptions?.fontSize || '12pt';
    const lHeight = docxOptions?.lineHeight || '1.5';
    const headerVal = docxOptions?.headerText ? `<div style='text-align: right; border-bottom: 1px solid #ddd; padding-bottom: 6px; font-size: 9pt; color: #666;'>${docxOptions.headerText}</div>` : '';
    const footerVal = docxOptions?.footerText ? `<div style='text-align: center; border-top: 1px solid #ddd; padding-top: 6px; font-size: 9pt; color: #666; margin-top: 30px;'>${docxOptions.footerText}</div>` : '';

    const docxHeader = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' 
            xmlns:w='urn:schemas-microsoft-com:office:word' 
            xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${title}</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Normal</w:View>
            <w:Zoom>100</w:Zoom>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          body { font-family: 'Times New Roman', 'Songti TC', serif; font-size: ${fSize}; line-height: ${lHeight}; margin: 1in; }
          h1 { font-size: 22pt; font-weight: bold; margin-bottom: 14pt; text-align: center; }
          h2 { font-size: 16pt; font-weight: bold; margin-top: 18pt; margin-bottom: 8pt; border-bottom: 1px solid #eee; }
          h3 { font-size: 13pt; font-weight: bold; margin-top: 12pt; margin-bottom: 4pt; }
          p { margin-bottom: 10pt; text-indent: 0.25in; text-align: justify; }
          blockquote { margin-left: 0.5in; margin-right: 0.5in; font-style: italic; color: #444; border-left: 3px solid #ccc; padding-left: 10px; }
        </style>
      </head>
      <body>
        ${headerVal}
        <div style="margin-top: 15px; margin-bottom: 25px;">
          ${htmlContent}
        </div>
        ${footerVal}
      </body>
      </html>
    `;
    const blob = new Blob(['\ufeff' + docxHeader], { type: 'application/msword' });
    downloadFile(filename, blob, 'application/msword');
  }
};
