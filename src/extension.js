import St from "gi://St"
import Shell from "gi://Shell"
import * as main from "resource:///org/gnome/shell/ui/main.js"
import { Extension } from "resource:///org/gnome/shell/extensions/extension.js"
import CONSTANTS from "./constants.js"
import Workspace from "./workspace.js"

// extension workspace indicator
export default class WorkspacesByOpenApps extends Extension {

  /**
   * enable extension: initialize everything, connect signals and trigger first render
   * */
  enable() {
    // initialize settings
    this._update_settings(this.getSettings(), false) // no re-render

    // create container and insert in panel
    this._container = new St.BoxLayout()
    const box = CONSTANTS.PANEL_BOX[this._settings.position_in_panel]
    main.panel[box].insert_child_at_index(this._container, this._settings.position_index)

    // connect signals and first render
    this._connect_signals()
    this._render()
  }

  /**
   * disable extension: destroy everything and disconnect signals
   * */
  disable() {
    this._disconnect_signals() // disconnect signals

    main.panel.statusArea["activities"]?.show() // restore activities

    this._settings = null
    this._container.destroy()
    this._container = null
  }

  /**
   * update settings: update this._settings, hide/show activities button and re-render
   * @param {Gio.Settings} rs raw settings
   * @param {boolean} render if re-render is needed
   */
  _update_settings(rs, render) {
    this._settings = {
      position_in_panel: rs.get_enum("position-in-panel"),
      position_index: rs.get_int("position-index"),
      hide_activities_button: rs.get_boolean("hide-activities-button"),

      scroll_enable: rs.get_boolean("scroll-enable"),
      scroll_wraparound: rs.get_boolean("scroll-wraparound"),
      scroll_inverse: rs.get_boolean("scroll-inverse"),
      middle_click_close_app: rs.get_boolean("middle-click-close-app"),
      click_on_active_overview: rs.get_boolean("click-on-active-overview"),
      click_on_focus_minimize: rs.get_boolean("click-on-focus-minimize"),

      indicator_show_active_workspace: rs.get_boolean("indicator-show-active-workspace"),
      indicator_show_focused_app: rs.get_boolean("indicator-show-focused-app"),
      indicator_color: rs.get_string("indicator-color"),
      indicator_round_borders: rs.get_boolean("indicator-round-borders"),
      indicator_swap_position: rs.get_boolean("indicator-swap-position"),

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
      log_apps_id: rs.get_boolean("log-apps-id"),

      size_app_icon: rs.get_int("size-app-icon"),
      size_labels: rs.get_int("size-labels"),
    }

    // hide activities button
    if (this._settings.hide_activities_button)
      main.panel.statusArea["activities"]?.hide()
    else
      main.panel.statusArea["activities"]?.show()

    if (render) {
      // disabling and enabling the extension is needed for settings that change
      // the indicator position, such as position_in_panel and position_index
      this.disable()
      this.enable()
    }
  }

  /**
   * connect signals that triggers a re-render of indicators
   * */
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

    const raw_settings = this.getSettings()
    this._sig_sett = raw_settings.connect("changed", () => this._update_settings(raw_settings, true))
  }

  /**
   * disconnect signals
   * */
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

    const raw_settings = this.getSettings()
    raw_settings.disconnect(this._sig_sett)
  }

  /**
   * render indicators: destroy current indicators and rebuild
   * */
  _render() {
    this._container.destroy_all_children()

    // build indicator for other monitor
    const other_monitor = this._render_workspace(0, true)
    if (other_monitor) {
      this._container.add_child(other_monitor)
    }

    // build normal workspaces indicators
    for (let i = 0; i < Shell.Global.get().get_workspace_manager().get_n_workspaces(); i++) {
      const workspace = this._render_workspace(i, false)
      if (workspace) {
        this._container.add_child(workspace)
      }
    }
  }

  /**
   * create indicator for a single workspace
   * @param {number} index index of workspace
   * @param {boolean} is_other_monitor special indicator for other monitor
   * @returns {Workspace} workspace indicator
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
          if (this._settings.log_apps_id) {
            console.log(`IGNORED ${app.get_id()}`)
          }
          return false
        }

        // dialogs, popovers and tooltip (only if not focused)
        if (!win.has_focus() && win.is_skip_taskbar()) return false

        // debug log app id
        if (this._settings.log_apps_id) {
          console.log(app.get_id())
        }

        return true
      })

    // hide other monitor indicator if no windows on all workspaces
    if (is_other_monitor && windows.length === 0) return

    const is_active = !is_other_monitor && Shell.Global.get().get_workspace_manager().get_active_workspace_index() === index

    // hide empty workspaces
    if (this._settings.indicator_hide_empty && !is_active && windows.length === 0) return

    const css_inline_workspace = `border-color: ${this._settings.indicator_color}`

    const css_classes_workspace = [ "wboa-workspace" ]
    if (this._settings.indicator_swap_position) {
      css_classes_workspace.push("wboa-top")
    } else {
      css_classes_workspace.push("wboa-bottom")
    }
    if (is_active) css_classes_workspace.push("wboa-active")
    if (!this._settings.indicator_show_active_workspace) css_classes_workspace.push("wboa-no-indicator")
    if (this._settings.indicator_round_borders) css_classes_workspace.push("wboa-rounded")

    const css_classes_panel = [ "panel-button", "wboa-panel-rounded" ]
    if (!this._settings.indicator_round_borders) css_classes_panel.push("wboa-no-rounded")

    return new Workspace(this._settings, workspace, windows, index, is_active, is_other_monitor, css_classes_panel, css_inline_workspace, css_classes_workspace)
  }

}
