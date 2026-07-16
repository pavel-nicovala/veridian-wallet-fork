import { After, Then, When } from "@wdio/cucumber-framework";
import AppOfflineScreen from "../../screen-objects/offline/app-offline.screen.js";
import {
  isKeriaReachable,
  startKeria,
  stopKeria,
} from "../../helpers/docker.helper.js";
import { setDeviceNetwork } from "../../helpers/device-network.helper.js";
import { log } from "../../helpers/logger.js";

When(/^the KERIA backend goes down$/, async function () {
  stopKeria();
});

When(/^the KERIA backend comes back up$/, async function () {
  await startKeria();
});

When(/^the device network is disabled$/, async function () {
  setDeviceNetwork(false);
});

When(/^the device network is enabled$/, async function () {
  setDeviceNetwork(true);
});

Then(/^user can see the App Offline page$/, async function () {
  await AppOfflineScreen.waitForDisplayed();
});

Then(/^the App Offline page disappears$/, async function () {
  await AppOfflineScreen.waitForHidden();
});

// Idempotent recovery so a failed offline scenario cannot leave the backend down
// or the device offline and poison the rest of the full-suite run.
After({ tags: "@offline" }, async function () {
  try {
    setDeviceNetwork(true);
  } catch (error) {
    log.warn(`[Offline cleanup] Failed to re-enable device network: ${error}`);
  }
  try {
    if (!(await isKeriaReachable())) {
      await startKeria();
    }
  } catch (error) {
    log.warn(`[Offline cleanup] Failed to restore KERIA: ${error}`);
  }
});
