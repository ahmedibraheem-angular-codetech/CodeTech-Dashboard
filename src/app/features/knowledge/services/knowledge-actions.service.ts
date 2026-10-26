import { Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { Observable, firstValueFrom } from 'rxjs';

import { LanguageService } from '../../../core/services/language.service';
import type { ConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';
import type { Article, ArticleStatus } from '../models/knowledge.model';
import { KnowledgeService } from './knowledge.service';

/**
 * Confirm + API + toast flows shared by the list, the editor and the detail page.
 * The caller passes its own `ConfirmDialog` and applies the returned article to its state.
 */
@Injectable({ providedIn: 'root' })
export class KnowledgeActions {
  private readonly api = inject(KnowledgeService);
  private readonly messages = inject(MessageService);
  private readonly lang = inject(LanguageService);

  /** Resolves `true` once the article is deleted. */
  async remove(article: Article, confirm: ConfirmDialog): Promise<boolean> {
    const accepted = await confirm.ask({
      title: this.lang.t('knowledge.deleteTitle'),
      message: this.lang.t('knowledge.deleteMessage'),
      confirmLabel: this.lang.t('knowledge.delete'),
      cancelLabel: this.lang.t('common.cancel'),
      danger: true,
    });
    if (!accepted) {
      return false;
    }
    if (!(await this.run(this.api.remove(article.id)))) {
      return false;
    }
    this.messages.add({ severity: 'success', summary: this.lang.t('knowledge.deleted') });
    return true;
  }

  /** Features the article, or asks before removing the featured mark. */
  async toggleFeatured(article: Article, confirm: ConfirmDialog): Promise<Article | null> {
    if (article.featured) {
      const accepted = await confirm.ask({
        title: this.lang.t('knowledge.unfeatureTitle'),
        message: this.lang.t('knowledge.unfeatureMessage'),
        confirmLabel: this.lang.t('knowledge.unfeatureConfirm'),
        cancelLabel: this.lang.t('common.cancel'),
      });
      if (!accepted) {
        return null;
      }
    }
    const result = await this.run(this.api.setFeatured(article.id, !article.featured));
    if (!result) {
      return null;
    }
    const next = result.value;
    this.messages.add({
      severity: 'success',
      summary: this.lang.t(next.featured ? 'knowledge.featured' : 'knowledge.unfeatured'),
    });
    return next;
  }

  /** Moving an article back to draft asks first. Other transitions apply directly. */
  async changeStatus(
    article: Article,
    status: ArticleStatus,
    confirm: ConfirmDialog,
  ): Promise<Article | null> {
    if (article.status === status) {
      return null;
    }
    if (status === 'draft' && !(await this.confirmDraft(confirm))) {
      return null;
    }
    const result = await this.run(this.api.setStatus(article.id, status));
    if (!result) {
      return null;
    }
    this.messages.add({ severity: 'success', summary: this.lang.t('knowledge.statusChanged') });
    return result.value;
  }

  /** The "save as draft" confirmation shared with the editor. */
  confirmDraft(confirm: ConfirmDialog): Promise<boolean> {
    return confirm.ask({
      title: this.lang.t('knowledge.draftTitle'),
      message: this.lang.t('knowledge.draftMessage'),
      confirmLabel: this.lang.t('knowledge.draftConfirm'),
      cancelLabel: this.lang.t('common.cancel'),
    });
  }

  /** Wraps the result so a `void` request can still be told apart from a failure. */
  private async run<T>(request: Observable<T>): Promise<{ value: T } | null> {
    try {
      return { value: await firstValueFrom(request) };
    } catch {
      this.messages.add({ severity: 'error', summary: this.lang.t('common.error') });
      return null;
    }
  }
}
