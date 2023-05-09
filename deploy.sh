#!/bin/bash

# remove current extension version
sudo rm -rf ~/.local/share/gnome-shell/extensions/workspaces-by-open-apps@favo02.github.com/

# copy to extensions folder
cp -r ./ ~/.local/share/gnome-shell/extensions/workspaces-by-open-apps@favo02.github.com
