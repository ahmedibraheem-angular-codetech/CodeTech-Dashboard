import { ChangeDetectionStrategy, Component } from '@angular/core';
import { InputText } from 'primeng/inputtext';

import { FeatureCard } from '../../../../../shared/components/feature-card/feature-card';
import { ProductUpload } from '../../../../../shared/components/product-upload/product-upload';
import { EditorStep, PROJECT_EDITOR_STEP_HOST } from './editor-step';

@Component({
  selector: 'app-project-solutions-step',
  imports: [FeatureCard, ProductUpload, InputText],
  templateUrl: './solutions-step.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: PROJECT_EDITOR_STEP_HOST,
})
export class SolutionsStep extends EditorStep {
  readonly uploadPrefix = 'project';
}
