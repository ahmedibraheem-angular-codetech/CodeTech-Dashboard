import { TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';

import { PermissionsPage } from './permissions';

describe('PermissionsPage', () => {
  it('renders the roles matrix for the selected role', () => {
    TestBed.configureTestingModule({
      imports: [PermissionsPage],
      providers: [MessageService],
    });
    const fixture = TestBed.createComponent(PermissionsPage);
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;

    expect(root.querySelector('h1')?.textContent).toContain('التحكم في الاذونات');
    expect(root.textContent).toContain('الأدوار');
    expect(root.textContent).toContain('الرئيسية');
    expect(root.querySelectorAll('.permissions-table__row').length).toBe(11);
    expect(root.querySelectorAll('p-toggleswitch').length).toBe(33);
  });

  it('opens the add-role dialog with the module permission grid', () => {
    TestBed.configureTestingModule({
      imports: [PermissionsPage],
      providers: [MessageService],
    });
    const fixture = TestBed.createComponent(PermissionsPage);
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    root.querySelector<HTMLButtonElement>('.permissions-add')?.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.editorOpen()).toBe(true);
    expect(document.querySelectorAll('.permissions-module-card').length).toBe(10);
    expect(document.body.textContent).toContain('اسم الدور');
    expect(document.body.textContent).toContain('الأذونات');
  });
});
