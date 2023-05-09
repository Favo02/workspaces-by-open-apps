const St = imports.gi.St
const Shell = imports.gi.Shell
const Main = imports.ui.main

// initialize extension
function init() {
  return new WorkspaceIndicator()
}

const workspaceManager = global.workspace_manager
const windowTracker = Shell.WindowTracker.get_default()

// extension workspace indicator
class WorkspaceIndicator {
  constructor() {
    this._buttons = []
    this._workspaceNumberChangedSIGNAL
    this._workspaceSwitchedSIGNAL 
    this._workspaceReorderedSIGNAL
    this._windowsChangedSIGNAL
    this._windowsRestackedSIGNAL
    this._windowLeftMonitorSIGNAL
    this._windowEnteredMonitorSIGNAL
  }

  enable() {
    // connect signals: trigger refresh()
    
    // workspace manager: global.workspace_manager
    this._workspaceNumberChangedSIGNAL = workspaceManager.connect(
      "notify::n-workspaces", // add/remove workspace
      this.refresh.bind(this)
    )
    this._workspaceSwitchedSIGNAL = workspaceManager.connect(
      "workspace-switched", // change active workspace
      this.refresh.bind(this)
    )
    this._workspaceReorderedSIGNAL = workspaceManager.connect(
      "workspaces-reordered", // reorder workspaces
      this.refresh.bind(this)
    )

    // window tracker: Shell.WindowTracker.get_default()
    this._windowsChangedSIGNAL = windowTracker.connect(
      "tracked-windows-changed",
      this.refresh.bind(this)
    )

    // display: global.display
    this._windowsRestackedSIGNAL = global.display.connect(
      "restacked",
      this.refresh.bind(this)
    )
    this._windowLeftMonitorSIGNAL = global.display.connect(
      "window-left-monitor",
      this.refresh.bind(this)
    )
    this._windowEnteredMonitorSIGNAL = global.display.connect(
      "window-entered-monitor",
      this.refresh.bind(this)
    )

    this.refresh()
  }
  
  disable() {
    this._buttons.splice(0).forEach(b => b.destroy())

    workspaceManager.disconnect(this._workspaceNumberChangedSIGNAL)
    workspaceManager.disconnect(this._workspaceSwitchedSIGNAL)
    workspaceManager.disconnect(this._workspaceReorderedSIGNAL)

    windowTracker.disconnect(this._windowsChangedSIGNAL)

    global.display.disconnect(this._windowsRestackedSIGNAL)
    global.display.disconnect(this._windowLeftMonitorSIGNAL)
    global.display.disconnect(this._windowEnteredMonitorSIGNAL)
  }

  refresh() {
    this._buttons.splice(0).forEach(b => b.destroy())
    for (let i = 0; i < global.workspace_manager.get_n_workspaces(); i++) {
      this.create_indicator_button(i)
    }
  }

  create_indicator_button(index) {
    const isActive = global.workspace_manager.get_active_workspace_index() == index
    const workspace = global.workspace_manager.get_workspace_by_index(index)
    const windows = workspace.list_windows()
    
    const button = new St.Bin({
      style_class: 'single-workspace',
      reactive:    true,
      can_focus:   true,
      track_hover: true,
      child:       new St.BoxLayout({style_class : ''})
    })
    this._buttons.push(button)

    // switch to workspace on click
    button.connect('button-press-event', () => workspace.activate(global.get_current_time()))

    // create apps icons
    this.create_indicator_icons(button, windows)
    this.create_indicator_label(button, index)

    // add to panel
    Main.panel["_leftBox"].insert_child_at_index(button, index)
  }

  create_indicator_icons(button, windows) {
    global.display.sort_windows_by_stacking(windows)
      .map(win => Shell.WindowTracker.get_default().get_window_app(win))
      .map(app => app.create_icon_texture(16))
      .map(tex => new St.Bin({style_class: 'app-icon', style: '', child: tex}))
      .forEach(ico => button.get_child().add_child(ico))
  }

  create_indicator_label(button, index) {
    const txt = (index + 1).toString()
    button.get_child().insert_child_at_index(new St.Label({text: txt}), 0)
  }

}
