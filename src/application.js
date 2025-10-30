import Clutter from "gi://Clutter"
import St from "gi://St"
import Shell from "gi://Shell"
import GObject from "gi://GObject"
import * as dnd from "resource:///org/gnome/shell/ui/dnd.js"
import CONSTANTS from "./constants.js"

/**
 * indicator for a application (with x{occurrences} label if needed)
 */
export default class Application extends St.BoxLayout {
  static {
    GObject.registerClass(this)
  }

  constructor(settings, index, window, occurrences, app_icon, css_inline_app, css_classes_app) {
    super({
      style: css_inline_app,
      style_class: css_classes_app.join(" "),
      reactive: true,
      can_focus: true,
      track_hover: true
    })

    this._settings = settings
    this._index = index
    this._window = window

    // setup signals
    this._setup_signals()

    // setup drag and drop
    this._setup_drag_and_drop()

    // add icon texture to icon button
    this.add_child(app_icon)

    // add x{occurrences} label to icon button (group same application)
    this._render_occurrences_label(occurrences, window)

    // add window title label to icon button (if setting is enabled)
    this._render_window_title()
  }

  /**
   * setup signals: click, touch
   */
  _setup_signals() {
    this.connect("button-release-event", this._on_click_application.bind(this))
    this.connect("touch-event", this._on_touch_application.bind(this))
  }

  /**
   * setup drag and drop for workspace and application indicators
   */
  _setup_drag_and_drop() {
    this._delegate = this
    this._draggable = dnd.makeDraggable(this, { dragActorOpacity: CONSTANTS.LOW_OPACITY })
  }

  /**
   * add x{occurrences} label to icon button (group same application)
   * @param {Map} occurrences
   */
  _render_occurrences_label(occurrences, window) {

    // apply global scale to label size
    const scale = this._settings.indicator_height_scale
    const size_labels = Math.round(this._settings.size_labels * scale)

    const css_style_text = `font-size: ${size_labels}px`
    const css_classes_text = [ "wboa-label" ]

    if ((this._settings.icons_group === 1) && (occurrences.get(window.app_id).count > 1)) {
      this.add_child(new St.Label({
        style: css_style_text,
        style_class: css_classes_text.join(" "),
        y_align: Clutter.ActorAlign.CENTER,
        text: `x${occurrences.get(window.app_id).count}`
      }))
    }
  }

  /**
   * add window title label to icon button (if setting is enabled)
   */
  _render_window_title() {
    if (!this._settings.apps_show_window_title) {
      return
    }

    const window_title = this._window.get_title()
    if (!window_title) {
      return
    }

    const css_style_text = `font-size: ${this._settings.size_labels}px; margin-left: 4px;`
    const css_classes_text = [ "wboa-label", "wboa-window-title" ]

    this.add_child(new St.Label({
      style: css_style_text,
      style_class: css_classes_text.join(" "),
      y_align: Clutter.ActorAlign.CENTER,
      text: window_title
    }))
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
      if (this._window.has_focus() && this._settings.click_on_focus_minimize) {
        this._window.minimize(Shell.Global.get().get_current_time())
      }
      // not focused or setting off: focus
      else {
        this._window.activate(Shell.Global.get().get_current_time())
      }
    }

    // middle click: close application
    if (this._settings.middle_click_close_app && event.get_button() === CONSTANTS.MIDDLE_CLICK) {
      this._window.delete(Shell.Global.get().get_current_time())
    }
  }

  /** touch on application handler */
  _on_touch_application() {
    this._window.activate(Shell.Global.get().get_current_time())
  }

}
