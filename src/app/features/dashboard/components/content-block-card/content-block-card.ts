import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';

import { LanguageService } from '../../../../core/services/language.service';
import { ContentPanel } from '../../../../shared/components/content-panel/content-panel';
import { SectionEmpty } from '../../../../shared/components/section-empty/section-empty';
import { ContentBlock } from '../../models/homepage.model';
import { HomepageService } from '../../services/homepage.service';

export type ContentBlockKind = 'about' | 'vision';

@Component({
  selector: 'app-content-block-card',
  imports: [ReactiveFormsModule, Button, Dialog, InputText, Textarea, SectionEmpty, ContentPanel],
  templateUrl: './content-block-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContentBlockCard {
  private readonly api = inject(HomepageService);
  private readonly messages = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  readonly lang = inject(LanguageService);

  readonly kind = input.required<ContentBlockKind>();
  readonly block = input.required<ContentBlock>();
  readonly filled = computed(() => this.block().body.trim().length > 0);
  /** Emitted with the saved block so the parent can replace its copy. */
  readonly blockSaved = output<ContentBlock>();

  readonly editorOpen = signal(false);
  readonly saving = signal(false);

  readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    body: ['', Validators.required],
    point1: ['', Validators.required],
    point2: ['', Validators.required],
    point3: ['', Validators.required],
  });

  open(): void {
    const block = this.block();
    this.form.reset({
      title: block.title,
      body: block.body,
      point1: block.points[0],
      point2: block.points[1],
      point3: block.points[2],
    });
    this.editorOpen.set(true);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.saving()) {
      return;
    }
    const value = this.form.getRawValue();
    const block: ContentBlock = {
      title: value.title.trim(),
      body: value.body.trim(),
      points: [value.point1.trim(), value.point2.trim(), value.point3.trim()],
    };
    this.saving.set(true);
    this.api
      .saveBlock(this.kind(), block)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (saved) => {
          this.saving.set(false);
          this.blockSaved.emit(saved);
          this.editorOpen.set(false);
          this.messages.add({ severity: 'success', summary: this.lang.t('common.save') });
        },
        error: () => {
          this.saving.set(false);
          this.messages.add({ severity: 'error', summary: this.lang.t('common.error') });
        },
      });
  }
}
