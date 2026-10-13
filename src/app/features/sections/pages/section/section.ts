import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';

import { LanguageService } from '../../../../core/services/language.service';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { StateView } from '../../../../shared/components/state-view/state-view';
import { AboutPage } from '../../components/about-page/about-page';

@Component({
  selector: 'app-section-page',
  imports: [PageHeader, StateView, AboutPage],
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
  /** `/about` is the only section route that has a designed page. */
  readonly isAbout = computed(() => this.titleKey() === 'nav.about');
}
