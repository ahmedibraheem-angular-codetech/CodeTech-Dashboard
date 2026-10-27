import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';

import { FeatureCard } from '../../../../../shared/components/feature-card/feature-card';
import { FieldError } from '../../../../../shared/components/field-error/field-error';
import { ProductUpload } from '../../../../products/components/product-upload/product-upload';
import { EditorStep } from './editor-step';

const stepHost = { style: 'display: contents' };
const uploadPrefix = 'project';

@Component({
  selector: 'app-project-about-step',
  imports: [IconField, InputIcon, InputText, Textarea, ProductUpload, FeatureCard, FieldError],
  templateUrl: './about-step.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: stepHost,
})
export class AboutStep extends EditorStep {
  readonly uploadPrefix = uploadPrefix;
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

@Component({
  selector: 'app-project-challenges-step',
  imports: [FeatureCard, ProductUpload],
  templateUrl: './challenges-step.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: stepHost,
})
export class ChallengesStep extends EditorStep {
  readonly uploadPrefix = uploadPrefix;
}

@Component({
  selector: 'app-project-solutions-step',
  imports: [FeatureCard, ProductUpload, InputText],
  templateUrl: './solutions-step.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: stepHost,
})
export class SolutionsStep extends EditorStep {
  readonly uploadPrefix = uploadPrefix;
}

@Component({
  selector: 'app-project-features-step',
  imports: [FeatureCard],
  templateUrl: './features-step.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: stepHost,
})
export class FeaturesStep extends EditorStep {
  readonly uploadPrefix = uploadPrefix;
}

@Component({
  selector: 'app-project-results-step',
  imports: [FeatureCard],
  templateUrl: './results-step.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: stepHost,
})
export class ResultsStep extends EditorStep {
  readonly uploadPrefix = uploadPrefix;
}

@Component({
  selector: 'app-project-identity-step',
  imports: [FeatureCard, ProductUpload],
  templateUrl: './identity-step.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: stepHost,
})
export class IdentityStep extends EditorStep {
  readonly uploadPrefix = uploadPrefix;
}

@Component({
  selector: 'app-project-seo-step',
  imports: [InputText, Textarea],
  templateUrl: './seo-step.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: stepHost,
})
export class SeoStep extends EditorStep {}
