#!/bin/bash

# remove current extension version
sudo rm -rf ~/.local/share/gnome-shell/extensions/workspaces-by-open-apps@favo02.github.com/

# copy to extensions folder
mkdir ~/.local/share/gnome-shell/extensions/workspaces-by-open-apps@favo02.github.com
cp -r ./schemas ~/.local/share/gnome-shell/extensions/workspaces-by-open-apps@favo02.github.com/
cp ./extension.js ~/.local/share/gnome-shell/extensions/workspaces-by-open-apps@favo02.github.com/
cp ./LICENSE ~/.local/share/gnome-shell/extensions/workspaces-by-open-apps@favo02.github.com/
cp ./metadata.json ~/.local/share/gnome-shell/extensions/workspaces-by-open-apps@favo02.github.com/
cp ./prefs.js ~/.local/share/gnome-shell/extensions/workspaces-by-open-apps@favo02.github.com/
cp ./README.md ~/.local/share/gnome-shell/extensions/workspaces-by-open-apps@favo02.github.com/
cp ./stylesheet.css ~/.local/share/gnome-shell/extensions/workspaces-by-open-apps@favo02.github.com/
