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
      page.getByRole('heading', {
        level: 1,
        name: 'Pricing',
      }),
    ).toBeVisible();
    await expect(page.locator('body')).toContainText(
      'Build a visual memory habit before words fade.',
    );
    await expect(page.locator('body')).toContainText(
      'Billing is not connected yet',
    );

    const freePlan = page.locator('[data-plan-id="free"]');
    const litePlan = page.locator('[data-plan-id="lite"]');
    const proPlan = page.locator('[data-plan-id="pro"]');
    const examPackPlan = page.locator('[data-plan-id="exam_pack"]');

    await expect(freePlan).toBeVisible();
    await expect(litePlan).toBeVisible();
    await expect(proPlan).toBeVisible();
    await expect(examPackPlan).toBeVisible();
    await expect(
      freePlan.getByRole('heading', {
        name: 'Free',
      }),
    ).toBeVisible();
    await expect(
      litePlan.getByRole('heading', {
        name: 'Lite',
      }),
    ).toBeVisible();
    await expect(
      proPlan.getByRole('heading', {
        name: 'Pro',
      }),
    ).toBeVisible();
    await expect(
      examPackPlan.getByRole('heading', {
        name: 'Exam Pack',
      }),
    ).toBeVisible();
    await expect(freePlan).toContainText('Start remembering your first words.');
    await expect(litePlan).toContainText('Build a daily visual memory habit.');
    await expect(proPlan).toContainText('Fix weak words and prepare for exams.');
    await expect(examPackPlan).toContainText(
      'Follow a guided visual vocabulary plan.',
    );
    await expect(
      freePlan.getByRole('link', { name: 'Start free review' }),
    ).toHaveAttribute('href', '/dashboard');
    await expect(
      page.getByRole('button', {
        name: 'Note Lite interest - billing not connected yet',
      }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', {
        name: 'Note Pro interest - billing not connected yet',
      }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', {
        name: 'Note Exam Pack interest - billing not connected yet',
      }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /checkout|subscribe|pay/i }),
    ).toHaveCount(0);
    await expect(
      page.getByRole('link', {
        name: 'Note Lite interest - billing not connected yet',
      }),
    ).toHaveCount(0);
    await expect(
      page.getByRole('link', {
        name: 'Note Pro interest - billing not connected yet',
      }),
    ).toHaveCount(0);
    await expect(
      page.getByRole('link', {
        name: 'Note Exam Pack interest - billing not connected yet',
      }),
    ).toHaveCount(0);

    const bodyText = await page.locator('body').innerText();

    expect(bodyText).not.toMatch(/paid access granted|subscription active/i);
    expect(bodyText).not.toMatch(/fake mastery/i);
    expect(bodyText).not.toMatch(/\bstreak\b/i);

    await page
      .getByRole('button', {
        name: 'Note Pro interest - billing not connected yet',
      })
      .click();
    await expect(
      page.getByText('Paid beta interest noted locally. Billing is not connected yet.'),
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

  test('pricing page keeps paid beta options interest-only', async ({
    page,
  }) => {
    await page.goto(`${baseUrl}/pricing`, { waitUntil: 'networkidle' });

    await expect(
      page.getByRole('heading', { name: 'Pricing' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Free' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Lite' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Pro' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Exam Pack' }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'View all packs' }),
    ).toHaveCount(0);

    const removedPackLinks = [
      'Open Academic Vocabulary pack plan',
      'Open IELTS Writing pack plan',
      'Open GRE Visual Verbal pack plan',
    ] as const;

    for (const name of removedPackLinks) {
      await expect(page.getByRole('link', { name })).toHaveCount(0);
    }

    await expect(
      page.getByRole('link', { name: 'Start free review' }),
    ).toHaveAttribute('href', '/dashboard');
    await expect(
      page.getByRole('button', {
        name: 'Note Lite interest - billing not connected yet',
      }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', {
        name: 'Note Pro interest - billing not connected yet',
      }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', {
        name: 'Note Exam Pack interest - billing not connected yet',
      }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /checkout|subscribe|pay/i }),
    ).toHaveCount(0);
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
      if (
        filePath.split("\\").join("/").endsWith(
          "src/app/auth/confirm/route.ts"
        )
        || filePath.split("\\").join("/").endsWith(
          "src/app/api/me/entitlements/route.ts"
        )
      ) {
        continue;
      }

      const fileText = readFileSync(filePath, 'utf8');

      expect(fileText, filePath).not.toMatch(
        /\bexport\s+(async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)\b/,
      );
    }
  });
});
