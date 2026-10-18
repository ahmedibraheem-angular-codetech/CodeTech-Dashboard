import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { map } from 'rxjs';

import { LanguageService } from '../../../../core/services/language.service';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { StateView } from '../../../../shared/components/state-view/state-view';
import { ProjectsService } from '../../services/projects.service';

@Component({
  selector: 'app-project-editor',
  imports: [ReactiveFormsModule, PageHeader, Button, RouterLink, StateView],
  templateUrl: './project-editor.html',
  styleUrl: '../projects-list/projects-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectEditor {
  private readonly api = inject(ProjectsService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly messages = inject(MessageService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  readonly lang = inject(LanguageService);
  readonly id = input('');
  readonly status = signal<'ready' | 'loading' | 'missing'>('ready');
  readonly form = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
    summary: [''],
    published: [true],
  });
  readonly mode = toSignal(
    this.route.data.pipe(map((data) => (data['mode'] === 'edit' ? 'edit' : 'create'))),
    { initialValue: this.route.snapshot.data['mode'] === 'edit' ? 'edit' : 'create' },
  );

  constructor() {
    effect(() => {
      const id = this.id();
      const mode = this.mode();
      untracked(() => {
        if (mode === 'edit' && id) {
          this.load(id);
        }
      });
    });
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.api
      .save({
        id: this.mode() === 'edit' ? this.id() : '',
        published: value.published,
        name: value.name,
        summary: value.summary,
        coverUrl: '/images/project-cover.jpg',
        tags: [
          { icon: 'pi pi-code', label: 'UI/UX' },
          { icon: 'pi pi-microchip', label: 'البرمجة' },
          { icon: 'pi pi-cloud', label: 'Cloud' },
        ],
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((saved) => {
        this.messages.add({ severity: 'success', summary: this.lang.t('project.saved') });
        void this.router.navigate(['/projects', saved.id]);
      });
  }

  private load(id: string): void {
    this.status.set('loading');
    this.api
      .get(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((project) => {
        if (!project) {
          this.status.set('missing');
          return;
        }
        this.form.patchValue({
          name: project.name,
          summary: project.summary,
          published: project.published,
        });
        this.status.set('ready');
      });
  }
}
