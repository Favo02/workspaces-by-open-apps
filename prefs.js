const { Gio, Gtk, Gdk } = imports.gi
const Me = imports.misc.extensionUtils.getCurrentExtension()

function init() {}

function buildPrefsWidget() {
  const settings = imports.misc.extensionUtils.getSettings(
    "org.gnome.shell.extensions.workspaces-indicator-by-open-apps"
  )

  // Create a parent container widget that is auto-centered
  const prefsWidget = new Gtk.CenterBox({
    visible: true,
  })

  // Put contents in a Table-like grid
  const gridWidget = new Gtk.Grid({
    column_spacing: 80,
    row_spacing: 12,
    visible: true,
  })

  prefsWidget.set_center_widget(gridWidget)

  // -------- SETTINGS --------

  let label, widget

	// panel-position
  label = new Gtk.Label({
    label: "Box where the indicator will be inserted",
    hexpand: true,
    halign: Gtk.Align.START,
  })
  widget = new Gtk.ComboBoxText()
  widget.append('LEFT', 'Left')
  widget.append('CENTER', 'Center')
  widget.append('RIGHT', 'Right')
  settings.bind(
    'panel-position',
    widget,
    'active-id',
    Gio.SettingsBindFlags.DEFAULT
  )
  gridWidget.attach(label, 0, 0, 1, 1)
  gridWidget.attach(widget, 1, 0, 1, 1)

	// position
  label = new Gtk.Label({
    label: "Position in panel (index, 0 = first)",
    hexpand: true,
    halign: Gtk.Align.START,
  })
  widget = new Gtk.SpinButton({
    halign: Gtk.Align.END
  })
  widget.set_sensitive(true)
  widget.set_range(0, 50)
  widget.set_value(settings.get_int('position'))
  widget.set_increments(1, 2)
  widget.connect(
    'value-changed',
    w => {
      settings.set_int(
        'position', 
        w.get_value_as_int()
      )
  })
  gridWidget.attach(label, 0, 1, 1, 1)
  gridWidget.attach(widget, 1, 1, 1, 1)

  // icons limit
  label = new Gtk.Label({
    label: "Maximum number of icons per workspace (0 = no limit)",
    hexpand: true,
    halign: Gtk.Align.START,
  })
  widget = new Gtk.SpinButton({
    halign: Gtk.Align.END
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
  gridWidget.attach(label, 0, 2, 1, 1)
  gridWidget.attach(widget, 1, 2, 1, 1)

  // info label
  const info = new Gtk.Label({
    label: '<span foreground="red"><i><b>Close settings to apply modifications below this label (working on a fix)</b></i></span>',
    halign: Gtk.Align.CENTER,
    use_markup: true,
    visible: true,
    margin_top: 10,
    margin_bottom: 10
  })
  gridWidget.attach(info, 0, 3, 2, 1)
	
	// show-focused-app-indicator
  label = new Gtk.Label({
    label: "Show focused app indicator (above app)",
    hexpand: true,
    halign: Gtk.Align.START,
  })
  widget = new Gtk.Switch({
    halign: Gtk.Align.END
  })
  settings.bind(
    "show-focused-app-indicator",
    widget,
    "active",
    Gio.SettingsBindFlags.DEFAULT
  )
  gridWidget.attach(label, 0, 4, 1, 1)
  gridWidget.attach(widget, 1, 4, 1, 1)

	// show-active-workspace-indicator
  label = new Gtk.Label({
    label: "Show active workspace indicator (under workspace)",
    hexpand: true,
    halign: Gtk.Align.START,
  })
  widget = new Gtk.Switch({
    halign: Gtk.Align.END
  })
  settings.bind(
    "show-active-workspace-indicator",
    widget,
    "active",
    Gio.SettingsBindFlags.DEFAULT
  )
  gridWidget.attach(label, 0, 5, 1, 1)
  gridWidget.attach(widget, 1, 5, 1, 1)

	// reduce-inactive-apps-opacity
  label = new Gtk.Label({
    label: "Reduce inactive apps opacity",
    hexpand: true,
    halign: Gtk.Align.START,
  })
  widget = new Gtk.Switch({
    halign: Gtk.Align.END
  })
  settings.bind(
    "reduce-inactive-apps-opacity",
    widget,
    "active",
    Gio.SettingsBindFlags.DEFAULT
  )
  gridWidget.attach(label, 0, 6, 1, 1)
  gridWidget.attach(widget, 1, 6, 1, 1)

	// round-indicators-border
  label = new Gtk.Label({
    label: "Round indicators border",
    hexpand: true,
    halign: Gtk.Align.START,
  })
  widget = new Gtk.Switch({
    halign: Gtk.Align.END
  })
  settings.bind(
    "round-indicators-border",
    widget,
    "active",
    Gio.SettingsBindFlags.DEFAULT
  )
  gridWidget.attach(label, 0, 7, 1, 1)
  gridWidget.attach(widget, 1, 7, 1, 1)

  // show-workspace-index
  label = new Gtk.Label({
    label: "Show workspace index",
    hexpand: true,
    halign: Gtk.Align.START,
  })
  widget = new Gtk.Switch({
    halign: Gtk.Align.END
  })
  settings.bind(
    "show-workspace-index",
    widget,
    "active",
    Gio.SettingsBindFlags.DEFAULT
  )
  gridWidget.attach(label, 0, 8, 1, 1)
  gridWidget.attach(widget, 1, 8, 1, 1)

  // scroll-wraparound
  label = new Gtk.Label({
    label: "Scroll workspaces wraparound",
    hexpand: true,
    halign: Gtk.Align.START,
  })
  widget = new Gtk.Switch({
    halign: Gtk.Align.END
  })
  settings.bind(
    "scroll-wraparound",
    widget,
    "active",
    Gio.SettingsBindFlags.DEFAULT
  )
  gridWidget.attach(label, 0, 9, 1, 1)
  gridWidget.attach(widget, 1, 9, 1, 1)

  // inverse-scroll
  label = new Gtk.Label({
    label: "Inverse workspaces scroll",
    hexpand: true,
    halign: Gtk.Align.START,
  })
  widget = new Gtk.Switch({
    halign: Gtk.Align.END
  })
  settings.bind(
    "inverse-scroll",
    widget,
    "active",
    Gio.SettingsBindFlags.DEFAULT
  )
  gridWidget.attach(label, 0, 10, 1, 1)
  gridWidget.attach(widget, 1, 10, 1, 1)

  // middle-click-close-app
  label = new Gtk.Label({
    label: "Middle click closes application",
    hexpand: true,
    halign: Gtk.Align.START,
  })
  widget = new Gtk.Switch({
    halign: Gtk.Align.END
  })
  settings.bind(
    "middle-click-close-app",
    widget,
    "active",
    Gio.SettingsBindFlags.DEFAULT
  )
  gridWidget.attach(label, 0, 11, 1, 1)
  gridWidget.attach(widget, 1, 11, 1, 1)

  // desaturate-apps
  label = new Gtk.Label({
    label: "Desaturate applications icons",
    hexpand: true,
    halign: Gtk.Align.START,
  })
  widget = new Gtk.Switch({
    halign: Gtk.Align.END
  })
  settings.bind(
    "desaturate-apps",
    widget,
    "active",
    Gio.SettingsBindFlags.DEFAULT
  )
  gridWidget.attach(label, 0, 12, 1, 1)
  gridWidget.attach(widget, 1, 12, 1, 1)

  // hide-empty-workspaces
  label = new Gtk.Label({
    label: "Hide empty workspaces",
    hexpand: true,
    halign: Gtk.Align.START,
  })
  widget = new Gtk.Switch({
    halign: Gtk.Align.END
  })
  settings.bind(
    "hide-empty-workspaces",
    widget,
    "active",
    Gio.SettingsBindFlags.DEFAULT
  )
  gridWidget.attach(label, 0, 13, 1, 1)
  gridWidget.attach(widget, 1, 13, 1, 1)

  // indicators-color
  label = new Gtk.Label({
    label: "Active/Focused indicators color",
    hexpand: true,
    halign: Gtk.Align.START,
  })
  const rgba = new Gdk.RGBA()
  rgba.parse(settings.get_string('indicators-color'))
  widget = new Gtk.ColorButton({
      rgba: rgba,
      show_editor: true,
      use_alpha: true,
      visible: true
  })
  widget.connect(
    'color-set',
    () => {
      settings.set_string(
        'indicators-color',
        widget.get_rgba().to_string()
      )
  })
  gridWidget.attach(label, 0, 14, 1, 1)
  gridWidget.attach(widget, 1, 14, 1, 1)

  // apps-on-all-workspaces-indicator
  const old_value = settings.get_string('apps-on-all-workspaces-indicator')
  label = new Gtk.Label({
    label: "Text for apps on all workspaces (second monitor)",
    hexpand: true,
    halign: Gtk.Align.START,
  })
  widget = new Gtk.Entry({
    halign: Gtk.Align.END,
    valign: Gtk.Align.CENTER,
    hexpand: true,
    xalign: 0,
  })
  widget.set_icon_from_icon_name(Gtk.EntryIconPosition.SECONDARY, 'edit-clear-symbolic')
  widget.set_icon_activatable(Gtk.EntryIconPosition.SECONDARY, true)
  widget.connect('icon-press', (e) => e.set_text(old_value))
  widget.is_entry = true
  widget.set_text(old_value)
  widget.connect(
    'changed',
    e => {
      settings.set_string(
        'apps-on-all-workspaces-indicator',
        e.get_text().length > 0 ? e.get_text() : old_value
      )
    }
  )

  settings.bind(
    "apps-on-all-workspaces-indicator",
    widget,
    "active",
    Gio.SettingsBindFlags.DEFAULT
  )
  gridWidget.attach(label, 0, 15, 1, 1)
  gridWidget.attach(widget, 1, 15, 1, 1)

  // -------- LINKS --------

  const github = new Gtk.Label({
    label: `<a href="https://github.com/Favo02/workspaces-by-open-apps">GitHub source code</a>`,
    halign: Gtk.Align.CENTER,
    use_markup: true,
    visible: true,
    margin_top: 40,
  })
  gridWidget.attach(github, 0, 16, 2, 1)

  const issue = new Gtk.Label({
    label: `<a href="https://github.com/Favo02/workspaces-by-open-apps/issues">Report a bug / Feature request</a>`,
    halign: Gtk.Align.CENTER,
    use_markup: true,
    visible: true,
  })
  gridWidget.attach(issue, 0, 17, 2, 1)

  return prefsWidget
}
