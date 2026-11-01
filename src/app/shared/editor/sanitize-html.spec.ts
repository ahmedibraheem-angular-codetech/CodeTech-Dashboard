import { describe, expect, it } from 'vitest';

import { sanitizeRichTextHtml } from './sanitize-html';

describe('sanitizeRichTextHtml', () => {
  it('keeps Quill color styles used by the editor', () => {
    const html = '<p><span style="color:rgb(240,102,102);">نص أحمر</span></p>';
    const result = sanitizeRichTextHtml(html);
    expect(result).toMatch(/style="[^"]*color:\s*rgb\(240,\s*102,\s*102\)/i);
    expect(result).toContain('نص أحمر');
  });

  it('keeps background-color and drops unrelated style properties', () => {
    const html =
      '<p><span style="color:#f00; background-color:rgb(0,0,0); position:fixed; top:0">x</span></p>';
    const result = sanitizeRichTextHtml(html);
    expect(result).toMatch(/color:\s*#f00/i);
    expect(result).toMatch(/background-color:\s*rgb\(0,\s*0,\s*0\)/i);
    expect(result).not.toContain('position');
    expect(result).not.toContain('top:');
  });

  it('removes scripts and event handlers', () => {
    const html =
      '<p>safe</p><script>window.__x=1</script><img src="https://cdn.test/a.png" onerror="alert(1)">';
    const result = sanitizeRichTextHtml(html);
    expect(result).toContain('safe');
    expect(result.toLowerCase()).not.toContain('<script');
    expect(result.toLowerCase()).not.toContain('onerror');
    expect(result).toContain('src="https://cdn.test/a.png"');
  });

  it('blocks javascript: URLs', () => {
    const result = sanitizeRichTextHtml('<a href="javascript:alert(1)">click</a>');
    expect(result).not.toContain('javascript:');
  });

  it('preserves lists, headings, links and hr from legal content', () => {
    const html =
      '<h3>عنوان</h3><ul><li>بند</li></ul><hr><a href="mailto:legal@code-tech.sa" target="_blank">mail</a>';
    const result = sanitizeRichTextHtml(html);
    expect(result).toContain('<h3>');
    expect(result).toContain('<ul>');
    expect(result).toContain('<hr>');
    expect(result).toContain('mailto:legal@code-tech.sa');
    expect(result).toContain('rel="noreferrer noopener"');
  });
});
