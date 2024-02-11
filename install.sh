#!/bin/bash

BASE_PATH="$(dirname "$(realpath "$0")")"

# remove current extension version
sudo rm -rf ~/.local/share/gnome-shell/extensions/workspaces-by-open-apps@favo02.github.com/

# copy to extensions folder
cp -r "$BASE_PATH/src" ~/.local/share/gnome-shell/extensions/workspaces-by-open-apps@favo02.github.com
