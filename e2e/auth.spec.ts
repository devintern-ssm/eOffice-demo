import { test, expect } from '@playwright/test';
import { quickLogin, logout, ACCOUNTS } from './helpers';

test.describe('Auth & session', () => {
  test('quick-login reaches the dashboard and stores a token', async ({ page }) => {
    await quickLogin(page, ACCOUNTS.rajesh);
    const token = await page.evaluate(() => localStorage.getItem('eoffice_token'));
    expect(token, 'JWT persisted under eoffice_token').toBeTruthy();
    await expect(page.getByText('Rajesh Kumar')).toBeVisible();
  });

  test('session survives a reload', async ({ page }) => {
    await quickLogin(page, ACCOUNTS.priya);
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('logout clears the session', async ({ page }) => {
    await quickLogin(page, ACCOUNTS.amit);
    await logout(page);
    const token = await page.evaluate(() => localStorage.getItem('eoffice_token'));
    expect(token).toBeFalsy();
  });

  test('deep-link to a protected route while logged out redirects to login', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('eoffice_token'));
    await page.goto('/all-files');
    await expect(page.getByRole('button', { name: /Sign in/i })).toBeVisible();
    await expect(page.getByRole('link', { name: 'All Files' })).toHaveCount(0);
  });
});
