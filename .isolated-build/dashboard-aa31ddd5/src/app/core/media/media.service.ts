import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { type Observable, map } from 'rxjs';

import { API_BASE_URL, apiUrl } from '../config/api';
import type { ApiEnvelope, FileObject } from '../http/api.model';

export type MediaUploadType = 'image' | 'video';

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
    const body = new FormData();
    body.append('type', type);
    body.append('file', file, file.name);
    return this.http
      .post<ApiEnvelope<FileObject>>(apiUrl(this.base, 'admin/media'), body)
      .pipe(map((envelope) => this.requireFile(envelope)));
  }

  uploadEditorImage(file: File): Observable<FileObject> {
    const body = new FormData();
    body.append('file', file, file.name);
    return this.http
      .post<ApiEnvelope<FileObject>>(apiUrl(this.base, 'admin/editor-images'), body)
      .pipe(map((envelope) => this.requireFile(envelope)));
  }

  private requireFile(envelope: ApiEnvelope<FileObject>): FileObject {
    const data = envelope?.data;
    if (!data || typeof data.uuid !== 'string' || typeof data.url !== 'string') {
      throw new Error('Invalid media upload response');
    }
    return data;
  }
}
