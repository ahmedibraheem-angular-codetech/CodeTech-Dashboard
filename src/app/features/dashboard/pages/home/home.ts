import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { LanguageService } from '../../../../core/services/language.service';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { StateView } from '../../../../shared/components/state-view/state-view';
import { ContentBlockCard } from '../../components/content-block-card/content-block-card';
import { PartnersSection } from '../../components/partners-section/partners-section';
import { VideoSection } from '../../components/video-section/video-section';
import { ContentBlock, Partner } from '../../models/homepage.model';
import { HomepageService } from '../../services/homepage.service';

type Status = 'loading' | 'ready' | 'error';

@Component({
  selector: 'app-home',
  imports: [PageHeader, StateView, PartnersSection, VideoSection, ContentBlockCard],
  templateUrl: './home.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  private readonly api = inject(HomepageService);
  private readonly destroyRef = inject(DestroyRef);
  readonly lang = inject(LanguageService);

  readonly status = signal<Status>('loading');
  readonly partners = signal<Partner[]>([]);
  readonly videoEnabled = signal(true);
  readonly videoName = signal<string | null>(null);
  readonly about = signal<ContentBlock | null>(null);
  readonly vision = signal<ContentBlock | null>(null);

  constructor() {
    this.reload();
  }

  reload(silent = false): void {
    if (!silent) {
      this.status.set('loading');
    }
    this.api
      .load()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (content) => {
          this.partners.set(content.partners);
          this.videoEnabled.set(content.videoEnabled);
          this.videoName.set(content.videoName);
          this.about.set(content.about);
          this.vision.set(content.vision);
          this.status.set('ready');
        },
        error: () => this.status.set('error'),
      });
  }
}
