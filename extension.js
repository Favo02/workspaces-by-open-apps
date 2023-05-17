const { Clutter, St, Shell, Gio } = imports.gi
const { main, dnd } = imports.ui

// initialize extension
function init() {
  return new WorkspaceIndicator()
}

// extension workspace indicator
class WorkspaceIndicator {
  constructor() {}

  enable() {
    this._settings = imports.misc.extensionUtils.getSettings("org.gnome.shell.extensions.workspaces-indicator-by-open-apps")

    this._workspacesIndicators = []
    this._hasOtherMonitor = false
    
    this.connectSignals() // signals that triggers refresh()
    this.refresh() // initialize indicator
  }
  
  disable() {
    this._settings = {}

    this._workspacesIndicators.splice(0).forEach(i => i.destroy())
    this._workspacesIndicators = []
    this._hasOtherMonitor = null

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
    this._workspacesIndicators.splice(0).forEach(i => i.destroy())

    // check if apps on all workspaces (other monitor)
    const windows = global.workspace_manager
      .get_workspace_by_index(0)
      .list_windows()
      .filter(w => w.is_on_all_workspaces())

    if (windows && windows.length > 0) {
      this._hasOtherMonitor = true
      this.create_indicator_button(0, true)
    }

    for (let i = 0; i < global.workspace_manager.get_n_workspaces(); i++) {
      this.create_indicator_button(i, false)
    }
  }

  create_indicator_button(index, isOtherMonitor) {
    const workspace = global.workspace_manager.get_workspace_by_index(index)
    const windows = workspace
      .list_windows()
      .filter(w => isOtherMonitor ? w.is_on_all_workspaces() : !w.is_on_all_workspaces())
    
    const isActive = !isOtherMonitor && global.workspace_manager.get_active_workspace_index() == index
    const showActiveWorkspaceIndicator = this._settings.get_boolean('show-active-workspace-indicator')
    const roundIndicatorsBorder = this._settings.get_boolean('round-indicators-border')

    let styles = 'workspace'
    if (isActive) { styles += ' active' }
    if (!showActiveWorkspaceIndicator) { styles += ' no-indicator' }
    if (!roundIndicatorsBorder) { styles += ' no-rounded' }

    const indicatorsColor = this._settings.get_string('indicators-color')

    const workspaceIndicator = new St.Bin({
      style_class: styles,
      style: `border-color: ${indicatorsColor}`,
      reactive:    true,
      can_focus:   true,
      track_hover: true,
      child:       new St.BoxLayout()
    })
    this._workspacesIndicators.push(workspaceIndicator)
    
    // drag and drop
    workspaceIndicator._delegate = workspaceIndicator

    workspaceIndicator._workspaceIndex = index
    
    workspaceIndicator.acceptDrop = function (source) {
      if (source._workspaceIndex !== this._workspaceIndex) {
        source._window.change_workspace_by_index(this._workspaceIndex, false)
        source._window.activate(global.get_current_time())
        return true
      }
      return false
    } 

    // switch to workspace on click
    workspaceIndicator.connect('button-release-event', () => workspace.activate(global.get_current_time()))

    // assign to "this" settings otherwise function triggered on connect can't access them
    workspaceIndicator.scrollWrap = this._settings.get_boolean('scroll-wraparound')
    workspaceIndicator.inverseScroll = this._settings.get_boolean('inverse-scroll')
    // scroll workspaces on mousewhell scroll
    workspaceIndicator.connect('scroll-event', this.scrollWorkspace.bind(workspaceIndicator))

    // create apps icons
    this.create_indicator_icons(workspaceIndicator, windows, index)

    const showWorkspaceIndex = this._settings.get_boolean('show-workspace-index')
    if (showWorkspaceIndex || isOtherMonitor) {
      this.create_indicator_label(
        workspaceIndicator,
        index,
        isOtherMonitor ? this._settings.get_string('apps-on-all-workspaces-indicator') : null
      )
    }

    // add to panel
    let box
    switch (this._settings.get_enum('panel-position')) {
      case 0:
        box = '_leftBox'
        break
      case 1:
        box = '_centerBox'
        break
      case 2:
        box = '_rightBox'
        break
    }

    const position = this._settings.get_int('position')

    // index to insert indicator in panel
    const insertIndex = isOtherMonitor ? 0 : position + index + (this._hasOtherMonitor ? 1 : 0)
    main.panel[box].insert_child_at_index(workspaceIndicator, insertIndex)
  }

  create_indicator_icons(button, windows, index) {
    windows
      .sort((w1, w2) => w1.get_id() - w2.get_id()) // sort by ids
      .forEach(win => {
        // convert from Meta.window to Shell.app
        const app = Shell.WindowTracker.get_default().get_window_app(win)

        if (!app || !win) {
          return
        }

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

        const indicatorsColor = this._settings.get_string('indicators-color')

        const icon = new St.Bin({
          style_class: styles,
          style: `border-color: ${indicatorsColor}`,
          reactive:    true,
          can_focus:   true,
          track_hover: true,
          child: texture
        })

        // focus application on click
        icon.connect('button-release-event', () => win.activate(global.get_current_time()))

        // drag and drop
        icon._workspaceIndex = index
        icon._window = win

        icon._delegate = icon
        icon._draggable = dnd.makeDraggable(icon, {
          dragActorOpacity: 150
        })

        // add app Icon to buttons
        button.get_child().add_child(icon)
      })
  }

  create_indicator_label(button, index, otherMonitorText) {
    const txt = otherMonitorText ?? (index + 1).toString()
    button.get_child().insert_child_at_index(new St.Label({
      text: txt,
      style_class: 'text'
    }), 0)
  }

  scrollWorkspace(actor, event) {
    let scroll_direction = event.get_scroll_direction()
    let direction = 0

		switch (scroll_direction) {
      case Clutter.ScrollDirection.LEFT:
      case Clutter.ScrollDirection.UP:
        direction = this.inverseScroll ? -1 : 1
        break
      case Clutter.ScrollDirection.RIGHT:
      case Clutter.ScrollDirection.DOWN:
        direction = this.inverseScroll ? 1 : -1
        break
      default:
        return Clutter.EVENT_PROPAGATE
    }

    const workspaceManager = global.workspace_manager

    let newIndex = workspaceManager.get_active_workspace_index() + direction

    // wrap
    const wrap = this.scrollWrap
    if (wrap) newIndex = mod(newIndex, workspaceManager.n_workspaces)

    if (newIndex >= 0 && newIndex < workspaceManager.n_workspaces) {
      workspaceManager.get_workspace_by_index(newIndex).activate(global.get_current_time())
    }

    // modulo working for negative numbers
    function mod(n, m) {
      return ((n % m) + m) % m;
    }
  }

}
