/**
 * Shared async settle for component specs that already waited on timers + CD.
 *
 * Semantics match the historical inline helper used across editor/list specs:
 *   await new Promise((resolve) => setTimeout(resolve, ms));
 *   await fixture.whenStable();
 *   fixture.detectChanges();
 *
 * Do not change `ms` casually — many suites were calibrated to 10–20ms with
 * memory services / HttpTestingController. Prefer adopting this helper only
 * where the previous sequence was identical.
 */
export async function flushUi(
  fixture: { whenStable: () => Promise<unknown>; detectChanges: () => void },
  ms = 20,
): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
  await fixture.whenStable();
  fixture.detectChanges();
}

/** Timer-only flush when there is no fixture (e.g. after HttpTestingController). */
export async function flushDelay(ms = 20): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
