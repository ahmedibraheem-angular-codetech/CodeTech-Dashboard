import { TestBed } from '@angular/core/testing';

import { StateView, type ViewState } from './state-view';

describe('StateView', () => {
  function render(mode: ViewState, message = '') {
    TestBed.configureTestingModule({ imports: [StateView] });
    const fixture = TestBed.createComponent(StateView);
    fixture.componentRef.setInput('mode', mode);
    fixture.componentRef.setInput('message', message);
    fixture.detectChanges();
    return { fixture, root: fixture.nativeElement as HTMLElement };
  }

  it('announces loading with a PrimeNG spinner and role=status', () => {
    const { root } = render('loading', 'Loading users');
    expect(root.querySelector('.state')?.getAttribute('role')).toBe('status');
    expect(root.querySelector('p-progress-spinner, p-progressspinner')).not.toBeNull();
    expect(root.textContent).toContain('Loading users');
  });

  it('shows the empty message without a retry button', () => {
    const { root } = render('empty', 'Nothing here');
    expect(root.querySelector('.pi-inbox')).not.toBeNull();
    expect(root.querySelector('button')).toBeNull();
  });

  it('emits retry from the error state button', () => {
    const { fixture, root } = render('error', 'Failed');
    const retry = vi.fn();
    fixture.componentInstance.retry.subscribe(retry);

    root.querySelector<HTMLButtonElement>('p-button button')?.click();

    expect(root.querySelector('.state')?.getAttribute('role')).toBe('alert');
    expect(retry).toHaveBeenCalledTimes(1);
  });
});
