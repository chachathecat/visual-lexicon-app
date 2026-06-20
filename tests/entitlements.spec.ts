import { expect, test } from '@playwright/test';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import {
  readLocalPlanState,
  resolveEntitlement,
  VLX_DEFAULT_PLAN_ID,
  VLX_PLAN_STATE_STORAGE_KEY,
} from '../src/lib/entitlements';

const baseUrl =
  process.env.PLAYWRIGHT_BASE_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  'http://127.0.0.1:3006';

const workspaceRoot = process.cwd();

const originalWindowDescriptor = Object.getOwnPropertyDescriptor(
  globalThis,
  'window',
);

function createMemoryLocalStorage(): Storage {
  const store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

function installLocalStorage() {
  const localStorage = createMemoryLocalStorage();

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { localStorage },
  });

  return localStorage;
}

function restoreWindow() {
  if (originalWindowDescriptor) {
    Object.defineProperty(globalThis, 'window', originalWindowDescriptor);
    return;
  }

  Reflect.deleteProperty(globalThis, 'window');
}

function listFilesRecursively(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const fullPath = join(directory, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      return listFilesRecursively(fullPath);
    }

    return [fullPath];
  });
}

test.afterEach(() => {
  restoreWindow();
});

test.describe('Visual Lexicon local entitlement skeleton', () => {
  test('default entitlement resolves to the local guest plan', () => {
    restoreWindow();

    const planState = readLocalPlanState();
    const entitlement = resolveEntitlement(planState);

    expect(planState).toEqual({
      plan: VLX_DEFAULT_PLAN_ID,
      source: 'local',
    });
    expect(entitlement.plan.id).toBe('guest');
    expect(entitlement.isDefault).toBe(true);
    expect(entitlement.isPaidPreview).toBe(false);
  });

  test('local plan state can be read safely', () => {
    const localStorage = installLocalStorage();

    localStorage.setItem(
      VLX_PLAN_STATE_STORAGE_KEY,
      JSON.stringify({ plan: 'lite', updatedAt: '2026-06-06T00:00:00.000Z' }),
    );
    expect(readLocalPlanState()).toEqual({
      plan: 'lite',
      source: 'local',
      updatedAt: '2026-06-06T00:00:00.000Z',
    });

    localStorage.setItem(VLX_PLAN_STATE_STORAGE_KEY, 'not-json');
    expect(readLocalPlanState().plan).toBe('guest');

    localStorage.setItem(
      VLX_PLAN_STATE_STORAGE_KEY,
      JSON.stringify({ plan: 'enterprise' }),
    );
    expect(readLocalPlanState().plan).toBe('guest');
  });

  test('pricing page renders Pricing v2 outcome plan cards', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      (window as Window & { dataLayer?: unknown[] }).dataLayer = [];
    });

    const response = await page.goto(`${baseUrl}/pricing`, {
      waitUntil: 'networkidle',
    });

    expect(response?.status()).toBe(200);
    await expect(page.locator('.track-b-shell')).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 1, name: 'Visual Lexicon paid beta' }),
    ).toBeVisible();
    await expect(page.locator('body')).toContainText(
      'Paid beta is invite-only.',
    );
    await expect(page.locator('body')).toContainText(
      'does not create checkout, billing, paid access, or external validation.',
    );

    const freePlan = page.locator('[data-plan-id="free"]');
    const litePlan = page.locator('[data-plan-id="lite"]');
    const proPlan = page.locator('[data-plan-id="pro"]');

    await expect(freePlan).toBeVisible();
    await expect(litePlan).toBeVisible();
    await expect(proPlan).toBeVisible();
    await expect(
      freePlan.getByRole('heading', {
        name: 'Start the local memory loop.',
      }),
    ).toBeVisible();
    await expect(
      litePlan.getByRole('heading', {
        name: 'Daily memory habit.',
      }),
    ).toBeVisible();
    await expect(
      proPlan.getByRole('heading', {
        name: 'Weak-word repair and exam prep.',
      }),
    ).toBeVisible();
    await expect(freePlan).toContainText('Saved words become review items');
    await expect(litePlan).toContainText('Interest capture only in this beta');
    await expect(proPlan).toContainText('No fake paid access or checkout');
    await expect(
      page.getByRole('button', { name: 'Join paid beta' }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Request early access' }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /checkout|subscribe|pay/i }),
    ).toHaveCount(0);
    await expect(
      page.getByRole('link', { name: 'Join paid beta' }),
    ).toHaveCount(0);
    await expect(
      page.getByRole('link', { name: 'Request early access' }),
    ).toHaveCount(0);

    const bodyText = await page.locator('body').innerText();

    expect(bodyText).not.toMatch(/paid access granted|subscription active/i);
    expect(bodyText).not.toMatch(/fake mastery/i);
    expect(bodyText).not.toMatch(/\bstreak\b/i);

    await page.getByRole('button', { name: 'Request early access' }).click();
    await expect(
      page.getByText('Paid beta interest noted locally. Billing is not connected.'),
    ).toBeVisible();
    await expect
      .poll(async () => {
        return await page.evaluate(() => {
          const dataLayer = (window as Window & { dataLayer?: unknown[] })
            .dataLayer;

          if (!Array.isArray(dataLayer)) return false;

          return dataLayer.some((item) => {
            return Boolean(
                item &&
                typeof item === 'object' &&
                !Array.isArray(item) &&
                (item as Record<string, unknown>).event ===
                  'vlx_pricing_interest' &&
                (item as Record<string, unknown>).source === 'pricing_page' &&
                (item as Record<string, unknown>).plan === 'pro',
            );
          });
        });
      })
      .toBe(true);
  });

  test('pricing page links Exam Packs to existing safe pack routes', async ({
    page,
  }) => {
    await page.goto(`${baseUrl}/pricing`, { waitUntil: 'networkidle' });

    await expect(
      page.getByRole('heading', { name: 'Exam Packs' }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'View all packs' })).toHaveAttribute(
      'href',
      '/packs',
    );

    const safePackLinks = [
      ['Open Academic Vocabulary pack plan', '/packs/academic-vocabulary'],
      ['Open IELTS Writing pack plan', '/packs/ielts-writing-vocabulary'],
      ['Open GRE Visual Verbal pack plan', '/packs/gre-visual-verbal'],
    ] as const;

    for (const [name, href] of safePackLinks) {
      await expect(page.getByRole('link', { name })).toHaveAttribute('href', href);
    }
  });

  test('documents Pricing / Paywall v2 and links it from README', () => {
    const docPath = join(workspaceRoot, 'docs', 'TRACK_B_PRICING_PAYWALL_V2.md');
    const readme = readFileSync(join(workspaceRoot, 'README.md'), 'utf8');
    const doc = readFileSync(docPath, 'utf8');

    expect(existsSync(docPath)).toBe(true);
    expect(readme).toContain('docs/TRACK_B_PRICING_PAYWALL_V2.md');
    expect(doc).toContain('Start remembering your first words.');
    expect(doc).toContain('Build a daily visual memory habit.');
    expect(doc).toContain('Fix weak words and prepare for exams.');
    expect(doc).toContain('Recommended next PR: **#79 Manual QA execution report**');
  });

  test('no payment SDK, checkout route, billing route, or route handler is created', () => {
    const disallowedRoutePaths = [
      'src/app/payment',
      'src/app/payments',
      'src/app/billing',
      'src/app/checkout',
      'src/app/api/payment',
      'src/app/api/payments',
      'src/app/api/billing',
      'src/app/api/checkout',
    ];

    for (const routePath of disallowedRoutePaths) {
      expect(existsSync(join(workspaceRoot, routePath))).toBe(false);
    }

    const packageJson = JSON.parse(
      readFileSync(join(workspaceRoot, 'package.json'), 'utf8'),
    ) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const dependencyNames = Object.keys({
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    });

    for (const dependencyName of dependencyNames) {
      expect(dependencyName.toLowerCase()).not.toMatch(
        /stripe|paddle|portone|lemonsqueezy|lemon-squeezy/,
      );
    }

    const appFiles = listFilesRecursively(join(workspaceRoot, 'src', 'app'));

    for (const filePath of appFiles) {
      const fileText = readFileSync(filePath, 'utf8');

      expect(fileText, filePath).not.toMatch(
        /\bexport\s+(async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)\b/,
      );
    }
  });
});
