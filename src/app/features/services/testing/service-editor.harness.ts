import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';
import type { MockInstance } from 'vitest';

import { API_LATENCY_MS } from '../../../core/config/latency';
import { LanguageService } from '../../../core/services/language.service';
import { flushUi } from '../../../../testing/flush-ui';
import { blankProject } from '../../projects/models/project.model';
import { ProjectsMemoryService } from '../../projects/testing/projects.memory';
import { ProjectsService } from '../../projects/services/projects.service';
import { type Service } from '../models/service.model';
import { SERVICES_SEED } from './services.mock';
import { ServicesMemoryService } from './services.memory';
import { ServicesService } from '../services/services.service';
import { ServiceEditor } from '../pages/service-editor/service-editor';

@Component({ template: '', changeDetection: ChangeDetectionStrategy.OnPush })
export class ServiceEditorRouteStub {}

export type ServicesApi = Pick<ServicesService, 'get' | 'save'>;
export type ProjectsApi = Pick<ProjectsService, 'list'>;

export function installServiceEditorTestHooks(): void {
  beforeEach(() => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe(): void {}
        unobserve(): void {}
        disconnect(): void {}
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    TestBed.inject(LanguageService).set('ar');
  });
}

export interface ServiceEditorRender {
  fixture: ComponentFixture<ServiceEditor>;
  editor: ServiceEditor;
  root: HTMLElement;
  navigate: MockInstance<(commands: unknown[], extras?: unknown) => Promise<boolean>>;
  toast: MockInstance<(message: unknown) => void>;
}

export async function renderServiceEditor(
  mode: 'create' | 'edit',
  id = '',
  overrides: { services?: ServicesApi; projects?: ProjectsApi } = {},
): Promise<ServiceEditorRender> {
  TestBed.configureTestingModule({
    imports: [ServiceEditor],
    providers: [
      MessageService,
      { provide: API_LATENCY_MS, useValue: 0 },
      { provide: ServicesService, useClass: ServicesMemoryService },
      { provide: ProjectsService, useClass: ProjectsMemoryService },
      provideRouter([{ path: 'services', component: ServiceEditorRouteStub }]),
      { provide: ActivatedRoute, useValue: { data: of({ mode }), snapshot: { data: { mode } } } },
    ],
  });
  if (overrides.services) {
    TestBed.overrideProvider(ServicesService, { useValue: overrides.services });
  }
  if (overrides.projects) {
    TestBed.overrideProvider(ProjectsService, { useValue: overrides.projects });
  }
  localStorage.setItem('codetech.language', 'ar');
  TestBed.inject(LanguageService).set('ar');
  const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  const toast = vi.spyOn(TestBed.inject(MessageService), 'add');
  const fixture = TestBed.createComponent(ServiceEditor);
  fixture.componentRef.setInput('id', id);
  fixture.detectChanges();
  await settle(fixture);
  return {
    fixture,
    editor: fixture.componentInstance,
    root: fixture.nativeElement as HTMLElement,
    navigate,
    toast,
  };
}

export function seedService(id: string): Service {
  const found = SERVICES_SEED.find((item) => item.id === id);
  if (!found) {
    throw new Error(`Seed ${id} is missing`);
  }
  return structuredClone(found);
}

export function inputEvent(value: string): Event {
  const input = document.createElement('input');
  input.value = value;
  const event = new Event('input', { bubbles: true });
  Object.defineProperty(event, 'target', { value: input });
  return event;
}

export function enterName(root: HTMLElement, value: string): void {
  const name = root.querySelector<HTMLInputElement>('input:not([type="file"])');
  if (!name) {
    throw new Error('Service name field is missing');
  }
  name.value = value;
  name.dispatchEvent(new Event('input'));
}

export function switchLocale(root: HTMLElement, label: 'English' | 'عربي'): void {
  const option = [...root.querySelectorAll<HTMLButtonElement>('.locale-switch__option')].find(
    (item) => item.textContent?.includes(label),
  );
  if (!option) {
    throw new Error(`Locale tab ${label} is missing`);
  }
  option.click();
}

export function clickNext(root: HTMLElement): void {
  const next = root.querySelector<HTMLButtonElement>('.editor-nav--next');
  if (!next) {
    throw new Error('Next button is missing');
  }
  next.click();
}

export async function settle(fixture: {
  whenStable: () => Promise<unknown>;
  detectChanges: () => void;
}): Promise<void> {
  await flushUi(fixture);
}

export function fillEveryStep(editor: ServiceEditor): void {
  editor.useLocale('ar');
  editor.setField('name', inputEvent('خدمة جديدة'));
  editor.setField('description', inputEvent('وصف'));
  editor.setWhyImageTitle(inputEvent('عنوان'));
  editor.setWhyImage({ name: 'why.png', url: 'blob:why' });
  editor.setWhyTitle(0, inputEvent('سبب'));
  editor.setWhyIcon(0, { name: 'pi-star', url: 'icon:pi-star' });
  editor.setPoint('solutions', 0, 'title', inputEvent('حل'));
  editor.setPoint('solutions', 0, 'body', inputEvent('تفصيل الحل'));
  editor.setPointImage('solutions', 0, { name: 'pi-bolt', url: 'icon:pi-bolt' });
  editor.setPoint('stages', 0, 'title', inputEvent('مرحلة'));
  editor.setPointImage('stages', 0, { name: 'stage.png', url: 'blob:stage' });
  editor.setPoint('features', 0, 'title', inputEvent('ميزة'));
  editor.setPointImage('features', 0, { name: 'feature.png', url: 'blob:feature' });
  editor.setProject('wasly', true);
  editor.setSectorImage(0, { name: 'sector.png', url: 'blob:sector' });
  editor.setFaq(0, 'question', inputEvent('سؤال'));
  editor.setFaq(0, 'answer', inputEvent('جواب'));
  editor.useLocale('en');
  editor.setField('name', inputEvent('New service'));
  editor.setField('description', inputEvent('Description'));
  editor.setWhyImageTitle(inputEvent('Title'));
  editor.setWhyTitle(0, inputEvent('Reason'));
  editor.setPoint('solutions', 0, 'title', inputEvent('Solution'));
  editor.setPoint('solutions', 0, 'body', inputEvent('Solution body'));
  editor.setPoint('stages', 0, 'title', inputEvent('Stage'));
  editor.setPoint('features', 0, 'title', inputEvent('Feature'));
  editor.setFaq(0, 'question', inputEvent('Question'));
  editor.setFaq(0, 'answer', inputEvent('Answer'));
  editor.useLocale('ar');
}

export function headerButton(root: HTMLElement, label: string): HTMLButtonElement | null {
  const match = [...root.querySelectorAll('app-page-header app-button')].find(
    (item) => item.textContent?.trim() === label,
  );
  return match?.querySelector('button') ?? null;
}

export function projectNamed(id: string) {
  return { ...blankProject(), id, published: true };
}

export function lastFileInput(root: HTMLElement): HTMLInputElement {
  const inputs = root.querySelectorAll<HTMLInputElement>('app-service-why-step input[type="file"]');
  const input = inputs.item(inputs.length - 1);
  if (!input) {
    throw new Error('File input is missing');
  }
  return input;
}

export function pickFile(input: HTMLInputElement, name: string): void {
  Object.defineProperty(input, 'files', {
    value: [new File([new Uint8Array([1])], name, { type: 'image/png' })],
    configurable: true,
  });
  input.dispatchEvent(new Event('change'));
}
