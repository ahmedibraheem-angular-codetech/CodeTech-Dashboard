import { localeText, productPoint } from './product.model';
import {
  isWorkflowStepArabicValid,
  workflowStepBodyArMissing,
  workflowStepHasContent,
  workflowStepTitleArMissing,
} from './product-workflow-step';

describe('product workflow step validation', () => {
  it('treats a completely empty row as optional', () => {
    const step = productPoint();
    expect(workflowStepHasContent(step)).toBe(false);
    expect(isWorkflowStepArabicValid(step)).toBe(true);
    expect(workflowStepTitleArMissing(step)).toBe(false);
    expect(workflowStepBodyArMissing(step)).toBe(false);
  });

  it('requires Arabic title and short description when any locale has content', () => {
    const enOnly = {
      ...productPoint(),
      title: localeText('', 'English title'),
      body: localeText('', 'English body'),
    };
    expect(workflowStepHasContent(enOnly)).toBe(true);
    expect(isWorkflowStepArabicValid(enOnly)).toBe(false);
    expect(workflowStepTitleArMissing(enOnly)).toBe(true);
    expect(workflowStepBodyArMissing(enOnly)).toBe(true);

    const titleOnlyAr = {
      ...productPoint(),
      title: localeText('عنوان', ''),
      body: localeText('', ''),
    };
    expect(isWorkflowStepArabicValid(titleOnlyAr)).toBe(false);
    expect(workflowStepTitleArMissing(titleOnlyAr)).toBe(false);
    expect(workflowStepBodyArMissing(titleOnlyAr)).toBe(true);
  });

  it('accepts a row with both Arabic title and short description', () => {
    const step = {
      ...productPoint(),
      title: localeText('عنوان', 'Title'),
      body: localeText('وصف', 'Body'),
    };
    expect(isWorkflowStepArabicValid(step)).toBe(true);
    expect(workflowStepTitleArMissing(step)).toBe(false);
    expect(workflowStepBodyArMissing(step)).toBe(false);
  });

  it('preserves partial English content while still failing Arabic validation', () => {
    const partial = {
      ...productPoint(),
      title: localeText('', 'Only English'),
      body: localeText('', ''),
    };
    expect(partial.title.en).toBe('Only English');
    expect(isWorkflowStepArabicValid(partial)).toBe(false);
  });
});
