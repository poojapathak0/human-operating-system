import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
// axe-core is UMD; import the source and inject into JSDOM window
// @ts-ignore
import axe from 'axe-core';

// Minimal a11y smoke test on key route HTML
async function runAxe(html: string) {
  const dom = new JSDOM(html, { pretendToBeVisual: true });
  const { window } = dom;
  // Inject axe into the JSDOM window
  // @ts-ignore
  window.eval(axe.source as string);
  // @ts-ignore
  const results = await (window as any).axe.run(window.document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] } });
  return results;
}

describe.skip('a11y (legacy JSDOM smoke)', () => {
  it('Check-In page has no critical a11y violations', async () => {
    const html = `<!doctype html><html lang="en"><body>
      <main>
        <h1>Daily Clarity Check-In</h1>
        <form aria-label="Daily Check-In">
          <label for="mood">How are you feeling?</label>
          <div id="mood" role="radiogroup" aria-label="Select mood">
            <button role="radio" aria-checked="false">Sad</button>
            <button role="radio" aria-checked="true">Neutral</button>
          </div>
          <label for="note">What's your top priority today?</label>
          <textarea id="note"></textarea>
          <button type="submit">Save</button>
        </form>
      </main>
    </body></html>`;
  const res: any = await runAxe(html);
    // Allow minor issues but no serious/critical
  const serious = res.violations.filter((v: any) => ['serious', 'critical'].includes(v.impact || ''));
    expect(serious.length).toBe(0);
  });
});
