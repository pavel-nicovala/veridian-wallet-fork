import { execSync } from "child_process";
import { log } from "./logger.js";

/**
 * Toggles the emulator's network connectivity via adb, simulating a device-side
 * network failure. Primary mechanism is `svc wifi/data` (the emulator routes all
 * traffic — including 10.0.2.2 to the host — through the virtual wifi interface);
 * airplane mode is the fallback for images where `svc` misbehaves.
 * We deliberately avoid the deprecated Appium `setNetworkConnection()`.
 */

const ADB_TIMEOUT_MS = 10 * 1000;

function adbShell(command: string): void {
  execSync(`adb shell ${command}`, { stdio: "ignore", timeout: ADB_TIMEOUT_MS });
}

export function setDeviceNetwork(enabled: boolean): void {
  const state = enabled ? "enable" : "disable";
  log.info(`[Network] Turning device network ${enabled ? "on" : "off"}`);
  try {
    adbShell(`svc wifi ${state}`);
    adbShell(`svc data ${state}`);
  } catch (error) {
    log.warn(`[Network] svc wifi/data failed, falling back to airplane mode: ${error}`);
    adbShell(`cmd connectivity airplane-mode ${enabled ? "disable" : "enable"}`);
  }
}
