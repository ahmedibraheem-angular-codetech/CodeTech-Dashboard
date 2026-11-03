import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { type Observable, catchError, forkJoin, from, map, of, switchMap, throwError } from 'rxjs';

import { API_BASE_URL, apiUrl } from '../../../core/config/api';
import { statusOf } from '../../../core/http/api-error';
import type { ApiEnvelope, PaginatedEnvelope } from '../../../core/http/api.model';
import { MediaService } from '../../../core/media/media.service';
import type {
  ProjectDetailDto,
  ProjectListDto,
  ProjectListQuery,
  ProjectStatusWriteDto,
  ProjectsPageDto,
  ProjectsPageSectionsWriteDto,
} from '../models/project.api';
import type {
  LocalizedMedia,
  Project,
  ProjectGalleryImage,
  ProjectIdentityButton,
  ProjectImage,
} from '../models/project.model';
import {
  isUploadUrl,
  mapProjectDetail,
  mapProjectListItem,
  toProjectWrite,
} from './project.mapper';

const PATH = 'admin/projects';
const PAGE_PATH = 'admin/pages/projects';

/**
 * Catalog projects. List is paginated (`search`, `filter[status]`, `per_page`).
 * Nested lists are embedded on write; media uses coat-check UUIDs (omit/null/set).
 * `catalogVisible` maps to `projects_visible` on the projects page sections API.
 */
@Injectable({ providedIn: 'root' })
export class ProjectsService {
  private readonly http = inject(HttpClient);
  private readonly media = inject(MediaService);
  private readonly base = inject(API_BASE_URL);

  /** Whether project cards show on the public projects page. */
  readonly catalogVisible = signal(false);

  list(query: ProjectListQuery = {}): Observable<Project[]> {
    return this.listPage(query).pipe(map((page) => page.data.map(mapProjectListItem)));
  }

  listPage(query: ProjectListQuery = {}): Observable<PaginatedEnvelope<ProjectListDto>> {
    return this.http.get<PaginatedEnvelope<ProjectListDto>>(apiUrl(this.base, PATH), {
      params: this.listParams(query),
    });
  }

  /** Loads every page so the board can keep client-side pagination. */
  listAll(query: Omit<ProjectListQuery, 'page'> = {}): Observable<Project[]> {
    return this.fetchAll(query);
  }

  get(id: string): Observable<Project | null> {
    return this.http.get<ApiEnvelope<ProjectDetailDto>>(apiUrl(this.base, `${PATH}/${id}`)).pipe(
      map((envelope) => mapProjectDetail(this.requireDetail(envelope))),
      catchError((error: unknown) => {
        if (statusOf(error) === 404) {
          return of(null);
        }
        return throwError(() => error);
      }),
    );
  }

  save(project: Project): Observable<Project> {
    return this.prepareUploads(project).pipe(
      switchMap((prepared) => {
        const body = toProjectWrite(prepared);
        if (!prepared.id) {
          return this.http.post<ApiEnvelope<ProjectDetailDto>>(apiUrl(this.base, PATH), body);
        }
        return this.http.put<ApiEnvelope<ProjectDetailDto>>(
          apiUrl(this.base, `${PATH}/${prepared.id}`),
          body,
        );
      }),
      map((envelope) => mapProjectDetail(this.requireDetail(envelope))),
    );
  }

  setPublished(id: string, published: boolean): Observable<Project> {
    const body: ProjectStatusWriteDto = { status: published ? 'published' : 'draft' };
    return this.http
      .patch<ApiEnvelope<ProjectDetailDto>>(apiUrl(this.base, `${PATH}/${id}/status`), body)
      .pipe(map((envelope) => mapProjectDetail(this.requireDetail(envelope))));
  }

  remove(id: string): Observable<void> {
    return this.http
      .delete(apiUrl(this.base, `${PATH}/${id}`), { responseType: 'text' })
      .pipe(map(() => undefined));
  }

  loadCatalogVisibility(): Observable<boolean> {
    return this.http.get<ApiEnvelope<ProjectsPageDto>>(apiUrl(this.base, PAGE_PATH)).pipe(
      map((envelope) => !!envelope?.data?.sections?.projects_visible),
      catchError(() => of(this.catalogVisible())),
      map((visible) => {
        this.catalogVisible.set(visible);
        return visible;
      }),
    );
  }

  toggleCatalog(): void {
    const next = !this.catalogVisible();
    this.catalogVisible.set(next);
    const body: ProjectsPageSectionsWriteDto = { projects_visible: next };
    this.http
      .patch<ApiEnvelope<ProjectsPageDto>>(apiUrl(this.base, `${PAGE_PATH}/sections`), body)
      .subscribe({
        error: () => this.catalogVisible.set(!next),
      });
  }

  private fetchAll(query: Omit<ProjectListQuery, 'page'>): Observable<Project[]> {
    const perPage = query.perPage ?? 100;
    const loadPage = (page: number, acc: Project[]): Observable<Project[]> =>
      this.listPage({ ...query, page, perPage }).pipe(
        switchMap((envelope) => {
          const chunk = envelope.data.map(mapProjectListItem);
          const next = [...acc, ...chunk];
          if (envelope.meta.current_page >= envelope.meta.last_page) {
            return of(next);
          }
          return loadPage(page + 1, next);
        }),
      );
    return loadPage(1, []);
  }

  private listParams(query: ProjectListQuery): HttpParams {
    let params = new HttpParams();
    if (query.search?.trim()) {
      params = params.set('search', query.search.trim());
    }
    if (query.status?.trim()) {
      params = params.set('filter[status]', query.status.trim());
    }
    if (query.page) {
      params = params.set('page', String(query.page));
    }
    if (query.perPage) {
      params = params.set('per_page', String(query.perPage));
    }
    return params;
  }

  private prepareUploads(project: Project): Observable<Project> {
    const next = structuredClone(project);
    return forkJoin({
      cover: this.uploadLocalized(next.cover),
      thumb: this.uploadLocalized(next.thumb),
      solutionsImage: this.uploadLocalized(next.solutionsImage.image),
      categories: this.uploadItemImages(next.categories),
      aboutCards: this.uploadItemImages(next.aboutCards),
      challenges: this.uploadItemImages(next.challenges),
      tools: this.uploadItemImages(next.tools),
      solutions: this.uploadItemImages(next.solutions),
      gallery: this.uploadItemImages(next.gallery),
      features: this.uploadItemImages(next.features),
      results: this.uploadItemImages(next.results),
      identityButtons: this.uploadIdentity(next.identityButtons),
    }).pipe(
      map((uploaded) => ({
        ...next,
        cover: uploaded.cover,
        thumb: uploaded.thumb,
        solutionsImage: { ...next.solutionsImage, image: uploaded.solutionsImage },
        categories: next.categories.map((item, index) => ({
          ...item,
          image: uploaded.categories[index] ?? item.image,
        })),
        aboutCards: next.aboutCards.map((item, index) => ({
          ...item,
          image: uploaded.aboutCards[index] ?? item.image,
        })),
        challenges: next.challenges.map((item, index) => ({
          ...item,
          image: uploaded.challenges[index] ?? item.image,
        })),
        tools: next.tools.map((item, index) => ({
          ...item,
          image: uploaded.tools[index] ?? item.image,
        })),
        solutions: next.solutions.map((item, index) => ({
          ...item,
          image: uploaded.solutions[index] ?? item.image,
        })),
        gallery: next.gallery.map((item, index) => ({
          ...item,
          image: uploaded.gallery[index] ?? item.image,
        })),
        features: next.features.map((item, index) => ({
          ...item,
          image: uploaded.features[index] ?? item.image,
        })),
        results: next.results.map((item, index) => ({
          ...item,
          image: uploaded.results[index] ?? item.image,
        })),
        identityButtons: uploaded.identityButtons,
      })),
    );
  }

  private uploadLocalized(image: LocalizedMedia): Observable<LocalizedMedia> {
    return forkJoin({
      ar: this.uploadSlot(image.ar),
      en: this.uploadSlot(image.en),
    });
  }

  private uploadItemImages(
    items: readonly { image: LocalizedMedia }[],
  ): Observable<LocalizedMedia[]> {
    if (items.length === 0) {
      return of([]);
    }
    return forkJoin(items.map((item) => this.uploadLocalized(item.image)));
  }

  private uploadIdentity(
    items: readonly ProjectIdentityButton[],
  ): Observable<ProjectIdentityButton[]> {
    if (items.length === 0) {
      return of([]);
    }
    return forkJoin(
      items.map((button) =>
        this.uploadItemImages(button.images).pipe(
          map((images) => ({
            ...button,
            images: button.images.map((image, index): ProjectGalleryImage => ({
              ...image,
              image: images[index] ?? image.image,
            })),
          })),
        ),
      ),
    );
  }

  private uploadSlot(image: ProjectImage): Observable<ProjectImage> {
    if (!isUploadUrl(image.imageUrl)) {
      return of(image);
    }
    return from(this.blobToFile(image.imageUrl, image.imageName || 'image.png')).pipe(
      switchMap((file) => this.media.upload('image', file)),
      map((uploaded) => ({
        imageUuid: uploaded.uuid,
        imageUrl: uploaded.url,
        imageName: uploaded.file_name || uploaded.name || image.imageName || 'image.png',
      })),
    );
  }

  private async blobToFile(url: string, name: string): Promise<File> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to read upload "${name}"`);
    }
    const blob = await response.blob();
    if (blob.size === 0) {
      throw new Error(`Empty upload "${name}"`);
    }
    return new File([blob], name || 'image.png', { type: blob.type || 'image/png' });
  }

  private requireDetail(envelope: ApiEnvelope<ProjectDetailDto>): ProjectDetailDto {
    const data = envelope?.data;
    if (!data || typeof data.id !== 'number') {
      throw new Error('Invalid project response');
    }
    return data;
  }
}
