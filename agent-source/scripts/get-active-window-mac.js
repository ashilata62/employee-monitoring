// JavaScript for Automation (JXA) - macOS Active Window Inspector
// Run via: osascript -l JavaScript get-active-window-mac.js
try {
    ObjC.import('Cocoa');
    var app = ObjC.unwrap($.NSWorkspace.sharedWorkspace.frontmostApplication);
    var appName = (app && app.localizedName) ? ObjC.unwrap(app.localizedName) : "Unknown";
    var windowTitle = appName;

    try {
        var sys = Application('System Events');
        var proc = sys.applicationProcesses.byName(appName);
        if (proc && proc.windows.length > 0) {
            var rawTitle = proc.windows[0].name();
            if (rawTitle) windowTitle = rawTitle;
        }
    } catch(e) {}

    var result = {
        appName: appName,
        windowTitle: windowTitle
    };
    console.log(JSON.stringify(result));
} catch (err) {
    console.log(JSON.stringify({ appName: "Desktop", windowTitle: "Desktop" }));
}
