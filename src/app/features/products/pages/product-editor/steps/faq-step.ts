import { ChangeDetectionStrategy, Component } from '@angular/core';

import { FeatureCard } from '../../../../../shared/components/feature-card/feature-card';
import { EditorStep, PRODUCT_EDITOR_STEP_HOST } from './editor-step';

@Component({
  selector: 'app-faq-step',
  imports: [FeatureCard],
  templateUrl: './faq-step.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: PRODUCT_EDITOR_STEP_HOST,
})
export class FaqStep extends EditorStep {}
