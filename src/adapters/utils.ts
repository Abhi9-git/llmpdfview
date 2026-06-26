import type { MessageMedia } from '../types';

/**
 * Convert a DOM element tree to Markdown text.
 * Now also converts <img> elements to markdown image syntax
 * and <svg> elements to inline data-URI images.
 */
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

    // Skip utility elements (buttons, icons, toolbars, etc.)
    if (
      tagName === 'BUTTON' ||
      tagName === 'STYLE' ||
      tagName === 'SCRIPT' ||
      el.classList.contains('sr-only') ||
      el.getAttribute('aria-hidden') === 'true'
    ) {
      return '';
    }

    // --- IMAGE HANDLING ---
    if (tagName === 'IMG') {
      const src = (el as HTMLImageElement).src;
      const alt = (el as HTMLImageElement).alt || 'image';
      if (src) {
        return `\n\n![${alt}](${src})\n\n`;
      }
      return '';
    }

    // --- SVG HANDLING ---
    if (tagName === 'SVG') {
      return svgToMarkdownImage(el);
    }

    // --- MERMAID DIAGRAM HANDLING ---
    // Detect mermaid containers: <pre class="mermaid">, <div class="mermaid">, etc.
    if (isMermaidElement(el)) {
      const mermaidSource = el.textContent?.trim() || '';
      if (mermaidSource) {
        return `\n\n\`\`\`mermaid\n${mermaidSource}\n\`\`\`\n\n`;
      }
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

    // --- PICTURE / FIGURE HANDLING ---
    // <picture> and <figure> elements can wrap <img> tags
    if (tagName === 'PICTURE') {
      const img = el.querySelector('img');
      if (img) {
        return traverse(img);
      }
      return '';
    }

    if (tagName === 'FIGURE') {
      let result = '';
      const img = el.querySelector('img');
      const svg = el.querySelector('svg');
      const figcaption = el.querySelector('figcaption');

      if (img) {
        const src = img.src;
        const alt = figcaption?.textContent?.trim() || img.alt || 'image';
        if (src) {
          result += `\n\n![${alt}](${src})\n\n`;
        }
      } else if (svg) {
        result += svgToMarkdownImage(svg);
      }

      return result;
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

/**
 * Extract all images and SVG diagrams from a DOM element.
 * Returns structured MessageMedia[] for standalone rendering.
 */
export function extractMedia(element: Element): MessageMedia[] {
  const media: MessageMedia[] = [];
  const seen = new Set<string>();

  // Extract all <img> elements
  const images = element.querySelectorAll('img');
  images.forEach((img) => {
    const src = img.src;
    if (!src || seen.has(src)) return;

    // Skip tiny tracking pixels and icons (< 32px)
    const width = img.naturalWidth || img.width || parseInt(img.getAttribute('width') || '0', 10);
    const height = img.naturalHeight || img.height || parseInt(img.getAttribute('height') || '0', 10);
    if ((width > 0 && width < 32) || (height > 0 && height < 32)) return;

    seen.add(src);
    media.push({
      type: 'image',
      src,
      alt: img.alt || 'Image',
    });
  });

  // Extract all <svg> elements that look like diagrams (not tiny icons)
  const svgs = element.querySelectorAll('svg');
  svgs.forEach((svg) => {
    // Skip small icon-sized SVGs
    const viewBox = svg.getAttribute('viewBox');
    const width = svg.getAttribute('width');
    const height = svg.getAttribute('height');

    const isLikelySvgIcon =
      (width && parseInt(width, 10) < 32) ||
      (height && parseInt(height, 10) < 32) ||
      (!viewBox && !width && !height && svg.children.length < 3);

    if (isLikelySvgIcon) return;

    // Clone and normalise the SVG for responsive rendering
    const clone = svg.cloneNode(true) as SVGSVGElement;

    // Inline computed styles so the SVG is self-contained
    inlineComputedStyles(svg, clone);

    if (!clone.getAttribute('viewBox')) {
      const w = parseFloat(width || '') || svg.getBBox?.()?.width || 800;
      const h = parseFloat(height || '') || svg.getBBox?.()?.height || 600;
      clone.setAttribute('viewBox', `0 0 ${w} ${h}`);
    }
    clone.removeAttribute('width');
    clone.removeAttribute('height');
    if (!clone.getAttribute('preserveAspectRatio')) {
      clone.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    }

    const svgMarkup = new XMLSerializer().serializeToString(clone);
    const dataUri = svgToDataUri(svgMarkup);
    if (seen.has(dataUri)) return;

    seen.add(dataUri);
    media.push({
      type: 'svg',
      src: dataUri,
      alt: svg.getAttribute('aria-label') || 'Diagram',
      svgMarkup,
    });
  });

  return media;
}

/**
 * Convert an SVG element to a markdown image with a data URI.
 * Normalises the SVG so it scales responsively (removes hardcoded
 * width/height, ensures a viewBox exists, and sets preserveAspectRatio).
 */
function svgToMarkdownImage(svgEl: Element): string {
  // Skip small icon SVGs
  const width = svgEl.getAttribute('width');
  const height = svgEl.getAttribute('height');
  if ((width && parseInt(width, 10) < 32) || (height && parseInt(height, 10) < 32)) {
    return '';
  }

  // Clone so we don't mutate the live DOM
  const clone = svgEl.cloneNode(true) as Element;

  // Inline computed styles from the live DOM so the SVG is visually
  // self-contained (colours, fonts, strokes, etc. from the LLM page CSS).
  inlineComputedStyles(svgEl, clone);

  // Ensure a viewBox exists so the SVG scales correctly inside an <img>.
  // Many LLM-generated flowcharts only have width/height but no viewBox,
  // which causes distortion when the <img> container is narrower.
  if (!clone.getAttribute('viewBox')) {
    const w = parseFloat(width || '') || (svgEl as SVGSVGElement).getBBox?.()?.width || 800;
    const h = parseFloat(height || '') || (svgEl as SVGSVGElement).getBBox?.()?.height || 600;
    clone.setAttribute('viewBox', `0 0 ${w} ${h}`);
  }

  // Remove fixed dimensions so the SVG fills its container width and
  // the browser calculates height from the viewBox aspect ratio.
  clone.removeAttribute('width');
  clone.removeAttribute('height');

  // Ensure the aspect ratio is preserved (centered, fit within container)
  if (!clone.getAttribute('preserveAspectRatio')) {
    clone.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  }

  const svgMarkup = new XMLSerializer().serializeToString(clone);
  const dataUri = svgToDataUri(svgMarkup);
  const alt = svgEl.getAttribute('aria-label') || 'diagram';
  return `\n\n![${alt}](${dataUri})\n\n`;
}


/**
 * Convert raw SVG markup string to a base64 data URI.
 */
function svgToDataUri(svgMarkup: string): string {
  const encoded = btoa(unescape(encodeURIComponent(svgMarkup)));
  return `data:image/svg+xml;base64,${encoded}`;
}

/**
 * Inline computed styles from the live DOM onto a cloned SVG tree.
 * This captures all styles applied by the LLM page's stylesheets (colours,
 * fonts, strokes, transforms, etc.) so the SVG is fully self-contained.
 */
const SVG_STYLE_PROPERTIES = [
  'fill', 'fill-opacity', 'fill-rule',
  'stroke', 'stroke-width', 'stroke-opacity', 'stroke-dasharray',
  'stroke-dashoffset', 'stroke-linecap', 'stroke-linejoin',
  'opacity',
  'font-family', 'font-size', 'font-weight', 'font-style',
  'text-anchor', 'dominant-baseline', 'alignment-baseline',
  'color', 'letter-spacing',
  'transform',
  'visibility', 'display',
  'clip-path', 'mask',
  'marker-start', 'marker-mid', 'marker-end',
  'filter',
] as const;

function inlineComputedStyles(liveEl: Element, cloneEl: Element): void {
  try {
    const computed = window.getComputedStyle(liveEl);
    const styleChunks: string[] = [];

    for (const prop of SVG_STYLE_PROPERTIES) {
      const value = computed.getPropertyValue(prop);
      if (value && value !== '' && value !== 'none' && value !== 'normal') {
        // Skip default/inherited values that would bloat the markup
        if (prop === 'fill' && value === 'rgb(0, 0, 0)') continue;
        if (prop === 'stroke' && value === 'none') continue;
        if (prop === 'font-size' && value === '16px') continue;
        if (prop === 'display' && value === 'inline') continue;
        if (prop === 'visibility' && value === 'visible') continue;
        if (prop === 'opacity' && value === '1') continue;
        styleChunks.push(`${prop}:${value}`);
      }
    }

    if (styleChunks.length > 0) {
      // Preserve any existing inline styles
      const existing = cloneEl.getAttribute('style') || '';
      const merged = existing ? `${existing};${styleChunks.join(';')}` : styleChunks.join(';');
      cloneEl.setAttribute('style', merged);
    }
  } catch {
    // getComputedStyle may fail on detached elements — skip silently
  }

  // Recurse into child elements
  const liveChildren = liveEl.children;
  const cloneChildren = cloneEl.children;
  const len = Math.min(liveChildren.length, cloneChildren.length);
  for (let i = 0; i < len; i++) {
    inlineComputedStyles(liveChildren[i], cloneChildren[i]);
  }
}

/**
 * Check if an element is a Mermaid diagram container.
 */
function isMermaidElement(el: Element): boolean {
  const className = typeof el.className === 'string' ? el.className : '';
  return (
    className.includes('mermaid') ||
    el.getAttribute('data-mermaid') !== null ||
    (el.tagName.toUpperCase() === 'PRE' && el.querySelector('.mermaid') !== null)
  );
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
