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
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { map } from 'rxjs';

import type { AppLanguage } from '../../../../core/i18n/translations';
import { LanguageService } from '../../../../core/services/language.service';
import { FieldError } from '../../../../shared/components/field-error/field-error';
import { LocaleSwitch } from '../../../../shared/components/locale-switch/locale-switch';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { StateView } from '../../../../shared/components/state-view/state-view';
import { ProductUpload } from '../../components/product-upload/product-upload';
import {
  PRODUCT_STEPS,
  blankProduct,
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
type MediaList = 'sectors' | 'tools';

@Component({
  selector: 'app-product-editor',
  imports: [PageHeader, Button, LocaleSwitch, FieldError, StateView, ProductUpload],
  templateUrl: './product-editor.html',
  styleUrl: '../../products.scss',
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
  readonly locale = signal<AppLanguage>('ar');
  readonly step = signal(0);
  readonly draft = signal<Product>(blankProduct());
  readonly status = signal<'loading' | 'ready' | 'missing'>('ready');
  readonly nameError = signal(false);

  readonly mode = toSignal(
    this.route.data.pipe(map((data) => (data['mode'] === 'edit' ? 'edit' : 'create'))),
    { initialValue: this.route.snapshot.data['mode'] === 'edit' ? 'edit' : 'create' },
  );
  readonly stepId = computed(() => PRODUCT_STEPS[this.step()].id);
  readonly lastStep = computed(() => this.step() === PRODUCT_STEPS.length - 1);

  constructor() {
    effect(() => {
      const mode = this.mode();
      const id = this.id();
      untracked(() => {
        if (mode === 'edit' && id) {
          this.load(id);
          return;
        }
        this.status.set('ready');
        this.draft.set(blankProduct());
        this.step.set(0);
      });
    });
  }

  protected text(value: LocaleText): string {
    return value[this.locale()];
  }

  protected select(index: number): void {
    if (this.mode() === 'create' && index > this.step()) {
      return;
    }
    this.step.set(index);
  }

  protected next(): void {
    if (!this.lastStep()) {
      this.step.update((current) => current + 1);
    }
  }

  protected previous(): void {
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
    this.persist(true, 'product.saved', true);
  }

  protected setField(key: 'name' | 'summary' | 'category', event: Event): void {
    const value = this.read(event);
    this.draft.update((current) => ({
      ...current,
      [key]: { ...current[key], [this.locale()]: value },
    }));
    if (key === 'name') {
      this.nameError.set(false);
    }
  }

  protected setPoint(list: PointList, index: number, field: 'title' | 'body', event: Event): void {
    const value = this.read(event);
    this.draft.update((current) => ({
      ...current,
      [list]: current[list].map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, [field]: { ...item[field], [this.locale()]: value } }
          : item,
      ),
    }));
  }

  protected addPoint(list: PointList): void {
    this.draft.update((current) => ({ ...current, [list]: [...current[list], productPoint()] }));
  }

  protected setMediaText(
    list: MediaList,
    index: number,
    field: 'title' | 'body',
    event: Event,
  ): void {
    const value = this.read(event);
    this.draft.update((current) => ({
      ...current,
      [list]: current[list].map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, [field]: { ...item[field], [this.locale()]: value } }
          : item,
      ),
    }));
  }

  protected setMediaImage(
    list: MediaList,
    index: number,
    file: { name: string; url: string },
  ): void {
    this.draft.update((current) => ({
      ...current,
      [list]: current[list].map((item, itemIndex) =>
        itemIndex === index ? { ...item, imageName: file.name, imageUrl: file.url } : item,
      ),
    }));
  }

  protected addMedia(list: MediaList): void {
    this.draft.update((current) => ({ ...current, [list]: [...current[list], productMedia()] }));
  }

  protected setSingle(key: 'solution' | 'identity', field: 'title' | 'body', event: Event): void {
    const value = this.read(event);
    this.draft.update((current) => ({
      ...current,
      [key]: { ...current[key], [field]: { ...current[key][field], [this.locale()]: value } },
    }));
  }

  protected setSingleImage(
    key: 'solution' | 'identity',
    file: { name: string; url: string },
  ): void {
    this.draft.update((current) => ({
      ...current,
      [key]: { ...current[key], imageName: file.name, imageUrl: file.url },
    }));
  }

  protected setCover(kind: 'cover' | 'thumb', file: { name: string; url: string }): void {
    this.draft.update((current) =>
      kind === 'cover'
        ? { ...current, coverName: file.name, coverUrl: file.url }
        : { ...current, thumbName: file.name, thumbUrl: file.url },
    );
  }

  protected setStat(index: number, field: 'value' | 'label' | 'body', event: Event): void {
    const value = this.read(event);
    this.draft.update((current) => ({
      ...current,
      stats: current.stats.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item;
        }
        if (field === 'value') {
          return { ...item, value };
        }
        return { ...item, [field]: { ...item[field], [this.locale()]: value } };
      }),
    }));
  }

  protected setStatImage(index: number, file: { name: string; url: string }): void {
    this.draft.update((current) => ({
      ...current,
      stats: current.stats.map((item, itemIndex) =>
        itemIndex === index ? { ...item, imageName: file.name, imageUrl: file.url } : item,
      ),
    }));
  }

  protected addStat(): void {
    this.draft.update((current) => ({ ...current, stats: [...current.stats, productStat()] }));
  }

  protected setUnit(index: number, field: 'title' | 'body', event: Event): void {
    const value = this.read(event);
    this.draft.update((current) => ({
      ...current,
      units: current.units.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, [field]: { ...item[field], [this.locale()]: value } }
          : item,
      ),
    }));
  }

  protected setUnitImage(index: number, file: { name: string; url: string }): void {
    this.draft.update((current) => ({
      ...current,
      units: current.units.map((item, itemIndex) =>
        itemIndex === index ? { ...item, imageName: file.name, imageUrl: file.url } : item,
      ),
    }));
  }

  protected setUnitPoint(
    unitIndex: number,
    pointIndex: number,
    field: 'title' | 'body',
    event: Event,
  ): void {
    const value = this.read(event);
    this.draft.update((current) => ({
      ...current,
      units: current.units.map((unit, index) =>
        index === unitIndex
          ? {
              ...unit,
              points: unit.points.map((point, currentIndex) =>
                currentIndex === pointIndex
                  ? { ...point, [field]: { ...point[field], [this.locale()]: value } }
                  : point,
              ),
            }
          : unit,
      ),
    }));
  }

  protected addUnit(): void {
    this.draft.update((current) => ({ ...current, units: [...current.units, productUnit()] }));
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
    this.draft.update((current) => ({
      ...current,
      faqs: current.faqs.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, [field]: { ...item[field], [this.locale()]: value } }
          : item,
      ),
    }));
  }

  protected addFaq(): void {
    this.draft.update((current) => ({ ...current, faqs: [...current.faqs, productFaq()] }));
  }

  protected setSeo(field: keyof Product['seo'], event: Event): void {
    const value = this.read(event);
    this.draft.update((current) => ({
      ...current,
      seo: { ...current.seo, [field]: { ...current.seo[field], [this.locale()]: value } },
    }));
  }

  private load(id: string): void {
    this.status.set('loading');
    this.api
      .get(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((product) => {
        if (!product) {
          this.status.set('missing');
          return;
        }
        this.draft.set(product);
        this.status.set('ready');
      });
  }

  private persist(
    published: boolean,
    message: 'product.saved' | 'product.draftSaved',
    leave: boolean,
  ): void {
    const current = { ...this.draft(), published };
    if (published && (!current.name.ar.trim() || !current.name.en.trim())) {
      this.nameError.set(true);
      this.step.set(0);
      return;
    }
    this.api
      .save(current)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((saved) => {
        this.draft.set(saved);
        this.messages.add({ severity: 'success', summary: this.lang.t(message) });
        if (leave) {
          void this.router.navigate(['/products', saved.id]);
        }
      });
  }

  private read(event: Event): string {
    return (event.target as HTMLInputElement | HTMLTextAreaElement).value;
  }
}
