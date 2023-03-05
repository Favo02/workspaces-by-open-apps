const { Clutter, GObject, St, Shell } = imports.gi;

const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;

const workspaceManager = global.workspace_manager;

// initialize extension
function init() {
  return new WorkspaceLayout();
}

// extension workspace indicator
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
    workspaceManager.disconnect(this._workspaceSwitchedSIGNAL);
    workspaceManager.disconnect(this._workspaceAddedSIGNAL);
    workspaceManager.disconnect(this._workspaceRemovedSIGNAL);
    workspaceManager.disconnect(this._workspaceReorderedSIGNAL);

    // disconnect this._windowAddSIGNAL this._windowRemoveSIGNAL
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

    // connect to signals: switch/create/remove/reorder workspace
    this._workspaceSwitchedSIGNAL = workspaceManager.connect_after(
      "workspace-switched",
      this.add_indicators.bind(this)
    );
    this._workspaceAddedSIGNAL = workspaceManager.connect_after(
      "workspace-added",
      this.add_indicators.bind(this)
    );
    this._workspaceRemovedSIGNAL = workspaceManager.connect_after(
      "workspace-removed",
      this.add_indicators.bind(this)
    );
    this._workspaceReorderedSIGNAL = workspaceManager.connect_after(
      "workspaces-reordered",
      this.add_indicators.bind(this)
    );

    this.add_indicators();
  }

  add_indicators() {
    this.destroy_indicators();
    let active_index = workspaceManager.get_active_workspace_index();

    for (let i = 0; i < workspaceManager.get_n_workspaces(); i++) {
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

// single workspace indicator
SingleWorkspace = GObject.registerClass(
  class WorkspaceIndicator extends St.Button {

    _init(workspace, active, skip_taskbar_mode, change_on_click) {
      super._init();
      this.active = active;
      this.workspace = workspace;
      this.skip_taskbar_mode = skip_taskbar_mode;

      this.createIconsContainer()

      this.add_actor(this._iconsContainer);

      this.show_or_hide()

      if (change_on_click) {
        this.connect("clicked", () =>
          this.workspace.activate(global.get_current_time())
        );
      }

      this.show_or_hide();
    }

    // creates and fills the _iconsContainer component
    createIconsContainer() {
      // setup _iconsContainer
      this._iconsContainer = new St.Widget({
        layout_manager: new Clutter.FlowLayout(),
        x_expand: true,
        y_expand: false,
        y_align: Clutter.ActorAlign.CENTER,
        style_class: "single-workspace"
      });

      // get all running apps
      let appSystem = Shell.AppSystem.get_default();
      let runningApps = appSystem.get_running();

      // add icons of apps running in this workspace to _iconsContainer
      runningApps.forEach(app => {
        if (app.is_on_workspace(this.workspace)) {
          const icon = app.get_icon()

          this._appIcon = new St.Icon({
            y_align: Clutter.ActorAlign.CENTER,
            style_class: "app-icon"
          });
          this._appIcon.set_gicon(icon)
    
          this._iconsContainer.add_child(this._appIcon)
        }
      });

      // add active class if current focused workspace
      if (this.active) {
        this._iconsContainer.add_style_class_name("active");
      }
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
