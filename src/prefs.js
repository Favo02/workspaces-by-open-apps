import Adw from "gi://Adw"
import Gio from "gi://Gio"
import Gtk from "gi://Gtk"
import Gdk from "gi://Gdk"
import { ExtensionPreferences } from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js"

export default class WorkspacesByOpenAppsPrefs extends ExtensionPreferences {

  fillPreferencesWindow(window) {
    window.set_search_enabled(true)
    window.set_default_size(1000, 800)

    const settings = this.getSettings()

    // page1: position and behavior
    const page1 = new Adw.PreferencesPage({
      name: "page1",
      title: "Position and Behavior",
      icon_name: "preferences-other-symbolic"
    })
    page1.add(this._page1_group1(settings))
    page1.add(this._page1_group2(settings))
    page1.add(this._info_label())

    // page2: appearance
    const page2 = new Adw.PreferencesPage({
      name: "page2",
      title: "Appearance",
      icon_name: "applications-graphics-symbolic"
    })
    page2.add(this._page2_group1(settings))
    page2.add(this._page2_group2(settings))
    page2.add(this._page2_group3(settings))
    page2.add(this._page2_group4(settings))
    page2.add(this._info_label())

    // page3: hide and ignore apps
    const page3 = new Adw.PreferencesPage({
      name: "page3",
      title: "Hide and ignore apps",
      icon_name: "edit-clear-all-symbolic"
    })
    page3.add(this._page3_group1(settings))
    // these groups needs to be saved to be updated (removed and readded) when a new app is ignored
    let p3g2 = this._page3_group2(settings)
    const p3g3 = this._page3_group3(settings)
    const label = this._info_label()
    page3.add(p3g2)
    page3.add(p3g3)
    page3.add(label)
    settings.connect("changed::icons-ignored", () => {
      // remove old groups (only p3g2 needs to be update but all groups below him needs to be removed)
      page3.remove(p3g2)
      page3.remove(p3g3)
      page3.remove(label)

      // update p3g2
      p3g2 = this._page3_group2(settings)

      // readd groups (they need to be added in this order, same as before)
      page3.add(p3g2)
      page3.add(p3g3)
      page3.add(label)
    })

    // page4: about
    const page4 = new Adw.PreferencesPage({
      name: "page4",
      title: "About",
      icon_name: "help-about-symbolic"
    })
    page4.add(this._about_page())
    page4.add(this._star_label())

    window.add(page1)
    window.add(page2)
    window.add(page3)
    window.add(page4)
  }

  _page1_group1(settings) {
    const group = new Adw.PreferencesGroup({
      title: "Position",
      description: ""
    })

    let row, widget

    row = new Adw.ActionRow({
      title: "Panel position",
      subtitle: "Panel to show the indicator in"
    })
    widget = new Gtk.ComboBoxText({
      valign: Gtk.Align.CENTER
    })
    widget.append("LEFT", "Left")
    widget.append("CENTER", "Center")
    widget.append("RIGHT", "Right")
    settings.bind("position-in-panel", widget, "active-id", Gio.SettingsBindFlags.DEFAULT)
    row.add_suffix(widget)
    row.activatable_widget = widget
    group.add(row)

    row = new Adw.ActionRow({
      title: "Position index",
      subtitle: "Number of other elements in the panel before the indicator"
    })
    widget = new Gtk.SpinButton({
      valign: Gtk.Align.CENTER
    })
    widget.set_sensitive(true)
    widget.set_range(0, 50)
    widget.set_value(settings.get_int("position-index"))
    widget.set_increments(1, 2)
    widget.connect("value-changed", w => { settings.set_int("position-index", w.get_value_as_int()) })
    row.add_suffix(widget)
    row.activatable_widget = widget
    group.add(row)

    row = new Adw.ActionRow({
      title: "Hide GNOME workspace indicator",
      subtitle: "Hide GNOME default workspace indicator (formerly \"Activities\" button)"
    })
    widget = new Gtk.Switch({
      valign: Gtk.Align.CENTER
    })
    settings.bind("hide-activities-button", widget, "active", Gio.SettingsBindFlags.DEFAULT)
    row.add_suffix(widget)
    row.activatable_widget = widget
    group.add(row)

    return group
  }

  _page1_group2(settings) {
    const group = new Adw.PreferencesGroup({
      title: "Behavior",
      description: ""
    })

    let row, widget

    row = new Adw.ActionRow({
      title: "Enable scroll",
      subtitle: "Change workspace by scrolling the mouse wheel (or touchpad gesture) over the indicator"
    })
    widget = new Gtk.Switch({
      valign: Gtk.Align.CENTER
    })
    settings.bind("scroll-enable", widget, "active", Gio.SettingsBindFlags.DEFAULT)
    row.add_suffix(widget)
    row.activatable_widget = widget
    group.add(row)

    row = new Adw.ActionRow({
      title: "Scroll wraparound",
      subtitle: "Scrolling past the last workspace will wrap around to the first one (and viceversa)"
    })
    widget = new Gtk.Switch({
      valign: Gtk.Align.CENTER
    })
    settings.bind("scroll-wraparound", widget, "active", Gio.SettingsBindFlags.DEFAULT)
    row.add_suffix(widget)
    row.activatable_widget = widget
    group.add(row)

    row = new Adw.ActionRow({
      title: "Inverse scroll",
      subtitle: "Invert the direction of scrolling"
    })
    widget = new Gtk.Switch({
      valign: Gtk.Align.CENTER
    })
    settings.bind("scroll-inverse", widget, "active", Gio.SettingsBindFlags.DEFAULT)
    row.add_suffix(widget)
    row.activatable_widget = widget
    group.add(row)

    row = new Adw.ActionRow({
      title: "Middle click closes app",
      subtitle: "Clicking with the middle mouse button on an app icon will close the app"
    })
    widget = new Gtk.Switch({
      valign: Gtk.Align.CENTER
    })
    settings.bind("middle-click-close-app", widget, "active", Gio.SettingsBindFlags.DEFAULT)
    row.add_suffix(widget)
    row.activatable_widget = widget
    group.add(row)

    row = new Adw.ActionRow({
      title: "Click on current workspace triggers overview",
      subtitle: "Clicking on the current active workspace will trigger the overview"
    })
    widget = new Gtk.Switch({
      valign: Gtk.Align.CENTER
    })
    settings.bind("click-on-active-overview", widget, "active", Gio.SettingsBindFlags.DEFAULT)
    row.add_suffix(widget)
    row.activatable_widget = widget
    group.add(row)

    row = new Adw.ActionRow({
      title: "Click on focused application to minimize",
      subtitle: "Clicking on the current focused application will minimize it"
    })
    widget = new Gtk.Switch({
      valign: Gtk.Align.CENTER
    })
    settings.bind("click-on-focus-minimize", widget, "active", Gio.SettingsBindFlags.DEFAULT)
    row.add_suffix(widget)
    row.activatable_widget = widget
    group.add(row)

    return group
  }

  _page2_group1(settings) {
    const group = new Adw.PreferencesGroup({
      title: "Indicator appearance",
      description: ""
    })

    let row, widget

    row = new Adw.ActionRow({
      title: "Active workspace indicator",
      subtitle: "Show an indicator below the current active workspace"
    })
    widget = new Gtk.Switch({
      valign: Gtk.Align.CENTER
    })
    settings.bind("indicator-show-active-workspace", widget, "active", Gio.SettingsBindFlags.DEFAULT)
    row.add_suffix(widget)
    row.activatable_widget = widget
    group.add(row)

    row = new Adw.ActionRow({
      title: "Focused app indicator",
      subtitle: "Show an indicator above the current focused app"
    })
    widget = new Gtk.Switch({
      valign: Gtk.Align.CENTER
    })
    settings.bind("indicator-show-focused-app", widget, "active", Gio.SettingsBindFlags.DEFAULT)
    row.add_suffix(widget)
    row.activatable_widget = widget
    group.add(row)

    row = new Adw.ActionRow({
      title: "Indicators color",
      subtitle: "Color of active workspace and focused app indicators"
    })
    const rgba = new Gdk.RGBA()
    rgba.parse(settings.get_string("indicator-color"))
    widget = new Gtk.ColorButton({
      rgba: rgba,
      show_editor: true,
      use_alpha: true,
      visible: true,
      valign: Gtk.Align.CENTER
    })
    widget.connect("color-set", w => { settings.set_string("indicator-color", w.get_rgba().to_string()) })
    row.add_suffix(widget)
    row.activatable_widget = widget
    group.add(row)

    row = new Adw.ActionRow({
      title: "Round indicators borders",
      subtitle: "Round borders of active workspace and focused app indicators"
    })
    widget = new Gtk.Switch({
      valign: Gtk.Align.CENTER
    })
    settings.bind("indicator-round-borders", widget, "active", Gio.SettingsBindFlags.DEFAULT)
    row.add_suffix(widget)
    row.activatable_widget = widget
    group.add(row)

    row = new Adw.ActionRow({
      title: "Swap indicators position",
      subtitle: "Move active app indicator to bottom and active workspace to top. This could break centering of labels, fix it manually using Spacing settings below"
    })
    widget = new Gtk.Switch({
      valign: Gtk.Align.CENTER
    })
    settings.bind("indicator-swap-position", widget, "active", Gio.SettingsBindFlags.DEFAULT)
    row.add_suffix(widget)
    row.activatable_widget = widget
    group.add(row)

    row = new Adw.ActionRow({
      title: "Show background for active workspace",
      subtitle: "Show a background box around the current active workspace indicator"
    })
    widget = new Gtk.Switch({
      valign: Gtk.Align.CENTER
    })
    settings.bind("indicator-show-background", widget, "active", Gio.SettingsBindFlags.DEFAULT)
    row.add_suffix(widget)
    row.activatable_widget = widget
    group.add(row)

    row = new Adw.ActionRow({
      title: "Background color",
      subtitle: "Background color for the active workspace indicator"
    })
    const bgRgba = new Gdk.RGBA()
    bgRgba.parse(settings.get_string("indicator-background-color"))
    widget = new Gtk.ColorButton({
      rgba: bgRgba,
      show_editor: true,
      use_alpha: true,
      visible: true,
      valign: Gtk.Align.CENTER
    })
    widget.connect("color-set", w => { settings.set_string("indicator-background-color", w.get_rgba().to_string()) })
    row.add_suffix(widget)
    row.activatable_widget = widget
    group.add(row)

    row = new Adw.ActionRow({
      title: "Background padding",
      subtitle: "Padding around the workspace indicator background (affects both label and icons). Default: 4"
    })
    widget = new Gtk.SpinButton({
      valign: Gtk.Align.CENTER
    })
    widget.set_sensitive(true)
    widget.set_range(0, 20)
    widget.set_value(settings.get_int("indicator-background-padding"))
    widget.set_increments(1, 2)
    widget.connect("value-changed", w => { settings.set_int("indicator-background-padding", w.get_value_as_int()) })
    row.add_suffix(widget)
    row.activatable_widget = widget
    group.add(row)

    row = new Adw.ActionRow({
      title: "Use theme color for text",
      subtitle: "Use the theme color for workspace text labels (similar to how icons are colored)"
    })
    widget = new Gtk.Switch({
      valign: Gtk.Align.CENTER
    })
    settings.bind("indicator-text-use-theme-color", widget, "active", Gio.SettingsBindFlags.DEFAULT)
    row.add_suffix(widget)
    row.activatable_widget = widget
    group.add(row)

    return group
  }

  _page2_group2(settings) {
    const group = new Adw.PreferencesGroup({
      title: "Workspaces appearance",
      description: ""
    })

    let row, widget

    row = new Adw.ActionRow({
      title: "Show workspace names",
      subtitle: "Show the workspace names before the workspace icons"
    })
    widget = new Gtk.Switch({
      valign: Gtk.Align.CENTER
    })
    settings.bind("indicator-show-indexes", widget, "active", Gio.SettingsBindFlags.DEFAULT)
    row.add_suffix(widget)
    row.activatable_widget = widget
    group.add(row)

    row = new Adw.ActionRow({
      title: "Hide empty workspaces indicator",
      subtitle: "Hides the name of empty workspaces"
    })
    widget = new Gtk.Switch({
      valign: Gtk.Align.CENTER
    })
    settings.bind("indicator-hide-empty", widget, "active", Gio.SettingsBindFlags.DEFAULT)
    row.add_suffix(widget)
    row.activatable_widget = widget
    group.add(row)

    row = new Adw.ActionRow({
      title: "Apps on all workspaces indicator text",
      subtitle: "Text indicator to show when there are apps on all workspaces"
    })
    widget = new Gtk.Entry({
      halign: Gtk.Align.END,
      valign: Gtk.Align.CENTER,
      hexpand: true,
      xalign: 0,
    })
    widget.set_text(settings.get_string("indicator-all-text"))
    widget.connect("changed", w => {
      if (w.get_text().length > 0) {
        settings.set_string("indicator-all-text", w.get_text())
      } else {
        settings.set_string("indicator-all-text", "ALL")
      }
    })
    row.add_suffix(widget)
    row.activatable_widget = widget
    group.add(row)

    row = new Adw.ActionRow({
      title: "Use custom names for workspaces",
      subtitle: "Display custom names instead of indexes. Enabling this settings activates the rename workspace UI (right click on workspace/keyboard shortcut)"
    })
    widget = new Gtk.Switch({
      valign: Gtk.Align.CENTER
    })
    settings.bind("indicator-use-custom-names", widget, "active", Gio.SettingsBindFlags.DEFAULT)
    row.add_suffix(widget)
    row.activatable_widget = widget
    group.add(row)

    row = new Adw.ActionRow({
      title: "Rename active workspace shortcut",
      subtitle: "Keyboard shortcut to rename the currently active workspace. If 'Use custom names for workspaces' is off, workspace renaming is disabled"
    })
    widget = new Gtk.Entry({
      halign: Gtk.Align.END,
      valign: Gtk.Align.CENTER,
      hexpand: true,
      xalign: 0.5,
      width_chars: 20,
      placeholder_text: "<Super><Shift>r",
    })
    widget.set_text(settings.get_strv("rename-workspace-shortcut")[0] || "")
    widget.connect("changed", w => {
      const shortcut = w.get_text().trim()
      // Only save if non-empty and contains typical keybinding patterns
      if (shortcut.length > 0) {
        settings.set_strv("rename-workspace-shortcut", [shortcut])
        widget.remove_css_class("error")
      } else if (shortcut.length > 0) {
        // Show error state but don't save invalid shortcut
        widget.add_css_class("error")
      } else {
        // Empty input: remove error state
        widget.remove_css_class("error")
      }
    })
    row.add_suffix(widget)
    row.activatable_widget = widget
    group.add(row)

    return group
  }

  _page2_group3(settings) {
    const group = new Adw.PreferencesGroup({
      title: "Icons appearance",
      description: ""
    })

    let row, widget

    row = new Adw.ActionRow({
      title: "Use symbolic icons",
      subtitle: "Use symbolic icons for apps"
    })
    widget = new Gtk.Switch({
      valign: Gtk.Align.CENTER
    })
    settings.bind("apps-symbolic-icons", widget, "active", Gio.SettingsBindFlags.DEFAULT)
    row.add_suffix(widget)
    row.activatable_widget = widget
    group.add(row)

    row = new Adw.ActionRow({
      title: "Desaturate all apps icons",
      subtitle: "Show only black and white apps icons"
    })
    widget = new Gtk.Switch({
      valign: Gtk.Align.CENTER
    })
    settings.bind("apps-all-desaturate", widget, "active", Gio.SettingsBindFlags.DEFAULT)
    row.add_suffix(widget)
    row.activatable_widget = widget
    group.add(row)

    row = new Adw.ActionRow({
      title: "Inactive apps effect",
      subtitle: "Effect to apply to inactive (not focused) apps icons"
    })
    widget = new Gtk.ComboBoxText({
      valign: Gtk.Align.CENTER
    })
    widget.append("NOTHING", "Nothing")
    widget.append("REDUCE OPACITY", "Reduce opacity")
    widget.append("DESATURATE", "Desaturate")
    settings.bind("apps-inactive-effect", widget, "active-id", Gio.SettingsBindFlags.DEFAULT)
    row.add_suffix(widget)
    row.activatable_widget = widget
    group.add(row)

    row = new Adw.ActionRow({
      title: "Minimized apps effect",
      subtitle: "Effect to apply to minimized apps icons"
    })
    widget = new Gtk.ComboBoxText({
      valign: Gtk.Align.CENTER
    })
    widget.append("NOTHING", "Nothing")
    widget.append("REDUCE OPACITY", "Reduce opacity")
    widget.append("DESATURATE", "Desaturate")
    settings.bind("apps-minimized-effect", widget, "active-id", Gio.SettingsBindFlags.DEFAULT)
    row.add_suffix(widget)
    row.activatable_widget = widget
    group.add(row)

    row = new Adw.ActionRow({
      title: "Show window title",
      subtitle: "Display the window title alongside the application icon"
    })
    widget = new Gtk.Switch({
      valign: Gtk.Align.CENTER
    })
    settings.bind("apps-show-window-title", widget, "active", Gio.SettingsBindFlags.DEFAULT)
    row.add_suffix(widget)
    row.activatable_widget = widget
    group.add(row)

    return group
  }

  _page2_group4(settings) {
    const group = new Adw.PreferencesGroup({
      title: "Size and spacing",
      description: ""
    })

    let row, widget

    row = new Adw.ActionRow({
      title: "Application icon size",
      subtitle: "Size of a single application icon. The icon is limited by the panel height (edit panel height with extensions like Just Perfection). Default: 20"
    })
    widget = new Gtk.SpinButton({
      valign: Gtk.Align.CENTER
    })
    widget.set_sensitive(true)
    widget.set_range(1, 50)
    widget.set_value(settings.get_int("size-app-icon"))
    widget.set_increments(1, 2)
    widget.connect("value-changed", w => { settings.set_int("size-app-icon", w.get_value_as_int()) })
    row.add_suffix(widget)
    row.activatable_widget = widget
    group.add(row)

    row = new Adw.ActionRow({
      title: "Labels font size",
      subtitle: "Font sizes for all labels (workspace name, apps groups). Default: 12"
    })
    widget = new Gtk.SpinButton({
      valign: Gtk.Align.CENTER
    })
    widget.set_sensitive(true)
    widget.set_range(1, 50)
    widget.set_value(settings.get_int("size-labels"))
    widget.set_increments(1, 2)
    widget.connect("value-changed", w => { settings.set_int("size-labels", w.get_value_as_int()) })
    row.add_suffix(widget)
    row.activatable_widget = widget
    group.add(row)

    row = new Adw.ActionRow({
      title: "Workspace spacing left",
      subtitle: "Left spacing for a workspace indicator. Default: 2"
    })
    widget = new Gtk.SpinButton({
      valign: Gtk.Align.CENTER
    })
    widget.set_sensitive(true)
    widget.set_range(0, 50)
    widget.set_value(settings.get_int("spacing-workspace-left"))
    widget.set_increments(1, 2)
    widget.connect("value-changed", w => { settings.set_int("spacing-workspace-left", w.get_value_as_int()) })
    row.add_suffix(widget)
    row.activatable_widget = widget
    group.add(row)

    row = new Adw.ActionRow({
      title: "Workspace spacing right",
      subtitle: "Right spacing for a workspace indicator. Default: 2"
    })
    widget = new Gtk.SpinButton({
      valign: Gtk.Align.CENTER
    })
    widget.set_sensitive(true)
    widget.set_range(0, 50)
    widget.set_value(settings.get_int("spacing-workspace-right"))
    widget.set_increments(1, 2)
    widget.connect("value-changed", w => { settings.set_int("spacing-workspace-right", w.get_value_as_int()) })
    row.add_suffix(widget)
    row.activatable_widget = widget
    group.add(row)

    row = new Adw.ActionRow({
      title: "Label spacing left",
      subtitle: "Left spacing for a workspace label. Default: 2"
    })
    widget = new Gtk.SpinButton({
      valign: Gtk.Align.CENTER
    })
    widget.set_sensitive(true)
    widget.set_range(0, 50)
    widget.set_value(settings.get_int("spacing-label-left"))
    widget.set_increments(1, 2)
    widget.connect("value-changed", w => { settings.set_int("spacing-label-left", w.get_value_as_int()) })
    row.add_suffix(widget)
    row.activatable_widget = widget
    group.add(row)

    row = new Adw.ActionRow({
      title: "Label spacing right",
      subtitle: "Right spacing for a workspace label. Default: 2"
    })
    widget = new Gtk.SpinButton({
      valign: Gtk.Align.CENTER
    })
    widget.set_sensitive(true)
    widget.set_range(0, 50)
    widget.set_value(settings.get_int("spacing-label-right"))
    widget.set_increments(1, 2)
    widget.connect("value-changed", w => { settings.set_int("spacing-label-right", w.get_value_as_int()) })
    row.add_suffix(widget)
    row.activatable_widget = widget
    group.add(row)

    row = new Adw.ActionRow({
      title: "Label spacing top",
      subtitle: "Top spacing for a workspace label. Default: 0"
    })
    widget = new Gtk.SpinButton({
      valign: Gtk.Align.CENTER
    })
    widget.set_sensitive(true)
    widget.set_range(0, 50)
    widget.set_value(settings.get_int("spacing-label-top"))
    widget.set_increments(1, 2)
    widget.connect("value-changed", w => { settings.set_int("spacing-label-top", w.get_value_as_int()) })
    row.add_suffix(widget)
    row.activatable_widget = widget
    group.add(row)

    row = new Adw.ActionRow({
      title: "Label spacing bottom",
      subtitle: "Bottom spacing for a workspace label. Default: 0"
    })
    widget = new Gtk.SpinButton({
      valign: Gtk.Align.CENTER
    })
    widget.set_sensitive(true)
    widget.set_range(0, 50)
    widget.set_value(settings.get_int("spacing-label-bottom"))
    widget.set_increments(1, 2)
    widget.connect("value-changed", w => { settings.set_int("spacing-label-bottom", w.get_value_as_int()) })
    row.add_suffix(widget)
    row.activatable_widget = widget
    group.add(row)

    row = new Adw.ActionRow({
      title: "App icon spacing left",
      subtitle: "Left spacing for an application icon. Default: 0"
    })
    widget = new Gtk.SpinButton({
      valign: Gtk.Align.CENTER
    })
    widget.set_sensitive(true)
    widget.set_range(0, 50)
    widget.set_value(settings.get_int("spacing-app-left"))
    widget.set_increments(1, 2)
    widget.connect("value-changed", w => { settings.set_int("spacing-app-left", w.get_value_as_int()) })
    row.add_suffix(widget)
    row.activatable_widget = widget
    group.add(row)

    row = new Adw.ActionRow({
      title: "App icon spacing right",
      subtitle: "Right spacing for an application icon. Default: 0"
    })
    widget = new Gtk.SpinButton({
      valign: Gtk.Align.CENTER
    })
    widget.set_sensitive(true)
    widget.set_range(0, 50)
    widget.set_value(settings.get_int("spacing-app-right"))
    widget.set_increments(1, 2)
    widget.connect("value-changed", w => { settings.set_int("spacing-app-right", w.get_value_as_int()) })
    row.add_suffix(widget)
    row.activatable_widget = widget
    group.add(row)

    row = new Adw.ActionRow({
      title: "Global size scale",
      subtitle: "Global scale multiplier applied to ALL sizes (icons, spacings, indicators, padding, fonts). For example: 0.5 = half size, 1.0 = normal, 2.0 = double size. Default: 1.0"
    })
    widget = new Gtk.SpinButton({
      valign: Gtk.Align.CENTER,
      digits: 1
    })
    widget.set_sensitive(true)
    widget.set_range(0.5, 5.0)
    widget.set_value(settings.get_double("indicator-height-scale"))
    widget.set_increments(0.5, 0.5)
    widget.connect("value-changed", w => { settings.set_double("indicator-height-scale", w.get_value()) })
    row.add_suffix(widget)
    row.activatable_widget = widget
    group.add(row)

    return group
  }

  _page3_group1(settings) {
    const group = new Adw.PreferencesGroup({
      title: "Icons appearance",
      description: ""
    })

    let row, widget

    row = new Adw.ActionRow({
      title: "Icons limit",
      subtitle: "Maximum number of icons displayed in a single inactive workspace indicator. Active workspace is always unlimited. 0 = unlimited"
    })
    widget = new Gtk.SpinButton({
      valign: Gtk.Align.CENTER
    })
    widget.set_sensitive(true)
    widget.set_range(0, 99)
    widget.set_value(settings.get_int("icons-limit"))
    widget.set_increments(1, 2)
    widget.connect("value-changed", w => { settings.set_int("icons-limit", w.get_value_as_int()) })
    row.add_suffix(widget)
    row.activatable_widget = widget
    group.add(row)

    row = new Adw.ActionRow({
      title: "Group icons of same application",
      subtitle: "Show only one icon for each application in the workspace indicator"
    })
    widget = new Gtk.ComboBoxText({
      valign: Gtk.Align.CENTER
    })
    widget.append("OFF", "Off")
    widget.append("GROUP AND SHOW COUNT", "Group and show count")
    widget.append("GROUP WITHOUT COUNT", "Group without count")
    settings.bind("icons-group", widget, "active-id", Gio.SettingsBindFlags.DEFAULT)
    row.add_suffix(widget)
    row.activatable_widget = widget
    group.add(row)

    return group
  }

  _page3_group2(settings) {
    const group = new Adw.PreferencesGroup({
      title: "Ignored applications",
      description: "List of applications currently ignored (no icons will be shown for them)"
    })

    const ignored_apps = settings.get_strv("icons-ignored")

    if (ignored_apps.length === 0) {
      group.add(new Gtk.Label({
        label: "No currently ignored apps"
      }))
    }

    for (const app of ignored_apps) {
      const row = new Adw.ActionRow({
        title: app
      })
      const widget = new Gtk.Button({
        valign: Gtk.Align.CENTER,
        label: "Reactivate"
      })
      widget.connect("clicked", () => {
        ignored_apps.splice(ignored_apps.indexOf(app), 1)
        settings.set_strv("icons-ignored", ignored_apps)
        row.get_parent().remove(row)
      })
      row.add_suffix(widget)
      row.activatable_widget = widget
      group.add(row)
    }

    return group
  }

  _page3_group3(settings) {
    const group = new Adw.PreferencesGroup({
      title: "Add ignored application",
      description: "Add an application to the list of ignored applications"
    })

    let row, widget

    row = new Adw.ActionRow({
      title: "Log displayed applications ids",
      subtitle: "Console log the ids of the applications currently running, to find the ids of the applications to ignore. Open log with \"journalctl /usr/bin/gnome-shell -f -o cat\""
    })
    widget = new Gtk.Switch({
      valign: Gtk.Align.CENTER
    })
    settings.bind("log-apps-id", widget, "active", Gio.SettingsBindFlags.DEFAULT)
    row.add_suffix(widget)
    row.activatable_widget = widget
    group.add(row)

    row = new Adw.ActionRow({
      title: "Add application to ignore",
      subtitle: "Insert id of the application to ignore. Regular expressions (regex) are supported"
    })
    widget = new Gtk.Entry({
      halign: Gtk.Align.END,
      valign: Gtk.Align.CENTER,
      hexpand: true,
      xalign: 0,
    })
    widget.set_width_chars(25)
    widget.set_placeholder_text("org.gnome.example")
    widget.set_icon_from_icon_name(Gtk.EntryIconPosition.SECONDARY, "object-select-symbolic")
    widget.set_icon_activatable(Gtk.EntryIconPosition.SECONDARY, true)
    widget.connect("icon-press", w => {
      const ignored_apps = settings.get_strv("icons-ignored")
      if (w.get_text().length === 0 || ignored_apps.includes(w.get_text()))
        return
      ignored_apps.push(w.get_text())
      settings.set_strv("icons-ignored", ignored_apps)
    })
    row.add_suffix(widget)
    row.activatable_widget = widget
    group.add(row)

    return group
  }

  _info_label() {
    return new Adw.PreferencesGroup({
      title: "",
      description: "Closing settings may be necessary to apply modifications",
      halign: Gtk.Align.CENTER
    })
  }

  _about_page() {
    const group = new Adw.PreferencesGroup({
      title: "Workspaces Indicator by Open Apps",
      description: "About this extension"
    })

    let row, widget

    row = new Adw.ActionRow({
      title: "Version"
    })
    widget = new Gtk.Label({
      label: ExtensionPreferences.lookupByUUID("workspaces-by-open-apps@favo02.github.com").metadata.version.toString(),
      valign: Gtk.Align.CENTER
    })
    row.add_suffix(widget)
    group.add(row)

    row = new Adw.ActionRow({
      title: "Source code"
    })
    widget = new Gtk.LinkButton({
      label: "Favo02/workspaces-by-open-apps on GitHub",
      uri: "https://github.com/Favo02/workspaces-by-open-apps",
      valign: Gtk.Align.CENTER,
    })
    row.add_suffix(widget)
    row.activatable_widget = widget
    group.add(row)

    row = new Adw.ActionRow({
      title: "Report a bug / Feature request"
    })
    widget = new Gtk.LinkButton({
      label: "Open an issue on GitHub",
      uri: "https://github.com/Favo02/workspaces-by-open-apps/issues",
      valign: Gtk.Align.CENTER,
    })
    row.add_suffix(widget)
    row.activatable_widget = widget
    group.add(row)

    row = new Adw.ActionRow({
      title: "GNOME extensions store"
    })
    widget = new Gtk.LinkButton({
      label: "Workspaces indicator by open apps",
      uri: "https://extensions.gnome.org/extension/5967/workspaces-indicator-by-open-apps/",
      valign: Gtk.Align.CENTER,
    })
    row.add_suffix(widget)
    row.activatable_widget = widget
    group.add(row)

    return group
  }

  _star_label() {
    return new Adw.PreferencesGroup({
      title: "",
      description: "Do not forget to leave a star if you like this extension!",
      halign: Gtk.Align.CENTER
    })
  }
}
