#!/usr/bin/env bash
# Linux Active Window & Process Detector (Supports X11 with Wayland fallback)

app_name="Unknown"
win_title="Desktop"

# 1. Try X11 via xdotool & xprop
if command -v xdotool >/dev/null 2>&1; then
    win_id=$(xdotool getactivewindow 2>/dev/null)
    if [ -n "$win_id" ]; then
        win_title=$(xdotool getwindowname "$win_id" 2>/dev/null)
        if command -v xprop >/dev/null 2>&1; then
            wm_class=$(xprop -id "$win_id" WM_CLASS 2>/dev/null | awk -F '"' '{print $4}')
            if [ -n "$wm_class" ]; then
                app_name="$wm_class"
            fi
        fi
        if [ "$app_name" = "Unknown" ]; then
            win_pid=$(xdotool getwindowpid "$win_id" 2>/dev/null)
            if [ -n "$win_pid" ] && [ -f "/proc/$win_pid/comm" ]; then
                app_name=$(cat "/proc/$win_pid/comm" 2>/dev/null)
            fi
        fi
    fi
fi

# 2. Wayland fallback via hyprctl or swaymsg if available
if [ "$app_name" = "Unknown" ] && command -v swaymsg >/dev/null 2>&1; then
    focused=$(swaymsg -t get_tree 2>/dev/null | grep -E '"focused": true' -B 10 -A 10)
    if [ -n "$focused" ]; then
        app_name=$(echo "$focused" | grep '"app_id":' | head -n1 | awk -F '"' '{print $4}')
        win_title=$(echo "$focused" | grep '"name":' | head -n1 | awk -F '"' '{print $4}')
    fi
fi

if [ -z "$win_title" ]; then
    win_title="$app_name"
fi

# Clean JSON Output
escaped_app=$(printf '%s' "$app_name" | sed 's/\\/\\\\/g; s/"/\\"/g')
escaped_title=$(printf '%s' "$win_title" | sed 's/\\/\\\\/g; s/"/\\"/g')
printf '{"appName":"%s","windowTitle":"%s"}\n' "$escaped_app" "$escaped_title"
