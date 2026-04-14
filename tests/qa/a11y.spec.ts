import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const route of ['/', '/login', '/wanted']) {
  test(`a11y smoke for ${route}`, async ({ page }) => {
    await page.goto(route);

    const results = await new AxeBuilder({ page })
      .disableRules(['color-contrast'])
      .analyze();

    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
}
