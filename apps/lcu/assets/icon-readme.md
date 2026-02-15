# App icons

Put your app icons here so electron-builder can use them. This folder is tracked by git (unlike `build/`, which is ignored). If you had icons in `build/`, move them here (e.g. `icon.ico`).

| Platform | File       | Format / notes |
|----------|------------|----------------|
| **Windows** | `icon.ico` | Multi-size .ico (e.g. 16, 32, 48, 256 px). Required for Windows exe/installer. |
| **macOS**   | `icon.icns`| .icns bundle. Used for .app and .dmg. |
| **Linux**   | `icon.png` | 512×512 or 1024×1024 PNG. Used for AppImage. |

If a platform file is missing, the build still runs but that platform will use the default Electron icon.

**Creating the files**

- **.ico**: Export from your design tool, or use an online converter (e.g. convert a 512×512 PNG to .ico with multiple sizes). Tools like ImageMagick: `convert icon.png -define icon:auto-resize=256,48,32,16 icon.ico`
- **.icns**: On macOS you can use `iconutil` or an online PNG→icns converter.
- **.png**: Use your main logo at 512×512 or 1024×1024.
