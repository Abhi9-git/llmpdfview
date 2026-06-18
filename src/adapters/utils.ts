export function elementToMarkdown(element: Element): string {
  const traverse = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return '';
    }

    const el = node as Element;
    const tagName = el.tagName.toUpperCase();

    // Skip utility elements (buttons, icons, toolbars, SVGs, etc.)
    if (
      tagName === 'BUTTON' ||
      tagName === 'SVG' ||
      tagName === 'STYLE' ||
      tagName === 'SCRIPT' ||
      el.classList.contains('sr-only') ||
      el.getAttribute('aria-hidden') === 'true'
    ) {
      return '';
    }

    // Special handling for code blocks
    if (tagName === 'PRE') {
      const codeEl = el.querySelector('code');
      if (codeEl) {
        const classes = Array.from(codeEl.classList);
        const langClass = classes.find((c) => c.startsWith('language-'));
        const lang = langClass ? langClass.replace('language-', '') : '';
        const codeText = codeEl.textContent || '';
        return `\n\`\`\`${lang}\n${codeText.trim()}\n\`\`\`\n`;
      }
      return `\n\`\`\`\n${el.textContent?.trim()}\n\`\`\`\n`;
    }

    if (tagName === 'CODE') {
      return `\`${el.textContent}\``;
    }

    // Process children first
    let childrenContent = '';
    for (let i = 0; i < el.childNodes.length; i++) {
      childrenContent += traverse(el.childNodes[i]);
    }

    switch (tagName) {
      case 'P':
        return `\n\n${childrenContent.trim()}\n\n`;
      case 'H1':
        return `\n\n# ${childrenContent.trim()}\n\n`;
      case 'H2':
        return `\n\n## ${childrenContent.trim()}\n\n`;
      case 'H3':
        return `\n\n### ${childrenContent.trim()}\n\n`;
      case 'H4':
        return `\n\n#### ${childrenContent.trim()}\n\n`;
      case 'H5':
        return `\n\n##### ${childrenContent.trim()}\n\n`;
      case 'H6':
        return `\n\n###### ${childrenContent.trim()}\n\n`;
      case 'STRONG':
      case 'B':
        return `**${childrenContent}**`;
      case 'EM':
      case 'I':
        return `*${childrenContent}*`;
      case 'BR':
        return '\n';
      case 'LI':
        return `\n- ${childrenContent.trim()}`;
      case 'UL':
        return `\n${childrenContent}\n`;
      case 'OL': {
        let listContent = '';
        let index = 1;
        for (let i = 0; i < el.childNodes.length; i++) {
          const child = el.childNodes[i];
          if (child.nodeType === Node.ELEMENT_NODE && (child as Element).tagName.toUpperCase() === 'LI') {
            listContent += `\n${index}. ${traverse(child).replace(/^\s*- /, '')}`;
            index++;
          } else {
            listContent += traverse(child);
          }
        }
        return `\n${listContent}\n`;
      }
      case 'BLOCKQUOTE':
        return `\n\n> ${childrenContent.trim().split('\n').join('\n> ')}\n\n`;
      case 'TABLE':
        return parseTable(el);
      default:
        return childrenContent;
    }
  };

  return traverse(element)
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function parseTable(table: Element): string {
  const rows = Array.from(table.querySelectorAll('tr'));
  if (rows.length === 0) return '';

  let markdownTable = '\n\n';

  const firstRow = rows[0];
  const headers = Array.from(firstRow.querySelectorAll('th, td')).map((cell) => cell.textContent?.trim() || '');
  markdownTable += `| ${headers.join(' | ')} |\n`;
  markdownTable += `| ${headers.map(() => '---').join(' | ')} |\n`;

  for (let i = 1; i < rows.length; i++) {
    const cells = Array.from(rows[i].querySelectorAll('td')).map((cell) => cell.textContent?.trim() || '');
    if (cells.length > 0) {
      markdownTable += `| ${cells.join(' | ')} |\n`;
    }
  }

  markdownTable += '\n';
  return markdownTable;
}
