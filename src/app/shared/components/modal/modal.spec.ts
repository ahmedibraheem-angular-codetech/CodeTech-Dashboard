import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';

import { Modal } from './modal';

@Component({
  imports: [Modal],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal
      [(visible)]="open"
      title="Edit profile"
      [icon]="icon()"
      [saving]="saving()"
      [saveDisabled]="saveDisabled()"
      [showSave]="showSave()"
      [showCancel]="showCancel()"
      [closeOnCancel]="closeOnCancel()"
      (save)="saves = saves + 1"
      (cancel)="cancels = cancels + 1"
    >
      <p class="projected">Body</p>
    </app-modal>
  `,
})
class Host {
  readonly open = signal(true);
  readonly icon = signal<string | undefined>('pi pi-user-edit');
  readonly saving = signal(false);
  readonly saveDisabled = signal(false);
  readonly showSave = signal(true);
  readonly showCancel = signal(true);
  readonly closeOnCancel = signal(true);
  saves = 0;
  cancels = 0;
}

describe('Modal', () => {
  async function setup(): Promise<ComponentFixture<Host>> {
    TestBed.configureTestingModule({ imports: [Host] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  const root = (): HTMLElement => document.body;
  const actions = (): HTMLButtonElement[] =>
    Array.from(root().querySelectorAll<HTMLButtonElement>('.app-modal__action button'));

  afterEach(() => {
    document.querySelectorAll('.p-dialog-mask, .p-dialog').forEach((node) => node.remove());
  });

  it('renders the title, icon and projected content as an accessible dialog', async () => {
    await setup();
    const dialog = root().querySelector('[role="dialog"]');
    expect(dialog?.classList).toContain('app-modal');
    expect(dialog?.getAttribute('aria-modal')).toBe('true');
    const title = root().querySelector('.app-modal__title');
    expect(title?.textContent).toContain('Edit profile');
    expect(dialog?.getAttribute('aria-labelledby')).toBe(title?.id);
    expect(root().querySelector('.app-modal__icon .pi-user-edit')).not.toBeNull();
    expect(root().querySelector('.projected')?.textContent).toBe('Body');
    expect(dialog?.closest('body')).toBe(document.body);
  });

  it('omits the icon when none is given', async () => {
    const fixture = await setup();
    fixture.componentInstance.icon.set(undefined);
    fixture.detectChanges();
    expect(root().querySelector('.app-modal__icon')).toBeNull();
  });

  it('shows the default translated actions, save first', async () => {
    await setup();
    expect(actions().map((button) => button.textContent?.trim())).toEqual([
      'حفظ التعديلات',
      'إلغاء',
    ]);
  });

  it('emits save and keeps the modal open', async () => {
    const fixture = await setup();
    actions()[0].click();
    expect(fixture.componentInstance.saves).toBe(1);
    expect(fixture.componentInstance.open()).toBe(true);
  });

  it('does not emit save while disabled or saving', async () => {
    const fixture = await setup();
    fixture.componentInstance.saveDisabled.set(true);
    fixture.detectChanges();
    actions()[0].click();
    expect(actions()[0].disabled).toBe(true);

    fixture.componentInstance.saveDisabled.set(false);
    fixture.componentInstance.saving.set(true);
    fixture.detectChanges();
    actions()[0].click();
    expect(fixture.componentInstance.saves).toBe(0);
    expect(root().querySelector('.app-modal__action .p-button-loading-icon')).not.toBeNull();
  });

  it('cancel emits and closes through the visible state', async () => {
    const fixture = await setup();
    actions()[1].click();
    expect(fixture.componentInstance.cancels).toBe(1);
    expect(fixture.componentInstance.open()).toBe(false);
  });

  it('cancel only emits when the parent keeps control of closing', async () => {
    const fixture = await setup();
    fixture.componentInstance.closeOnCancel.set(false);
    fixture.detectChanges();
    actions()[1].click();
    expect(fixture.componentInstance.cancels).toBe(1);
    expect(fixture.componentInstance.open()).toBe(true);
  });

  it('offers the close icon only when the modal closes itself', async () => {
    const fixture = await setup();
    expect(root().querySelector('.p-dialog-close-button')).not.toBeNull();

    fixture.componentInstance.closeOnCancel.set(false);
    fixture.detectChanges();
    expect(root().querySelector('.p-dialog-close-button')).toBeNull();
  });

  it('cannot be cancelled while saving', async () => {
    const fixture = await setup();
    fixture.componentInstance.saving.set(true);
    fixture.detectChanges();
    expect(actions()[1].disabled).toBe(true);
    actions()[1].click();
    expect(fixture.componentInstance.cancels).toBe(0);
    expect(fixture.componentInstance.open()).toBe(true);
  });

  it('hides either action on request', async () => {
    const fixture = await setup();
    fixture.componentInstance.showCancel.set(false);
    fixture.detectChanges();
    expect(actions()).toHaveLength(1);

    fixture.componentInstance.showCancel.set(true);
    fixture.componentInstance.showSave.set(false);
    fixture.detectChanges();
    expect(actions().map((button) => button.textContent?.trim())).toEqual(['إلغاء']);
  });
});
