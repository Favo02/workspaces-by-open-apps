const St = imports.gi.St;
const Shell = imports.gi.Shell;
const Main = imports.ui.main;

// initialize extension
function init() {
  return new WorkspaceIndicator();
}

// extension workspace indicator
class WorkspaceIndicator {
  constructor() {
    this._buttons = [];
    this._handle_sc;
    this._handle_wm; 
  }

  enable() {
    this._handle_sc = global.display.connect('restacked', this.refresh);
    this._handle_wm = global.window_manager.connect('switch-workspace', this.refresh);
    this.refresh();
  }
  
  disable() {
    this._buttons.splice(0).forEach(b => b.destroy());
    global.display.disconnect(this._handle_sc);
    global.window_manager.disconnect(this._handle_wm);
  }

  refresh() {
    this._buttons.splice(0).forEach(b => b.destroy());
    for (let i = 0; i < global.workspace_manager.get_n_workspaces(); i++) {
      this.create_indicator_button(i);
    }
  }

  create_indicator_button(index) {
    const isActive = global.workspace_manager.get_active_workspace_index() == index;
    const workspace = global.workspace_manager.get_workspace_by_index(index);
    const windows = workspace.list_windows();

    // empty workspace
    if (!windows.length) {
      return;
    }
    
    const button = new St.Bin({
      style_class: 'single-workspace',
      reactive:    true,
      can_focus:   true,
      track_hover: true,
      child:       new St.BoxLayout({style_class : ''})
    });
    this._buttons.push(button);

    // switch to workspace on click
    button.connect('button-press-event', () => workspace.activate(global.get_current_time()));

    // create apps icons
    this.create_indicator_icons(button, windows);
    this.create_indicator_label(button, index);
    this.create_indicator_style(button, isActive);

    // add to panel
    Main.panel["_leftBox"].insert_child_at_index(button, index);
  }

  create_indicator_icons(button, windows) {
    global.display.sort_windows_by_stacking(windows)
      .reverse()
      .map(win => Shell.WindowTracker.get_default().get_window_app(win))
      .filter(this.filter_unique_apps())
      .map(app => app.create_icon_texture(16))
      .map(tex => new St.Bin({style_class: 'app-icon', style: '', child: tex}))
      .forEach(ico => button.get_child().add_child(ico));
  }

  filter_unique_apps() {
    const ids = {};
    return (app) => {
      if (ids[app.id]) {
        return false;
      }
      ids[app.id] = true;
      return true;
    };
  }
  
  create_indicator_label(button, index) {
    const txt = (index + 1).toString();
    button.get_child().insert_child_at_index(new St.Label({text: txt}), 0);
  }
  
  create_indicator_style(button, active) {
    if (!active)
      return;
    button.pseudo_class = (button.pseudo_class || '');
  }

}
