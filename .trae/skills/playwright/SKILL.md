---
name: "playwright"
description: "Playwright E2E testing framework for web apps. Invoke when user asks to write/run tests, test specific features, or set up automated testing."
---

# Playwright Testing

Playwright is a powerful end-to-end testing framework for web applications. This skill helps you set up, write, and run Playwright tests.

## Installation

### Global Installation (Recommended)

```bash
npm install -g playwright
npx playwright install chromium  # Install Chromium browser
```

### Project Installation

```bash
npm install -D @playwright/test
npx playwright install chromium
```

## Basic Test Structure

### Simple Test Example

```typescript
// tests/example.spec.ts
import { test, expect } from '@playwright/test';

test('homepage loads successfully', async ({ page }) => {
  await page.goto('https://example.com');
  await expect(page).toHaveTitle(/Example/);
});

test('login flow works', async ({ page }) => {
  await page.goto('https://example.com/login');
  await page.fill('[data-testid="username"]', 'user@example.com');
  await page.fill('[data-testid="password"]', 'password123');
  await page.click('[data-testid="login-button"]');
  await expect(page).toHaveURL(/.*dashboard/);
});
```

## Common Selectors

| Selector Type | Example | Best For |
|---------------|---------|----------|
| CSS | `page.locator('button.primary')` | General elements |
| Text | `page.getByText('Submit')` | Visible text |
| Role | `page.getByRole('button', { name: 'Submit' })` | Accessibility |
| Test ID | `page.getByTestId('submit-btn')` | Stable selectors |
| Label | `page.getByLabel('Email')` | Form fields |

## Core Actions

### Navigation

```typescript
await page.goto('https://example.com');
await page.goBack();
await page.goForward();
await page.reload();
```

### Interactions

```typescript
// Click
await page.click('button.submit');

// Fill input
await page.fill('input[name="email"]', 'test@example.com');
await page.type('input[name="email"]', 'test@example.com', { delay: 100 });

// Select
await page.selectOption('select#country', 'China');
await page.check('input[type="checkbox"]');

// Hover & Drag
await page.hover('div.draggable');
await page.dragAndDrop('#source', '#target');
```

### Assertions

```typescript
// Basic assertions
await expect(page).toHaveTitle('Page Title');
await expect(page).toHaveURL(/.*dashboard/);
await expect(page.locator('h1')).toContainText('Welcome');

// Visibility
await expect(page.locator('.loading')).toBeHidden();
await expect(page.locator('.modal')).toBeVisible();

// Content
await expect(page.locator('table')).toContainText('Total: $100');
await expect(page.locator('.error')).toHaveCount(0);

// State
await expect(page.locator('input')).toBeChecked();
await expect(page.locator('select')).toHaveValue('option-1');
```

## Page Object Model

### Page Object Example

```typescript
// pages/LoginPage.ts
import { Page, expect } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.page.getByLabel('Email').fill(email);
    await this.page.getByLabel('Password').fill(password);
    await this.page.getByRole('button', { name: 'Sign In' }).click();
  }

  async expectError(message: string) {
    await expect(this.page.locator('.error-message')).toContainText(message);
  }
}

// pages/DashboardPage.ts
import { Page } from '@playwright/test';

export class DashboardPage {
  constructor(private page: Page) {}

  async expectLoaded() {
    await expect(this.page).toHaveTitle(/Dashboard/);
  }

  async getUserName(): Promise<string> {
    return this.page.locator('.user-name').textContent() ?? '';
  }
}
```

### Using Page Objects in Tests

```typescript
import { test } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';

test('user can login and see dashboard', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const dashboardPage = new DashboardPage(page);

  await loginPage.goto();
  await loginPage.login('user@example.com', 'password123');

  await dashboardPage.expectLoaded();
  await expect(dashboardPage.getUserName()).resolves.toBe('John Doe');
});
```

## Waiting Strategies

```typescript
// Auto-wait (default)
// Playwright automatically waits for elements to be actionable

// Explicit waits
await page.waitForLoadState('networkidle');
await page.waitForSelector('.loaded-content');
await page.waitForResponse('**/api/data');
await page.waitForRequest('**/submit');

// Custom waits
await expect(page.locator('.result')).toHaveCount(5, { timeout: 10000 });

// Wait-free assertions (fail immediately if not ready)
await expect(page.locator('.immediate')).toBeVisible({ state: 'attached' });
```

## Test Configuration

### playwright.config.ts

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  webServer: {
    command: 'npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

## API Testing with Playwright

```typescript
test('API returns correct data', async ({ request }) => {
  const response = await request.get('https://api.example.com/users');
  expect(response.ok()).toBeTruthy();
  expect(response.status()).toBe(200);

  const users = await response.json();
  expect(users).toHaveLength(10);
  expect(users[0]).toHaveProperty('name');
});

test('API creates new resource', async ({ request }) => {
  const newUser = {
    name: 'John Doe',
    email: 'john@example.com',
  };

  const response = await request.post('https://api.example.com/users', {
    data: newUser,
  });

  expect(response.status()).toBe(201);
  const created = await response.json();
  expect(created).toMatchObject(newUser);
});
```

## Running Tests

```bash
# Run all tests
npx playwright test

# Run specific test file
npx playwright test tests/login.spec.ts

# Run tests with specific project
npx playwright test --project=chromium

# Run tests matching pattern
npx playwright test -g "login"

# Open UI mode (visual debugging)
npx playwright test --ui

# Show report
npx playwright show-report

# Debug mode
npx playwright test --debug
```

## Best Practices

1. **Use Test IDs**: Add `data-testid` attributes for stable element selection
2. **Avoid Sleep**: Use built-in waiting mechanisms instead of `page.waitForTimeout()`
3. **Page Objects**: Create page objects for reusable interaction patterns
4. **Isolate Tests**: Each test should be independent and able to run in parallel
5. **Meaningful Names**: Use descriptive test and function names
6. **Data-Test Attributes**: Add test-friendly attributes instead of relying on CSS classes

```html
<!-- Good -->
<button data-testid="submit-form">Submit</button>

<!-- Avoid -->
<button class="btn btn-primary submit-form">Submit</button>
```

## Common Test Scenarios

### Form Validation

```typescript
test('form shows validation errors', async ({ page }) => {
  await page.goto('/register');

  // Submit empty form
  await page.click('button[type="submit"]');

  // Check validation messages
  await expect(page.locator('[data-testid="email-error"]')).toContainText('Email is required');
  await expect(page.locator('[data-testid="password-error"]')).toContainText('Password must be at least 8 characters');
});
```

### Dynamic Content

```typescript
test('content loads after API call', async ({ page }) => {
  await page.goto('/dashboard');

  // Wait for dynamic content
  await page.waitForSelector('[data-testid="user-list"]');

  // Verify loaded data
  await expect(page.locator('[data-testid="user-count"]')).toContainText('5 users');
});
```

### Error Handling

```typescript
test('shows error on failed request', async ({ page }) => {
  // Intercept and fail API request
  await page.route('**/api/protected', (route) => {
    route.fulfill({ status: 401, body: 'Unauthorized' });
  });

  await page.goto('/dashboard');

  await expect(page.locator('.error-message')).toBeVisible();
  await expect(page.locator('.error-message')).toContainText('Please log in');
});
```

## Troubleshooting

### Element Not Found

```typescript
// Debug: Take screenshot before action
await page.screenshot({ path: 'debug.png' });

// Debug: Print page HTML
console.log(await page.content());

// Debug: List all buttons
const buttons = await page.locator('button').all();
for (const btn of buttons) {
  console.log(await btn.textContent());
}
```

### Flaky Tests

```typescript
// Add retries for flaky tests
test('flaky test', async ({ page }) => {
  test.info().annotations.push({ type: 'flaky', description: 'Known flaky test' });
  // Your test code
});
```
