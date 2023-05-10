const { St, Shell, Gio } = imports.gi
const { main } = imports.ui
const Me = imports.misc.extensionUtils.getCurrentExtension()

// initialize extension
function init() {
  return new WorkspaceIndicator()
}

// extension workspace indicator
class WorkspaceIndicator {
  constructor() {}

  enable() {
    this._settings = this.getSettings()

    this._workspacesIndicators = []
    
    this.connectSignals() // signals that triggers refresh()
    this.refresh() // initialize indicator
  }
  
  disable() {
    this._settings = {}

    this._workspacesIndicators.splice(0).forEach(i => i.destroy())
    this._workspacesIndicators = []

    this.disconnectSignals()
  }

  getSettings() {
    let GioSSS = Gio.SettingsSchemaSource
    let schemaSource = GioSSS.new_from_directory(
      Me.dir.get_child("schemas").get_path(),
      GioSSS.get_default(),
      false
    )
    let schemaObj = schemaSource.lookup('org.gnome.shell.extensions.workspaces-indicator-by-open-apps', true)
    if (!schemaObj) {
      throw new Error('cannot find schemas')
    }
    return new Gio.Settings({ settings_schema : schemaObj })
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
    this._workspacesIndicators.splice(0).forEach(i => i.destroy())

    for (let i = 0; i < global.workspace_manager.get_n_workspaces(); i++) {
      this.create_indicator_button(i)
    }
  }

  create_indicator_button(index) {
    const workspace = global.workspace_manager.get_workspace_by_index(index)
    const windows = workspace.list_windows()
    
    const isActive = global.workspace_manager.get_active_workspace_index() == index
    const showActiveWorkspaceIndicator = this._settings.get_boolean('show-active-workspace-indicator')
    const roundIndicatorsBorder = this._settings.get_boolean('round-indicators-border')

    let styles = 'workspace'
    if (isActive) { styles += ' active' }
    if (!showActiveWorkspaceIndicator) { styles += ' no-indicator' }
    if (!roundIndicatorsBorder) { styles += ' no-rounded' }

    const workspaceIndicator = new St.Bin({
      style_class: styles,
      reactive:    true,
      can_focus:   true,
      track_hover: true,
      child:       new St.BoxLayout()
    })
    this._workspacesIndicators.push(workspaceIndicator)

    // switch to workspace on click
    workspaceIndicator.connect('button-press-event', () => workspace.activate(global.get_current_time()))

    // create apps icons
    this.create_indicator_icons(workspaceIndicator, windows)
    this.create_indicator_label(workspaceIndicator, index)

    // add to panel
    let box
    switch (this._settings.get_enum('panel-position')) {
      case 0:
        box = '_leftBox'
        break;
      case 1:
        box = '_centerBox'
        break;
      case 2:
        box = '_rightBox'
        break;
    }

    const position = this._settings.get_int('position')

    main.panel[box].insert_child_at_index(workspaceIndicator, position + index)
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
        const reduceInactiveAppsOpacity = this._settings.get_boolean('reduce-inactive-apps-opacity')
        if (!win.has_focus() && reduceInactiveAppsOpacity) {
          texture.set_opacity(150)
        }

        // create container (with texture as child)
        const showFocusedAppIndicator = this._settings.get_boolean('show-focused-app-indicator')
        const roundIndicatorsBorder = this._settings.get_boolean('round-indicators-border')

        let styles = 'app'
        if (win.has_focus()) { styles += ' active' }
        if (!showFocusedAppIndicator) { styles += ' no-indicator' }
        if (!roundIndicatorsBorder) { styles += ' no-rounded' }

        const icon = new St.Bin({
          style_class: styles,
          child: texture
        })

        // add app Icon to buttons
        button.get_child().add_child(icon)
      })
  }

  create_indicator_label(button, index) {
    const txt = (index + 1).toString()
    button.get_child().insert_child_at_index(new St.Label({
      text: txt,
      style_class: 'text'
    }), 0)
  }

}
