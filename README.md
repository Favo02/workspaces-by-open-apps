# Workspace indicator by open apps

**GNOME shell estension** to display a simple **workspace indicator** showing **icons of apps open** in it instead of classic numbers or dots.


## Deploy:

Not currently available on [GNOME extensions](https://extensions.gnome.org/).

To install execute the `./deploy.sh` script (requires sudo priviledges).


## TODO:

- Drag and drop support to move applications between workspaces
- Highlight focues app in workspace with more than one app
- Add settings to customize various settings:
  - position to insert indicator
  - color of active indicator
  - show/hide workspace index text
- CI/CD (github actions): 
  - Linting ([Eslint](https://eslint.org))
  - Versioning ([GitVersion](https://gitversion.net))

## Contributions:

Any contribution is welcome!

Submit any bug or feature request through an **issue**, or submit your code creating a **pull request**. 


## Commit, Branch and Pull request convention:

### **Commit**:

Commit message convention: `<type>(<scope>): <summary>`

Type: `build`, `feat`, `fix`, `refactor`, `docs`\
Scope: `extension`, `prefs`, `schemas`, `css`\
Summary: short summary in present tense, not capitalized, no period at the end

Example: `feat(extension): add drag and drop`

### **Branch**:
Create a new branch for new features. Branch name should be self explanatory.\
*It is possible to not to create the new branch for single-commit fixes or small modifications.*

Example: `add-drag-and-drop`

### **Pull request**:
When the feature is ready and stable create a new pull request.


## Credits:

Due to the poor (really poor) documentation to develop any gnome shell extension I used snippets of already existing extension (all deprecated and not working anymore) and merged them to create what I was looking for.

- BaBar taskbar _(and various other fthx extensions)_ (https://github.com/fthx/babar)
- TaskIcons (https://github.com/rliang/gnome-shell-extension-task-icons)
- Improved workspace indicator (https://github.com/MichaelAquilina/improved-workspace-indicator)
