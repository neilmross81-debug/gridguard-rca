$chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$outDir = "c:\Users\neilm\.gemini\antigravity\scratch\gridguard-rca\docs\screenshots"
$userProfile = "C:\Users\neilm\AppData\Local\Temp\chrome_user_profile"
$baseFileUrl = "file:///c:/Users/neilm/.gemini/antigravity/scratch/gridguard-rca/index.html"

$views = @(
    @{ name = "02_dashboard.png"; route = "#/" },
    @{ name = "03_investigations_register.png"; route = "#/investigations" },
    @{ name = "04_rca_overview.png"; route = "#/investigations/rca-osp1-220kv-gis-001/overview" },
    @{ name = "05_timeline_soe.png"; route = "#/investigations/rca-osp1-220kv-gis-001/timeline" },
    @{ name = "06_5whys_diagram.png"; route = "#/investigations/rca-osp1-220kv-gis-001/whys" },
    @{ name = "07_ishikawa_fishbone.png"; route = "#/investigations/rca-osp1-220kv-gis-001/ishikawa" },
    @{ name = "08_fault_tree_fta.png"; route = "#/investigations/rca-osp1-220kv-gis-001/fault_tree" },
    @{ name = "09_barrier_swiss_cheese.png"; route = "#/investigations/rca-osp1-220kv-gis-001/barriers" },
    @{ name = "10_fmea_risk.png"; route = "#/investigations/rca-osp1-220kv-gis-001/fmea" },
    @{ name = "11_capa_tracker.png"; route = "#/investigations/rca-osp1-220kv-gis-001/capa" },
    @{ name = "12_governance_signoffs.png"; route = "#/investigations/rca-osp1-220kv-gis-001/report" }
)

foreach ($v in $views) {
    $targetPath = Join-Path $outDir $v.name
    $url = "$baseFileUrl$($v.route)"
    Write-Host "Capturing $($v.name)..."
    Start-Process -FilePath $chromePath -ArgumentList `
        "--headless=new", `
        "--user-data-dir=$userProfile", `
        "--allow-file-access-from-files", `
        "--force-device-scale-factor=1.5", `
        "--virtual-time-budget=2000", `
        "--screenshot=$targetPath", `
        "--window-size=1440,1050", `
        "`"$url`"" -Wait -NoNewWindow
}

Write-Host "Done capturing screenshots!"
