# Workspace indicator by open apps

<a href="https://extensions.gnome.org/extension/5967/workspaces-indicator-by-open-apps/"><img align="right" src="https://raw.githubusercontent.com/andyholmes/gnome-shell-extensions-badge/master/get-it-on-ego.svg?sanitize=true" alt="Get it on GNOME Extensions" height="80"></a>

**GNOME shell estension** to display a simple **workspace indicator** showing **icons of apps open** in it instead of classic numbers or dots.

<img src="https://github.com/Favo02/workspaces-by-open-apps/assets/59796435/52ab2be9-ad78-4cb4-9a7a-f51fc734d2a3" alt="Preview" height="40">

> [!NOTE]
> Due to the small amount of time I can dedicate to this project, the extension may not be updated frequently. However, I will try to fix any bugs and add update to new GNOME versions as soon as possible.

## Features

- Show a simple indicator to **display workspaces** and **apps open** in it
- Support for **drag and drop**: change an application workspace just dragging its icon
- **Right/Left** click to focus/minimize application, **Middle click** to close
- **Workspaces scrolling**: change active workspace scrolling hover the indicator
- Support for **multiple monitor** _(for both static and dynamic workspaces)_
- **Rename workspaces** directly from the extension _(activate in settings)_
- Hide/show **GNOME default workspace indicator** (former activities button)

## Customization

- Indicator **position**
- Mouse **scroll** direction (normal or inverse)
- Activate/deactivate "**middle click** to close app"
- Activate/deactivate "**click on active workspace to overview**"
- Activate/deactivate "**click on focused application to minimize**"
- Activate/deactivate "**workspace indicator**"
- Activate/deactivate "**app indicator**"
- Customize indicator **color**
- Activate/deactivate "**round borders**"
- Show/Hide **workspaces names**
- Show/Hide **empty** workspaces
- Customize apps on all workspaces **text indicator**
- **Desaturate** all icons
- **No effect**/**Reduce opacity**/**Desaturate** for both **minimized** and **inactive** apps
- **Limit icons** per workspace
- **Group icons** of same application
- **Ignore** applications (with regex)

> [!TIP]
> Customize CSS editing `stylesheet.css` file. Add more classes simply searching `css_*` variables in `extension.js`.

<img src="https://github.com/Favo02/workspaces-by-open-apps/assets/59796435/29f066c6-b2e8-411d-8430-faf4d921db27" alt="Preview" height="40">

<img src="https://github.com/Favo02/workspaces-by-open-apps/assets/59796435/72d6ea78-640a-4f1f-8c50-ddf5bb3baabb" alt="Preview" height="40">

<img src="https://github.com/Favo02/workspaces-by-open-apps/assets/59796435/49215294-423f-4850-a94f-6c62276fcd92" alt="Preview" height="40">

<img src="https://github.com/Favo02/workspaces-by-open-apps/assets/59796435/2f7b37fd-6d8a-422a-a0af-b66b38f1f7c0" alt="Preview" height="40">

<img src="https://github.com/Favo02/workspaces-by-open-apps/assets/59796435/7c505b21-db70-4cc2-9f5c-9875fb01052f" alt="Preview" height="40">

<img src="https://github.com/Favo02/workspaces-by-open-apps/assets/59796435/a9c13079-370b-4ed9-9c88-eabade9d9503" alt="Preview" height="40">

<img src="https://github.com/Favo02/workspaces-by-open-apps/assets/59796435/29c21224-fcc2-4151-b7d7-ed6e11cfe0ac" alt="Preview" height="500">

## Installation

Available for **GNOME 45**: [gnome shell extensions store](https://extensions.gnome.org/extension/5967/workspaces-indicator-by-open-apps/).

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

_Go to [issues page](https://github.com/Favo02/workspaces-by-open-apps/issues) to see the full list of features and bugs to fix._

## Contributions

Any contribution is welcome!

Submit any bug or feature request through an **issue**, or submit your code creating a **pull request**.

## Commit, Branch and Pull request convention

### Commit

Commit message convention: `<type>(<scope>): <summary>`

Type: `build`, `feat`, `fix`, `refactor`, `docs`\
Scope: `extension`, `settings`, `css`\
Summary: short summary in present tense, not capitalized, no period at the end

Example: `feat(extension): add drag and drop`

### Branch
Create a new branch for new features. Branch name should be self explanatory.\
*It is possible to not to create the new branch for single-commit fixes or small modifications.*

Example: `add-drag-and-drop`

### Pull request
When the feature is ready and stable create a new pull request.

## Credits

Due to the poor documentation to develop GNOME shell extensions, I looked at the source code of existing extension (often deprecated and not working anymore):

- [BaBar taskbar](https://github.com/fthx/babar) by _@fthx_ _(and various other fthx's extensions)_
- [TaskIcons](https://github.com/rliang/gnome-shell-extension-task-icons) by _@rliang_
- [Improved workspace indicator](https://github.com/MichaelAquilina/improved-workspace-indicator) by _@MichaelAquilina_
- [New workspaces shortcut](https://github.com/barnscott/newworkspaceshortcut-barnix.io) by _@barnscott_
- [AppIndicator Support](https://github.com/ubuntu/gnome-shell-extension-appindicator) by _@ubuntu_
- [Top Panel Workspace Scroll](https://github.com/timbertson/gnome-shell-scroll-workspaces) by _@timbertson_
- [Focus follows forkspace](https://github.com/christopher-l/focus-follows-workspace) by _@christopher-l_
