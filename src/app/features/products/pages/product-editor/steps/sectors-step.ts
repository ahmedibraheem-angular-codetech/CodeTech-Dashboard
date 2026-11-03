import { ChangeDetectionStrategy, Component } from '@angular/core';

import { FeatureCard } from '../../../../../shared/components/feature-card/feature-card';
import { FieldError } from '../../../../../shared/components/field-error/field-error';
import { ProductUpload } from '../../../../../shared/components/product-upload/product-upload';
import { EditorStep, PRODUCT_EDITOR_STEP_HOST } from './editor-step';

@Component({
  selector: 'app-sectors-step',
  imports: [ProductUpload, FeatureCard, FieldError],
  templateUrl: './sectors-step.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: PRODUCT_EDITOR_STEP_HOST,
})
export class SectorsStep extends EditorStep {}
