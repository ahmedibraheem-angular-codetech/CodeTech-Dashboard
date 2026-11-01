import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { LanguageService } from '../../../../core/services/language.service';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { StateView } from '../../../../shared/components/state-view/state-view';
import { AboutCeoSection } from '../../components/about-ceo/about-ceo';
import { AboutGroupsSection } from '../../components/about-groups/about-groups';
import { AboutPartnersSection } from '../../components/about-partners/about-partners';
import { AboutTeamSection } from '../../components/about-team/about-team';
import { type AboutCeo, type AboutGroups, type AboutMember, type AboutPartner } from '../../models/about.model';
import { AboutService } from '../../services/about.service';

type Status = 'loading' | 'ready' | 'error';

@Component({
  selector: 'app-about-page',
  imports: [
    PageHeader,
    StateView,
    AboutGroupsSection,
    AboutPartnersSection,
    AboutCeoSection,
    AboutTeamSection,
  ],
  templateUrl: './about-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutPage {
  private readonly api = inject(AboutService);
  private readonly destroyRef = inject(DestroyRef);
  readonly lang = inject(LanguageService);

  readonly status = signal<Status>('loading');
  readonly story = signal<AboutGroups | null>(null);
  readonly vision = signal<AboutGroups | null>(null);
  readonly partners = signal<AboutPartner[]>([]);
  readonly ceo = signal<AboutCeo | null>(null);
  readonly team = signal<AboutMember[]>([]);

  constructor() {
    this.reload();
  }

  reload(): void {
    this.status.set('loading');
    this.api
      .load()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (content) => {
          this.story.set(content.story);
          this.vision.set(content.vision);
          this.partners.set(content.partners);
          this.ceo.set(content.ceo);
          this.team.set(content.team);
          this.status.set('ready');
        },
        error: () => this.status.set('error'),
      });
  }
}
