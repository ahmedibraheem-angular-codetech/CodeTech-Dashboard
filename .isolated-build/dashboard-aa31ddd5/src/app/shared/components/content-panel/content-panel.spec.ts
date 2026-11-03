import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { ContentPanel } from './content-panel';

@Component({
  imports: [ContentPanel],
  template: `<app-content-panel><p class="inner">content</p></app-content-panel>`,
})
class Host {}

describe('ContentPanel', () => {
  it('projects the content and draws the shared container', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const panel: HTMLElement = fixture.nativeElement.querySelector('app-content-panel');

    expect(panel.querySelector('.inner')?.textContent).toBe('content');
    const style = getComputedStyle(panel);
    expect(style.display).toBe('flex');
    expect(style.padding).toBe('12px');
    expect(style.borderRadius).toBe('16px');
  });
});
