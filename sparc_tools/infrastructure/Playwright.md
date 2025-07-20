# 🎭 Playwright: Reliable End-to-End Testing

Playwright is a modern, open-source framework developed by Microsoft for reliable end-to-end (E2E) testing and automation of web applications. It allows you to write tests that interact with your web application just like a real user would, across different browsers (Chromium, Firefox, WebKit) and platforms (Windows, macOS, Linux).

## 🚀 Why Use Playwright?

*   **Cross-Browser:** Run tests against Chromium (Chrome, Edge), Firefox, and WebKit (Safari) with a single API.
*   **Cross-Platform:** Works on Windows, macOS, and Linux, locally or in CI environments.
*   **Reliability:** Built to handle modern web complexities. Features include:
    *   **Auto-Waits:** Automatically waits for elements to be ready before performing actions, reducing flakiness.
    *   **Retry Mechanisms:** Built-in retries for assertions.
    *   **Network Interception:** Mock or modify network requests and responses.
*   **Capabilities:** Supports advanced interactions like file uploads/downloads, multi-tab/multi-window scenarios, authentication handling, geolocation mocking, and more.
*   **Language Bindings:** Official libraries available for TypeScript/JavaScript (Node.js), Python, Java, and .NET.
*   **Tooling:** Comes with excellent developer tools:
    *   **Codegen:** Record user interactions and generate test code automatically.
    *   **Trace Viewer:** A GUI tool to inspect test execution step-by-step, including DOM snapshots, network logs, console messages, and screenshots/videos.
    *   **Debugging Tools:** Step through tests, inspect selectors.
*   **Parallel Execution:** Run tests in parallel out of the box for faster feedback cycles.

## 🛠️ Installation / Setup

Installation depends on the language binding you choose. Here's the setup for **Python** and **TypeScript/JavaScript (Node.js)**.

### 1. Python Setup

*   **Prerequisites:** Python installed (see [../foundational/Python.md](../foundational/Python.md)), preferably managed with `uv` or `venv`.
*   **Install Playwright Library:**
    ```bash
    # Using pip (within an activated venv)
    pip install pytest-playwright 

    # Using uv (recommended)
    uv add --dev pytest-playwright # Installs playwright and pytest plugin
    ```
*   **Install Browsers:** Playwright needs browser binaries. Run this command once after installing the library:
    ```bash
    playwright install 
    # Or: python -m playwright install 
    ```
    This downloads the necessary browser versions managed by Playwright.

### 2. TypeScript/JavaScript (Node.js) Setup

*   **Prerequisites:** Node.js and npm/yarn installed (see [../foundational/JavaScript.md](../foundational/JavaScript.md)).
*   **Initialize Project (if new):**
    ```bash
    npm init -y 
    # or yarn init -y
    ```
*   **Install Playwright Test Runner:**
    ```bash
    # Using npm
    npm init playwright@latest 

    # Using yarn
    yarn create playwright
    ```
    This interactive command will:
    *   Install `@playwright/test`.
    *   Add example tests.
    *   Create a configuration file (`playwright.config.ts` or `.js`).
    *   Install the necessary browser binaries.
    *   Add helper scripts to your `package.json`.

## 💡 Getting Started

### 1. Writing a Basic Test (Python with pytest)

*   Create a test file (e.g., `test_example.py`):
    ```python
    import re
    from playwright.sync_api import Page, expect

    def test_homepage_has_title(page: Page):
        """Tests if the Playwright homepage has the correct title."""
        page.goto("https://playwright.dev/")

        # Expect a title "to contain" a substring.
        expect(page).to_have_title(re.compile("Playwright"))

    def test_get_started_link(page: Page):
        """Tests the 'Get started' link navigates correctly."""
        page.goto("https://playwright.dev/")

        # Click the get started link.
        get_started_link = page.get_by_role("link", name="Get started")
        
        # Expect an attribute "to be strictly equal" to the value.
        expect(get_started_link).to_have_attribute("href", "/docs/intro")

        # Click the link.
        get_started_link.click()

        # Expects the URL to contain intro.
        expect(page).to_have_url(re.compile(".*intro"))
    ```
*   **Run the tests:**
    ```bash
    pytest 
    ```

### 2. Writing a Basic Test (TypeScript with Playwright Test)

*   Look at the example file created during installation (e.g., `tests/example.spec.ts`):
    ```typescript
    import { test, expect } from '@playwright/test';

    test('homepage has Playwright in title and get started link linking to intro page', async ({ page }) => {
      await page.goto('https://playwright.dev/');

      // Expect a title "to contain" a substring.
      await expect(page).toHaveTitle(/Playwright/);

      // create a locator
      const getStarted = page.getByRole('link', { name: 'Get started' });

      // Expect an attribute "to be strictly equal" to the value.
      await expect(getStarted).toHaveAttribute('href', '/docs/intro');

      // Click the get started link.
      await getStarted.click();

      // Expects the URL to contain intro.
      await expect(page).toHaveURL(/.*intro/);
    });
    ```
*   **Run the tests:**
    ```bash
    # Using npm
    npx playwright test

    # Using yarn
    yarn playwright test
    ```

### 3. Using Codegen

*   Generate code by recording your actions:
    ```bash
    # Python
    playwright codegen https://example.com

    # Node.js
    npx playwright codegen https://example.com 
    ```
*   Interact with the browser window that opens. Playwright Codegen will print the corresponding code to the console or save it to a file.

### 4. Using Trace Viewer

*   Run tests with tracing enabled:
    ```bash
    # Python (modify pytest.ini or use command line flags)
    pytest --tracing=on 

    # Node.js (modify playwright.config.ts or use command line flags)
    npx playwright test --trace=on 
    ```
*   Open the generated trace file (`trace.zip`):
    ```bash
    # Python
    playwright show-trace trace.zip

    # Node.js
    npx playwright show-trace trace.zip
    ```

## 📚 Help & Resources

*   **Official Playwright Documentation:** Excellent guides, API reference, and examples. [https://playwright.dev/docs/intro](https://playwright.dev/docs/intro)
*   **Playwright GitHub:** [https://github.com/microsoft/playwright](https://github.com/microsoft/playwright)
*   **Playwright Community Discord:** [https://aka.ms/playwright/discord](https://aka.ms/playwright/discord)
*   **Stack Overflow:** [https://stackoverflow.com/questions/tagged/playwright](https://stackoverflow.com/questions/tagged/playwright)
*   **YouTube Channel (Playwright):** Tutorials and feature highlights. [https://www.youtube.com/c/Playwrightdev](https://www.youtube.com/c/Playwrightdev)

## ✅ Next Steps

*   Write tests for the core user flows of your application.
*   Learn about different selectors (CSS, XPath, text, role-based).
*   Explore assertions using `expect`.
*   Use Codegen to help write tests faster.
*   Analyze test failures using the Trace Viewer.
*   Integrate Playwright tests into your CI/CD pipeline (e.g., GitHub Actions).
*   Learn about Page Object Model (POM) for organizing test code.

---
*Licensed under the [Creative Commons Attribution-NonCommercial 4.0 International License (CC BY-NC 4.0)](https://creativecommons.org/licenses/by-nc/4.0/)*
*Visit [ProductFoundry.ai](https://productfoundry.ai)*