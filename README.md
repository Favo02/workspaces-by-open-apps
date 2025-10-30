# Workspace indicator by open apps

<a href="https://extensions.gnome.org/extension/5967/workspaces-indicator-by-open-apps/"><img align="right" src="https://raw.githubusercontent.com/andyholmes/gnome-shell-extensions-badge/master/get-it-on-ego.svg?sanitize=true" alt="Get it on GNOME Extensions" height="80"></a>

**GNOME shell estension** to display a simple **workspace indicator** showing **icons of apps open** in it instead of classic numbers or dots.

<img src="https://github.com/Favo02/workspaces-by-open-apps/assets/59796435/52ab2be9-ad78-4cb4-9a7a-f51fc734d2a3" alt="Preview" height="40">

## Features and Customization

- Show a simple indicator to display workspaces and the apps open in them
- Support for drag and drop: move an application to another workspace by dragging its icon
- Right- or left-click to focus or minimize an application; middle-click to close it
- Workspaces scrolling: change the active workspace by scrolling over the indicator
- Support for multiple monitors _(for both static and dynamic workspaces)_
- Rename workspaces directly from the extension _(enable in settings)_
- Hide or show the GNOME default workspace indicator (formerly the Activities button)
- Customize indicator position, size, color, and background
- Customize which elements are shown (indicator, empty workspaces, etc.)
- Icon style and saturation
- Show or hide window titles alongside icons
- Limit and group icons per workspace
- Ignore applications (using regular expressions)
- and many more in _extension preferences_

> [!TIP]
> Customize CSS editing `stylesheet.css` file. Add more classes simply searching `css_*` variables in `extension.js`.

> [!WARNING]
> Centering vertically the labels independently from the font used is problematic. Tweak `.wboa-label` classes in `stylesheet.css` to adjust it.

<img src="https://github.com/Favo02/workspaces-by-open-apps/assets/59796435/29f066c6-b2e8-411d-8430-faf4d921db27" alt="Preview" height="40">

<img src="https://github.com/Favo02/workspaces-by-open-apps/assets/59796435/72d6ea78-640a-4f1f-8c50-ddf5bb3baabb" alt="Preview" height="40">

<img src="https://github.com/Favo02/workspaces-by-open-apps/assets/59796435/49215294-423f-4850-a94f-6c62276fcd92" alt="Preview" height="40">

<img src="https://github.com/Favo02/workspaces-by-open-apps/assets/59796435/2f7b37fd-6d8a-422a-a0af-b66b38f1f7c0" alt="Preview" height="40">

<img src="https://github.com/Favo02/workspaces-by-open-apps/assets/59796435/7c505b21-db70-4cc2-9f5c-9875fb01052f" alt="Preview" height="40">

<img src="https://github.com/Favo02/workspaces-by-open-apps/assets/59796435/a9c13079-370b-4ed9-9c88-eabade9d9503" alt="Preview" height="40">

<img src="https://github.com/Favo02/workspaces-by-open-apps/assets/59796435/29c21224-fcc2-4151-b7d7-ed6e11cfe0ac" alt="Preview" height="500">

## Installation

Available for **GNOME 45+**: [gnome shell extensions store](https://extensions.gnome.org/extension/5967/workspaces-indicator-by-open-apps/).

> [!TIP]
> _Legacy versions (GNOME shell 40-44) available on gnome extensions store. These versions will not receive new updates._

### Manual installation

- Download the extension folder _(this repository)_
- Execute `./install.sh` _(requires sudo priviledges)_

### Useful commands

- Compile settings schema: `glib-compile-schemas ./schemas/`
- Show (all) extension(s) logs: `journalctl /usr/bin/gnome-shell -f -o cat`
- Show settings logs: `journalctl /usr/bin/gjs -f -o cat`
- List settings: `dconf dump  /org/gnome/shell/extensions/workspaces-indicator-by-open-apps/`
- Edit manually setting: `dconf write /org/gnome/shell/extensions/workspaces-indicator-by-open-apps/<setting> <value>`

## To Do

_See [issues](https://github.com/Favo02/workspaces-by-open-apps/issues) page._

## Contributions

_See [CONTRIBUTING.md](CONTRIBUTING.md) file._

## Credits

_See [CREDITS.md](CREDITS.md) file._
