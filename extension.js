const { Clutter, GObject, St, Shell } = imports.gi

const Main = imports.ui.main
const PanelMenu = imports.ui.panelMenu

const workspaceManager = global.workspace_manager
const windowTracker = Shell.WindowTracker.get_default()
const display = global.display

// initialize extension
function init() {
  return new WorkspaceIndicator()
}

// extension workspace indicator
class WorkspaceIndicator {
  constructor() {}

  // enable extension
  enable() {
    this.workspaceIndicators = []
    this.panelContainer = null
    this.containerLayout = null

    // initialize panel container
    this.addPanelContainer()
  }

  // disable extension
  disable() {
    this.destroyWorkspaceIndicators()
    this.destroyPanelContainer()

    // disconnect signals
    workspaceManager.disconnect(this._workspaceNumberChangedSIGNAL)
    workspaceManager.disconnect(this._workspaceSwitchedSIGNAL)
    workspaceManager.disconnect(this._workspaceReorderedSIGNAL)

    windowTracker.disconnect(this._windowsChangedSIGNAL)
    display.disconnect(this._windowsRestackedSIGNAL)
  }

  // add workspace indicator (container of single workspace indicators) to panel
  addPanelContainer() {
    // remove current container
    this.destroyPanelContainer()

    this.panelContainer = new PanelMenu.Button(0, "workspace-indicator-by-open-apps")
    this.containerLayout = new St.BoxLayout({style_class: "container"})
    this.panelContainer.add_actor(this.containerLayout)

    // add container to panel
    Main.panel.addToStatusArea(
      "workspace-indicator-by-open-apps",
      this.panelContainer,
      0,
      "left"
    )

    // connect signals workspace: trigger addWorkspaceIndicators()
    this._workspaceNumberChangedSIGNAL = workspaceManager.connect(
      "notify::n-workspaces", // add/remove workspace
      this.addWorkspaceIndicators.bind(this)
    )
    this._workspaceSwitchedSIGNAL = workspaceManager.connect(
      "workspace-switched", // change active workspace
      this.addWorkspaceIndicators.bind(this)
    )
    this._workspaceReorderedSIGNAL = workspaceManager.connect(
      "workspaces-reordered", // reorder workspaces
      this.addWorkspaceIndicators.bind(this)
    )


    // connect signals window: trigger addWorkspaceIndicators()
    this._windowsChangedSIGNAL = windowTracker.connect(
      "tracked-windows-changed",
      this.addWorkspaceIndicators.bind(this)
    )
    this._windowsRestackedSIGNAL = display.connect(
      "restacked",
      this.addWorkspaceIndicators.bind(this)
    )

    // add workspace indicators to container
    this.addWorkspaceIndicators()
  }

  // add a single workspace indicator for every workspace to containerLayout
  addWorkspaceIndicators() {
    // remove current indicators
    this.destroyWorkspaceIndicators()

    // generate indicator for each workspace
    for (let i = 0; i < workspaceManager.get_n_workspaces(); i++) {
      const workspace = workspaceManager.get_workspace_by_index(i)

      const isActive = i == workspaceManager.get_active_workspace_index()

      const indicator = new SingleWorkspaceIndicator(workspace, isActive)

      this.containerLayout.add_actor(indicator)
      this.workspaceIndicators.push(indicator)
    }
  }

  // remove panel container
  destroyPanelContainer() {
    this.destroyWorkspaceIndicators()

    if (this.containerLayout !== null) this.containerLayout.destroy()
    if (this.panelContainer !== null) this.panelContainer.destroy()

    this.containerLayout = null
    this.panelContainer = null
  }

  // remove workspace indicators
  destroyWorkspaceIndicators() {
    for (let i = 0; i < this.workspaceIndicators.length; i++) {
      this.workspaceIndicators[i].destroy()
    }
    this.workspaceIndicators = []
  }
}

// single workspace indicator
const SingleWorkspaceIndicator = GObject.registerClass(
  class SingleWorkspaceIndicator extends St.Button {

    // initialize single indicator
    _init(workspace, active) {
      super._init()

      this.active = active
      this.workspace = workspace
      this.layout = new St.BoxLayout({style_class: "single-workspace"})

      this.addIcons()

      this.add_actor(this.layout)

      this.connect("clicked", () =>
        this.workspace.activate(global.get_current_time())
      )

      
    }

    // add icons of apps in this workspace to this.layout
    addIcons() {

      // get all running apps
      const runningApps = Shell.AppSystem.get_default().get_running()

      // add icons of apps running in this workspace to this.layout
      for (let i = 0; i < runningApps.length; i++) {
        const app = runningApps[i]

        if (app.is_on_workspace(this.workspace)) {
          const icon = app.get_icon()

          this._appIcon = new St.Icon({
            y_align: Clutter.ActorAlign.CENTER,
            style_class: "app-icon"
          })
          this._appIcon.set_gicon(icon)
    
          this.layout.add_child(this._appIcon)
        } 
      }

      // add active class if current focused workspace
      if (this.active) {
        this.layout.add_style_class_name("active-workspace")
      }
    }

    // remove single workspace indicator
    destroy() {
      this.layout.destroy()
      super.destroy()
    }
  }
)
