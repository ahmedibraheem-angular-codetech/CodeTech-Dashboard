import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { LanguageService } from '../../../core/services/language.service';
import { AppButton, type AppButtonVariant } from './app-button';

@Component({
  imports: [AppButton],
  template: `
    <form (ngSubmit)="submits = submits + 1">
      <app-button [type]="type" [label]="label" (clicked)="clicks = clicks + 1" />
    </form>
  `,
})
class FormHost {
  type: 'button' | 'submit' | 'reset' = 'button';
  label = 'Go';
  clicks = 0;
  submits = 0;
}

describe('AppButton', () => {
  function render(inputs: Record<string, unknown> = {}) {
    TestBed.configureTestingModule({ imports: [AppButton] });
    const fixture = TestBed.createComponent(AppButton);
    for (const [key, value] of Object.entries(inputs)) {
      fixture.componentRef.setInput(key, value);
    }
    fixture.detectChanges();
    return {
      fixture,
      host: fixture.nativeElement as HTMLElement,
      button: () => fixture.nativeElement.querySelector('button') as HTMLButtonElement,
    };
  }

  it('renders a primary medium button with type=button by default', () => {
    const { button, host } = render({ label: 'Save' });
    const native = button();
    expect(native.type).toBe('button');
    expect(native.textContent).toContain('Save');
    expect(native.classList.contains('p-button-sm')).toBe(false);
    expect(native.classList.contains('p-button-lg')).toBe(false);
    expect(host.classList.contains('app-button')).toBe(true);
  });

  it.each<[AppButtonVariant, string]>([
    ['secondary', 'p-button-secondary'],
    ['outlined', 'p-button-outlined'],
    ['ghost', 'p-button-text'],
    ['danger', 'p-button-danger'],
    ['success', 'p-button-success'],
  ])('maps variant %s to %s', (variant, expectedClass) => {
    const { button } = render({ label: 'Action', variant });
    expect(button().classList.contains(expectedClass)).toBe(true);
  });

  it('maps small and large sizes onto PrimeNG size classes', () => {
    const { fixture, button } = render({ label: 'Sized', size: 'small' });
    expect(button().classList.contains('p-button-sm')).toBe(true);

    fixture.componentRef.setInput('size', 'large');
    fixture.detectChanges();
    expect(button().classList.contains('p-button-lg')).toBe(true);
  });

  it('renders icon-only, icon+text, and respects a physical iconPos', () => {
    const { fixture, host, button } = render({ icon: 'pi pi-plus', ariaLabel: 'Add' });
    expect(button().getAttribute('aria-label')).toBe('Add');
    expect(button().querySelector('.pi-plus')).not.toBeNull();
    expect(host.classList.contains('app-button--icon-only')).toBe(true);

    fixture.componentRef.setInput('label', 'Add user');
    fixture.componentRef.setInput('iconPos', 'right');
    fixture.detectChanges();
    expect(button().textContent).toContain('Add user');
    expect(button().querySelector('.p-button-icon-right')).not.toBeNull();
  });

  it('places a start icon at the inline start for Arabic and English', () => {
    const { fixture, button } = render({
      label: 'Save',
      icon: 'pi pi-save',
      iconPos: 'start',
    });
    const lang = TestBed.inject(LanguageService);

    lang.set('ar');
    fixture.detectChanges();
    expect(button().querySelector('.p-button-icon-right')).not.toBeNull();

    lang.set('en');
    fixture.detectChanges();
    expect(button().querySelector('.p-button-icon-left')).not.toBeNull();
    lang.set('ar');
  });

  it('disables the control and shows a loading indicator', () => {
    const { fixture, button } = render({ label: 'Save', disabled: true });
    expect(button().disabled).toBe(true);

    fixture.componentRef.setInput('disabled', false);
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    expect(button().disabled).toBe(true);
    expect(button().classList.contains('p-button-loading')).toBe(true);
  });

  it('emits clicked from the inner PrimeNG button', () => {
    const { fixture, button } = render({ label: 'Click' });
    const clicked = vi.fn();
    fixture.componentInstance.clicked.subscribe(clicked);
    button().click();
    expect(clicked).toHaveBeenCalledTimes(1);
  });

  it('does not submit a wrapping form when type is the default button', () => {
    TestBed.configureTestingModule({ imports: [FormHost] });
    const fixture = TestBed.createComponent(FormHost);
    fixture.detectChanges();

    const native = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(native.type).toBe('button');
    native.click();
    expect(fixture.componentInstance.clicks).toBe(1);
    expect(fixture.componentInstance.submits).toBe(0);
  });

  it('forwards submit and reset to the native button', () => {
    const { fixture, button } = render({ label: 'Save', type: 'submit' });
    expect(button().type).toBe('submit');

    fixture.componentRef.setInput('type', 'reset');
    fixture.detectChanges();
    expect(button().type).toBe('reset');
  });

  it('marks the host as fluid when requested', () => {
    const { host } = render({ label: 'Full', fluid: true });
    expect(host.classList.contains('app-button--fluid')).toBe(true);
  });
});
