# App icons

Put your app icons here. This folder is set as **buildResources** for electron-builder, so it will look here for `icon.ico` (Windows), `icon.icns` (macOS), and `icon.png` (Linux). This folder is tracked by git.

| Platform | File       | Format / notes |
|----------|------------|----------------|
| **Windows** | `icon.ico` | At least 256×256. Must be a **real** .ico file (see below). |
| **macOS**   | `icon.icns`| 512×512 (or 1024×1024 for Retina). Used for .app and .dmg. |
| **Linux**   | `icon.png` | 512×512 or 1024×1024 PNG. Used for AppImage. |

If a platform file is missing, the build still runs but that platform will use the default Electron icon.

**Windows .ico – important**

- **Do not** just rename a `.png` to `.ico`. That causes “Unable to set icon” errors. The file must be a proper multi-size .ico (e.g. 16, 32, 48, 256 px).
- Export from an editor that supports .ico (e.g. [GIMP](https://www.gimp.org/)), or use a converter that outputs a real .ico (e.g. [icoconvert.com](https://icoconvert.com), or ImageMagick: `convert icon.png -define icon:auto-resize=256,48,32,16 icon.ico`).
- Start from a high-res source (e.g. 1024×1024 PNG) then convert.

**Other formats**

- **.icns**: On macOS use `iconutil` or an online PNG→icns converter.
- **.png**: Use your main logo at 512×512 or 1024×1024.
