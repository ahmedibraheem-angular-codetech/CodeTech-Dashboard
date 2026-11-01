import { TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';

import { authSession } from '../../../../core/auth/auth-session.fixture';
import { AuthService } from '../../../../core/auth/auth.service';
import { PermissionsPage } from './permissions';

const ROLE_GRANTS = ['roles.view', 'roles.create', 'roles.update', 'roles.delete'] as const;

describe('PermissionsPage', () => {
  function render() {
    TestBed.configureTestingModule({
      imports: [PermissionsPage],
      providers: [MessageService],
    });
    TestBed.inject(AuthService).session.set(
      authSession({
        token: 't',
        email: 'admin@codetech.sa',
        name: 'Admin',
        profileLoaded: true,
        permissions: [...ROLE_GRANTS],
      }),
    );
    const fixture = TestBed.createComponent(PermissionsPage);
    fixture.detectChanges();
    return fixture;
  }

  it('renders the roles matrix for the selected role', () => {
    const fixture = render();
    const root: HTMLElement = fixture.nativeElement;

    expect(root.querySelector('h1')?.textContent).toContain('التحكم في الاذونات');
    expect(root.textContent).toContain('الأدوار');
    expect(root.textContent).toContain('الرئيسية');
    expect(root.querySelectorAll('.permissions-table__row').length).toBe(11);
    expect(root.querySelectorAll('p-toggleswitch').length).toBe(33);
  });

  it('opens the add-role dialog with the module permission grid', () => {
    const fixture = render();
    const root: HTMLElement = fixture.nativeElement;
    root.querySelector<HTMLButtonElement>('.permissions-add')?.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.editorOpen()).toBe(true);
    expect(document.querySelectorAll('.permissions-module-card').length).toBe(10);
    expect(document.body.textContent).toContain('اسم الدور');
    expect(document.body.textContent).toContain('الأذونات');
  });
});
