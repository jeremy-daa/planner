# How to Test Cron Jobs Locally (Windows)

Since `vercel.json` cron jobs only run automatically when deployed to Vercel, you need a way to trigger them locally on your PC for testing.

## Option 1: Manual Trigger (Easiest)
Simply open your browser or use Postman/Curl to visit:
`http://localhost:3000/api/cron/reminders`

## Option 2: Automate with Windows Task Scheduler (PowerShell)

1.  **Create a PowerShell Script**:
    Create a file named `trigger-cron.ps1` in your project folder:
    ```powershell
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/cron/reminders" -Method Get
    Write-Host "Cron Triggered: $($response.StatusCode)"
    ```

2.  **Schedule it**:
    *   Open **Task Scheduler** (Search in Start Menu).
    *   Click **Create Basic Task** -> Name it "Planner Cron".
    *   Trigger: **Daily** -> Recur every: 1 days -> Repeat task every: **30 minutes**.
    *   Action: **Start a program**.
    *   Program/script: `powershell.exe`
    *   Add arguments: `-File "D:\Planner\planner\trigger-cron.ps1"` (Use full path).

## Option 3: Simple Loop (For Development Session)
Just run this in a separate PowerShell terminal while you code:

```powershell
while ($true) {
    Invoke-WebRequest -Uri "http://localhost:3000/api/cron/reminders"
    Write-Host "Triggered Cron at $(Get-Date)"
    Start-Sleep -Seconds 1800 # 30 minutes
}
```
