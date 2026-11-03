import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';

import { FeatureCard } from '../../../../../shared/components/feature-card/feature-card';
import { FieldError } from '../../../../../shared/components/field-error/field-error';
import { ProductUpload } from '../../../../../shared/components/product-upload/product-upload';
import { EditorStep, PRODUCT_EDITOR_STEP_HOST } from './editor-step';

@Component({
  selector: 'app-info-step',
  imports: [IconField, InputIcon, InputText, Textarea, ProductUpload, FeatureCard, FieldError],
  templateUrl: './info-step.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: PRODUCT_EDITOR_STEP_HOST,
})
export class InfoStep extends EditorStep {
  readonly featureTab = signal(0);
  readonly statTab = signal(0);

  selectFeature(index: number): void {
    this.featureTab.set(index);
  }

  selectStat(index: number): void {
    this.statTab.set(index);
  }

  addFeature(): void {
    this.editor.addPoint('features');
    this.featureTab.set(this.editor.draft().features.length - 1);
  }

  addStat(): void {
    this.editor.addStat();
    this.statTab.set(this.editor.draft().stats.length - 1);
  }

  removeFeature(index: number): void {
    this.editor.removePoint('features', index);
    this.featureTab.update((current) =>
      this.clampTab(current, index, this.editor.draft().features.length),
    );
  }

  removeStat(index: number): void {
    this.editor.removeStat(index);
    this.statTab.update((current) =>
      this.clampTab(current, index, this.editor.draft().stats.length),
    );
  }

  private clampTab(current: number, removed: number, length: number): number {
    const next = current === removed ? removed - 1 : current > removed ? current - 1 : current;
    return Math.max(0, Math.min(next, length - 1));
  }
}
