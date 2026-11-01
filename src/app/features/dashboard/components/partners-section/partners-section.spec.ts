import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';
import { Subject, of } from 'rxjs';

import { authSession } from '../../../../core/auth/auth-session.fixture';
import { AuthService } from '../../../../core/auth/auth.service';
import { type Partner } from '../../models/homepage.model';
import { HomepageService } from '../../services/homepage.service';
import { PartnersSection } from './partners-section';

const HOME_GRANTS = ['home.view', 'home.create', 'home.update', 'home.delete'] as const;

describe('PartnersSection', () => {
  const partners: Partner[] = [{ id: 'p1', name: 'Acme', monogram: 'A', image: null }];

  function setup() {
    TestBed.configureTestingModule({
      imports: [PartnersSection],
      providers: [
        MessageService,
        provideHttpClient(withInterceptors([])),
        provideHttpClientTesting(),
      ],
    });
    TestBed.inject(AuthService).session.set(
      authSession({
        token: 't',
        email: 'admin@codetech.sa',
        name: 'Admin',
        profileLoaded: true,
        permissions: [...HOME_GRANTS],
      }),
    );
    const fixture = TestBed.createComponent(PartnersSection);
    fixture.componentRef.setInput('partners', partners);
    fixture.detectChanges();
    return fixture;
  }

  function file(name: string, type: string, size = 1024): File {
    return new File([new Uint8Array(size)], name, { type });
  }

  it('shows the empty state when there are no partners', () => {
    const fixture = setup();
    fixture.componentRef.setInput('partners', []);
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    expect(root.querySelector('app-section-empty')).not.toBeNull();
    expect(root.textContent).toContain('لا يوجد شركاء بعد');
    expect(root.querySelector('.partner-card')).toBeNull();
  });

  it('does not save a partner without an image', () => {
    const fixture = setup();
    const save = vi.spyOn(TestBed.inject(HomepageService), 'savePartner');
    fixture.componentInstance.open();
    fixture.componentInstance.save();
    expect(save).not.toHaveBeenCalled();
  });

  it('rejects an unsupported or oversized image', () => {
    const fixture = setup();
    const component = fixture.componentInstance;
    component.open();

    component.onDrop(dropOf(file('doc.pdf', 'application/pdf')));
    expect(component.imageError()).toBe('home.imageType');

    component.onDrop(dropOf(file('big.png', 'image/png', 5 * 1024 * 1024 + 1)));
    expect(component.imageError()).toBe('home.imageSize');
    expect(component.image()).toBeNull();
  });

  it('saves a partner from the picked image, closes the modal and tells the parent', async () => {
    const fixture = setup();
    const component = fixture.componentInstance;
    const changed = vi.fn();
    component.changed.subscribe(changed);
    vi.spyOn(TestBed.inject(HomepageService), 'savePartner').mockReturnValue(
      of({
        id: '99',
        name: 'logo.png',
        monogram: 'l',
        image: { name: 'logo.png', size: 2048, uploadedAt: '2026-11-01', uuid: 'u-99' },
      }),
    );

    component.open();
    component.onDrop(dropOf(file('logo.png', 'image/png', 2048)));
    component.save();
    await fixture.whenStable();
    expect(changed).toHaveBeenCalledTimes(1);
    expect(component.saving()).toBe(false);
    expect(component.editorOpen()).toBe(false);
    expect(component.image()).toBeNull();
  });

  it('ignores a second save while the first one is in flight', () => {
    const fixture = setup();
    const component = fixture.componentInstance;
    const pending = new Subject<Partner>();
    const save = vi
      .spyOn(TestBed.inject(HomepageService), 'savePartner')
      .mockReturnValue(pending.asObservable());

    component.open();
    component.onDrop(dropOf(file('once.png', 'image/png')));
    component.save();
    component.save();
    expect(save).toHaveBeenCalledTimes(1);
    pending.complete();
  });
});

function dropOf(value: File): DragEvent {
  const event = new Event('drop') as DragEvent;
  Object.defineProperty(event, 'dataTransfer', { value: { files: [value] } });
  return event;
}
