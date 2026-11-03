import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { apiUrl } from '../../../core/config/api';
import { HomepageService } from './homepage.service';
import { HOME_PAGE_DTO } from './homepage.mock';

const HOME = apiUrl(environment.apiUrl, 'admin/pages/home');
const MEDIA = apiUrl(environment.apiUrl, 'admin/media');
const PARTNERS = apiUrl(environment.apiUrl, 'admin/partners');

describe('HomepageService', () => {
  let service: HomepageService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([])), provideHttpClientTesting()],
    });
    service = TestBed.inject(HomepageService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads and maps GET /admin/pages/home', async () => {
    const result = firstValueFrom(service.load());
    http.expectOne(HOME).flush({ data: HOME_PAGE_DTO });
    const content = await result;
    expect(content.partners).toHaveLength(2);
    expect(content.about.texts.en.title).toBe('About CodeTech');
    expect(content.videoUrl).toContain('intro-video.mp4');
  });

  it('uploads a logo then POSTs /admin/partners', async () => {
    const file = new File(['x'], 'new-logo.png', { type: 'image/png' });
    const result = firstValueFrom(
      service.savePartner({
        id: 'new',
        name: 'new-logo',
        monogram: 'n',
        image: { name: 'new-logo.png', size: 1, uploadedAt: '2026-11-01', file },
      }),
    );
    const media = http.expectOne(MEDIA);
    expect((media.request.body as FormData).get('type')).toBe('image');
    media.flush({
      data: {
        uuid: 'uploaded-logo',
        name: 'new-logo',
        file_name: 'new-logo.png',
        mime_type: 'image/png',
        size: 1,
        url: 'https://example.test/new-logo.png',
        download_url: 'https://example.test/download',
        created_at: '2026-11-01T10:00:00.000000Z',
      },
    });
    const create = http.expectOne(PARTNERS);
    expect(create.request.method).toBe('POST');
    expect(create.request.body).toEqual({ logo: 'uploaded-logo' });
    create.flush({
      data: {
        id: 99,
        logo: {
          uuid: 'uploaded-logo',
          name: 'new-logo',
          file_name: 'new-logo.png',
          mime_type: 'image/png',
          size: 1,
          url: 'https://example.test/new-logo.png',
          download_url: 'https://example.test/download',
          created_at: '2026-11-01T10:00:00.000000Z',
        },
        sort_order: 3,
        created_at: '2026-11-01T10:00:00.000000Z',
        updated_at: '2026-11-01T10:00:00.000000Z',
      },
    });
    await expect(result).resolves.toMatchObject({ id: '99', name: 'new-logo.png' });
  });

  it('deletes a partner by id', async () => {
    const result = firstValueFrom(service.removePartner('7'));
    const request = http.expectOne(`${PARTNERS}/7`);
    expect(request.request.method).toBe('DELETE');
    request.flush('', { status: 204, statusText: 'No Content' });
    await result;
  });

  it('toggles intro video visibility', async () => {
    const result = firstValueFrom(service.setVideoEnabled(false));
    const request = http.expectOne(`${HOME}/intro-video`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ is_visible: false });
    request.flush({
      data: {
        ...HOME_PAGE_DTO,
        intro_video: { ...HOME_PAGE_DTO.intro_video, is_visible: false },
      },
    });
    await expect(result).resolves.toMatchObject({ videoEnabled: false });
  });

  it('uploads a video then PUTs intro-video', async () => {
    const file = new File(['video'], 'clip.mp4', { type: 'video/mp4' });
    const result = firstValueFrom(service.setVideo(file));
    const media = http.expectOne(MEDIA);
    expect((media.request.body as FormData).get('type')).toBe('video');
    media.flush({
      data: {
        uuid: 'vid-9',
        name: 'clip',
        file_name: 'clip.mp4',
        mime_type: 'video/mp4',
        size: 4,
        url: 'https://example.test/clip.mp4',
        download_url: 'https://example.test/download',
        created_at: '2026-11-01T10:00:00.000000Z',
      },
    });
    const put = http.expectOne(`${HOME}/intro-video`);
    expect(put.request.body).toEqual({ video: 'vid-9' });
    put.flush({
      data: {
        ...HOME_PAGE_DTO,
        intro_video: {
          is_visible: true,
          video: {
            uuid: 'vid-9',
            name: 'clip',
            file_name: 'clip.mp4',
            mime_type: 'video/mp4',
            size: 4,
            url: 'https://example.test/clip.mp4',
            download_url: 'https://example.test/download',
            created_at: '2026-11-01T10:00:00.000000Z',
          },
        },
      },
    });
    await expect(result).resolves.toMatchObject({
      videoName: 'clip.mp4',
      videoUrl: 'https://example.test/clip.mp4',
    });
  });

  it('saves the about block with both languages and a new image uuid', async () => {
    const file = new File(['img'], 'shot.png', { type: 'image/png' });
    const block = {
      texts: {
        ar: { title: 'عنوان', body: 'وصف', points: ['نقطة'] },
        en: { title: 'Title', body: 'Body', points: ['Point'] },
      },
      image: { name: 'shot.png', size: 1, uploadedAt: '2026-11-01', file },
    };
    const result = firstValueFrom(service.saveBlock('about', block, null));
    http.expectOne(MEDIA).flush({
      data: {
        uuid: 'img-1',
        name: 'shot',
        file_name: 'shot.png',
        mime_type: 'image/png',
        size: 1,
        url: 'https://example.test/shot.png',
        download_url: 'https://example.test/download',
        created_at: '2026-11-01T10:00:00.000000Z',
      },
    });
    const put = http.expectOne(`${HOME}/about`);
    expect(put.request.body).toEqual({
      title: { ar: 'عنوان', en: 'Title' },
      description: { ar: 'وصف', en: 'Body' },
      points: { ar: ['نقطة'], en: ['Point'] },
      image: 'img-1',
    });
    put.flush({ data: HOME_PAGE_DTO });
    await expect(result).resolves.toMatchObject({
      texts: { ar: { title: 'عن كود التقنية' } },
    });
  });

  it('omits image when keeping an existing file and clears with null', async () => {
    const previous = {
      name: 'about.png',
      size: 1,
      uploadedAt: '2026-10-29',
      uuid: 'about-image',
      url: 'https://example.test/about.png',
    };
    const keep = firstValueFrom(
      service.saveBlock(
        'vision',
        {
          texts: {
            ar: { title: 'رؤية', body: '', points: [] },
            en: { title: '', body: '', points: [] },
          },
          image: previous,
        },
        previous,
      ),
    );
    const keepReq = http.expectOne(`${HOME}/vision-2030`);
    expect(keepReq.request.body).not.toHaveProperty('image');
    keepReq.flush({ data: HOME_PAGE_DTO });
    await keep;

    const clear = firstValueFrom(
      service.saveBlock(
        'about',
        {
          texts: {
            ar: { title: 'عنوان', body: '', points: [] },
            en: { title: '', body: '', points: [] },
          },
          image: null,
        },
        previous,
      ),
    );
    const clearReq = http.expectOne(`${HOME}/about`);
    expect(clearReq.request.body.image).toBeNull();
    clearReq.flush({ data: HOME_PAGE_DTO });
    await clear;
  });

  it('surfaces HTTP errors from load', async () => {
    const result = firstValueFrom(service.load()).catch((error: unknown) => error);
    http.expectOne(HOME).flush('nope', { status: 500, statusText: 'Server Error' });
    expect(await result).toBeTruthy();
  });
});
