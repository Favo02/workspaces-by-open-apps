# Workspace indicator by open apps

**GNOME shell estension** to display a simple **workspace indicator** showing **icons of apps open** in it instead of classic numbers or dots.

<img src="https://extensions.gnome.org/extension-data/screenshots/screenshot_5967.png" alt="Preview" height="50">


## Deploy:

Available for GNOME 44: [gnome shell extensions store](https://extensions.gnome.org/extension/5967/workspaces-indicator-by-open-apps/)

[<img src="https://raw.githubusercontent.com/andyholmes/gnome-shell-extensions-badge/master/get-it-on-ego.svg?sanitize=true" alt="Get it on GNOME Extensions" height="80">](https://extensions.gnome.org/extension/5967/workspaces-indicator-by-open-apps/)


### Alternative install:

- Download this folder
- Execute `./deploy.sh` (requires sudo priviledges).


## TODO:

- Drag and drop support to move applications between workspaces ([#10][i10])
- Add support for multiple monitors ([#9][i9])
- Click on application focuses that application ([#11][i11])
- CI/CD (github actions): 
  - Linting ([Eslint](https://eslint.org))
  - Versioning ([GitVersion](https://gitversion.net))

[i9]: https://github.com/Favo02/workspaces-by-open-apps/issues/9
[i10]: https://github.com/Favo02/workspaces-by-open-apps/issues/10
[i11]: https://github.com/Favo02/workspaces-by-open-apps/issues/11

## Contributions:

Any contribution is welcome!

Submit any bug or feature request through an **issue**, or submit your code creating a **pull request**. 


## Commit, Branch and Pull request convention:

### **Commit**:

Commit message convention: `<type>(<scope>): <summary>`

Type: `build`, `feat`, `fix`, `refactor`, `docs`\
Scope: `extension`, `settings`, `css`\
Summary: short summary in present tense, not capitalized, no period at the end

Example: `feat(extension): add drag and drop`

### **Branch**:
Create a new branch for new features. Branch name should be self explanatory.\
*It is possible to not to create the new branch for single-commit fixes or small modifications.*

Example: `add-drag-and-drop`

### **Pull request**:
When the feature is ready and stable create a new pull request.


## Credits:

Due to the poor (really poor) documentation to develop any gnome shell extension I used snippets of already existing extension (often deprecated and not working anymore) and merged them to create what I was looking for.

- BaBar taskbar _(and various other fthx extensions)_ (https://github.com/fthx/babar)
- TaskIcons (https://github.com/rliang/gnome-shell-extension-task-icons)
- Improved workspace indicator (https://github.com/MichaelAquilina/improved-workspace-indicator)
- New workspaces shortcut (https://github.com/barnscott/newworkspaceshortcut-barnix.io)
- AppIndicator Support (https://github.com/ubuntu/gnome-shell-extension-appindicator)
