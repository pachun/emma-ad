#!/bin/sh
# Installs the latest Emma on Linux, or brings an installed copy up to date.
#
#   curl -fsSL https://emmaemail.app/install.sh | sh
#
# Puts the AppImage under ~/.local/share/emma, links it as `emma` in
# ~/.local/bin, and adds Emma to the app menu with its icon. Emma keeps
# itself up to date after that; run this again only to reinstall.

set -eu

data_dir="${XDG_DATA_HOME:-$HOME/.local/share}"
app_dir="$data_dir/emma"
bin_dir="$HOME/.local/bin"
menu_dir="$data_dir/applications"
icon_dir="$data_dir/icons/hicolor/256x256/apps"
appimage="$app_dir/Emma.AppImage"

download_the_latest_emma() {
  mkdir -p "$app_dir"
  echo "Downloading the latest Emma…"
  curl -fL --progress-bar -o "$appimage.downloading" https://emmaemail.app/download/linux/appimage
  mv "$appimage.downloading" "$appimage"
  chmod +x "$appimage"
}

put_emma_on_the_path() {
  mkdir -p "$bin_dir"
  ln -sf "$appimage" "$bin_dir/emma"
}

add_emma_to_the_app_menu() {
  mkdir -p "$menu_dir" "$icon_dir"
  curl -fsSL -o "$icon_dir/emma.png" https://emmaemail.app/app-icon-light.png
  cat > "$menu_dir/emma.desktop" <<DESKTOP
[Desktop Entry]
Type=Application
Name=Emma
Comment=One inbox. Empty.
Exec=$appimage %u
Icon=emma
Terminal=false
Categories=Network;Email;
MimeType=x-scheme-handler/emma;
StartupWMClass=Emma-desktop
DESKTOP
  update-desktop-database "$menu_dir" 2>/dev/null || true
  xdg-mime default emma.desktop x-scheme-handler/emma 2>/dev/null || true
}

download_the_latest_emma
put_emma_on_the_path
add_emma_to_the_app_menu

echo "Emma is installed. Open it from your app menu, or run: emma"
