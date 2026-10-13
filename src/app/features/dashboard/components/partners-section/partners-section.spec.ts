import { TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';

import { API_LATENCY_MS } from '../../../../core/config/latency';
import { Partner } from '../../models/homepage.model';
import { HomepageService } from '../../services/homepage.service';
import { PartnersSection } from './partners-section';

describe('PartnersSection', () => {
  const partners: Partner[] = [{ id: 'p1', name: 'Acme', monogram: 'A', image: null }];

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

    component.open();
    component.onDrop(dropOf(file(' logo.png ', 'image/png', 2048)));
    component.save();
    expect(component.saving()).toBe(true);

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(changed).toHaveBeenCalledTimes(1);
    expect(component.saving()).toBe(false);
    expect(component.editorOpen()).toBe(false);
    expect(component.image()).toBeNull();
  });

  it('ignores a second save while the first one is in flight', () => {
    const fixture = setup();
    const component = fixture.componentInstance;
    const save = vi.spyOn(TestBed.inject(HomepageService), 'savePartner');

    component.open();
    component.onDrop(dropOf(file('once.png', 'image/png')));
    component.save();
    component.save();
    expect(save).toHaveBeenCalledTimes(1);
  });
});

function dropOf(value: File): DragEvent {
  const event = new Event('drop') as DragEvent;
  Object.defineProperty(event, 'dataTransfer', { value: { files: [value] } });
  return event;
}
