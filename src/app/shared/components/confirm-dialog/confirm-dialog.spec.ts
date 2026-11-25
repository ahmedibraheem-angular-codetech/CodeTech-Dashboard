import { TestBed } from '@angular/core/testing';

import { ConfirmDialog } from './confirm-dialog';

describe('ConfirmDialog', () => {
  const options = {
    title: 'Delete',
    message: 'Sure?',
    confirmLabel: 'Delete',
    cancelLabel: 'Cancel',
    danger: true,
  };

  function create() {
    const fixture = TestBed.createComponent(ConfirmDialog);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('resolves false and closes when Escape is pressed', async () => {
    const dialog = create();
    const answer = dialog.ask(options);
    expect(dialog.visible()).toBe(true);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(await answer).toBe(false);
    expect(dialog.visible()).toBe(false);
  });

  it('ignores Escape while closed and still confirms with the button', async () => {
    const dialog = create();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(dialog.visible()).toBe(false);

    const answer = dialog.ask(options);
    dialog.confirm();
    expect(await answer).toBe(true);
  });
});
