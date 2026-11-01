import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

import { LanguageService } from '../../core/services/language.service';
import { LayoutService } from '../../core/services/layout.service';
import { Header } from '../components/header/header';
import { Sidebar } from '../components/sidebar/sidebar';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, Sidebar, Header],
  templateUrl: './admin-layout.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLayout {
  readonly layout = inject(LayoutService);
  readonly lang = inject(LanguageService);

  readonly pageEnter = signal(false);

  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  private skipNextEnter = true;

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        if (this.skipNextEnter) {
          this.skipNextEnter = false;
          return;
        }
        this.replayPageEnter();
      });
  }

  private replayPageEnter(): void {
    this.pageEnter.set(false);

    requestAnimationFrame(() => {
      this.pageEnter.set(true);
    });
  }

  onPageEnterEnd(event: AnimationEvent): void {
    if (event.target !== event.currentTarget) {
      return;
    }
    if (event.animationName !== 'route-page-in') {
      return;
    }
    this.pageEnter.set(false);
  }
}
