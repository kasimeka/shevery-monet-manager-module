# Monet Manager

A Shevery ADB module that sets the Android Monet seed color. The WebUI previews all nine Android styles (TONAL_SPOT to FIDELITY) using Material Color Utilities, and can apply a seed color or copy the current wallpaper color from `com.miui.wallpaper`. This works around HyperOS 3 breaking wallpaper-based Monet color updates and hiding the stock UI customization settings, making it impossible to change the system UI color palette.

## Build

```sh
pnpm install
pnpm build      # bundles src/index.ts into webui/mcu.js
pnpm typecheck
```

`webui/mcu.js` is committed so the module can be packaged without a build step.

## Package

```sh
zip -r monet-manager.zip module.prop action.sh monet.sh webui
```

Install the zip from the Shevery ADB Modules screen.

## Access

The WebUI needs the module shell bridge (`usesShellBridge=true`) and the global module access mode set to **Full access**. Previews work in any mode. The module action button syncs the seed from the wallpaper and works in Safe mode.

## Files

- `monet.sh`: runs on the device with shell privileges. `status`, `wpcolor`, `auto`, `RRGGBB [STYLE]`, `wallpaper`.
- `src/index.ts`: WebUI source.
- `webui/`: page and bundled script.
