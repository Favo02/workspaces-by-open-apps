import Clutter from "gi://Clutter"
import St from "gi://St"
import Shell from "gi://Shell"
import Meta from "gi://Meta"
import GObject from "gi://GObject"
import * as main from "resource:///org/gnome/shell/ui/main.js"
import * as dnd from "resource:///org/gnome/shell/ui/dnd.js"
import CONSTANTS from "./constants.js"

export default class Workspace extends St.Bin {
  static {
    GObject.registerClass(this)
  }

  constructor(settings, workspace, windows, index, is_active, is_other_monitor, css_inline_workspace, css_classes_workspace) {
    super({
      style_class: "panel-button",
      reactive: true,
      can_focus: true,
      track_hover: true,
      child: new St.BoxLayout({
        style: css_inline_workspace,
        style_class: css_classes_workspace.join(" "),
        reactive: true,
        can_focus: true,
        track_hover: true
      }),
    })

    this._settings = settings
    this._index = index
    this._workspace = workspace

    // drag and drop
    this._delegate = this
    // converting this anonymous function to a lambda will break the code,
    // because keyword this in lambda is different keyword than this in anonymous functions
    this.acceptDrop = function (source) {
      if (source._index !== this._index) {
        source._window.change_workspace_by_index(this._index, false)
        source._window.activate(Shell.Global.get().get_current_time())
        return true
      }
      return false
    }

    // connect click, touch, scroll signals
    this.connect("button-release-event", this._on_click_workspace.bind(this))
    this.connect("touch-event", this._on_touch_workspace.bind(this))
    if (this._settings.scroll_enable) {
      this.connect("scroll-event", this._on_scroll_workspace.bind(this))
    }

    // create apps icons
    this._render_workspace_applications(this, windows, is_active, index)

    // create indicator label
    if (this._settings.indicator_show_indexes || is_other_monitor) {
      this._render_workspace_label(this, index, is_other_monitor ? this._settings.indicator_all_text : null)
    }
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
    if (this._settings.icons_group !== CONSTANTS.OFF) {
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
      ? CONSTANTS.NO_LIMIT
      : this._settings.icons_limit

    windows
      .sort((w1, w2) => w1.has_focus() ? -1 : w2.has_focus() ? 1 : w1.get_id() - w2.get_id()) // sort by focus and id
      .slice(0, icons_limit) // limit icons
      .sort((w1, w2) => w1.get_id() - w2.get_id()) // sort by id only
      .forEach(win => {

        // convert from Meta.window to Shell.app
        const app = Shell.WindowTracker.get_default().get_window_app(win)

        // create Clutter.actor
        const app_icon = app.create_icon_texture(CONSTANTS.TEXTURES_SIZE)

        // effects for not focused apps
        const is_focus = win.has_focus() || occurrences[win.get_pid()]?.focus
        if (!is_focus) {
          if (this._settings.apps_inactive_effect === CONSTANTS.REDUCE_OPACITY) // reduce opacity
            app_icon.set_opacity(CONSTANTS.LOW_OPACITY)
          if (this._settings.apps_inactive_effect === CONSTANTS.DESATURATE) // desaturate
            app_icon.add_effect(new Clutter.DesaturateEffect())
        }

        // effects for minimized apps
        const is_not_minimized = !win.is_hidden() || occurrences[win.get_pid()]?.not_minimized
        if (!is_not_minimized) {
          if (this._settings.apps_minimized_effect === CONSTANTS.REDUCE_OPACITY) // reduce opacity
            app_icon.set_opacity(CONSTANTS.LOW_OPACITY)
          if (this._settings.apps_minimized_effect === CONSTANTS.DESATURATE) // desaturate
            app_icon.add_effect(new Clutter.DesaturateEffect())
        }

        // desaturate icon setting
        if (this._settings.apps_all_desaturate)
          app_icon.add_effect(new Clutter.DesaturateEffect())

        const css_inline_app = `border-color: ${this._settings.indicator_color}`

        const css_classes_app =                           [ "wboa-app" ]
        if (is_focus)                                     css_classes_app.push("wboa-active")
        if (!this._settings.indicator_show_focused_app)   css_classes_app.push("wboa-no-indicator")
        if (!this._settings.indicator_round_borders)      css_classes_app.push("wboa-no-rounded")

        const app_container = new St.BoxLayout({
          style: css_inline_app,
          style_class: css_classes_app.join(" "),
          reactive: true,
          can_focus: true,
          track_hover: true
        })

        // focus application on click
        app_container.middle_closes_app = this._settings.middle_click_close_app
        app_container.click_on_focus_minimize = this._settings.click_on_focus_minimize
        app_container.connect("button-release-event", this._on_click_application.bind(app_container))
        app_container.connect("touch-event", this._on_touch_application.bind(app_container))

        // drag and drop
        app_container._index = index
        app_container._window = win

        app_container._delegate = app_container
        app_container._draggable = dnd.makeDraggable(app_container, {
          dragActorOpacity: CONSTANTS.LOW_OPACITY
        })

        // add icon texture to icon button
        app_container.add_child(app_icon)

        const css_classes_text = [ "wboa-app-group-text" ]

        // add x{occurrences} label to icon button (group same application)
        if ((this._settings.icons_group === 1) && (occurrences[win.get_pid()].count > 1)) {
          app_container.add_child(new St.Label({
            style_class: css_classes_text.join(" "),
            y_align: Clutter.ActorAlign.CENTER,
            text: `x${occurrences[win.get_pid()].count}`
          }))
        }

        // add app icon to buttons
        button.get_child().add_child(app_container)
      })

    // render + icon (for icon limit)
    if (windows.length > icons_limit) {
      const plus_icon = new St.Icon({
        icon_name: "list-add-symbolic",
        icon_size: CONSTANTS.ICONS_SIZE
      })
      plus_icon.set_opacity(CONSTANTS.LOW_OPACITY)
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
      style_class: css_classes_label.join(" "),
      y_align: Clutter.ActorAlign.CENTER,
      text: indicator_text
    }), 0)
  }

  /**
   * click on workspace handler
   * @param _ actor clicked (unused)
   * @param event click event
   */
  _on_click_workspace(_, event) {
    // left click: focus workspace or activate overview
    if (event.get_button() === CONSTANTS.LEFT_CLICK) {
      const is_active = Shell.Global.get().get_workspace_manager().get_active_workspace_index() === this._index

      // active and setting on: activate overview
      if (is_active && this._settings._click_on_active_overview)
        main.overview.toggle()
      // not active or setting off: focus workspace
      else
        this._workspace.activate(Shell.Global.get().get_current_time())
    }

    // middle click: do nothing

    // right click: rename workspace
    if (event.get_button() === CONSTANTS.RIGHT_CLICK) {
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
    // left/right click: focus or minimize application
    if (event.get_button() === CONSTANTS.LEFT_CLICK || event.get_button() === CONSTANTS.RIGHT_CLICK) {

      // focused and setting on: minimize
      if (this._window.has_focus() && this.click_on_focus_minimize)
        this._window.minimize(Shell.Global.get().get_current_time())
      // not focused or setting off: focus
      else
        this._window.activate(Shell.Global.get().get_current_time())
    }

    // middle click: close application
    if (this.middle_closes_app && event.get_button() === CONSTANTS.MIDDLE_CLICK)
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
        direction = this._settings._inverse_scroll ? -1 : 1
        break
      case Clutter.ScrollDirection.RIGHT:
      case Clutter.ScrollDirection.DOWN:
        direction = this._settings._inverse_scroll ? 1 : -1
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
    if (this._settings._scroll_wraparound)
      new_index = mod(new_index, workspace_manager.n_workspaces)

    if (new_index >= 0 && new_index < workspace_manager.n_workspaces)
      workspace_manager.get_workspace_by_index(new_index).activate(Shell.Global.get().get_current_time())
  }

}
