import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { type Observable, forkJoin, map, of, switchMap, throwError } from 'rxjs';

import { API_BASE_URL, apiUrl } from '../../../core/config/api';
import type { ApiEnvelope } from '../../../core/http/api.model';
import { MediaService } from '../../../core/media/media.service';
import type {
  AboutPageDto,
  AboutPartnerCreateDto,
  AboutPartnerDto,
  AboutTeamMemberDto,
  AboutLocalizedFileWrite,
} from '../models/about.api';
import type {
  AboutCeo,
  AboutContent,
  AboutGroups,
  AboutImage,
  AboutImages,
  AboutMember,
  AboutPartner,
} from '../models/about.model';
import {
  mapAboutPage,
  mapCeo,
  mapPartner,
  mapStory,
  mapTeamMember,
  mapVision,
  toCeoWrite,
  toStoryWrite,
  toTeamWrite,
  toVisionWrite,
} from './about.mapper';

const ABOUT_PATH = 'admin/pages/about';
const PARTNERS_PATH = 'admin/partners';
const TEAM_PATH = 'admin/team-members';

@Injectable({ providedIn: 'root' })
export class AboutService {
  private readonly http = inject(HttpClient);
  private readonly media = inject(MediaService);
  private readonly base = inject(API_BASE_URL);

  load(): Observable<AboutContent> {
    return forkJoin({
      page: this.http
        .get<ApiEnvelope<AboutPageDto>>(apiUrl(this.base, ABOUT_PATH))
        .pipe(map((envelope) => this.requirePage(envelope))),
      partners: this.http
        .get<ApiEnvelope<AboutPartnerDto[]>>(apiUrl(this.base, PARTNERS_PATH))
        .pipe(map((envelope) => this.requirePartners(envelope))),
    }).pipe(map(({ page, partners }) => mapAboutPage(page, partners)));
  }

  saveStory(story: AboutGroups, previousImage: AboutImages): Observable<AboutGroups> {
    return this.resolveImages(previousImage, story.image).pipe(
      switchMap((image) =>
        this.http.put<ApiEnvelope<AboutPageDto>>(
          apiUrl(this.base, `${ABOUT_PATH}/about-block`),
          toStoryWrite(story, image),
        ),
      ),
      map((envelope) => mapStory(this.requirePage(envelope).about)),
    );
  }

  saveVision(vision: AboutGroups): Observable<AboutGroups> {
    return this.http
      .put<ApiEnvelope<AboutPageDto>>(
        apiUrl(this.base, `${ABOUT_PATH}/vision-mission`),
        toVisionWrite(vision),
      )
      .pipe(map((envelope) => mapVision(this.requirePage(envelope).vision_mission)));
  }

  saveCeo(ceo: AboutCeo, previousImage: AboutImages): Observable<AboutCeo> {
    return this.resolveImages(previousImage, ceo.image).pipe(
      switchMap((image) =>
        this.http.put<ApiEnvelope<AboutPageDto>>(
          apiUrl(this.base, `${ABOUT_PATH}/ceo`),
          toCeoWrite(ceo, image),
        ),
      ),
      map((envelope) => mapCeo(this.requirePage(envelope).ceo)),
    );
  }

  savePartner(partner: AboutPartner): Observable<AboutPartner> {
    const file = partner.image?.file;
    if (!file) {
      return throwError(() => new Error('Partner logo file is required'));
    }
    return this.media.upload('image', file).pipe(
      switchMap((uploaded) => {
        const body: AboutPartnerCreateDto = { logo: uploaded.uuid };
        return this.http.post<ApiEnvelope<AboutPartnerDto>>(apiUrl(this.base, PARTNERS_PATH), body);
      }),
      map((envelope) => mapPartner(this.requirePartner(envelope))),
    );
  }

  removePartner(id: string): Observable<void> {
    return this.http
      .delete(apiUrl(this.base, `${PARTNERS_PATH}/${id}`), { responseType: 'text' })
      .pipe(map(() => undefined));
  }

  saveMember(member: AboutMember, previousImage: AboutImage | null): Observable<AboutMember> {
    const isNew = !/^\d+$/.test(member.id);
    return this.resolveImageTicket(previousImage, member.image).pipe(
      switchMap((photo) => {
        const body = toTeamWrite(member, photo);
        if (isNew) {
          return this.http.post<ApiEnvelope<AboutTeamMemberDto>>(
            apiUrl(this.base, TEAM_PATH),
            body,
          );
        }
        return this.http.put<ApiEnvelope<AboutTeamMemberDto>>(
          apiUrl(this.base, `${TEAM_PATH}/${member.id}`),
          body,
        );
      }),
      map((envelope) => mapTeamMember(this.requireTeamMember(envelope))),
    );
  }

  removeMember(id: string): Observable<void> {
    return this.http
      .delete(apiUrl(this.base, `${TEAM_PATH}/${id}`), { responseType: 'text' })
      .pipe(map(() => undefined));
  }

  private resolveImages(
    previous: AboutImages,
    next: AboutImages,
  ): Observable<AboutLocalizedFileWrite | undefined> {
    return forkJoin({
      ar: this.resolveImageTicket(previous.ar, next.ar),
      en: this.resolveImageTicket(previous.en, next.en),
    }).pipe(
      map(({ ar, en }) => {
        const out: AboutLocalizedFileWrite = {};
        if (ar !== undefined) {
          out.ar = ar;
        }
        if (en !== undefined) {
          out.en = en;
        }
        return Object.keys(out).length ? out : undefined;
      }),
    );
  }

  private resolveImageTicket(
    previous: AboutImage | null,
    next: AboutImage | null,
  ): Observable<string | null | undefined> {
    if (next?.file) {
      return this.media.upload('image', next.file).pipe(map((file) => file.uuid));
    }
    if (next === null) {
      return of(previous ? null : undefined);
    }
    return of(undefined);
  }

  private requirePage(envelope: ApiEnvelope<AboutPageDto>): AboutPageDto {
    const data = envelope?.data;
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid about page response');
    }
    return data;
  }

  private requirePartners(envelope: ApiEnvelope<AboutPartnerDto[]>): AboutPartnerDto[] {
    const data = envelope?.data;
    return Array.isArray(data) ? data : [];
  }

  private requirePartner(envelope: ApiEnvelope<AboutPartnerDto>): AboutPartnerDto {
    const data = envelope?.data;
    if (!data || typeof data.id !== 'number') {
      throw new Error('Invalid partner response');
    }
    return data;
  }

  private requireTeamMember(envelope: ApiEnvelope<AboutTeamMemberDto>): AboutTeamMemberDto {
    const data = envelope?.data;
    if (!data || typeof data.id !== 'number') {
      throw new Error('Invalid team member response');
    }
    return data;
  }
}
