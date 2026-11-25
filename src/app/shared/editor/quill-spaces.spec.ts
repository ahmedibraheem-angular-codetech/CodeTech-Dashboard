import Quill from 'quill';
import { describe, expect, it } from 'vitest';

import { restoreBreakableSpaces } from './quill';

function editor(): Quill {
  const host = document.createElement('div');
  document.body.appendChild(host);
  return new Quill(host, { theme: 'snow' });
}

const NBSP = '\u00a0';

describe('restoreBreakableSpaces with real Quill semantic HTML', () => {
  it('turns ordinary spaces back into breakable spaces', () => {
    const q = editor();
    q.setContents([{ insert: 'a b c\n' }]);
    expect(q.getSemanticHTML()).toBe('<p>a&nbsp;b&nbsp;c</p>');
    expect(restoreBreakableSpaces(q.getSemanticHTML())).toBe('<p>a b c</p>');
  });

  it('keeps a typed non-breaking space (literal U+00A0) as it is', () => {
    const q = editor();
    q.setContents([{ insert: `a${NBSP}b c\n` }]);
    expect(restoreBreakableSpaces(q.getSemanticHTML())).toBe(`<p>a${NBSP}b c</p>`);
  });

  it('keeps repeated spaces and block edges visible', () => {
    const q = editor();
    q.setContents([{ insert: 'a  b\n x \n' }]);
    expect(restoreBreakableSpaces(q.getSemanticHTML())).toBe(
      '<p>a &nbsp;b</p><p>&nbsp;x&nbsp;</p>',
    );
  });

  it('handles inline formatting, links and mixed Arabic and English', () => {
    const q = editor();
    q.setContents([
      { insert: 'x ' },
      { insert: 'bold y', attributes: { bold: true } },
      { insert: ' مرحبا بالعالم ' },
      { insert: 'link t', attributes: { link: 'https://e.com/a b' } },
      { insert: '\n' },
    ]);
    const out = restoreBreakableSpaces(q.getSemanticHTML());
    expect(out).toContain('<p>x <strong>bold y</strong> مرحبا بالعالم ');
    expect(out).toContain('href="https://e.com/a b"');
    expect(out).toContain('>link t</a>');
    expect(out).not.toContain('&nbsp;');
  });

  it('keeps the same text after save and reopen', () => {
    const q = editor();
    q.setContents([{ insert: `one  two ${NBSP}three\n lead\n` }]);
    const before = q.getText();
    const saved = restoreBreakableSpaces(q.getSemanticHTML());
    const q2 = editor();
    q2.setContents(q2.clipboard.convert({ html: saved }));
    expect(q2.getText().replaceAll(NBSP, ' ')).toBe(before.replaceAll(NBSP, ' '));
  });

  it('leaves html without the entity unchanged', () => {
    expect(restoreBreakableSpaces('<p>a b</p>')).toBe('<p>a b</p>');
  });
});
