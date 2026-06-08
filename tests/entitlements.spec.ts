import { expect, test } from '@playwright/test';
import { existsSync } from 'node:fs';
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

  test('pricing page renders Free, Lite, and Pro outcome shells', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      (window as Window & { dataLayer?: unknown[] }).dataLayer = [];
    });

    const response = await page.goto(`${baseUrl}/pricing`, {
      waitUntil: 'networkidle',
    });

    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole('heading', {
        name: /Turn visual words into remembered words/i,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', {
        name: 'Start remembering your first 50 words.',
      }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Build a daily visual memory habit.' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', {
        name: 'Fix weak words and prepare for exams.',
      }),
    ).toBeVisible();
    await expect(page.getByText('Save words you meet')).toBeVisible();
    await expect(page.getByText('Review before forgetting')).toBeVisible();
    await expect(page.getByText('Repair weak words')).toBeVisible();
    await expect(page.getByText('Continue exam packs')).toBeVisible();
    const disclaimer = page.getByRole('region', {
      name: 'Local MVP billing disclaimer',
    });

    await expect(disclaimer).toContainText('Billing is not connected.');
    await expect(
      disclaimer.getByText(/Upgrade clicks only record local interest/i),
    ).toBeVisible();
    await expect(disclaimer).toContainText('No real subscription is created.');
    await expect(
      page.getByRole('button', { name: 'Preview Lite' }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Preview Pro' }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /checkout|subscribe|pay/i }),
    ).toHaveCount(0);

    await page.getByRole('button', { name: 'Preview Pro' }).click();
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
                  'vlx_upgrade_click' &&
                (item as Record<string, unknown>).source === 'pricing_page' &&
                (item as Record<string, unknown>).plan === 'pro',
            );
          });
        });
      })
      .toBe(true);
  });

  test('no payment route is created', () => {
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
      expect(existsSync(join(process.cwd(), routePath))).toBe(false);
    }
  });
});
