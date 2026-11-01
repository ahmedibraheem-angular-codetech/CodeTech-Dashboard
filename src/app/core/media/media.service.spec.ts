import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { apiUrl } from '../config/api';
import { MediaService } from './media.service';

const MEDIA = apiUrl(environment.apiUrl, 'admin/media');
const EDITOR_IMAGES = apiUrl(environment.apiUrl, 'admin/editor-images');

describe('MediaService', () => {
  let service: MediaService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([])), provideHttpClientTesting()],
    });
    service = TestBed.inject(MediaService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('uploads a multipart image and returns the file object', async () => {
    const file = new File(['x'], 'logo.png', { type: 'image/png' });
    const result = firstValueFrom(service.upload('image', file));
    const request = http.expectOne(MEDIA);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toBeInstanceOf(FormData);
    const body = request.request.body as FormData;
    expect(body.get('type')).toBe('image');
    expect(body.get('file')).toBeInstanceOf(File);
    request.flush({
      data: {
        uuid: 'u-1',
        name: 'logo',
        file_name: 'logo.png',
        mime_type: 'image/png',
        size: 1,
        url: 'https://example.test/logo.png',
        download_url: 'https://example.test/download',
        created_at: '2026-10-29T10:00:00.000000Z',
      },
    });
    await expect(result).resolves.toMatchObject({ uuid: 'u-1', file_name: 'logo.png' });
  });

  it('uploads a rich-text image to POST /admin/editor-images', async () => {
    const file = new File(['x'], 'inline.png', { type: 'image/png' });
    const result = firstValueFrom(service.uploadEditorImage(file));
    const request = http.expectOne(EDITOR_IMAGES);
    expect(request.request.method).toBe('POST');
    const body = request.request.body as FormData;
    expect(body.get('file')).toBeInstanceOf(File);
    expect(body.get('type')).toBeNull();
    request.flush({
      data: {
        uuid: 'editor-1',
        name: 'inline',
        file_name: 'inline.png',
        mime_type: 'image/png',
        size: 1,
        url: 'https://example.test/inline.png',
        download_url: 'https://example.test/download',
        created_at: '2026-10-29T10:00:00.000000Z',
      },
    });
    await expect(result).resolves.toMatchObject({
      uuid: 'editor-1',
      url: 'https://example.test/inline.png',
    });
  });
});
