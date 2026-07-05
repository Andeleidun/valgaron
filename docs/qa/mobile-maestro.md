# Mobile Maestro E2E

Maestro is the first native/device interaction harness for Valgaron Mobile. It
is Android-only for the first slice and is intentionally separate from
`npm run check` because it depends on a local emulator or physical device.

## Install Maestro

Maestro requires Java 17 or newer and `JAVA_HOME` pointing to that
installation. Verify Java first:

```powershell
java -version
```

On Windows, use
[Maestro's official CLI install documentation](https://docs.maestro.dev/maestro-cli/how-to-install-maestro-cli):

1. Download the latest `maestro.zip` from the
   [Maestro GitHub releases page](https://github.com/mobile-dev-inc/Maestro/releases/latest).
2. Extract it to a stable location such as `C:\maestro`.
3. Add the extracted `bin` folder to your user `PATH`.
4. Restart the terminal so PATH changes are visible.

For the current local install, the executable was verified at:

```text
C:\maestro\maestro\bin\maestro.bat
```

Confirm the CLI is available:

```powershell
maestro --version
```

If Maestro is installed somewhere else and is not on PATH, set `MAESTRO_CLI`
before running the npm script:

```powershell
$env:MAESTRO_CLI = 'C:\path\to\maestro.bat'
```

## Android Device

Run against an Android Studio emulator or a physical Android device with USB
debugging enabled. Confirm ADB can see the device:

```powershell
adb devices
```

If `adb` is not on PATH, add the Android SDK platform-tools folder, commonly:

```text
%LOCALAPPDATA%\Android\Sdk\platform-tools
```

## Build And Install

The deterministic E2E reset is guarded by the Expo public flag
`EXPO_PUBLIC_VALGARON_E2E=1`. Build and install the native app with that flag
enabled so the installed bundle resets AsyncStorage to the seed world on app
startup and clears mobile recovery snapshot keys.

From the repository root:

```powershell
$env:EXPO_PUBLIC_VALGARON_E2E = '1'
npm run android --workspace @valgaron/mobile
```

The app id under test is:

```text
com.valgaron.mobile
```

## Run Flows

After the E2E build is installed and a device is attached:

```powershell
npm run mobile:e2e
npm run mobile:e2e:android
```

Both commands currently run the Android flow suite at
`mobile/e2e/flows/character-tree.yaml`.

## Known Limitations

- Android-only for v1.
- Not part of `npm run check`.
- Local emulator and device timing can be environment-sensitive.
- CI wiring is deferred.
