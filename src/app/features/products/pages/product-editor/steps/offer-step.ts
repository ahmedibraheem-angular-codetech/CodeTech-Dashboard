import { ChangeDetectionStrategy, Component } from '@angular/core';

import { FeatureCard } from '../../../../../shared/components/feature-card/feature-card';
import { EditorStep, PRODUCT_EDITOR_STEP_HOST } from './editor-step';

@Component({
  selector: 'app-offer-step',
  imports: [FeatureCard],
  templateUrl: './offer-step.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: PRODUCT_EDITOR_STEP_HOST,
})
export class OfferStep extends EditorStep {}
