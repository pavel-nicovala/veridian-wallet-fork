import { expect } from "expect-webdriverio";

export class AppOfflineScreen {
  // AppOffline renders through ResponsivePageLayout with pageId="offline"
  get offlinePage() {
    return $("[data-testid=\"offline-page\"]");
  }

  get title() {
    return $("[data-testid=\"offline-page\"] h1");
  }

  // Offline detection is poll-driven (KERIA is polled every 2s), so both waits
  // use a generous ceiling well above the poll/reconnect interval.
  async waitForDisplayed(timeout = 60000) {
    await this.offlinePage.waitForDisplayed({
      timeout,
      timeoutMsg: "App Offline page did not appear after connectivity loss",
    });
    await expect(this.title).toBeDisplayed();
    await expect(this.title).toHaveText(expect.stringContaining("offline"));
  }

  async waitForHidden(timeout = 60000) {
    await this.offlinePage.waitForDisplayed({
      timeout,
      reverse: true,
      timeoutMsg: "App Offline page did not disappear after connectivity was restored",
    });
  }
}

export default new AppOfflineScreen();
