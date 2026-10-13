import { TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';

import { API_LATENCY_MS } from '../../../../core/config/latency';
import { Partner } from '../../models/homepage.model';
import { HomepageService } from '../../services/homepage.service';
import { PartnersSection } from './partners-section';

describe('PartnersSection', () => {
  const partners: Partner[] = [{ id: 'p1', name: 'Acme', monogram: 'A' }];

  function setup() {
    TestBed.configureTestingModule({
      imports: [PartnersSection],
      providers: [MessageService, { provide: API_LATENCY_MS, useValue: 0 }],
    });
    const fixture = TestBed.createComponent(PartnersSection);
    fixture.componentRef.setInput('partners', partners);
    fixture.detectChanges();
    return fixture;
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

  it('does not save an invalid partner', () => {
    const fixture = setup();
    const save = vi.spyOn(TestBed.inject(HomepageService), 'savePartner');
    fixture.componentInstance.open();
    fixture.componentInstance.save();
    expect(save).not.toHaveBeenCalled();
    expect(fixture.componentInstance.form.touched).toBe(true);
  });

  it('saves a valid partner, closes the editor and tells the parent to reload', async () => {
    const fixture = setup();
    const component = fixture.componentInstance;
    const changed = vi.fn();
    component.changed.subscribe(changed);

    component.open();
    component.form.setValue({ name: ' New partner ', monogram: 'N' });
    component.save();
    expect(component.saving()).toBe(true);

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(changed).toHaveBeenCalledTimes(1);
    expect(component.saving()).toBe(false);
    expect(component.editorOpen()).toBe(false);
  });

  it('ignores a second submit while the first one is in flight', () => {
    const fixture = setup();
    const component = fixture.componentInstance;
    const save = vi.spyOn(TestBed.inject(HomepageService), 'savePartner');

    component.open();
    component.form.setValue({ name: 'Once', monogram: 'O' });
    component.save();
    component.save();
    expect(save).toHaveBeenCalledTimes(1);
  });
});
