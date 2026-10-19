import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { catchError, finalize, map, of, switchMap } from 'rxjs';

import type { AppLanguage } from '../../../../core/i18n/translations';
import { LanguageService } from '../../../../core/services/language.service';
import { FeatureCard } from '../../../../shared/components/feature-card/feature-card';
import { FieldError } from '../../../../shared/components/field-error/field-error';
import { LocaleSwitch } from '../../../../shared/components/locale-switch/locale-switch';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { StateView } from '../../../../shared/components/state-view/state-view';
import { WizardStepper } from '../../../../shared/components/wizard-stepper/wizard-stepper';
import { ProductUpload } from '../../components/product-upload/product-upload';
import {
  PRODUCT_STEPS,
  blankProduct,
  readLocale,
  productFaq,
  productMedia,
  productPoint,
  productStat,
  productUnit,
  type LocaleText,
  type Product,
} from '../../models/product.model';
import { ProductsService } from '../../services/products.service';

type PointList = 'features' | 'challenges' | 'offer' | 'results' | 'steps' | 'highlights';
type MediaList = 'sectors' | 'tools' | 'integrations' | 'identity';

@Component({
  selector: 'app-product-editor',
  imports: [
    PageHeader,
    Button,
    LocaleSwitch,
    FieldError,
    StateView,
    ProductUpload,
    FeatureCard,
    WizardStepper,
    IconField,
    InputIcon,
    InputText,
    Textarea,
  ],
  templateUrl: './product-editor.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductEditor {
  private readonly api = inject(ProductsService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly messages = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  readonly lang = inject(LanguageService);

  /** Bound from `/products/:id/edit`. Empty while creating. */
  readonly id = input('');
  readonly steps = PRODUCT_STEPS;
  readonly locale = signal<AppLanguage>(this.lang.language());
  readonly step = signal(0);
  /** Highest step index the user has left with التالي. */
  protected readonly passed = signal(-1);
  readonly draft = signal<Product>(blankProduct());
  readonly status = signal<'loading' | 'ready' | 'missing' | 'error'>(
    this.route.snapshot.data['mode'] === 'edit' ? 'loading' : 'ready',
  );
  readonly saving = signal(false);
  readonly nameError = signal(false);
  private readonly reload = signal(0);

  readonly mode = toSignal(
    this.route.data.pipe(map((data) => (data['mode'] === 'edit' ? 'edit' : 'create'))),
    { initialValue: this.route.snapshot.data['mode'] === 'edit' ? 'edit' : 'create' },
  );
  readonly stepId = computed(() => PRODUCT_STEPS[this.step()].id);
  readonly wizardSteps = computed(() =>
    this.steps.map((item) => ({ id: item.id, label: this.lang.t(item.labelKey) })),
  );
  readonly lastStep = computed(() => this.step() === PRODUCT_STEPS.length - 1);

  private readonly editRequest = computed(() =>
    this.mode() === 'edit' && this.id() ? { id: this.id(), reload: this.reload() } : null,
  );

  constructor() {
    effect(() => {
      const editing = this.mode() === 'edit' && this.id();
      untracked(() => {
        if (editing) {
          return;
        }
        this.status.set('ready');
        this.draft.set(blankProduct());
        this.step.set(0);
        this.passed.set(-1);
        this.nameError.set(false);
      });
    });

    toObservable(this.editRequest)
      .pipe(
        switchMap((request) => {
          if (!request) {
            return of(null);
          }
          this.status.set('loading');
          return this.api.get(request.id).pipe(
            map((product) => ({ failed: false as const, product })),
            catchError(() => of({ failed: true as const, product: null })),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((result) => {
        if (!result) {
          return;
        }
        if (result.failed) {
          this.status.set('error');
          return;
        }
        if (!result.product) {
          this.status.set('missing');
          return;
        }
        this.draft.set(result.product);
        this.step.set(0);
        this.passed.set(-1);
        this.nameError.set(false);
        this.status.set('ready');
      });
  }

  protected text(value: LocaleText): string {
    return readLocale(value, this.locale());
  }

  protected copy(key: string): string {
    return this.lang.lookup(key, this.locale()) ?? key;
  }

  protected unitName(index: number): string {
    return `${this.copy('product.unitItem')} ${this.ordinal('product.unitOrder', index)}`;
  }

  protected stepName(index: number): string {
    return `${this.copy('product.stepItem')} ${this.ordinal('product.stepOrder', index)}`;
  }

  private ordinal(prefix: 'product.unitOrder' | 'product.stepOrder', index: number): string {
    return this.lang.lookup(`${prefix}.${index + 1}`, this.locale()) ?? `${index + 1}`;
  }

  protected retry(): void {
    if (this.mode() === 'edit' && this.id()) {
      this.reload.update((value) => value + 1);
    }
  }

  protected select(index: number | undefined): void {
    if (this.saving() || index === undefined || (this.mode() === 'create' && index > this.step())) {
      return;
    }
    this.step.set(index);
  }

  protected next(): void {
    if (this.saving() || this.lastStep()) {
      return;
    }
    if (this.mode() === 'create' && this.step() === 0 && !this.namesValid()) {
      this.nameError.set(true);
      return;
    }
    const leaving = this.step();
    this.passed.update((current) => Math.max(current, leaving));
    this.step.set(leaving + 1);
  }

  protected previous(): void {
    if (this.saving()) {
      return;
    }
    if (this.step() === 0) {
      void this.router.navigate(['/products']);
      return;
    }
    this.step.update((current) => current - 1);
  }

  protected saveDraft(): void {
    this.persist(false, 'product.draftSaved', false);
  }

  protected finish(): void {
    if (this.mode() === 'edit') {
      this.persist(this.draft().published, 'product.saved', true);
      return;
    }
    this.persist(true, 'product.saved', true);
  }

  /** Edit-mode publish or unpublish. The editor stays open. */
  protected updatePublished(published: boolean): void {
    this.persist(published, published ? 'product.saved' : 'product.draftSaved', false);
  }

  protected setField(key: 'name' | 'summary' | 'category', event: Event): void {
    const value = this.read(event);
    if (value === undefined) {
      return;
    }
    this.draft.update((current) => ({
      ...current,
      [key]: this.writeLocale(current[key], value),
    }));
    if (key === 'name') {
      this.nameError.set(false);
    }
  }

  protected setPoint(list: PointList, index: number, field: 'title' | 'body', event: Event): void {
    const value = this.read(event);
    if (value === undefined) {
      return;
    }
    this.draft.update((current) => ({
      ...current,
      [list]: this.patchLocaleField(current[list], index, field, value),
    }));
  }

  protected addPoint(list: PointList): void {
    this.draft.update((current) => ({ ...current, [list]: [...current[list], productPoint()] }));
  }

  protected removePoint(list: PointList, index: number): void {
    this.draft.update((current) => ({
      ...current,
      [list]:
        current[list].length > 1
          ? current[list].filter((_, item) => item !== index)
          : current[list],
    }));
  }

  protected setPointImage(
    list: PointList,
    index: number,
    file: { name: string; url: string },
  ): void {
    this.draft.update((current) => ({
      ...current,
      [list]: this.mapAt(current[list], index, (item) => this.withImage(item, file)),
    }));
  }

  protected setMediaText(
    list: MediaList,
    index: number,
    field: 'title' | 'body',
    event: Event,
  ): void {
    const value = this.read(event);
    if (value === undefined) {
      return;
    }
    this.draft.update((current) => ({
      ...current,
      [list]: this.patchLocaleField(current[list], index, field, value),
    }));
  }

  protected setMediaImage(
    list: MediaList,
    index: number,
    file: { name: string; url: string },
  ): void {
    this.draft.update((current) => ({
      ...current,
      [list]: this.mapAt(current[list], index, (item) => this.withImage(item, file)),
    }));
  }

  protected addMedia(list: MediaList): void {
    this.draft.update((current) => ({ ...current, [list]: [...current[list], productMedia()] }));
  }

  protected removeMedia(list: MediaList, index: number): void {
    this.draft.update((current) => ({
      ...current,
      [list]:
        current[list].length > 1
          ? current[list].filter((_, item) => item !== index)
          : current[list],
    }));
  }

  protected setSingle(key: 'solution', field: 'title' | 'body', event: Event): void {
    const value = this.read(event);
    if (value === undefined) {
      return;
    }
    this.draft.update((current) => ({
      ...current,
      [key]: { ...current[key], [field]: this.writeLocale(current[key][field], value) },
    }));
  }

  protected setSingleImage(key: 'solution', file: { name: string; url: string }): void {
    this.draft.update((current) => ({
      ...current,
      [key]: this.withImage(current[key], file),
    }));
  }

  protected setCover(kind: 'cover' | 'thumb', file: { name: string; url: string }): void {
    this.draft.update((current) =>
      kind === 'cover'
        ? { ...current, coverName: file.name, coverUrl: file.url }
        : { ...current, thumbName: file.name, thumbUrl: file.url },
    );
  }

  protected setCoverText(
    key: 'coverTitle' | 'coverAlt' | 'thumbTitle' | 'thumbAlt',
    event: Event,
  ): void {
    const value = this.read(event);
    if (value === undefined) {
      return;
    }
    this.draft.update((current) => ({
      ...current,
      [key]: this.writeLocale(current[key], value),
    }));
  }

  protected setStat(index: number, field: 'value' | 'label' | 'body', event: Event): void {
    const value = this.read(event);
    if (value === undefined) {
      return;
    }
    this.draft.update((current) => ({
      ...current,
      stats: current.stats.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item;
        }
        if (field === 'value') {
          return { ...item, value };
        }
        return { ...item, [field]: this.writeLocale(item[field], value) };
      }),
    }));
  }

  protected setStatImage(index: number, file: { name: string; url: string }): void {
    this.draft.update((current) => ({
      ...current,
      stats: this.mapAt(current.stats, index, (item) => this.withImage(item, file)),
    }));
  }

  protected addStat(): void {
    this.draft.update((current) => ({ ...current, stats: [...current.stats, productStat()] }));
  }

  protected removeStat(index: number): void {
    this.draft.update((current) => ({
      ...current,
      stats:
        current.stats.length > 1
          ? current.stats.filter((_, item) => item !== index)
          : current.stats,
    }));
  }

  protected setUnit(index: number, field: 'title' | 'body', event: Event): void {
    const value = this.read(event);
    if (value === undefined) {
      return;
    }
    this.draft.update((current) => ({
      ...current,
      units: this.patchLocaleField(current.units, index, field, value),
    }));
  }

  protected setUnitImage(index: number, file: { name: string; url: string }): void {
    this.draft.update((current) => ({
      ...current,
      units: this.mapAt(current.units, index, (item) => this.withImage(item, file)),
    }));
  }

  protected setUnitPoint(
    unitIndex: number,
    pointIndex: number,
    field: 'title' | 'body',
    event: Event,
  ): void {
    const value = this.read(event);
    if (value === undefined) {
      return;
    }
    this.draft.update((current) => ({
      ...current,
      units: current.units.map((unit, index) =>
        index === unitIndex
          ? {
              ...unit,
              points: this.patchLocaleField(unit.points, pointIndex, field, value),
            }
          : unit,
      ),
    }));
  }

  protected setUnitPointImage(
    unitIndex: number,
    pointIndex: number,
    file: { name: string; url: string },
  ): void {
    this.draft.update((current) => ({
      ...current,
      units: current.units.map((unit, index) =>
        index === unitIndex
          ? {
              ...unit,
              points: this.mapAt(unit.points, pointIndex, (point) => this.withImage(point, file)),
            }
          : unit,
      ),
    }));
  }

  protected addUnit(): void {
    this.draft.update((current) => ({ ...current, units: [...current.units, productUnit()] }));
  }

  protected removeUnit(index: number): void {
    this.draft.update((current) => ({
      ...current,
      units:
        current.units.length > 1
          ? current.units.filter((_, item) => item !== index)
          : current.units,
    }));
  }

  protected removeUnitPoint(unitIndex: number, pointIndex: number): void {
    this.draft.update((current) => ({
      ...current,
      units: current.units.map((unit, index) =>
        index === unitIndex && unit.points.length > 1
          ? { ...unit, points: unit.points.filter((_, item) => item !== pointIndex) }
          : unit,
      ),
    }));
  }

  protected addUnitPoint(unitIndex: number): void {
    this.draft.update((current) => ({
      ...current,
      units: current.units.map((unit, index) =>
        index === unitIndex ? { ...unit, points: [...unit.points, productPoint()] } : unit,
      ),
    }));
  }

  protected setFaq(index: number, field: 'question' | 'answer', event: Event): void {
    const value = this.read(event);
    if (value === undefined) {
      return;
    }
    this.draft.update((current) => ({
      ...current,
      faqs: this.patchLocaleField(current.faqs, index, field, value),
    }));
  }

  protected addFaq(): void {
    this.draft.update((current) => ({ ...current, faqs: [...current.faqs, productFaq()] }));
  }

  protected removeFaq(index: number): void {
    this.draft.update((current) => ({
      ...current,
      faqs:
        current.faqs.length > 1 ? current.faqs.filter((_, item) => item !== index) : current.faqs,
    }));
  }

  protected setSeo(field: keyof Product['seo'], event: Event): void {
    const value = this.read(event);
    if (value === undefined) {
      return;
    }
    this.draft.update((current) => ({
      ...current,
      seo: { ...current.seo, [field]: this.writeLocale(current.seo[field], value) },
    }));
  }

  private persist(
    published: boolean,
    message: 'product.saved' | 'product.draftSaved',
    leave: boolean,
  ): void {
    if (this.saving()) {
      return;
    }
    const current = { ...this.draft(), published };
    if (published && !this.namesValid()) {
      this.nameError.set(true);
      this.step.set(0);
      return;
    }
    this.saving.set(true);
    this.api
      .save(current)
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (saved) => {
          this.draft.set(saved);
          this.nameError.set(false);
          this.messages.add({ severity: 'success', summary: this.lang.t(message) });
          if (leave) {
            void this.router.navigate(['/products', saved.id]);
          }
        },
        error: () => {
          this.messages.add({ severity: 'error', summary: this.lang.t('common.error') });
        },
      });
  }

  private namesValid(): boolean {
    const { name } = this.draft();
    return name.ar.trim().length > 0 && name.en.trim().length > 0;
  }

  private read(event: Event): string | undefined {
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      return target.value;
    }
    return undefined;
  }

  private writeLocale(current: LocaleText, value: string): LocaleText {
    return { ...current, [this.locale()]: value };
  }

  private mapAt<T>(items: readonly T[], index: number, update: (item: T) => T): T[] {
    return items.map((item, itemIndex) => (itemIndex === index ? update(item) : item));
  }

  private patchLocaleField<T extends Record<K, LocaleText>, K extends keyof T>(
    items: readonly T[],
    index: number,
    field: K,
    value: string,
  ): T[] {
    return this.mapAt(items, index, (item) => ({
      ...item,
      [field]: this.writeLocale(item[field], value),
    }));
  }

  private withImage<T extends { imageName: string; imageUrl: string }>(
    item: T,
    file: { name: string; url: string },
  ): T {
    return { ...item, imageName: file.name, imageUrl: file.url };
  }
}
