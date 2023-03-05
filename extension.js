const { Clutter, Gio, GObject, GLib, Meta, St, Shell } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;

const Me = ExtensionUtils.getCurrentExtension();
const workspaceManager = global.workspace_manager;

function getWorkspaceIcons(workspace) {
  let appSystem = Shell.AppSystem.get_default();
  let runningApps = appSystem.get_running();

  let icons = []

  runningApps.forEach(app => {
    if (app.is_on_workspace(workspace)) {
      icons.push(app.get_icon())
    }
  });

  return icons
}

// single workspace icons container
let SingleWorkspace = GObject.registerClass(
  class WorkspaceIndicator extends St.Button {

    _init(workspace, active, skip_taskbar_mode, change_on_click) {
      super._init();
      this.active = active;
      this.workspace = workspace;
      this.skip_taskbar_mode = skip_taskbar_mode;

      // setup icons container
      this._iconsContainer = new St.Widget({
        layout_manager: new Clutter.FlowLayout(),
        x_expand: true,
        y_expand: false,
        y_align: Clutter.ActorAlign.CENTER,
        style_class: "single-workspace"
      });

      // get icons of apps in workspace
      getWorkspaceIcons(this.workspace).forEach(icon => {
        this._statusLabel = new St.Icon({
          y_align: Clutter.ActorAlign.CENTER,
          style_class: "app-icon"
        });
        this._statusLabel.set_gicon(icon)

        this._iconsContainer.add_child(this._statusLabel)
      });

      if (this.active) {
        this._iconsContainer.add_style_class_name("active");
      }

      this.add_actor(this._iconsContainer);

      // Connect signals
      this._windowAddedId = this.workspace.connect("window-added", () =>
        this.show_or_hide()
      );
      this._windowRemovedId = this.workspace.connect("window-removed", () =>
        this.show_or_hide()
      );

      if (change_on_click) {
        this.connect("clicked", () =>
          this.workspace.activate(global.get_current_time())
        );
      }

      this.show_or_hide();
    }

    show_or_hide() {
      if (this.active || this.has_user_window()) {
        this.show();
      } else {
        this.hide();
      }
    }

    has_user_window() {
      let windows = this.workspace.list_windows();

      if (!this.skip_taskbar_mode) {
        return windows.length > 0;
      }

      return windows.some((w) => {
        return !w.is_skip_taskbar();
      });
    }

    destroy() {
      this.workspace.disconnect(this._windowRemovedId);
      this.workspace.disconnect(this._windowAddedId);
      super.destroy();
    }
  }
);

class WorkspaceLayout {
  constructor() {}

  enable() {
    this.indicators = [];
    this.panel_button = null;
    this.box_layout = null;
    this.themeContext = St.ThemeContext.get_for_stage(global.stage);

    this.add_panel_button();
  }

  disable() {
    this.destroy_indicators();
    this.destroy_panel_button();
    workspaceManager.disconnect(this._workspaceSwitchedId);
    workspaceManager.disconnect(this._workspaceAddedId);
    workspaceManager.disconnect(this._workspaceRemovedId);
    workspaceManager.disconnect(this._workspaceReordered);
  }

  add_panel_button() {
    this.destroy_panel_button();
    this.panel_button = new PanelMenu.Button(
      0.0,
      _("Improved Workspace Indicator")
    );
    this.box_layout = new St.BoxLayout();
    this.panel_button.add_actor(this.box_layout);


    let [position] = "left";
    Main.panel.addToStatusArea(
      "improved-workspace-indicator",
      this.panel_button,
      0,
      position
    );
    this._workspaceSwitchedId = workspaceManager.connect_after(
      "workspace-switched",
      this.add_indicators.bind(this)
    );
    this._workspaceAddedId = workspaceManager.connect_after(
      "workspace-added",
      this.add_indicators.bind(this)
    );
    this._workspaceRemovedId = workspaceManager.connect_after(
      "workspace-removed",
      this.add_indicators.bind(this)
    );
    this._workspaceReordered = workspaceManager.connect_after(
      "workspaces-reordered",
      this.add_indicators.bind(this)
    );

    this.add_indicators();
  }

  add_indicators() {
    this.destroy_indicators();
    let active_index = workspaceManager.get_active_workspace_index();
    let i = 0;

    for (; i < workspaceManager.get_n_workspaces(); i++) {
      let workspace = workspaceManager.get_workspace_by_index(i);
      if (workspace !== null) {
        let indicator = new SingleWorkspace(
          workspace,
          i == active_index,
          true,
          true
        );

        this.box_layout.add_actor(indicator);
        this.indicators.push(indicator);
      }
    }
  }

  destroy_indicators() {
    let i = 0;
    for (; i < this.indicators.length; i++) {
      this.indicators[i].destroy();
    }
    this.indicators = [];
  }

  destroy_panel_button() {
    this.destroy_indicators();

    if (this.box_layout !== null) this.box_layout.destroy();
    if (this.panel_button !== null) this.panel_button.destroy();

    this.box_layout = null;
    this.panel_button = null;
  }
}

function init() {
  return new WorkspaceLayout();
}
