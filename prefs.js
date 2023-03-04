const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

function init() {

}

function buildPrefsWidget() {
	let widget = new PrefsWidget();
	widget.show();
	return widget;
}

const PrefsWidget = new GObject.Class({
	Name:"Prefs.Widget",
	GTypeName: "PrefsWidget",
	Extends: Gtk.Box,
	
	_init: function (params) {
		this.parent(params);
		this.margin = 20;
		this.set_spacing(15);
		this.set_orientation(Gtk.Orientation.VERTICAL);
	}
});
