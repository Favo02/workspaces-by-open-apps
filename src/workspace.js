import Clutter from "gi://Clutter"
import St from "gi://St"
import Shell from "gi://Shell"
import Meta from "gi://Meta"
import GObject from "gi://GObject"
import * as main from "resource:///org/gnome/shell/ui/main.js"
import * as popupMenu from "resource:///org/gnome/shell/ui/popupMenu.js"
import CONSTANTS from "./constants.js"
import Application from "./application.js"

/**
 * indicator for a single workspace
 */
export default class Workspace extends St.Bin {
  static {
    GObject.registerClass(this)
  }

  constructor(settings, workspace, windows, index, is_active, is_other_monitor, css_classes_panel, css_inline_workspace, css_classes_workspace) {
    super({
      style_class: css_classes_panel.join(" "),
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
    this._is_active = is_active

    // setup signals
    this._setup_signals()

    // setup drag and drop
    this._setup_drag_and_drop()

    // render label
    if (this._settings.indicator_show_indexes || is_other_monitor) {
      this._render_label(index, is_other_monitor)
    }

    // create apps icons
    this._render_applications(windows, is_active)
  }

  /**
   * create icons of running applications inside a workspace indicator
   * @param windows windows to create icons of
   * @param {boolean} is_active if the workspace is active
   */
  _render_applications(windows, is_active) {

    // count occurrences of each application
    const occurrences = this._count_application_occurrences(windows)

    // remove duplicates (if application grouping is on)
    if (this._settings.icons_group !== CONSTANTS.OFF) {
      windows = this._remove_duplicates(windows)
    }

    // limit icons (if application limit is on)
    let icons_limit
    if (is_active || this._settings.icons_limit === 0) {
      icons_limit = CONSTANTS.NO_LIMIT
    } else {
      icons_limit = this._settings.icons_limit
    }

    windows
      .sort((w1, w2) => { // sort by focus and id
        if (w1.has_focus()) return -1
        if (w2.has_focus()) return 1
        return w1.get_id() - w2.get_id()
      })
      .slice(0, icons_limit) // limit icons
      .sort((w1, w2) => w1.get_id() - w2.get_id()) // sort by id only
      .forEach(window => {
        // create app indicator and add to workspace
        const app_container = this._create_application(window, occurrences)
        this.get_child().add_child(app_container)
      })

    // render + icon (for icon limit)
    if (windows.length > icons_limit) {
      const scale = this._settings.indicator_height_scale
      const plus_icon = new St.Icon({
        icon_name: "list-add-symbolic",
        icon_size: Math.round(this._settings.size_app_icon * scale / 2)
      })
      plus_icon.set_opacity(CONSTANTS.LOW_OPACITY)
      this.get_child().add_child(plus_icon)
    }
  }

  /**
   * count the occourrence, focus and minimization of each application in the workspace
   * if settings {icons_group} is OFF, return empty map
   * @param {Meta.Window[]} windows windows in workspace
   * @returns {Map} occurrences, focus and minimization of each application or empty map
   */
  _count_application_occurrences(windows) {
    // count occurrences of each application
    const occurrences = new Map()

    if (this._settings.icons_group !== CONSTANTS.OFF) {
      for (const window of windows) {
        const id = window.app_id
        const get_or_default = occurrences.get(id) ?? { count: 0, focus: false, not_minimized: false }

        occurrences.set(id, {
          count: get_or_default.count + 1,
          focus: get_or_default.focus || window.has_focus(),
          not_minimized: get_or_default.not_minimized || !window.is_hidden()
        })
      }
    }

    return occurrences
  }

  /**
   * remove duplicate windows based on window pid
   * keeps the focused window for each app, or the first one if none is focused
   * @param {Meta.Window[]} windows windows to remove duplicates from
   * @returns {Meta.Window[]} windows without duplicates
   */
  _remove_duplicates(windows) {
    const app_windows = new Map()

    // group windows by app_id
    for (const win of windows) {
      if (!app_windows.has(win.app_id)) {
        app_windows.set(win.app_id, [])
      }
      app_windows.get(win.app_id).push(win)
    }

    // for each app, keep the focused window or the first one
    const result = []
    for (const [app_id, wins] of app_windows) {
      const focused = wins.find(w => w.has_focus())
      result.push(focused || wins[0])
    }

    return result
  }

  /**
   * create an application icon, applying effects (focus, desaturation, grouping, ...) based on settings
   * @param {Meta.Window} window to create icon of
   * @param {Map} occurrences occurrences of each application
   * @returns {Application} application icon
   */
  _create_application(window, occurrences) {
    // convert from Meta.window to Shell.app
    const app = Shell.WindowTracker.get_default().get_window_app(window)

    // apply global scale to icon size
    const scale = this._settings.indicator_height_scale
    const scaled_icon_size = Math.round(this._settings.size_app_icon * scale)

    // create Clutter.actor
    const app_icon = app.create_icon_texture(scaled_icon_size)

    // effects for not focused apps
    const is_focus = window.has_focus() || occurrences.get(window.app_id)?.focus
    if (!is_focus) {
      // reduce opacity
      if (this._settings.apps_inactive_effect === CONSTANTS.REDUCE_OPACITY) {
        app_icon.set_opacity(CONSTANTS.LOW_OPACITY)
      }
      // desaturate
      if (this._settings.apps_inactive_effect === CONSTANTS.DESATURATE) {
        app_icon.add_effect(new Clutter.DesaturateEffect())
      }
    }

    // effects for minimized apps
    const is_not_minimized = !window.is_hidden() || occurrences.get(window.app_id)?.not_minimized
    if (!is_not_minimized) {
      // reduce opacity
      if (this._settings.apps_minimized_effect === CONSTANTS.REDUCE_OPACITY) {
        app_icon.set_opacity(CONSTANTS.LOW_OPACITY)
      }
      // desaturate
      if (this._settings.apps_minimized_effect === CONSTANTS.DESATURATE) {
        app_icon.add_effect(new Clutter.DesaturateEffect())
      }
    }

    // desaturation effect for all apps (setting)
    if (this._settings.apps_all_desaturate) {
      app_icon.add_effect(new Clutter.DesaturateEffect())
    }

    // apply global scale to all sizes
    const indicator_height = Math.round(2 * scale)
    const spacing_app_left = Math.round(this._settings.spacing_app_left * scale)
    const spacing_app_right = Math.round(this._settings.spacing_app_right * scale)

    const css_inline_app = `
      border-color: ${this._settings.indicator_color};
      margin-left: ${spacing_app_left}px;
      margin-right: ${spacing_app_right}px;
      ${is_focus && this._settings.indicator_show_focused_app ?
        (this._settings.indicator_swap_position ?
          `border-bottom-width: ${indicator_height}px; margin-bottom: 0px;` :
          `border-top-width: ${indicator_height}px; margin-top: 0px;`) :
        (this._settings.indicator_swap_position ?
          `margin-bottom: ${indicator_height}px;` :
          `margin-top: ${indicator_height}px;`)}
    `

    const css_classes_app = ["wboa-app"]
    if (this._settings.indicator_swap_position) {
      css_classes_app.push("wboa-bottom")
    } else {
      css_classes_app.push("wboa-top")
    }
    if (is_focus) css_classes_app.push("wboa-active")
    if (!this._settings.indicator_show_focused_app) css_classes_app.push("wboa-no-indicator")
    if (this._settings.indicator_round_borders) css_classes_app.push("wboa-rounded")
    if (this._settings.apps_symbolic_icons) css_classes_app.push("wboa-symbolic-icons")

    return new Application(this._settings, this._index, window, occurrences, app_icon, css_inline_app, css_classes_app)
  }

  /**
   * setup drag and drop for workspace and application indicators
   */
  _setup_drag_and_drop() {
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
  }

  /**
   * setup signals: click, touch, scroll
   */
  _setup_signals() {
    this.connect("button-release-event", this._on_click_workspace.bind(this))
    this.connect("touch-event", this._on_touch_workspace.bind(this))
    if (this._settings.scroll_enable) {
      this.connect("scroll-event", this._on_scroll_workspace.bind(this))
    }
  }

  /**
   * create label for a workspace indicator
   * @param {number} index index of workspace
   * @param {boolean} other_monitor if the workspace is for other monitor
   */
  _render_label(index, other_monitor) {
    // text to display
    let indicator_text

    // other monitor custom text
    if (other_monitor) {
      indicator_text = this._settings.indicator_all_text
    }
    // custom workspace name
    else if (this._settings.indicator_use_custom_names) {
      indicator_text = Meta.prefs_get_workspace_name(index)
    }
    // default text: index
    else {
      indicator_text = (index + 1).toString()
    }

    // apply global scale to label sizes
    const scale = this._settings.indicator_height_scale
    const size_labels = Math.round(this._settings.size_labels * scale)
    const spacing_label_left = Math.round(this._settings.spacing_label_left * scale)
    const spacing_label_right = Math.round(this._settings.spacing_label_right * scale)
    const spacing_label_top = Math.round(this._settings.spacing_label_top * scale)
    const spacing_label_bottom = Math.round(this._settings.spacing_label_bottom * scale)

    const css_style_label = `
      font-size: ${size_labels}px;
      margin-left: ${spacing_label_left}px;
      margin-right: ${spacing_label_right}px;
      margin-top: ${spacing_label_top}px;
      margin-bottom: ${spacing_label_bottom}px;
    `
    const css_classes_label = ["wboa-label"]
    if (this._settings.indicator_text_use_theme_color) {
      css_classes_label.push("wboa-label-themed")
    }

    // add label to indicator
    this.get_child().insert_child_at_index(new St.Label({
      style: css_style_label,
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
      if (is_active && this._settings.click_on_active_overview) {
        main.overview.toggle()
      }
      // not active or setting off: focus workspace
      else {
        this._workspace.activate(Shell.Global.get().get_current_time())
      }
    }

    // middle click: do nothing

    // right click: rename workspace
    if (event.get_button() === CONSTANTS.RIGHT_CLICK) {
      // only allow renaming if custom names are enabled
      if (this._settings.indicator_use_custom_names) {
        this._show_rename_menu()
      }
    }
  }

  /**
   * show popup menu for renaming workspace
   */
  _show_rename_menu() {
    // only allow renaming if custom names are enabled
    if (!this._settings.indicator_use_custom_names) {
      return
    }

    // close existing menu if any
    if (this._rename_menu) {
      this._rename_menu.close(true)
      this._rename_menu.destroy()
      this._rename_menu = null
    }

    // create popup menu
    this._rename_menu = new popupMenu.PopupMenu(this, 0.5, St.Side.TOP)
    main.uiGroup.add_child(this._rename_menu.actor)
    this._rename_menu.actor.hide()

    // create menu item with text entry
    const menuItem = new popupMenu.PopupBaseMenuItem({
      reactive: false,
      can_focus: false
    })

    const entry = new St.Entry({
      text: Meta.prefs_get_workspace_name(this._index),
      style_class: 'rename-workspace-entry',
      can_focus: true,
      x_expand: true
    })

    menuItem.actor.add_child(entry)
    this._rename_menu.addMenuItem(menuItem)

    // handle key press events
    const entryClutterText = entry.get_clutter_text()
    const keyPressId = entryClutterText.connect('key-press-event', (_, event) => {
      const symbol = event.get_key_symbol()

      // Enter key: apply rename and close menu
      if (symbol === Clutter.KEY_Return || symbol === Clutter.KEY_KP_Enter) {
        Meta.prefs_change_workspace_name(this._index, entry.get_text())
        this._rename_menu.close(true)
        this.get_child().remove_child(this.get_child().get_first_child())
        this._render_label()
        return Clutter.EVENT_STOP
      }

      // Escape key: cancel and close menu
      if (symbol === Clutter.KEY_Escape) {
        this._rename_menu.close(true)
        return Clutter.EVENT_STOP
      }

      return Clutter.EVENT_PROPAGATE
    })

    // cleanup when menu is closed
    const closeId = this._rename_menu.connect('menu-closed', () => {
      entryClutterText.disconnect(keyPressId)
      this._rename_menu.disconnect(closeId)
      this._rename_menu.destroy()
      this._rename_menu = null
    })

    // open menu and focus entry
    this._rename_menu.open(true)
    entry.grab_key_focus()
    entryClutterText.set_selection(0, entry.get_text().length)
  }

  /** touch on workspace handler */
  _on_touch_workspace() {
    this._workspace.activate(Shell.Global.get().get_current_time())
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
    let direction
    switch (scroll_direction) {
      case Clutter.ScrollDirection.LEFT:
      case Clutter.ScrollDirection.UP:
        direction = this._settings.scroll_inverse ? -1 : 1
        break
      case Clutter.ScrollDirection.RIGHT:
      case Clutter.ScrollDirection.DOWN:
        direction = this._settings.scroll_inverse ? 1 : -1
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
    if (this._settings.scroll_wraparound) {
      new_index = mod(new_index, workspace_manager.n_workspaces)
    }

    if (new_index >= 0 && new_index < workspace_manager.n_workspaces) {
      workspace_manager.get_workspace_by_index(new_index).activate(Shell.Global.get().get_current_time())
    }
  }

}
