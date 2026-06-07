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

  test('pricing page renders Free, Lite, and Pro plan shells', async ({
    page,
  }) => {
    const response = await page.goto(`${baseUrl}/pricing`, {
      waitUntil: 'networkidle',
    });

    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole('heading', { name: /Choose the memory loop you need/i }),
    ).toBeVisible();
    await expect(page.getByText('Free').first()).toBeVisible();
    await expect(page.getByText('Lite').first()).toBeVisible();
    await expect(page.getByText('Pro').first()).toBeVisible();
    await expect(page.getByText(/No billing provider/i)).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Preview Lite' }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Preview Pro' }),
    ).toBeVisible();
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
