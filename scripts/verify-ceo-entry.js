async (page) => {
  const base = new URL(page.url()).origin;
  const checks = [];
  const errors = [];
  const check = (condition, label) => {
    if (!condition) throw new Error(label);
    checks.push(label);
  };
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    if (response.url().startsWith(base) && response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(base + '/#ceo-workspace');
    await page.waitForFunction(() => document.querySelector('main')?.dataset.homeMediaStatus?.startsWith('ready'));
    await page.getByRole('link', { name: '进入 CEO 工作台', exact: true }).click();
    check(decodeURI(new URL(page.url()).pathname) === '/ceo-workspace/CEO工作台.html', `Entry opens the standalone workspace at ${width}px`);
    await page.reload();
    check(await page.title() === 'CEO工作台 · 经营总览', `Workspace refresh works at ${width}px`);
    const back = page.getByRole('link', { name: '返回数字超市', exact: true });
    check(await back.count() === 1 && await back.isVisible(), `Return link is visible at ${width}px`);
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Workspace fits ${width}px`);
    const icon = await page.locator('link[rel="icon"]').getAttribute('href');
    check(icon === '/favicon.svg' && (await page.request.get(new URL(icon, base).href)).ok(), `Shared favicon loads at ${width}px`);
    await page.screenshot({ path: `output/playwright/ceo-entry-${width}.png` });
    await back.click();
    await page.waitForFunction(() => document.querySelector('main')?.dataset.homeMediaStatus?.startsWith('ready'));
    check(page.url() === base + '/#ceo-workspace' && await page.locator('#ceo-workspace').isVisible(), `Return opens the homepage CEO section at ${width}px`);
  }
  check(errors.length === 0, `No runtime or HTTP errors: ${errors.join('; ')}`);
  return { passed: checks.length, checks, errors };
}
