const { Clutter, St, Shell, Meta } = imports.gi
const { main, dnd } = imports.ui

// initialize extension
function init() {
  return new Extension()
}

// extension workspace indicator
class Extension {
  constructor() {}

  /** enable extension: initialize everything */
  enable() {
    // parse settings
    this._settings = this.parse_settings(imports.misc.extensionUtils.getSettings("org.gnome.shell.extensions.workspaces-indicator-by-open-apps"))

    this._indicators = [] // each indicator is a workspace
    
    this.connect_signals() // signals that triggers render
    this.render() // initialize indicator
  }
  
  /** disable extension: destroy everything */
  disable() {
    this._settings = {}

    this._indicators.splice(0).forEach(i => i.destroy()) // destroy current indicators

    this.disconnect_signals() // disconnect signals
  }

  parse_settings(raw_settings) {
    return {
      panel_position: raw_settings.get_enum("panel-position"),
      position: raw_settings.get_int("position"),
      icons_limit: raw_settings.get_int("icons-limit"),
      show_focused_app_indicator: raw_settings.get_boolean("show-focused-app-indicator"),
      show_active_workspace_indicator: raw_settings.get_boolean("show-active-workspace-indicator"),
      reduce_inactive_apps_opacity: raw_settings.get_boolean("reduce-inactive-apps-opacity"),
      round_indicators_border: raw_settings.get_boolean("round-indicators-border"),
      show_workspace_index: raw_settings.get_boolean("show-workspace-index"),
      scroll_wraparound: raw_settings.get_boolean("scroll-wraparound"),
      inverse_scroll: raw_settings.get_boolean("inverse-scroll"),
      middle_click_close_app: raw_settings.get_boolean("middle-click-close-app"),
      desaturate_apps: raw_settings.get_boolean("desaturate-apps"),
      hide_empty_workspaces: raw_settings.get_boolean("hide-empty-workspaces"),
      hide_tooltips: raw_settings.get_boolean("hide-tooltips"),
      indicators_color: raw_settings.get_string("indicators-color"),
      apps_on_all_workspaces_indicator: raw_settings.get_string("apps-on-all-workspaces-indicator")
    }
  }

  /** connect signals that triggers a re-render of indicators */
  connect_signals() {
    // signals for global.workspace_manager
    this._workspaceNumberChangedSIGNAL = global.workspace_manager.connect("notify::n-workspaces", () => this.render())
    this._workspaceSwitchedSIGNAL = global.workspace_manager.connect("workspace-switched", () => this.render())
    this._workspaceReorderedSIGNAL = global.workspace_manager.connect("workspaces-reordered", () => this.render())

    // signals for Shell.WindowTracker.get_default()
    this._windowsChangedSIGNAL = Shell.WindowTracker.get_default().connect("tracked-windows-changed", () => this.render())

    // signals for global.display
    this._windowsRestackedSIGNAL = global.display.connect("restacked", () => this.render())
    this._windowLeftMonitorSIGNAL = global.display.connect("window-left-monitor", () => this.render())
    this._windowEnteredMonitorSIGNAL = global.display.connect("window-entered-monitor", () => this.render())
  }

  /** disconnect signals */
  disconnect_signals() {
    global.workspace_manager.disconnect(this._workspaceNumberChangedSIGNAL)
    global.workspace_manager.disconnect(this._workspaceSwitchedSIGNAL)
    global.workspace_manager.disconnect(this._workspaceReorderedSIGNAL)

    Shell.WindowTracker.get_default().disconnect(this._windowsChangedSIGNAL)

    global.display.disconnect(this._windowsRestackedSIGNAL)
    global.display.disconnect(this._windowLeftMonitorSIGNAL)
    global.display.disconnect(this._windowEnteredMonitorSIGNAL)
  }

  /** render indicators: destroy current indicators and rebuild */
  render() {
    this._indicators.splice(0).forEach(i => i.destroy())

    // build indicator for other monitor
    this.render_workspace(0, true)

    // build normal workspaces indicators
    for (let i = 0; i < global.workspace_manager.get_n_workspaces(); i++) {
      this.render_workspace(i)
    }
  }

  /**
   * create indicator for a single workspace
   * @param {number} index index of workspace 
   * @param {boolean} is_other_monitor special indicator for other monitor 
   */
  render_workspace(index, is_other_monitor) {
    const workspace = global.workspace_manager.get_workspace_by_index(index)

    const windows = workspace
      .list_windows()
      // filter out windows on all workspaces (or not on all workspaces for special other monitor indicator)
      .filter(w => is_other_monitor ? w.is_on_all_workspaces() : !w.is_on_all_workspaces())

    // hide other monitor indicator if no windows on all workspaces
    if (is_other_monitor && windows.length === 0) return
    
    const is_active = !is_other_monitor && global.workspace_manager.get_active_workspace_index() == index

    // hide empty workspaces
    if (this._settings.hide_empty_workspaces && !is_active && windows.length === 0) return

    // indicator styles
    let style_classes = "workspace"
    if (is_active) { style_classes += " active" }
    if (!this._settings.show_active_workspace_indicator) { style_classes += " no-indicator" }
    if (!this._settings.round_indicators_border) { style_classes += " no-rounded" }

    const style = `border-color: ${this._settings.indicators_color}`

    // create indicator
    const indicator = new St.Bin({
      style_class: style_classes,
      style: style,
      reactive:    true,
      can_focus:   true,
      track_hover: true,
      child:       new St.BoxLayout()
    })
    this._indicators.push(indicator)
    
    // indicator properties
    indicator._index = index
    indicator._workspace = workspace
    indicator._scroll_wraparound = this._settings.scroll_wraparound
    indicator._inverse_scroll = this._settings.inverse_scroll

    // drag and drop
    indicator._delegate = indicator
    indicator.acceptDrop = function (source) {
      if (source._index !== this._index) {
        source._window.change_workspace_by_index(this._index, false)
        source._window.activate(global.get_current_time())
        return true
      }
      return false
    } 

    // connect click, touch, scroll signals
    indicator.connect("button-release-event", this.on_click_workspace.bind(indicator))
    indicator.connect("touch-event", this.on_touch_workspace.bind(indicator))
    indicator.connect("scroll-event", this.on_scroll_workspace.bind(indicator))

    // create apps icons
    this.create_indicator_icons(indicator, windows, is_active, index)

    // create indicator label
    if (this._settings.show_workspace_index || is_other_monitor) {
      this.create_indicator_label(
        indicator,
        index,
        is_other_monitor ? this._settings.apps_on_all_workspaces_indicator : null
      )
    }

    // add to panel
    let box
    switch (this._settings.panel_position) {
      case 0:
        box = "_leftBox"
        break
      case 1:
        box = "_centerBox"
        break
      case 2:
        box = "_rightBox"
        break
    }

    // index (selected by user) to insert indicator in panel
    const insertIndex = this._settings.position + (this._indicators.length-1)

    main.panel[box].insert_child_at_index(indicator, insertIndex)
  }

  /**
   * create icons of running applications inside a workspace indicator
   * @param button indicator to add childs (icons)
   * @param windows windows to create icons of 
   * @param {number} index index of workspace 
   */
  create_indicator_icons(button, windows, isActive, index) {
    const limit = this._settings.icons_limit
    const limitIcons = isActive ? 100 : (limit == 0 ? 100 : limit)

    windows
      .sort((w1, w2) => w1.get_id() - w2.get_id()) // sort by id (creation order)
      .forEach((win, count) => {

        // hide dialogs, popovers and tooltip
        if (this._settings.hide_tooltips && (win.get_window_type() != Meta.WindowType.NORMAL)) return

        // limit icons
        if (!win.has_focus() && count >= limitIcons) {
          if (count == limitIcons) {
            const plusIcon = new St.Icon({
              icon_name: "list-add-symbolic",
              icon_size: 10
            })
            plusIcon.set_opacity(150)
            button.get_child().add_child(plusIcon)
          }
          return
        }

        // convert from Meta.window to Shell.app
        const app = Shell.WindowTracker.get_default().get_window_app(win)

        if (!app || !win) {
          return
        }

        // create Clutter.actor
        const texture = app.create_icon_texture(20)

        // set low opacity for not focused apps
        const reduceInactiveAppsOpacity = this._settings.reduce_inactive_apps_opacity
        if (!win.has_focus() && reduceInactiveAppsOpacity) {
          texture.set_opacity(150)
        }

        // desaturate icon setting
        const desaturateApps = this._settings.desaturate_apps
        if (desaturateApps) {
          texture.add_effect(new Clutter.DesaturateEffect())
        }

        // styles
        const showFocusedAppIndicator = this._settings.show_focused_app_indicator
        const roundIndicatorsBorder = this._settings.round_indicators_border

        let style_classes = "app"
        if (win.has_focus()) { style_classes += " active" }
        if (!showFocusedAppIndicator) { style_classes += " no-indicator" }
        if (!roundIndicatorsBorder) { style_classes += " no-rounded" }

        const indicatorsColor = this._settings.indicators_color
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
        icon.middleClosesApp = this._settings.middle_click_close_app
        icon.connect("button-release-event", this.on_click_application.bind(icon))
        icon.connect("touch-event", this.on_touch_application.bind(icon))

        // drag and drop
        icon._index = index
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
      style_class: "text"
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
    if (event.get_button() == 3) {

      const workspaceManager = global.workspace_manager
      const workspaceIndex = this._index

      // activate workspace
      if (workspaceManager.get_active_workspace_index() !== workspaceIndex) {
        this._workspace.activate(global.get_current_time())
        return
      }

      // if rename label exists, destroy it 
      if (this._renameWorkspace) {
        this._renameWorkspace.destroy()
        this._renameWorkspace = null
        return
      }

      // create text input
      const entry = new St.Entry({
        text: Meta.prefs_get_workspace_name(workspaceIndex),
        style_class: "text",
      })
      
      // connect typing event: update workspace name
      entry.connect("key-press-event", () => {
        const text = entry.get_text()
        Meta.prefs_change_workspace_name(workspaceIndex, text)
      })

      // add to indicator
      this.get_child().insert_child_at_index(entry, 0)
      entry.grab_key_focus()      
      
      this._renameWorkspace = entry
    }
  }

  /**
   * touch on workspace handler
   */
  on_touch_workspace() {
    this._workspace.activate(global.get_current_time())
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
   * touch on application handler
   */
  on_touch_application() {
    this._window.activate(global.get_current_time())
  }

  /**
   * scroll on workspace indicator handler
   * @param actor actor scrolled on 
   * @param event click event 
   */
  on_scroll_workspace(actor, event) {
    // scroll direction
    let scroll_direction = event.get_scroll_direction()

    // convert 2D direction to left/right
    let direction = 0
		switch (scroll_direction) {
      case Clutter.ScrollDirection.LEFT:
      case Clutter.ScrollDirection.UP:
        direction = this._inverse_scroll ? -1 : 1
        break
      case Clutter.ScrollDirection.RIGHT:
      case Clutter.ScrollDirection.DOWN:
        direction = this._inverse_scroll ? 1 : -1
        break
      default:
        return Clutter.EVENT_PROPAGATE
    }

    // activate adjacent workspace on scroll
    const workspaceManager = global.workspace_manager
    let newIndex = workspaceManager.get_active_workspace_index() + direction

    // wrap
    if (this._scroll_wraparound) newIndex = mod(newIndex, workspaceManager.n_workspaces)

    if (newIndex >= 0 && newIndex < workspaceManager.n_workspaces) {
      workspaceManager.get_workspace_by_index(newIndex).activate(global.get_current_time())
    }

    // modulo operator working for negative numbers
    function mod(n, m) {
      return ((n % m) + m) % m;
    }
  }

}
