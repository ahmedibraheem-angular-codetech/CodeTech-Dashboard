import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';

import { FeatureCard } from '../../../../../shared/components/feature-card/feature-card';
import { FieldError } from '../../../../../shared/components/field-error/field-error';
import { ProductUpload } from '../../../components/product-upload/product-upload';
import { EditorStep } from './editor-step';

const stepHost = { style: 'display: contents' };

@Component({
  selector: 'app-info-step',
  imports: [IconField, InputIcon, InputText, Textarea, ProductUpload, FeatureCard, FieldError],
  templateUrl: './info-step.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: stepHost,
})
export class InfoStep extends EditorStep {}

@Component({
  selector: 'app-sectors-step',
  imports: [ProductUpload, FeatureCard],
  templateUrl: './sectors-step.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: stepHost,
})
export class SectorsStep extends EditorStep {}

@Component({
  selector: 'app-offer-step',
  imports: [FeatureCard],
  templateUrl: './offer-step.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: stepHost,
})
export class OfferStep extends EditorStep {}

@Component({
  selector: 'app-tools-step',
  imports: [FeatureCard],
  templateUrl: './tools-step.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: stepHost,
})
export class ToolsStep extends EditorStep {}

@Component({
  selector: 'app-units-step',
  imports: [FeatureCard],
  templateUrl: './units-step.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: stepHost,
})
export class UnitsStep extends EditorStep {}

@Component({
  selector: 'app-identity-step',
  imports: [FeatureCard],
  templateUrl: './identity-step.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: stepHost,
})
export class IdentityStep extends EditorStep {}

@Component({
  selector: 'app-faq-step',
  imports: [FeatureCard],
  templateUrl: './faq-step.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: stepHost,
})
export class FaqStep extends EditorStep {}

@Component({
  selector: 'app-seo-step',
  imports: [InputText, Textarea],
  templateUrl: './seo-step.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: stepHost,
})
export class SeoStep extends EditorStep {}
