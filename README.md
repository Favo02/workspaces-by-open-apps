# Workspace indicator by open apps

**GNOME shell estension** to display a simple **workspace indicator** showing **icons of apps open** in it instead of classic numbers or dots.

[<img src="https://github.com/Favo02/workspaces-by-open-apps/assets/59796435/a4139bec-db00-4de9-a49a-74e640163e7e" alt="Preview" height="50">](https://extensions.gnome.org/extension/5967/workspaces-indicator-by-open-apps/)

## Usage and Customization

- Support for **drag and drop**: change an application workspace just dragging its icon
- **Right/Left** click to focus application, **Middle click** to close
- **Workspaces scrolling**: change active workspace scrolling hover the indicator
- Toggle application icons **desaturation**
- Show/Hide workspaces **index label**
- Show/Hide active workspace and focused app **indicator**
- Change indicator **style** and **color**
- Support for **multiple monitor** _(for both static and dynamic workspaces)_
- **_[NEW!]_** Hide **empty** workspaces
- **_[NEW!]_** **Rename workspaces** directly from the extension _(switch workspace to apply new name)_


[<img src="https://github.com/Favo02/workspaces-by-open-apps/assets/59796435/83ff712a-ff47-4592-8cec-c2c34bb8552a" alt="Preview" height="50">](https://extensions.gnome.org/extension/5967/workspaces-indicator-by-open-apps/)

[<img src="https://github.com/Favo02/workspaces-by-open-apps/assets/59796435/d838baf9-1f70-45d0-a8ba-26975823ab95" alt="Preview" height="50">](https://extensions.gnome.org/extension/5967/workspaces-indicator-by-open-apps/)

[<img src="https://github.com/Favo02/workspaces-by-open-apps/assets/59796435/f022ed21-d150-4871-817c-c604f3c28921" alt="Preview" height="47">](https://extensions.gnome.org/extension/5967/workspaces-indicator-by-open-apps/)

[<img src="https://github.com/Favo02/workspaces-by-open-apps/assets/59796435/71453236-581f-4580-81b3-4f461db508e2" alt="Preview" height="47">](https://extensions.gnome.org/extension/5967/workspaces-indicator-by-open-apps/)

## Deploy

Available for GNOME 44: [gnome shell extensions store](https://extensions.gnome.org/extension/5967/workspaces-indicator-by-open-apps/)

[<img src="https://raw.githubusercontent.com/andyholmes/gnome-shell-extensions-badge/master/get-it-on-ego.svg?sanitize=true" alt="Get it on GNOME Extensions" height="80">](https://extensions.gnome.org/extension/5967/workspaces-indicator-by-open-apps/)


### Alternative install

- Download this folder
- Execute `./deploy.sh` (requires sudo priviledges).


## TODO

- Apply settings without closing settings window ([#14][i14])
- Display workspace new name without switching workspace ([#26][i26])

[i14]: https://github.com/Favo02/workspaces-by-open-apps/issues/14
[i26]: https://github.com/Favo02/workspaces-by-open-apps/issues/26

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

Due to the poor (really poor) documentation to develop any gnome shell extension I used snippets of already existing extension (often deprecated and not working anymore) and merged them to create what I was looking for.

- BaBar taskbar _(and various other fthx extensions)_ (https://github.com/fthx/babar)
- TaskIcons (https://github.com/rliang/gnome-shell-extension-task-icons)
- Improved workspace indicator (https://github.com/MichaelAquilina/improved-workspace-indicator)
- New workspaces shortcut (https://github.com/barnscott/newworkspaceshortcut-barnix.io)
- AppIndicator Support (https://github.com/ubuntu/gnome-shell-extension-appindicator)
- Top Panel Workspace Scroll (https://github.com/timbertson/gnome-shell-scroll-workspaces)
