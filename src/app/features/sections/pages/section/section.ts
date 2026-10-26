import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';

import { LanguageService } from '../../../../core/services/language.service';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { StateView } from '../../../../shared/components/state-view/state-view';
import { AboutPage } from '../../components/about-page/about-page';
import { FaqBoard } from '../../components/faq-board/faq-board';
import { InquiriesBoard } from '../../components/inquiries-board/inquiries-board';
import { LegalDocumentBoard } from '../../components/legal-document-board/legal-document-board';
import type { LegalDocumentKind } from '../../models/legal-document.model';

@Component({
  selector: 'app-section-page',
  imports: [PageHeader, StateView, AboutPage, FaqBoard, InquiriesBoard, LegalDocumentBoard],
  templateUrl: './section.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionPage {
  readonly lang = inject(LanguageService);
  private readonly route = inject(ActivatedRoute);
  readonly titleKey = toSignal(
    this.route.data.pipe(map((data) => String(data['titleKey'] ?? 'sections.ready'))),
    { initialValue: String(this.route.snapshot.data['titleKey'] ?? 'sections.ready') },
  );
  readonly isAbout = computed(() => this.titleKey() === 'nav.about');
  /** Inquiries board (shared statistics cards + data table). */
  readonly isInquiries = computed(() => this.titleKey() === 'nav.inquiries');
  /** Same board as inquiries. Only the page and table title change. */
  readonly isStart = computed(() => this.titleKey() === 'nav.startProjects');
  readonly isFaq = computed(() => this.titleKey() === 'nav.faq');
  readonly isTerms = computed(() => this.titleKey() === 'nav.terms');
  readonly isPrivacy = computed(() => this.titleKey() === 'nav.privacy');
  readonly isLegal = computed(() => this.isTerms() || this.isPrivacy());
  readonly legalKind = computed<LegalDocumentKind>(() => (this.isPrivacy() ? 'privacy' : 'terms'));
  readonly legalPrefix = computed(() => (this.isPrivacy() ? 'legal.privacy' : 'legal.terms'));
  readonly boardTitle = computed(() => (this.isStart() ? this.lang.t('nav.startProjects') : ''));
  readonly detailPath = computed(() => (this.isStart() ? '/contact/start' : '/contact/inquiries'));
}
