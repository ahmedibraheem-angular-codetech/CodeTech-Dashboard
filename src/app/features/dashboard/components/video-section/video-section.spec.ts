import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';
import type { FileSelectEvent } from 'primeng/fileupload';
import { of, Subject } from 'rxjs';

import { authSession } from '../../../../core/auth/auth-session.fixture';
import { AuthService } from '../../../../core/auth/auth.service';
import type { HomepageContent, VideoUploadEvent } from '../../models/homepage.model';
import { HomepageService } from '../../services/homepage.service';
import { VideoSection } from './video-section';

const HOME_GRANTS = ['home.view', 'home.create', 'home.update', 'home.delete'] as const;

function selectEvent(file: File): FileSelectEvent {
  return { originalEvent: new Event('change'), files: [file], currentFiles: [file] };
}

const emptyHome: HomepageContent = {
  partners: [],
  videoEnabled: true,
  videoName: 'intro.mp4',
  videoUrl: 'https://example.test/intro.mp4',
  about: { texts: { ar: { title: '', body: '', points: [] }, en: { title: '', body: '', points: [] } }, image: null },
  vision: { texts: { ar: { title: '', body: '', points: [] }, en: { title: '', body: '', points: [] } }, image: null },
};

describe('VideoSection', () => {
  function setup(name: string | null = null) {
    TestBed.configureTestingModule({
      imports: [VideoSection],
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
    const fixture = TestBed.createComponent(VideoSection);
    fixture.componentRef.setInput('enabled', true);
    fixture.componentRef.setInput('name', name);
    fixture.componentRef.setInput('url', name ? 'https://example.test/intro.mp4' : null);
    fixture.detectChanges();
    return fixture;
  }

  it('renders the upload through p-fileupload in basic mode', () => {
    const fixture = setup();
    const root: HTMLElement = fixture.nativeElement;
    expect(root.querySelector('p-fileupload, p-fileUpload')).not.toBeNull();
    expect(root.querySelector('input[type="file"]')?.getAttribute('accept')).toContain('video/');
  });

  it('uploads a selected video through the API', async () => {
    const fixture = setup();
    const stream: VideoUploadEvent[] = [
      { phase: 'upload', progress: 45 },
      { phase: 'saving', progress: 92 },
      { phase: 'done', progress: 100, content: emptyHome },
    ];
    const save = vi
      .spyOn(TestBed.inject(HomepageService), 'setVideo')
      .mockReturnValue(of(...stream));
    fixture.componentInstance.onSelected(
      selectEvent(new File(['x'], 'intro.mp4', { type: 'video/mp4' })),
    );
    await fixture.whenStable();

    expect(save).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance.name()).toBe('intro.mp4');
    expect(fixture.componentInstance.url()).toBe('https://example.test/intro.mp4');
    expect(fixture.componentInstance.saving()).toBe(false);
    expect(fixture.componentInstance.uploadProgress()).toBe(0);
  });

  it('shows upload progress while setVideo emits progress events', async () => {
    const fixture = setup();
    const updates = new Subject<VideoUploadEvent>();
    vi.spyOn(TestBed.inject(HomepageService), 'setVideo').mockReturnValue(updates);
    fixture.componentInstance.onSelected(
      selectEvent(new File(['x'], 'intro.mp4', { type: 'video/mp4' })),
    );
    fixture.detectChanges();

    expect(fixture.componentInstance.saving()).toBe(true);
    expect(fixture.nativeElement.querySelector('.video-upload')).not.toBeNull();

    updates.next({ phase: 'upload', progress: 40 });
    fixture.detectChanges();
    expect(fixture.componentInstance.uploadProgress()).toBe(40);
    expect(fixture.nativeElement.textContent).toContain('%');

    updates.next({ phase: 'saving', progress: 92 });
    fixture.detectChanges();
    expect(fixture.componentInstance.uploadPhase()).toBe('saving');

    updates.next({ phase: 'done', progress: 100, content: emptyHome });
    updates.complete();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.componentInstance.saving()).toBe(false);
    expect(fixture.nativeElement.querySelector('.video-upload')).toBeNull();
  });

  it('ignores a file that is not a video', async () => {
    const fixture = setup();
    const save = vi.spyOn(TestBed.inject(HomepageService), 'setVideo');
    fixture.componentInstance.onSelected(
      selectEvent(new File(['x'], 'notes.txt', { type: 'text/plain' })),
    );
    await fixture.whenStable();

    expect(save).not.toHaveBeenCalled();
    expect(fixture.componentInstance.name()).toBeNull();
  });

  it('rejects a video larger than 20 MB', async () => {
    const fixture = setup();
    const save = vi.spyOn(TestBed.inject(HomepageService), 'setVideo');
    const messages = TestBed.inject(MessageService);
    const add = vi.spyOn(messages, 'add');
    fixture.componentInstance.onSelected(
      selectEvent(new File([new Uint8Array(20 * 1024 * 1024 + 1)], 'big.mp4', { type: 'video/mp4' })),
    );
    await fixture.whenStable();
    expect(save).not.toHaveBeenCalled();
    expect(add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
  });
});
