!macro customUnInstall
  ; Stop any running background/tray instances before removing files
  nsExec::ExecToLog 'taskkill /F /IM "Insightful Agent.exe" /T'
  Sleep 500

  ; Remove Windows Startup entries created at runtime by Electron setLoginItemSettings
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "electron.app.Insightful Agent"
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "Insightful Agent"
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "com.ems.tracker"
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved\Run" "electron.app.Insightful Agent"
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved\Run" "Insightful Agent"

  ; Remove saved session, auth token, and updater cache
  RMDir /r "$APPDATA\insightful-agent"
  RMDir /r "$LOCALAPPDATA\insightful-agent-updater"
!macroend
