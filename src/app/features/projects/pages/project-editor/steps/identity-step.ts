import { ChangeDetectionStrategy, Component } from '@angular/core';

import { FeatureCard } from '../../../../../shared/components/feature-card/feature-card';
import { ProductUpload } from '../../../../../shared/components/product-upload/product-upload';
import { EditorStep, PROJECT_EDITOR_STEP_HOST } from './editor-step';

@Component({
  selector: 'app-project-identity-step',
  imports: [FeatureCard, ProductUpload],
  templateUrl: './identity-step.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: PROJECT_EDITOR_STEP_HOST,
})
export class IdentityStep extends EditorStep {
  readonly uploadPrefix = 'project';
}
