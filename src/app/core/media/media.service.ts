import { HttpClient, HttpEventType, type HttpEvent } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { type Observable, filter, map } from 'rxjs';

import { API_BASE_URL, apiUrl } from '../config/api';
import type { ApiEnvelope, FileObject } from '../http/api.model';

export type MediaUploadType = 'image' | 'video';

export type MediaUploadEvent =
  { type: 'progress'; progress: number } | { type: 'response'; file: FileObject };

/**
 * Coat-check upload: POST /admin/media returns a uuid ticket used by form fields
 * within 24 hours. Omit the field to keep a file, send null to remove it.
 *
 * Rich-text images use {@link uploadEditorImage} (`POST /admin/editor-images`):
 * permanent files whose `url` goes into `<img src>` in HTML.
 */
@Injectable({ providedIn: 'root' })
export class MediaService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  upload(type: MediaUploadType, file: File): Observable<FileObject> {
    return this.uploadWithProgress(type, file).pipe(
      filter(
        (event): event is Extract<MediaUploadEvent, { type: 'response' }> =>
          event.type === 'response',
      ),
      map((event) => event.file),
    );
  }

  /** Multipart upload with {@link HttpEventType.UploadProgress} percent updates. */
  uploadWithProgress(type: MediaUploadType, file: File): Observable<MediaUploadEvent> {
    const body = new FormData();
    body.append('type', type);
    body.append('file', file, file.name);
    return this.http
      .post<ApiEnvelope<FileObject>>(apiUrl(this.base, 'admin/media'), body, {
        reportProgress: true,
        observe: 'events',
      })
      .pipe(
        map((event) => this.mapUploadEvent(event)),
        filter((event): event is MediaUploadEvent => event !== null),
      );
  }

  uploadEditorImage(file: File): Observable<FileObject> {
    const body = new FormData();
    body.append('file', file, file.name);
    return this.http
      .post<ApiEnvelope<FileObject>>(apiUrl(this.base, 'admin/editor-images'), body)
      .pipe(map((envelope) => this.requireFile(envelope)));
  }

  private mapUploadEvent(event: HttpEvent<ApiEnvelope<FileObject>>): MediaUploadEvent | null {
    if (event.type === HttpEventType.UploadProgress) {
      const total = event.total ?? 0;
      const progress = total > 0 ? Math.min(100, Math.round((100 * event.loaded) / total)) : 0;
      return { type: 'progress', progress };
    }
    if (event.type === HttpEventType.Response) {
      if (!event.body) {
        throw new Error('Invalid media upload response');
      }
      return { type: 'response', file: this.requireFile(event.body) };
    }
    return null;
  }

  private requireFile(envelope: ApiEnvelope<FileObject>): FileObject {
    const data = envelope?.data;
    if (!data || typeof data.uuid !== 'string' || typeof data.url !== 'string') {
      throw new Error('Invalid media upload response');
    }
    return data;
  }
}
