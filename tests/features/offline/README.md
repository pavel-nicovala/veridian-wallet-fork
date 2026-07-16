# Offline Behavior E2E Tests

Tests the wallet's offline behavior on Android: when connectivity to the KERIA agent is
lost, the app must show the "You're offline" page, and it must recover automatically once
connectivity returns.

Two scenarios in [`offline-behavior.feature`](offline-behavior.feature), each onboarding a
fresh wallet against a local dockerized KERIA before simulating a failure:

| Tag | Failure simulated | Mechanism |
|---|---|---|
| `@backend-outage` | KERIA goes down | `docker compose stop keria` mid-test, then `start` |
| `@device-network` | Device loses network | `adb shell svc wifi/data disable`, then re-enable |

In CI these run via [`.github/workflows/e2e-offline.yaml`](../../../.github/workflows/e2e-offline.yaml).

## Running locally

### Prerequisites

- **Node 20** (`engines` in package.json — newer majors break the WDIO/Appium stack with
  `UND_ERR_INVALID_ARG` session errors): `nvm use 20`
- **Android SDK** with an AVD created (e.g. `Galaxy_S24_Ultra`), and:
  ```bash
  export ANDROID_HOME="$HOME/Library/Android/sdk"   # macOS default
  export PATH="$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$PATH"
  ```
- **Docker** with the compose plugin
- `npm ci` done, and a `.env` file at the repo root:
  ```
  APP_PATH=<absolute path to>/android/app/build/outputs/apk/debug/app-debug.apk
  KERIA_IP=10.0.2.2
  AVD_NAME=<your AVD name>
  ```

### 1. Start the ephemeral backend

The e2e stack publishes the same ports as the dev stack — stop the dev stack first if it
is running:

```bash
docker compose stop
docker compose -f docker-compose.e2e.yaml up -d --wait
```

### 2. Build the app (first time, or after app changes)

```bash
KERIA_IP=10.0.2.2 npm run build:e2e
cd android && ./gradlew assembleDebug && cd ..
```

### 3. Start the emulator

```bash
emulator -avd <your AVD name> &
adb wait-for-device
```

### 4. Run the tests

```bash
RELOAD_SESSION=true npm run wdio:android:s24ultra -- --spec ./tests/features/offline/offline-behavior.feature
```

Drop the `-- --spec …` suffix to run the full e2e suite instead. `RELOAD_SESSION=true` is
required whenever a run contains more than one onboarding scenario: it reloads the Appium
session after each scenario, which resets app data so the next scenario starts from the
intro screen. Appium itself needs no manual start — the WDIO Appium service spawns it on
port 4733.

### 5. Tear down

```bash
docker compose -f docker-compose.e2e.yaml down -v
docker compose start   # restore the dev stack if you had it running
```

## Troubleshooting

- **`Appium exited before timeout` / port errors** — a stale Appium is holding port 4733:
  `lsof -ti :4733 | xargs kill -9`
- **`createIdentifier error … 400 unknown witness` during onboarding** — the keria
  container cannot reach the witnesses. This happens if a previous
  `docker compose up` failed on a port conflict and Docker reused a half-created
  container with no network attached. Fix:
  `docker compose -f docker-compose.e2e.yaml down -v` and bring the stack up again.
- **`Neither ANDROID_HOME nor ANDROID_SDK_ROOT …`** — export `ANDROID_HOME` (see
  prerequisites) in the same shell that runs the tests.
- KERIA's `/spec.yaml` answers **401** when healthy — any HTTP response means it is up;
  only connection-level failures mean it is down (the health probes in
  `tests/helpers/docker.helper.ts` rely on this).
