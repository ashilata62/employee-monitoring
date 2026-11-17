Add-Type @"
using System;
using System.Runtime.InteropServices;
public class Win32 {
    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    public static extern int GetWindowText(IntPtr hWnd, System.Text.StringBuilder lpString, int nMaxCount);
    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);
}
"@

$hwnd = [Win32]::GetForegroundWindow()
if ($hwnd -eq [IntPtr]::Zero) { Write-Output '{"appName":"Unknown","title":"","pid":0}'; exit }

$sb = New-Object System.Text.StringBuilder 256
[void][Win32]::GetWindowText($hwnd, $sb, $sb.Capacity)
$title = $sb.ToString()

try {
    [uint32]$procId = 0
    [void][Win32]::GetWindowThreadProcessId($hwnd, [ref]$procId)
    $proc = Get-Process -Id $procId -ErrorAction Stop
    $processName = $proc.ProcessName
    $processPid = $proc.Id
} catch {
    $processName = 'Unknown'
    $processPid = 0
}

$payload = @{appName=$processName; title=$title; pid=$processPid} | ConvertTo-Json -Compress
Write-Output $payload
