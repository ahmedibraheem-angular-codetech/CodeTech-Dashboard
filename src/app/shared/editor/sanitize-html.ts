
const ALLOWED_TAGS = new Set([
  'A',
  'BLOCKQUOTE',
  'BR',
  'CODE',
  'DIV',
  'EM',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'HR',
  'I',
  'IMG',
  'LI',
  'OL',
  'P',
  'PRE',
  'S',
  'SPAN',
  'STRONG',
  'SUB',
  'SUP',
  'U',
  'UL',
]);

const GLOBAL_ATTRS = new Set(['class', 'dir']);
const TAG_ATTRS: Record<string, ReadonlySet<string>> = {
  A: new Set(['href', 'target', 'rel']),
  IMG: new Set(['src', 'alt', 'title']),
};

const SAFE_STYLE_PROP = /^(color|background-color)$/i;
const SAFE_COLOR_VALUE =
  /^(transparent|currentcolor|#[0-9a-f]{3,8}|rgba?\(\s*[\d.]+\s*(,\s*[\d.]+\s*){2,3}\)|[a-z]+)$/i;

export function sanitizeRichTextHtml(html: string): string {
  if (!html) {
    return '';
  }

  const parsed = new DOMParser().parseFromString(`<div id="__root">${html}</div>`, 'text/html');
  const root = parsed.getElementById('__root');
  if (!root) {
    return '';
  }

  sanitizeNode(root);
  return root.innerHTML;
}

function sanitizeNode(node: Node): void {
  const children = Array.from(node.childNodes);
  for (const child of children) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as Element;
      const tag = el.tagName.toUpperCase();

      if (!ALLOWED_TAGS.has(tag)) {

        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'IFRAME' || tag === 'OBJECT') {
          el.remove();
          continue;
        }
        const parent = el.parentNode;
        if (!parent) {
          el.remove();
          continue;
        }
        sanitizeNode(el);
        while (el.firstChild) {
          parent.insertBefore(el.firstChild, el);
        }
        el.remove();
        continue;
      }

      sanitizeElement(el);
      sanitizeNode(el);
    } else if (child.nodeType === Node.COMMENT_NODE) {
      child.parentNode?.removeChild(child);
    }
  }
}

function sanitizeElement(el: Element): void {
  const tag = el.tagName.toUpperCase();
  const allowed = TAG_ATTRS[tag];

  for (const attr of Array.from(el.attributes)) {
    const name = attr.name.toLowerCase();

    if (name.startsWith('on')) {
      el.removeAttribute(attr.name);
      continue;
    }

    if (name === 'style') {
      const cleaned = sanitizeStyleAttribute(attr.value);
      if (cleaned) {
        el.setAttribute('style', cleaned);
      } else {
        el.removeAttribute('style');
      }
      continue;
    }

    if (GLOBAL_ATTRS.has(name) || allowed?.has(name)) {
      if ((name === 'href' || name === 'src') && isDangerousUrl(attr.value)) {
        el.removeAttribute(attr.name);
      }
      continue;
    }

    el.removeAttribute(attr.name);
  }

  if (tag === 'A' && el.hasAttribute('href') && el.getAttribute('target') === '_blank') {
    el.setAttribute('rel', 'noreferrer noopener');
  }
}

function sanitizeStyleAttribute(style: string): string | null {
  const kept: string[] = [];
  for (const declaration of style.split(';')) {
    const colon = declaration.indexOf(':');
    if (colon < 0) {
      continue;
    }
    const prop = declaration.slice(0, colon).trim();
    const value = declaration.slice(colon + 1).trim();
    if (!SAFE_STYLE_PROP.test(prop) || !SAFE_COLOR_VALUE.test(value)) {
      continue;
    }
    kept.push(`${prop}: ${value}`);
  }
  return kept.length > 0 ? kept.join('; ') : null;
}

function isDangerousUrl(value: string): boolean {
  const trimmed = value.trim().toLowerCase();
  return (
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('vbscript:') ||
    trimmed.startsWith('data:text/html')
  );
}
