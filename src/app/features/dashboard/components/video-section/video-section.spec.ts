import { TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';
import type { FileSelectEvent } from 'primeng/fileupload';

import { API_LATENCY_MS } from '../../../../core/config/latency';
import { HomepageService } from '../../services/homepage.service';
import { VideoSection } from './video-section';

function selectEvent(file: File): FileSelectEvent {
  return { originalEvent: new Event('change'), files: [file], currentFiles: [file] };
}

describe('VideoSection', () => {
  function setup() {
    TestBed.configureTestingModule({
      imports: [VideoSection],
      providers: [MessageService, { provide: API_LATENCY_MS, useValue: 0 }],
    });
    const fixture = TestBed.createComponent(VideoSection);
    fixture.componentRef.setInput('enabled', true);
    fixture.componentRef.setInput('name', null);
    fixture.detectChanges();
    const save = vi.spyOn(TestBed.inject(HomepageService), 'setVideoName');
    return { fixture, save };
  }

  it('renders the upload through p-fileupload in basic mode', () => {
    const { fixture } = setup();
    const root: HTMLElement = fixture.nativeElement;
    expect(root.querySelector('p-fileupload, p-fileUpload')).not.toBeNull();
    expect(root.querySelector('input[type="file"]')?.getAttribute('accept')).toBe('video/*');
  });

  it('stores the name of a selected video', async () => {
    const { fixture, save } = setup();
    fixture.componentInstance.onSelected(
      selectEvent(new File(['x'], 'intro.mp4', { type: 'video/mp4' })),
    );
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(save).toHaveBeenCalledWith('intro.mp4');
    expect(fixture.componentInstance.name()).toBe('intro.mp4');
  });

  it('ignores a file that is not a video', async () => {
    const { fixture, save } = setup();
    fixture.componentInstance.onSelected(
      selectEvent(new File(['x'], 'notes.txt', { type: 'text/plain' })),
    );
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(save).not.toHaveBeenCalled();
    expect(fixture.componentInstance.name()).toBeNull();
  });
});
