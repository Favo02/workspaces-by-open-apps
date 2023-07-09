const { Clutter, St, Shell, Gio, Meta } = imports.gi
const { main, dnd } = imports.ui

// initialize extension
function init() {
  return new WorkspaceIndicator()
}

// extension workspace indicator
class WorkspaceIndicator {
  constructor() {}

  /**
   * enable extension: intialize variables, connectSignals() and refresh()
   */
  enable() {
    this._settings = imports.misc.extensionUtils.getSettings("org.gnome.shell.extensions.workspaces-indicator-by-open-apps")

    this._workspacesIndicators = []
    this._hasOtherMonitor = false
    
    this.connect_signals() // signals that triggers refresh()
    this.refresh() // initialize indicator
  }
  
  /**
   * disable extension: destroy variables, disconnectSignals()
   */
  disable() {
    this._settings = {}

    this._workspacesIndicators.splice(0).forEach(i => i.destroy())
    this._workspacesIndicators = []
    this._hasOtherMonitor = null

    this.disconnect_signals()
  }

  /**
   * connect signals to refresh indicators
   */
  connect_signals() {
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

  /**
   * disconnect signals
   */
  disconnect_signals() {
    global.workspace_manager.disconnect(this._workspaceNumberChangedSIGNAL)
    global.workspace_manager.disconnect(this._workspaceSwitchedSIGNAL)
    global.workspace_manager.disconnect(this._workspaceReorderedSIGNAL)

    Shell.WindowTracker.get_default().disconnect(this._windowsChangedSIGNAL)

    global.display.disconnect(this._windowsRestackedSIGNAL)
    global.display.disconnect(this._windowLeftMonitorSIGNAL)
    global.display.disconnect(this._windowEnteredMonitorSIGNAL)
  }

  /**
   * refresh indicators: destroy and rebuild
   */
  refresh() {
    this._workspacesIndicators.splice(0).forEach(i => i.destroy())

    // check if apps on all workspaces (other monitor)
    const windows = global.workspace_manager
      .get_workspace_by_index(0)
      .list_windows()
      .filter(w => w.is_on_all_workspaces())

    // build indicator for other monitor
    if (windows && windows.length > 0) {
      this._hasOtherMonitor = true
      this.create_indicator_button(0, true)
    }

    // build normal workspaces indicators
    for (let i = 0; i < global.workspace_manager.get_n_workspaces(); i++) {
      this.create_indicator_button(i, false)
    }
  }

  // create indicator for a signle workspace
  /**
   * create indicator for a single workspace
   * @param {number} index index of workspace 
   * @param {boolean} isOtherMonitor special indicator for other monitor 
   * @returns 
   */
  create_indicator_button(index, isOtherMonitor) {
    const workspace = global.workspace_manager.get_workspace_by_index(index)
    const windows = workspace
      .list_windows()
      .filter(w => isOtherMonitor ? w.is_on_all_workspaces() : !w.is_on_all_workspaces())
    
    const isActive = !isOtherMonitor && global.workspace_manager.get_active_workspace_index() == index

    // hide empty workspaces
    const hideEmptyWorkspaces = this._settings.get_boolean('hide-empty-workspaces')
    if (hideEmptyWorkspaces && !isActive && windows.length === 0) return

    // indicator settings
    const showActiveWorkspaceIndicator = this._settings.get_boolean('show-active-workspace-indicator')
    const roundIndicatorsBorder = this._settings.get_boolean('round-indicators-border')

    // indicator styles
    let style_classes = 'workspace'
    if (isActive) { style_classes += ' active' }
    if (!showActiveWorkspaceIndicator) { style_classes += ' no-indicator' }
    if (!roundIndicatorsBorder) { style_classes += ' no-rounded' }

    const indicatorsColor = this._settings.get_string('indicators-color')
    const style = `border-color: ${indicatorsColor}`

    // create indicator
    const workspaceIndicator = new St.Bin({
      style_class: style_classes,
      style: style,
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
    workspaceIndicator._workspace = workspace
    workspaceIndicator.connect('button-release-event', this.on_click_workspace.bind(workspaceIndicator))

    // assign to "this" settings otherwise function triggered on connect can't access them
    workspaceIndicator.scrollWrap = this._settings.get_boolean('scroll-wraparound')
    workspaceIndicator.inverseScroll = this._settings.get_boolean('inverse-scroll')

    // scroll workspaces on mousewhell scroll
    workspaceIndicator.connect('scroll-event', this.on_scroll_workspace.bind(workspaceIndicator))

    // create apps icons
    this.create_indicator_icons(workspaceIndicator, windows, index)

    // create indicator label
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

  /**
   * create icons of running applications inside a workspace indicator
   * @param button indicator to add childs (icons)
   * @param windows windows to create icons of 
   * @param {number} index index of workspace 
   */
  create_indicator_icons(button, windows, index) {
    windows
      .sort((w1, w2) => w1.get_id() - w2.get_id()) // sort by id
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

        // desaturate icon setting
        const desaturateApps = this._settings.get_boolean('desaturate-apps')
        if (desaturateApps) {
          texture.add_effect(new Clutter.DesaturateEffect())
        }

        // styles
        const showFocusedAppIndicator = this._settings.get_boolean('show-focused-app-indicator')
        const roundIndicatorsBorder = this._settings.get_boolean('round-indicators-border')

        let style_classes = 'app'
        if (win.has_focus()) { style_classes += ' active' }
        if (!showFocusedAppIndicator) { style_classes += ' no-indicator' }
        if (!roundIndicatorsBorder) { style_classes += ' no-rounded' }

        const indicatorsColor = this._settings.get_string('indicators-color')
        const style = `border-color: ${indicatorsColor}`

        const icon = new St.Bin({
          style_class: style_classes,
          style: style,
          reactive:    true,
          can_focus:   true,
          track_hover: true,
          child: texture
        })

        // focus application on click
        icon.middleClosesApp = this._settings.get_boolean('middle-click-close-app')
        icon.connect('button-release-event', this.on_click_application.bind(icon))

        // drag and drop
        icon._workspaceIndex = index
        icon._window = win

        icon._delegate = icon
        icon._draggable = dnd.makeDraggable(icon, {
          dragActorOpacity: 150
        })

        // add app icon to buttons
        button.get_child().add_child(icon)
      })
  }

  /**
   * create label for a workspace indicator
   * @param button indicator to add label 
   * @param {number} index index of workspace 
   * @param {string} otherMonitorText custom other workspace text to display 
   */
  create_indicator_label(button, index, otherMonitorText) {
    // text to display
    let indicatorText

    // other monitor custom text
    if (otherMonitorText) {
      indicatorText = otherMonitorText
    }
    else {
      // custom workspace name
      const customName = Meta.prefs_get_workspace_name(index)

      // if custom name != default
      if (customName !== `Workspace ${index+1}`) {
        indicatorText = customName
      }
      // default text: index
      else {
        indicatorText = (index+1).toString()
      }
    }

    // add label to indicator
    button.get_child().insert_child_at_index(new St.Label({
      text: indicatorText,
      style_class: 'text'
    }), 0)
  }

  /**
   * click on workspace handler
   * @param actor actor clicked
   * @param event click event 
   */
  on_click_workspace(actor, event) {
    // left click: focus workspace
    if (event.get_button() == 1) {
      this._workspace.activate(global.get_current_time())
    }

    // middle click: do nothing

    // right click: rename workspace
    if (event.get_button() == 1) {
      // TODO: rename workspace
    }
  }

  /**
   * click on application icon handler
   * @param actor actor clicked
   * @param event click event 
   */
  on_click_application(actor, event) {
    // left/right click: focus application
    if (event.get_button() == 1 || event.get_button() == 3) {
      this._window.activate(global.get_current_time())
    }

    // middle click: close application
    if (this.middleClosesApp && event.get_button() == 2) {
      this._window.delete(global.get_current_time())
    }
  }

  /**
   * scroll on workspace indicator handler
   * @param actor actor scrolled on 
   * @param event click event 
   * @returns 
   */
  on_scroll_workspace(actor, event) {
    // scroll direction
    let scroll_direction = event.get_scroll_direction()

    // convert 2D direction to left/right
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

    // activate adjacent workspace on scroll
    const workspaceManager = global.workspace_manager
    let newIndex = workspaceManager.get_active_workspace_index() + direction

    // wrap
    const wrap = this.scrollWrap
    if (wrap) newIndex = mod(newIndex, workspaceManager.n_workspaces)

    if (newIndex >= 0 && newIndex < workspaceManager.n_workspaces) {
      workspaceManager.get_workspace_by_index(newIndex).activate(global.get_current_time())
    }

    // modulo operator working for negative numbers
    function mod(n, m) {
      return ((n % m) + m) % m;
    }
  }

}
