const { St, Shell } = imports.gi
const { main } = imports.ui

// position in left panel to insert workspace indicator
const position = 0

// initialize extension
function init() {
  return new WorkspaceIndicator()
}

// extension workspace indicator
class WorkspaceIndicator {
  constructor() {}

  enable() {
    this._buttons = []
    
    this.connectSignals() // signals that triggers refresh()
    this.refresh() // initialize indicator
  }
  
  disable() {
    this._buttons.splice(0).forEach(b => b.destroy())
    this._buttons = []

    this.disconnectSignals()
  }

  connectSignals() {
    // signals for global.workspace_manager
    this._workspaceNumberChangedSIGNAL = global.workspace_manager.connect(
      "notify::n-workspaces", // add/remove workspace
      this.refresh.bind(this)
    )
    this._workspaceSwitchedSIGNAL = global.workspace_manager.connect(
      "workspace-switched", // change active workspace
      this.refresh.bind(this)
    )
    this._workspaceReorderedSIGNAL = global.workspace_manager.connect(
      "workspaces-reordered", // reorder workspaces
      this.refresh.bind(this)
    )

    // signals for Shell.WindowTracker.get_default()
    this._windowsChangedSIGNAL = Shell.WindowTracker.get_default().connect(
      "tracked-windows-changed",
      this.refresh.bind(this)
    )

    // signals for global.display
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
  }

  disconnectSignals() {
    global.workspace_manager.disconnect(this._workspaceNumberChangedSIGNAL)
    global.workspace_manager.disconnect(this._workspaceSwitchedSIGNAL)
    global.workspace_manager.disconnect(this._workspaceReorderedSIGNAL)

    Shell.WindowTracker.get_default().disconnect(this._windowsChangedSIGNAL)

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
      style_class: isActive ? 'active-workspace' : 'single-workspace',
      reactive:    true,
      can_focus:   true,
      track_hover: true,
      child:       new St.BoxLayout()
    })
    this._buttons.push(button)

    // switch to workspace on click
    button.connect('button-press-event', () => workspace.activate(global.get_current_time()))

    // create apps icons
    this.create_indicator_icons(button, windows)
    this.create_indicator_label(button, index)

    // add to panel
    main.panel["_leftBox"].insert_child_at_index(button, position + index)
  }

  create_indicator_icons(button, windows) {
    windows
      .sort((w1, w2) => w1.get_id() - w2.get_id()) // sort by ids
      .forEach(win => {
        // convert from Meta.window to Shell.app
        const app = Shell.WindowTracker.get_default().get_window_app(win)

        // create Clutter.actor
        const texture = app.create_icon_texture(20)

        // set low opacity for not focused apps
        if (!win.has_focus()) {
          texture.set_opacity(150)
        }

        // create container (with texture as child)
        const icon = new St.Bin({style_class: win.has_focus() ? 'app-icon-active' : 'app-icon', child: texture})

        // add app Icon to buttons
        button.get_child().add_child(icon)
      })
  }

  create_indicator_label(button, index) {
    const txt = (index + 1).toString()
    button.get_child().insert_child_at_index(new St.Label({text: txt, style_class: 'workspace-text'}), 0)
  }

}
