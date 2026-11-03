export const PROJECT_STEPS = [
  { id: 'about', labelKey: 'project.step.about' },
  { id: 'challenges', labelKey: 'project.step.challenges' },
  { id: 'solutions', labelKey: 'project.step.solutions' },
  { id: 'features', labelKey: 'project.step.features' },
  { id: 'results', labelKey: 'project.step.results' },
  { id: 'identity', labelKey: 'project.step.identity' },
  { id: 'seo', labelKey: 'project.step.seo' },
] as const;

export const SEO_STEP_INDEX = PROJECT_STEPS.findIndex((item) => item.id === 'seo');
