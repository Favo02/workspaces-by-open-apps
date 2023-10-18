const { Adw, Gio, Gtk, Gdk } = imports.gi
const Me = imports.misc.extensionUtils.getCurrentExtension()

function init() {}

function fillPreferencesWindow(window) {
  window.set_search_enabled(true)

  const settings = imports.misc.extensionUtils.getSettings("org.gnome.shell.extensions.workspaces-indicator-by-open-apps")

  const page1 = new Adw.PreferencesPage({
    name: "page1",
    title: "Position and Behavior",
    icon_name: "preferences-other-symbolic"
  })
  page1.add(page1_group1(settings))
  page1.add(page1_group2(settings))

  const page2 = new Adw.PreferencesPage({
    name: "page2",
    title: "Appearance",
    icon_name: "applications-graphics-symbolic"
  })
  page2.add(page2_group1(settings))
  page2.add(page2_group2(settings))
  page2.add(page2_group3(settings))

  const page3 = new Adw.PreferencesPage({
    name: "page3",
    title: "Hide and ignore apps",
    icon_name: "edit-clear-all-symbolic"
  })
  page3.add(page3_group1(settings))

  const page4 = new Adw.PreferencesPage({
    name: "page4",
    title: "About",
    icon_name: "help-about-symbolic"
  })

  window.add(page1)
  window.add(page2)
  window.add(page3)
  window.add(page4)

  // TODO: ad at end of every page "close settings to apply modifications" label
}

function page1_group1(settings) {
  let group, row, widget

  group = new Adw.PreferencesGroup({
    title: "Position",
    description: ""
  })

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
  widget.connect(
    "value-changed",
    w => {
      settings.set_int(
        "position-index", 
        w.get_value_as_int()
      )
  })
  row.add_suffix(widget)
  row.activatable_widget = widget
  group.add(row)

  return group
}

function page1_group2(settings) {
  let group, row, widget

  group = new Adw.PreferencesGroup({
    title: "Behavior",
    description: ""
  })

  row = new Adw.ActionRow({
    title: "Scroll wraparound",
    subtitle: "Scrolling past the last workspace will wrap around to the first one (and viceversa)"
  })
  widget = new Gtk.Switch({
    valign: Gtk.Align.CENTER
  })
  settings.bind(
    "scroll-wraparound",
    widget,
    "active",
    Gio.SettingsBindFlags.DEFAULT
  )
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
  settings.bind(
    "scroll-inverse",
    widget,
    "active",
    Gio.SettingsBindFlags.DEFAULT
  )
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
  settings.bind(
    "middle-click-close-app",
    widget,
    "active",
    Gio.SettingsBindFlags.DEFAULT
  )
  row.add_suffix(widget)
  row.activatable_widget = widget
  group.add(row)

  return group
}

function page2_group1(settings) {
  let group, row, widget

  group = new Adw.PreferencesGroup({
    title: "Indicator appearance",
    description: ""
  })

  row = new Adw.ActionRow({
    title: "Active workspace indicator",
    subtitle: "Show an indicator below the current active workspace"
  })
  widget = new Gtk.Switch({
    valign: Gtk.Align.CENTER
  })
  settings.bind(
    "indicator-show-active-workspace",
    widget,
    "active",
    Gio.SettingsBindFlags.DEFAULT
  )
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
  settings.bind(
    "indicator-show-focused-app",
    widget,
    "active",
    Gio.SettingsBindFlags.DEFAULT
  )
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
  widget.connect(
    "color-set",
    () => {
      settings.set_string(
        "indicator-color",
        widget.get_rgba().to_string()
      )
  })
  settings.bind(
    "indicator-show-focused-app",
    widget,
    "active",
    Gio.SettingsBindFlags.DEFAULT
  )
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
  settings.bind(
    "indicator-round-borders",
    widget,
    "active",
    Gio.SettingsBindFlags.DEFAULT
  )
  row.add_suffix(widget)
  row.activatable_widget = widget
  group.add(row)

  return group
}

function page2_group2(settings) {
  let group, row, widget

  group = new Adw.PreferencesGroup({
    title: "Workspaces appearance",
    description: ""
  })

  row = new Adw.ActionRow({
    title: "Show workspace names",
    subtitle: "Show the workspace names before the workspace icons"
  })
  widget = new Gtk.Switch({
    valign: Gtk.Align.CENTER
  })
  settings.bind(
    "indicator-show-indexes",
    widget,
    "active",
    Gio.SettingsBindFlags.DEFAULT
  )
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
  settings.bind(
    "indicator-hide-empty",
    widget,
    "active",
    Gio.SettingsBindFlags.DEFAULT
  )
  row.add_suffix(widget)
  row.activatable_widget = widget
  group.add(row)

  row = new Adw.ActionRow({
    title: "Apps on all workspaces indicator text",
    subtitle: "Text indicator to show when there are apps on all workspaces"
  })
  const old_value = settings.get_string("indicator-all-text")
  widget = new Gtk.Entry({
    halign: Gtk.Align.END,
    valign: Gtk.Align.CENTER,
    hexpand: true,
    xalign: 0,
  })
  widget.set_icon_from_icon_name(Gtk.EntryIconPosition.SECONDARY, "edit-clear-symbolic")
  widget.set_icon_activatable(Gtk.EntryIconPosition.SECONDARY, true)
  widget.connect("icon-press", (e) => e.set_text(old_value))
  widget.is_entry = true
  widget.set_text(old_value)
  widget.connect(
    "changed",
    e => {
      settings.set_string(
        "indicator-all-text",
        e.get_text().length > 0 ? e.get_text() : old_value
      )
    }
  )
  row.add_suffix(widget)
  row.activatable_widget = widget
  group.add(row)

  row = new Adw.ActionRow({
    title: "Use custom names for workspaces",
    subtitle: "Display custom (editable by rigth click on workspace) names instead of indexes"
  })
  widget = new Gtk.Switch({
    valign: Gtk.Align.CENTER
  })
  settings.bind(
    "indicator-use-custom-names",
    widget,
    "active",
    Gio.SettingsBindFlags.DEFAULT
  )
  row.add_suffix(widget)
  row.activatable_widget = widget
  group.add(row)

  return group
}

function page2_group3(settings) {
  let group, row, widget

  group = new Adw.PreferencesGroup({
    title: "Icons appearance",
    description: ""
  })

  row = new Adw.ActionRow({
    title: "Desaturate all apps icons",
    subtitle: "Show only black and white apps icons"
  })
  widget = new Gtk.Switch({
    valign: Gtk.Align.CENTER
  })
  settings.bind(
    "apps-all-desaturate",
    widget,
    "active",
    Gio.SettingsBindFlags.DEFAULT
  )
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

  return group
}

function page3_group1(settings) {
  let group, row, widget

  group = new Adw.PreferencesGroup({
    title: "Icons appearance",
    description: ""
  })

  row = new Adw.ActionRow({
    title: "Icons limit",
    subtitle: "Maximum number of icons displayed in a single inactive workspace indicator. Active workspace is always unlimited. 0 = unlimited"
  })
  widget = new Gtk.SpinButton({
    valign: Gtk.Align.CENTER
  })
  widget.set_sensitive(true)
  widget.set_range(0, 99)
  widget.set_value(settings.get_int('icons-limit'))
  widget.set_increments(1, 2)
  widget.connect(
    'value-changed',
    w => {
      settings.set_int(
        'icons-limit', 
        w.get_value_as_int()
      )
  })
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
