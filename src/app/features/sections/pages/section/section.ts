import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';

import { LanguageService } from '../../../../core/services/language.service';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { StateView } from '../../../../shared/components/state-view/state-view';
import { AboutPage } from '../../components/about-page/about-page';
import { InquiriesBoard } from '../../components/inquiries-board/inquiries-board';

@Component({
  selector: 'app-section-page',
  imports: [PageHeader, StateView, AboutPage, InquiriesBoard],
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
  /** Sample consumer for the shared statistics cards and data table. */
  readonly isInquiries = computed(() => this.titleKey() === 'nav.inquiries');
}
