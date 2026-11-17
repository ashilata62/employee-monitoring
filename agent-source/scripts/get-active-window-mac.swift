import Cocoa
import CoreGraphics

// Swift Native macOS Active Window & Application Detector
func getActiveWindow() {
    guard let frontApp = NSWorkspace.shared.frontmostApplication else {
        print("{\"appName\":\"Desktop\",\"windowTitle\":\"Desktop\"}")
        return
    }

    let appName = frontApp.localizedName ?? "Unknown"
    let pid = frontApp.processIdentifier
    var windowTitle = appName

    // Query CGWindowList for window title of frontmost PID
    let options = CGWindowListOption(arrayLiteral: .excludeDesktopElements, .optionOnScreenOnly)
    if let windowListInfo = CGWindowListCopyWindowInfo(options, kCGNullWindowID) as? [[String: Any]] {
        for info in windowListInfo {
            if let windowPID = info[kCGWindowOwnerPID as String] as? pid_t, windowPID == pid {
                // Check layer 0 (standard normal window layer)
                if let layer = info[kCGWindowLayer as String] as? Int, layer == 0 {
                    if let title = info[kCGWindowName as String] as? String, !title.isEmpty {
                        windowTitle = title
                        break
                    }
                }
            }
        }
    }

    // Escape quotes for clean JSON output
    let cleanApp = appName.replacingOccurrences(of: "\"", with: "\\\"")
    let cleanTitle = windowTitle.replacingOccurrences(of: "\"", with: "\\\"")
    print("{\"appName\":\"\(cleanApp)\",\"windowTitle\":\"\(cleanTitle)\"}")
}

getActiveWindow()
