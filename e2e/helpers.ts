import { Page, expect } from '@playwright/test';

/** Log in via the demo quick-login buttons on the sign-in screen. */
export async function quickLogin(page: Page, who: RegExp | string) {
  await page.goto('/');
  const btn = page.getByRole('button', { name: who });
  await btn.click();
  // The dashboard heading confirms we are authenticated.
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
}

export async function logout(page: Page) {
  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page.getByRole('button', { name: /Sign in/i })).toBeVisible();
}

export const ACCOUNTS = {
  rajesh: /Rajesh/,
  priya: /Priya/,
  amit: /Amit/,
  md: /MD Rao/,
  sneha: /Sneha/,
  admin: /^Admin$/,
};
