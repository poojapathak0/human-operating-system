import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import Planner from '../routes/Planner';

describe('a11y: Planner', () => {
  it('has no serious accessibility violations', async () => {
    const { container } = render(<Planner />);
    const results = await axe(container, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
      rules: { 'color-contrast': { enabled: false } },
    });
    const serious = results.violations.filter((v: any) => ['serious', 'critical'].includes(v.impact || ''));
    expect(serious).toHaveLength(0);
  });
});
