import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';

import { FeatureCard } from '../../../../../shared/components/feature-card/feature-card';
import { FieldError } from '../../../../../shared/components/field-error/field-error';
import { ProductUpload } from '../../../../../shared/components/product-upload/product-upload';
import { EditorStep, PROJECT_EDITOR_STEP_HOST } from './editor-step';

@Component({
  selector: 'app-project-info-step',
  imports: [IconField, InputIcon, InputText, Textarea, ProductUpload, FeatureCard, FieldError],
  templateUrl: './info-step.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: PROJECT_EDITOR_STEP_HOST,
})
export class InfoStep extends EditorStep {
  readonly uploadPrefix = 'project';
  readonly categoryTab = signal(0);
  readonly aboutTab = signal(0);

  selectCategory(index: number): void {
    this.categoryTab.set(index);
  }

  selectAbout(index: number): void {
    this.aboutTab.set(index);
  }

  addCategory(): void {
    this.editor.addPoint('categories');
    this.categoryTab.set(this.editor.draft().categories.length - 1);
  }

  addAbout(): void {
    this.editor.addPoint('aboutCards');
    this.aboutTab.set(this.editor.draft().aboutCards.length - 1);
  }

  removeCategory(index: number): void {
    this.editor.removePoint('categories', index);
    this.categoryTab.update((current) =>
      this.clamp(current, index, this.editor.draft().categories.length),
    );
  }

  removeAbout(index: number): void {
    this.editor.removePoint('aboutCards', index);
    this.aboutTab.update((current) =>
      this.clamp(current, index, this.editor.draft().aboutCards.length),
    );
  }

  private clamp(current: number, removed: number, length: number): number {
    const next = current === removed ? removed - 1 : current > removed ? current - 1 : current;
    return Math.max(0, Math.min(next, length - 1));
  }
}
