import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterOutlet } from '@angular/router';
import { Toast } from 'primeng/toast';

import { BreadcrumbService } from './core/services/breadcrumb.service';
import { LanguageService } from './core/services/language.service';
import { LayoutService } from './core/services/layout.service';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Toast],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly title = inject(Title);
  private readonly lang = inject(LanguageService);
  private readonly crumbs = inject(BreadcrumbService);
  private readonly theme = inject(ThemeService);
  private readonly layout = inject(LayoutService);

  constructor() {
    effect(() => {
      this.theme.theme();
      this.layout.density();
      const current = this.crumbs.crumbs().at(-1);
      const page = current ? this.lang.t(current.key) : this.lang.t('app.name');
      this.title.setTitle(`${page} | CodeTech`);
    });
  }
}
