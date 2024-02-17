#!/bin/bash

BASE_PATH="$(dirname "$(realpath "$0")")"

# If XDG_DATA_HOME is not set, guess its path
if [[ -z "$XDG_DATA_HOME" ]]; then
    XDG_DATA_HOME="$HOME/.local/share"
fi

ALL_EXTENSIONS_PATH="$XDG_DATA_HOME/gnome-shell/extensions"
EXTENSION_NAME="workspaces-by-open-apps@favo02.github.com"
EXTENSION_PATH="$ALL_EXTENSIONS_PATH/$EXTENSION_NAME"

echo "Extension directory path: $EXTENSION_PATH"

# Ensure that extensions directory exists
if [ ! -d "$ALL_EXTENSIONS_PATH" ]; then
    echo "Extension directory not found. Exiting."
    exit 1
fi

echo "Removing the extension directory..."

# Remove current extension version
sudo rm -rf "$EXTENSION_PATH"

# If 'sudo' or 'rm' failed, exit
if [ $? -ne 0 ]; then
    echo "Removal of the extension directory failed. Exiting."
    exit 1
fi

echo "Copying src/ directory to the extension directory..."

# Copy to extensions folder
cp -r "$BASE_PATH/src" "$EXTENSION_PATH"

if [ $? -ne 0 ]; then
    echo "Copying files failed. Exiting."
    exit 1
fi

echo "Extension updated. Please restart GNOME Shell to apply changes (logout)."
