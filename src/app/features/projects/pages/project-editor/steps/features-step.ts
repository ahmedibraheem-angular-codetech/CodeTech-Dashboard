import { ChangeDetectionStrategy, Component } from '@angular/core';

import { FeatureCard } from '../../../../../shared/components/feature-card/feature-card';
import { EditorStep, PROJECT_EDITOR_STEP_HOST } from './editor-step';

@Component({
  selector: 'app-project-features-step',
  imports: [FeatureCard],
  templateUrl: './features-step.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: PROJECT_EDITOR_STEP_HOST,
})
export class FeaturesStep extends EditorStep {
  readonly uploadPrefix = 'project';
}
