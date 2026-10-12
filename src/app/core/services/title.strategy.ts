import { effect, inject, Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

import { LanguageService } from './language.service';

@Injectable()
export class AppTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly language = inject(LanguageService);

  private currentSnapshot: RouterStateSnapshot | null = null;

  constructor() {
    super();

    effect(() => {
      this.language.language();

      if (this.currentSnapshot) {
        this.updateTitle(this.currentSnapshot);
      }
    });
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    this.currentSnapshot = snapshot;

    const key = this.deepestKey(snapshot.root);
    const appName = this.language.t('app.name');

    this.title.setTitle(key ? `${this.language.t(key)} | ${appName}` : appName);
  }

  private deepestKey(route: RouterStateSnapshot['root']): string | null {
    let current: RouterStateSnapshot['root'] | null = route;
    let key: string | null = null;

    while (current) {
      const value = current.data['titleKey'];

      if (typeof value === 'string') {
        key = value;
      }

      current = current.firstChild;
    }

    return key;
  }
}
