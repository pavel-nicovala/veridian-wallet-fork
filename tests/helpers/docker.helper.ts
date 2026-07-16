import { execSync } from "child_process";
import { getKeriaUrlsForTestRunner } from "./ssi-agent-urls.helper.js";
import { log } from "./logger.js";

/**
 * Controls the ephemeral docker-compose backend from test code so e2e scenarios
 * can simulate a KERIA outage (`docker compose stop keria`) and a recovery.
 * Runs on the test-runner host, which is where docker is available in CI.
 */

const COMPOSE_FILE = process.env.E2E_COMPOSE_FILE || "docker-compose.e2e.yaml";
const KERIA_SERVICE = "keria";
const COMPOSE_TIMEOUT_MS = 120 * 1000;
const HEALTH_TIMEOUT_MS = 60 * 1000;
const HEALTH_POLL_INTERVAL_MS = 2 * 1000;

function composeCommand(command: string): void {
  execSync(`docker compose -f ${COMPOSE_FILE} ${command}`, {
    stdio: "inherit",
    timeout: COMPOSE_TIMEOUT_MS,
  });
}

export function stopKeria(): void {
  log.info("[Docker] Stopping KERIA container to simulate a backend outage");
  composeCommand(`stop ${KERIA_SERVICE}`);
}

export async function startKeria(): Promise<void> {
  log.info("[Docker] Starting KERIA container");
  composeCommand(`start ${KERIA_SERVICE}`);
  await waitForKeriaReachable();
}

/**
 * Any HTTP response (even a 404) proves KERIA is up and listening;
 * only a connection-level failure counts as unreachable.
 */
export async function isKeriaReachable(): Promise<boolean> {
  const { connectUrl } = getKeriaUrlsForTestRunner();
  try {
    await fetch(`${connectUrl}/spec.yaml`, { signal: AbortSignal.timeout(3000) });
    return true;
  } catch (e) {
    return false;
  }
}

export async function waitForKeriaReachable(timeoutMs = HEALTH_TIMEOUT_MS): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await isKeriaReachable()) {
      log.info("[Docker] KERIA is reachable again");
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, HEALTH_POLL_INTERVAL_MS));
  }
  throw new Error(`KERIA did not become reachable within ${timeoutMs}ms`);
}
