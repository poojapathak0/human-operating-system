import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import Vault from '../routes/Vault';

describe('a11y: Vault', () => {
  it('has no serious accessibility violations', async () => {
    const { container } = render(<Vault />);
    const results = await axe(container, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
      rules: { 'color-contrast': { enabled: false } },
    });
    const serious = results.violations.filter((v: any) => ['serious', 'critical'].includes(v.impact || ''));
    expect(serious).toHaveLength(0);
  });
});
