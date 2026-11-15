#!/system/bin/sh
# Set Android Monet seed color. Needs shell privileges (adb / Shizuku rish).
# Usage:
#   sh monet.sh <RRGGBB> [STYLE]   e.g. sh monet.sh B388FF VIBRANT
#   sh monet.sh auto [STYLE]       seed from current wallpaper (read from MIUI
#                                  wallpaper service; works around HyperOS bug)
#   sh monet.sh wpcolor            print the current wallpaper color (RRGGBB)
#   sh monet.sh wallpaper          stock wallpaper mode (broken on this phone)
#   sh monet.sh status             show current setting + accent colors
# STYLE: TONAL_SPOT (default) VIBRANT EXPRESSIVE SPRITZ RAINBOW FRUIT_SALAD
#        CONTENT MONOCHROMATIC FIDELITY

KEY=theme_customization_overlay_packages
TS="$(date +%s)000"

# Writing secure settings needs the shell (2000) or root (0) uid.
case "$(id -u)" in
  0|2000) ;;
  *)
    echo "no shell privileges (uid $(id -u))."
    echo "Run through Shevery/Shizuku: install as an ADB module, or use"
    echo "  rish -c 'sh /sdcard/monet.sh auto'"
    exit 2 ;;
esac

status() {
  echo "setting: $(settings get secure $KEY)"
  for c in system_accent1_200 system_accent1_500 system_accent3_200; do
    echo "$c: $(cmd overlay lookup android android:color/$c)"
  done
}

wpcolor() {
  dumpsys activity service com.miui.miwallpaper 2>/dev/null \
    | grep -oE "which=1, .*primaryColors=\[WallpaperColors: [0-9a-f]{8}" \
    | head -1 | grep -oE "[0-9a-f]{8}$" | cut -c3-
}

if [ "$1" = wpcolor ]; then
  C=$(wpcolor); [ -z "$C" ] && exit 1; echo "$C"; exit 0
fi

if [ "$1" = auto ]; then
  C=$(wpcolor)
  [ -z "$C" ] && { echo "could not read wallpaper color"; exit 1; }
  echo "wallpaper color: #$C"
  set -- "$C" "$2"
fi

case "$1" in
  ""|-h|--help)
    sed -n '2,11p' "$0"; exit 1 ;;
  status)
    status; exit 0 ;;
  wallpaper)
    settings put secure $KEY "{\"android.theme.customization.color_source\":\"home_wallpaper\",\"android.theme.customization.theme_style\":\"TONAL_SPOT\",\"android.theme.customization.color_both\":\"1\",\"_applied_timestamp\":$TS}" ;;
  *)
    HEX=$(echo "${1#\#}" | tr 'a-f' 'A-F')
    case "$HEX" in
      [0-9A-F][0-9A-F][0-9A-F][0-9A-F][0-9A-F][0-9A-F]) ;;
      *) echo "invalid color: $1 (want RRGGBB)"; exit 1 ;;
    esac
    STYLE=$(echo "${2:-TONAL_SPOT}" | tr 'a-z' 'A-Z')
    settings put secure $KEY "{\"android.theme.customization.color_source\":\"preset\",\"android.theme.customization.system_palette\":\"FF$HEX\",\"android.theme.customization.accent_color\":\"FF$HEX\",\"android.theme.customization.theme_style\":\"$STYLE\",\"android.theme.customization.color_both\":\"1\",\"_applied_timestamp\":$TS}" ;;
esac

sleep 2
status
