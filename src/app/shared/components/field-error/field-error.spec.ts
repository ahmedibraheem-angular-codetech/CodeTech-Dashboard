import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { FieldError } from './field-error';

@Component({
  imports: [FieldError],
  template: `<app-field-error id="email-error" [icon]="true">Required</app-field-error>`,
})
class Host {}

describe('FieldError', () => {
  it('is announced as an alert, keeps its id for aria-describedby and renders the message', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement.querySelector('app-field-error');

    expect(element.getAttribute('role')).toBe('alert');
    expect(element.id).toBe('email-error');
    expect(element.classList.contains('field__error')).toBe(true);
    expect(element.textContent).toContain('Required');
    expect(element.querySelector('i.pi-times-circle')).not.toBeNull();
  });
});
