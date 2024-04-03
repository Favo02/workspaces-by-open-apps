import Clutter from "gi://Clutter"
import St from "gi://St"
import Shell from "gi://Shell"
import Meta from "gi://Meta"
import * as main from "resource:///org/gnome/shell/ui/main.js"
import * as dnd from "resource:///org/gnome/shell/ui/dnd.js"
import { Extension } from "resource:///org/gnome/shell/extensions/extension.js"

// extension workspace indicator
export default class WorkspacesByOpenApps extends Extension {

  /** enable extension: initialize everything */
  enable() {
    this._raw_settings = this.getSettings()

    this._settings = {} // parsed settings
    this._constants = { // useful constants
      LEFT: 0,
      CENTER: 1,
      RIGHT: 2,
      REDUCE_OPACITY: 1,
      DESATURATE: 2,
      OFF: 0,
      GROUP_AND_SHOW_COUNT: 1,
      GROUP_WITHOUT_COUNT: 2,
      NO_LIMIT: 100,
      LOW_OPACITY: 175,
      ICONS_SIZE: 10,
      TEXTURES_SIZE: 20
    }
    this._indicators = [] // each indicator is a workspace

    this._connect_signals() // signals that triggers render
    this._render() // initialize indicator
  }

  /** disable extension: destroy everything */
  disable() {
    this._raw_settings = null
    this._settings = null
    this._constants = null
    this._indicators.splice(0).forEach(i => i.destroy()) // destroy current indicators
    this._indicators = null

    this._disconnect_signals() // disconnect signals
  }

  /** parse raw settings object into a better formatted object */
  _parse_settings() {
    const rs = this._raw_settings
    this._settings = {
      position_in_panel: rs.get_enum("position-in-panel"),
      position_index: rs.get_int("position-index"),
      hide_activities_button: rs.get_boolean("hide-activities-button"),

      scroll_wraparound: rs.get_boolean("scroll-wraparound"),
      scroll_inverse: rs.get_boolean("scroll-inverse"),
      middle_click_close_app: rs.get_boolean("middle-click-close-app"),
      click_on_active_overview: rs.get_boolean("click-on-active-overview"),
      click_on_focus_minimize: rs.get_boolean("click-on-focus-minimize"),

      indicator_show_active_workspace: rs.get_boolean("indicator-show-active-workspace"),
      indicator_show_focused_app: rs.get_boolean("indicator-show-focused-app"),
      indicator_color: rs.get_string("indicator-color"),
      indicator_round_borders: rs.get_boolean("indicator-round-borders"),

      indicator_show_indexes: rs.get_boolean("indicator-show-indexes"),
      indicator_hide_empty: rs.get_boolean("indicator-hide-empty"),
      indicator_all_text: rs.get_string("indicator-all-text"),
      indicator_use_custom_names: rs.get_boolean("indicator-use-custom-names"),

      apps_all_desaturate: rs.get_boolean("apps-all-desaturate"),
      apps_inactive_effect: rs.get_enum("apps-inactive-effect"),
      apps_minimized_effect: rs.get_enum("apps-minimized-effect"),

      icons_limit: rs.get_int("icons-limit"),
      icons_group: rs.get_enum("icons-group"),
      icons_ignored: rs.get_strv("icons-ignored"),
      log_apps_id: rs.get_boolean("log-apps-id")
    }
  }

  /** connect signals that triggers a re-render of indicators */
  _connect_signals() {
    const workspace_manager = Shell.Global.get().get_workspace_manager()
    this._sig_wm1 = workspace_manager.connect("active-workspace-changed", () => this._render())
    this._sig_wm2 = workspace_manager.connect("showing-desktop-changed", () => this._render())
    this._sig_wm3 = workspace_manager.connect("workspace-added", () => this._render())
    this._sig_wm4 = workspace_manager.connect("workspace-removed", () => this._render())
    this._sig_wm5 = workspace_manager.connect("workspace-switched", () => this._render())
    this._sig_wm6 = workspace_manager.connect("workspaces-reordered", () => this._render())

    const window_tracker = Shell.WindowTracker.get_default()
    this._sig_wt1 = window_tracker.connect("tracked-windows-changed", () => this._render())

    const display = Shell.Global.get().get_display()
    this._sig_dp1 = display.connect("restacked", () => this._render())
    this._sig_dp2 = display.connect("window-left-monitor", () => this._render())
    this._sig_dp3 = display.connect("window-entered-monitor", () => this._render())
  }

  /** disconnect signals */
  _disconnect_signals() {
    const workspace_manager = Shell.Global.get().get_workspace_manager()
    workspace_manager.disconnect(this._sig_wm1)
    workspace_manager.disconnect(this._sig_wm2)
    workspace_manager.disconnect(this._sig_wm3)
    workspace_manager.disconnect(this._sig_wm4)
    workspace_manager.disconnect(this._sig_wm5)
    workspace_manager.disconnect(this._sig_wm6)

    const window_tracker = Shell.WindowTracker.get_default()
    window_tracker.disconnect(this._sig_wt1)

    const display = Shell.Global.get().get_display()
    display.disconnect(this._sig_dp1)
    display.disconnect(this._sig_dp2)
    display.disconnect(this._sig_dp3)
  }

  /** render indicators: destroy current indicators and rebuild */
  _render() {
    this._parse_settings()

    // hide activities button/new workspace indicator
    if (this._settings.hide_activities_button)
      main.panel.statusArea["activities"]?.hide()
    else
      main.panel.statusArea["activities"]?.show()

    this._indicators.splice(0).forEach(i => i.destroy())

    // build indicator for other monitor
    this._render_workspace(0, true)

    // build normal workspaces indicators
    for (let i = 0; i < Shell.Global.get().get_workspace_manager().get_n_workspaces(); i++)
      this._render_workspace(i, false)
  }

  /**
   * create indicator for a single workspace
   * @param {number} index index of workspace
   * @param {boolean} is_other_monitor special indicator for other monitor
   */
  _render_workspace(index, is_other_monitor) {
    const workspace = Shell.Global.get().get_workspace_manager().get_workspace_by_index(index)

    const windows = workspace
      .list_windows()
      // filter out apps
      .filter(win => {
        // undefined window
        if (!win) return false

        // undefined app
        const app = Shell.WindowTracker.get_default().get_window_app(win)
        if (!app) return false

        // apps on all workspaces (for normal workspace indicator)
        if (!is_other_monitor && win.is_on_all_workspaces()) return false

        // apps NOT on all workspaces (for other monitor indicator)
        if (is_other_monitor && !win.is_on_all_workspaces()) return false

        // ignored in settings (regex match)
        const matches = this._settings.icons_ignored.filter(ignored => new RegExp(ignored, "i").test(app.get_id()))
        if (matches.length > 0) {
          // debug log ignored app id
          if (this._settings.log_apps_id) console.log(`IGNORED ${app.get_id()}`)
          return false
        }

        // dialogs, popovers and tooltip (only if not focused)
        if (!win.has_focus() && win.is_skip_taskbar()) return false

        // debug log app id
        if (this._settings.log_apps_id)
          console.log(app.get_id())

        return true
      })

    // hide other monitor indicator if no windows on all workspaces
    if (is_other_monitor && windows.length === 0)
      return

    const is_active = !is_other_monitor && Shell.Global.get().get_workspace_manager().get_active_workspace_index() === index

    // hide empty workspaces
    if (this._settings.indicator_hide_empty && !is_active && windows.length === 0)
      return

    const css_inline_workspace = `border-color: ${this._settings.indicator_color}`

    const css_classes_workspace =                         [ "wboa-workspace" ]
    if (is_active)                                        css_classes_workspace.push("wboa-active")
    if (!this._settings.indicator_show_active_workspace)  css_classes_workspace.push("wboa-no-indicator")
    if (!this._settings.indicator_round_borders)          css_classes_workspace.push("wboa-no-rounded")

    // create indicator
    const indicator = new St.Bin({
      style: css_inline_workspace,
      style_class: css_classes_workspace.join(" "),
      reactive: true,
      can_focus: true,
      track_hover: true,
      child: new St.BoxLayout({
        style_class: "panel-button",
        reactive: true,
        can_focus: true,
        track_hover: true
      })
    })
    this._indicators.push(indicator)

    // indicator properties
    indicator._index = index
    indicator._workspace = workspace
    indicator._scroll_wraparound = this._settings.scroll_wraparound
    indicator._inverse_scroll = this._settings.scroll_inverse
    indicator._click_on_active_overview = this._settings.click_on_active_overview

    // drag and drop
    indicator._delegate = indicator
    // converting this anonymous function to a lambda will break the code,
    // because keyword this in lambda is different keyword than this in anonymous functions
    indicator.acceptDrop = function (source) {
      if (source._index !== this._index) {
        source._window.change_workspace_by_index(this._index, false)
        source._window.activate(Shell.Global.get().get_current_time())
        return true
      }
      return false
    }

    // connect click, touch, scroll signals
    indicator.connect("button-release-event", this._on_click_workspace.bind(indicator))
    indicator.connect("touch-event", this._on_touch_workspace.bind(indicator))
    indicator.connect("scroll-event", this._on_scroll_workspace.bind(indicator))

    // create apps icons
    this._render_workspace_applications(indicator, windows, is_active, index)

    // create indicator label
    if (this._settings.indicator_show_indexes || is_other_monitor) {
      this._render_workspace_label(
        indicator,
        index,
        is_other_monitor ? this._settings.indicator_all_text : null
      )
    }

    // add to panel
    let box
    switch (this._settings.position_in_panel) {
      case this._constants.LEFT:
        box = "_leftBox"
        break
      case this._constants.CENTER:
        box = "_centerBox"
        break
      case this._constants.RIGHT:
        box = "_rightBox"
        break
    }

    // index (selected by user) to insert indicator in panel
    const insert_index = this._settings.position_index + (this._indicators.length-1)

    main.panel[box].insert_child_at_index(indicator, insert_index)
  }

  /**
   * create icons of running applications inside a workspace indicator
   * @param button indicator to add childs (icons)
   * @param windows windows to create icons of
   * @param {boolean} is_active if the workspace is active
   * @param {number} index index of workspace
   */
  _render_workspace_applications(button, windows, is_active, index) {
    // group same application (if setting is on)
    let occurrences = {}
    if (this._settings.icons_group !== this._constants.OFF) {
      // count occurences of each application
      occurrences = windows.reduce((acc, cur) => {
        const id = cur.get_pid()
        if (!acc[id]) {
          acc[id] = {
            count: 1,
            focus: cur.has_focus(),
            not_minimized: !cur.is_hidden()
          }
        }
        else {
          acc[id].count++
          acc[id].focus ||= cur.has_focus()
          acc[id].not_minimized ||= !cur.is_hidden()
        }
        return acc
      }, {})

      // remove duplicates
      const unique_windows = windows.reduce((acc, curr) => {
        const found = acc.find(obj => obj.get_pid() === curr.get_pid())
        if (!found) acc.push(curr)
        return acc
      }, [])

      windows = unique_windows
    }

    const icons_limit = (is_active || this._settings.icons_limit === 0)
      ? this._constants.NO_LIMIT
      : this._settings.icons_limit

    windows
      .sort((w1, w2) => w1.has_focus() ? -1 : w2.has_focus() ? 1 : w1.get_id() - w2.get_id()) // sort by focus and id
      .slice(0, icons_limit) // limit icons
      .sort((w1, w2) => w1.get_id() - w2.get_id()) // sort by id only
      .forEach(win => {

        // convert from Meta.window to Shell.app
        const app = Shell.WindowTracker.get_default().get_window_app(win)

        // create Clutter.actor
        const texture = app.create_icon_texture(this._constants.TEXTURES_SIZE)

        // effects for not focused apps
        const is_focus = win.has_focus() || occurrences[win.get_pid()]?.focus
        if (!is_focus) {
          if (this._settings.apps_inactive_effect === this._constants.REDUCE_OPACITY) // reduce opacity
            texture.set_opacity(this._constants.LOW_OPACITY)
          if (this._settings.apps_inactive_effect === this._constants.DESATURATE) // desaturate
            texture.add_effect(new Clutter.DesaturateEffect())
        }

        // effects for minimized apps
        const is_not_minimized = !win.is_hidden() || occurrences[win.get_pid()]?.not_minimized
        if (!is_not_minimized) {
          if (this._settings.apps_minimized_effect === this._constants.REDUCE_OPACITY) // reduce opacity
            texture.set_opacity(this._constants.LOW_OPACITY)
          if (this._settings.apps_minimized_effect === this._constants.DESATURATE) // desaturate
            texture.add_effect(new Clutter.DesaturateEffect())
        }

        // desaturate icon setting
        if (this._settings.apps_all_desaturate)
          texture.add_effect(new Clutter.DesaturateEffect())

        const css_inline_app = `border-color: ${this._settings.indicator_color}`

        const css_classes_app =                           [ "wboa-app" ]
        if (is_focus)                                     css_classes_app.push("wboa-active")
        if (!this._settings.indicator_show_focused_app)   css_classes_app.push("wboa-no-indicator")
        if (!this._settings.indicator_round_borders)      css_classes_app.push("wboa-no-rounded")

        const icon = new St.Bin({
          style: css_inline_app,
          style_class: css_classes_app.join(" "),
          reactive: true,
          can_focus: true,
          track_hover: true,
          child: new St.BoxLayout()
        })

        // focus application on click
        icon.middle_closes_app = this._settings.middle_click_close_app
        icon.click_on_focus_minimize = this._settings.click_on_focus_minimize
        icon.connect("button-release-event", this._on_click_application.bind(icon))
        icon.connect("touch-event", this._on_touch_application.bind(icon))

        // drag and drop
        icon._index = index
        icon._window = win

        icon._delegate = icon
        icon._draggable = dnd.makeDraggable(icon, {
          dragActorOpacity: this._constants.LOW_OPACITY
        })

        // add icon texture to icon button
        icon.get_child().add_child(texture)

        const css_classes_text = [ "wboa-app-group-text" ]

        // add x{occurrences} label to icon button (group same application)
        if ((this._settings.icons_group === 1) && (occurrences[win.get_pid()].count > 1)) {
          icon.get_child().add_child(new St.Label({
            text: `x${occurrences[win.get_pid()].count}`,
            style_class: css_classes_text.join(" ")
          }))
        }

        // add app icon to buttons
        button.get_child().add_child(icon)
      })

    // render + icon (for icon limit)
    if (windows.length > icons_limit) {
      const plus_icon = new St.Icon({
        icon_name: "list-add-symbolic",
        icon_size: this._constants.ICONS_SIZE
      })
      plus_icon.set_opacity(this._constants.LOW_OPACITY)
      button.get_child().add_child(plus_icon)
    }
  }

  /**
   * create label for a workspace indicator
   * @param button indicator to add label
   * @param {number} index index of workspace
   * @param {string} other_monitor_text custom other workspace text to display
   */
  _render_workspace_label(button, index, other_monitor_text) {
    // text to display
    let indicator_text

    if (other_monitor_text) { // other monitor custom text
      indicator_text = other_monitor_text
    }
    else if (this._settings.indicator_use_custom_names) { // custom workspace name
      indicator_text = Meta.prefs_get_workspace_name(index)
    }
    else { // default text: index
      indicator_text = (index+1).toString()
    }

    const css_classes_label = [ "wboa-workspace-label" ]

    // add label to indicator
    button.get_child().insert_child_at_index(new St.Label({
      text: indicator_text,
      style_class: css_classes_label.join(" ")
    }), 0)
  }

  /**
   * click on workspace handler
   * @param _ actor clicked (unused)
   * @param event click event
   */
  _on_click_workspace(_, event) {
    // this._constants are not in scope
    const LEFT_CLICK = 1, RIGHT_CLICK = 3

    // left click: focus workspace or activate overview
    if (event.get_button() === LEFT_CLICK) {
      const is_active = Shell.Global.get().get_workspace_manager().get_active_workspace_index() === this._index

      // active and setting on: activate overview
      if (is_active && this._click_on_active_overview)
        main.overview.toggle()
      // not active or setting off: focus workspace
      else
        this._workspace.activate(Shell.Global.get().get_current_time())
    }

    // middle click: do nothing

    // right click: rename workspace
    if (event.get_button() === RIGHT_CLICK) {
      // if rename label exists, destroy it
      if (this._rename_workspace) {
        this._rename_workspace.destroy()
        this._rename_workspace = null
        return
      }

      const css_classes_label = [ "wboa-workspace-label" ]

      // create text input
      const entry = new St.Entry({
        text: Meta.prefs_get_workspace_name(this._index),
        style_class: css_classes_label.join(" ")
      })

      // connect typing event: update workspace name
      entry.connect("key-release-event", () => {
        Meta.prefs_change_workspace_name(this._index, entry.get_text())
      })

      // add to indicator
      this.get_child().insert_child_at_index(entry, 0)
      entry.grab_key_focus()

      this._rename_workspace = entry
    }
  }

  /** touch on workspace handler */
  _on_touch_workspace() {
    this._workspace.activate(Shell.Global.get().get_current_time())
  }

  /**
   * click on application icon handler
   * @param _ actor clicked (unused)
   * @param event click event
   */
  _on_click_application(_, event) {
    // this._constants are not in scope
    const LEFT_CLICK = 1, MIDDLE_CLICK = 2, RIGHT_CLICK = 3

    // left/right click: focus or minimize application
    if (event.get_button() === LEFT_CLICK || event.get_button() === RIGHT_CLICK) {

      // focused and setting on: minimize
      if (this._window.has_focus() && this.click_on_focus_minimize)
        this._window.minimize(Shell.Global.get().get_current_time())
      // not focused or setting off: focus
      else
        this._window.activate(Shell.Global.get().get_current_time())
    }

    // middle click: close application
    if (this.middle_closes_app && event.get_button() === MIDDLE_CLICK)
      this._window.delete(Shell.Global.get().get_current_time())
  }

  /** touch on application handler */
  _on_touch_application() {
    this._window.activate(Shell.Global.get().get_current_time())
  }

  /**
   * scroll on workspace indicator handler
   * @param _ actor scrolled on (unused)
   * @param event click event
   */
  _on_scroll_workspace(_, event) {
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
    const workspace_manager = Shell.Global.get().get_workspace_manager()
    let new_index = workspace_manager.get_active_workspace_index() + direction

    // modulo operator working for negative numbers
    const mod = (n, m) => (((n % m) + m) % m)

    // wrap
    if (this._scroll_wraparound)
      new_index = mod(new_index, workspace_manager.n_workspaces)

    if (new_index >= 0 && new_index < workspace_manager.n_workspaces)
      workspace_manager.get_workspace_by_index(new_index).activate(Shell.Global.get().get_current_time())
  }

}
