export const PRODUCT_STEPS = [
  { id: 'info', labelKey: 'product.step.info' },
  { id: 'sectors', labelKey: 'product.step.sectors' },
  { id: 'offer', labelKey: 'product.step.offer' },
  { id: 'tools', labelKey: 'product.step.tools' },
  { id: 'units', labelKey: 'product.step.units' },
  { id: 'identity', labelKey: 'product.step.identity' },
  { id: 'faq', labelKey: 'product.step.faq' },
  { id: 'seo', labelKey: 'product.step.seo' },
] as const;

export const IDENTITY_STEP_INDEX = PRODUCT_STEPS.findIndex((item) => item.id === 'identity');
export const SEO_STEP_INDEX = PRODUCT_STEPS.findIndex((item) => item.id === 'seo');
