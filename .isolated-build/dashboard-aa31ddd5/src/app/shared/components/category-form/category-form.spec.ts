import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { CategoryForm } from './category-form';

describe('CategoryForm', () => {
  it('renders labels from the provided i18n keys', async () => {
    TestBed.configureTestingModule({ imports: [CategoryForm] });
    const fixture = TestBed.createComponent(CategoryForm);
    fixture.componentRef.setInput(
      'form',
      new FormGroup({
        nameAr: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        nameEn: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        published: new FormControl(true, { nonNullable: true }),
      }),
    );
    fixture.componentRef.setInput('labelKey', 'faq.categoryName');
    fixture.componentRef.setInput('placeholderKey', 'faq.categoryNamePlaceholder');
    fixture.componentRef.setInput('requiredKey', 'faq.required');
    fixture.componentRef.setInput('publishedKey', 'faq.publishStatus');
    fixture.detectChanges();

    const root: HTMLElement = fixture.nativeElement;
    expect(root.querySelector('.category-form')).not.toBeNull();
    expect(root.textContent).toContain('اسم التصنيف');
    expect(root.textContent).toContain('حالة النشر');
  });
});
