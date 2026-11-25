export async function flushUi(
  fixture: { whenStable: () => Promise<unknown>; detectChanges: () => void },
  ms = 20,
): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
  await fixture.whenStable();
  fixture.detectChanges();
}

export async function flushDelay(ms = 20): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
