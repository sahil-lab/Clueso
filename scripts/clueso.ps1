param(
    [ValidateSet("Setup", "Format", "Up", "Verify", "Status")]
    [string]$Action = "Status"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$ComposeFile = Join-Path $ProjectRoot "infra\docker\compose.yaml"
$LocalDir = Join-Path $ProjectRoot ".local"
$EvidenceDir = Join-Path $LocalDir "evidence"
$Utf8 = [System.Text.UTF8Encoding]::new($false)
$PreviousParallelLimit = $env:COMPOSE_PARALLEL_LIMIT
$env:COMPOSE_PARALLEL_LIMIT = "1"
$RunStarted = [DateTime]::UtcNow.ToString("o")

function Save-Json {
    param([string]$Name, [object]$Value)
    $json = $Value | ConvertTo-Json -Depth 20
    [System.IO.File]::WriteAllText((Join-Path $EvidenceDir $Name), $json + "`n", $Utf8)
}

function Invoke-Docker {
    param([string[]]$Arguments, [string]$LogName = "")
    Write-Host ("`n> docker " + ($Arguments -join " "))
    $started = [DateTime]::UtcNow
    $previousErrorPreference = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
        if ($LogName) {
            & docker @Arguments 2>&1 | ForEach-Object { $_.ToString() } | Tee-Object -FilePath (Join-Path $EvidenceDir $LogName)
        }
        else {
            & docker @Arguments 2>&1 | ForEach-Object { $_.ToString() }
        }
        $code = $LASTEXITCODE
    }
    finally {
        $ErrorActionPreference = $previousErrorPreference
    }
    $record = [ordered]@{
        startedAt = $started.ToString("o")
        finishedAt = [DateTime]::UtcNow.ToString("o")
        command = "docker " + ($Arguments -join " ")
        arguments = $Arguments
        exitCode = $code
        log = $LogName
    }
    [System.IO.File]::AppendAllText(
        (Join-Path $EvidenceDir "commands.jsonl"),
        ($record | ConvertTo-Json -Compress) + "`n",
        $Utf8
    )
    if ($code -ne 0) {
        $evidence = "commands.jsonl"
        if ($LogName) {
            $evidence = "$LogName and commands.jsonl"
        }
        throw "Docker command failed with exit code $code. See $evidence."
    }
}

function Invoke-Compose {
    param([string[]]$ComposeArgs, [string]$LogName = "")
    Invoke-Docker -Arguments (@("compose", "--project-name", "clueso", "--file", $ComposeFile) + $ComposeArgs) -LogName $LogName
}

function Initialize-LocalState {
    foreach ($directory in @($LocalDir, $EvidenceDir, (Join-Path $LocalDir "secrets"), (Join-Path $LocalDir "m2"))) {
        [System.IO.Directory]::CreateDirectory($directory) | Out-Null
    }
    $secretPath = Join-Path $LocalDir "secrets\spring.datasource.password"
    if (-not (Test-Path -LiteralPath $secretPath)) {
        $bytes = New-Object byte[] 32
        $random = [System.Security.Cryptography.RandomNumberGenerator]::Create()
        try {
            $random.GetBytes($bytes)
            [System.IO.File]::WriteAllText($secretPath, [Convert]::ToBase64String($bytes), $Utf8)
        }
        finally {
            $random.Dispose()
        }
        Write-Host "Generated the Clueso-only local database secret (value not displayed)."
    }
    elseif ([System.IO.File]::ReadAllText($secretPath).Trim().Length -lt 32) {
        throw "Existing Clueso database secret is invalid. It was not replaced; repair requires an explicit decision."
    }
}

function Get-DependencyFingerprint {
    $paths = @("package.json", "apps\web\package.json", "package-lock.json")
    $hashes = foreach ($path in $paths) {
        $fullPath = Join-Path $ProjectRoot $path
        if (Test-Path -LiteralPath $fullPath) {
            (Get-FileHash -LiteralPath $fullPath -Algorithm SHA256).Hash
        }
    }
    return ($hashes -join ":")
}

function Ensure-Dependencies {
    $stampPath = Join-Path $LocalDir "node-volume-dependencies.sha256"
    $fingerprint = Get-DependencyFingerprint
    if (Test-Path -LiteralPath $stampPath) {
        if ([System.IO.File]::ReadAllText($stampPath) -eq $fingerprint) {
            $probe = "const fs = require('node:fs'); console.log(fs.existsSync('node_modules/.package-lock.json') && fs.existsSync('node_modules/typescript/bin/tsc') ? 'dependencies-present' : 'dependencies-missing');"
            $probeOutput = @(Invoke-Compose -ComposeArgs @("run", "--rm", "--no-deps", "node-tool", "node", "-e", $probe) -LogName "dependency-probe.log")
            if ($probeOutput -contains "dependencies-present") {
                Write-Host "Node dependencies already match the manifests and lockfile."
                return
            }
            Write-Host "Clueso's generated dependency volume is missing its toolchain."
        }
    }
    $installCommand = "install"
    if (Test-Path -LiteralPath (Join-Path $ProjectRoot "package-lock.json")) {
        $installCommand = "ci"
    }
    Write-Host "Restoring generated Node dependencies for the current manifests and lockfile."
    Invoke-Compose -ComposeArgs @("run", "--rm", "--no-deps", "node-tool", "npm", $installCommand, "--no-audit", "--no-fund") -LogName "npm-install.log"
    [System.IO.File]::WriteAllText($stampPath, (Get-DependencyFingerprint), $Utf8)
}

function Build-Artifacts {
    Invoke-Compose -ComposeArgs @("run", "--rm", "--no-deps", "node-tool", "npm", "run", "build") -LogName "web-build.log"
    Invoke-Compose -ComposeArgs @("run", "--rm", "--no-deps", "maven-tool", "mvn", "-B", "-ntp", "-DskipTests", "package") -LogName "api-build.log"
}

function Start-Runtime {
    Invoke-Compose -ComposeArgs @("build", "api", "web") -LogName "images-build.log"
    Invoke-Compose -ComposeArgs @("up", "--detach", "--wait", "--wait-timeout", "180", "db", "api", "web") -LogName "runtime-up.log"
}

Push-Location -LiteralPath $ProjectRoot
try {
    Initialize-LocalState
    Get-Command docker -ErrorAction Stop | Out-Null
    Invoke-Docker -Arguments @("version", "--format", "{{json .}}") -LogName "docker-version.log"
    Invoke-Compose -ComposeArgs @("config", "--quiet")

    switch ($Action) {
        "Setup" {
            Ensure-Dependencies
        }
        "Format" {
            Ensure-Dependencies
            Invoke-Compose -ComposeArgs @("run", "--rm", "--no-deps", "node-tool", "npm", "run", "format") -LogName "format-write.log"
            Invoke-Compose -ComposeArgs @("run", "--rm", "--no-deps", "maven-tool", "mvn", "-B", "-ntp", "spotless:apply") -LogName "java-format.log"
        }
        "Up" {
            Ensure-Dependencies
            Build-Artifacts
            Start-Runtime
        }
        "Verify" {
            Ensure-Dependencies
            Invoke-Compose -ComposeArgs @("run", "--rm", "--no-deps", "node-tool", "npm", "run", "format:check") -LogName "format-check.log"
            Invoke-Compose -ComposeArgs @("run", "--rm", "--no-deps", "node-tool", "npm", "run", "lint") -LogName "lint.log"
            Invoke-Compose -ComposeArgs @("run", "--rm", "--no-deps", "node-tool", "npm", "run", "typecheck") -LogName "typecheck.log"
            Invoke-Compose -ComposeArgs @("run", "--rm", "--no-deps", "node-tool", "npm", "test") -LogName "web-tests.log"
            Invoke-Compose -ComposeArgs @("run", "--rm", "--no-deps", "node-tool", "npm", "run", "build") -LogName "web-build.log"
            try {
                Invoke-Compose -ComposeArgs @("up", "--detach", "--wait", "--wait-timeout", "120", "test-db") -LogName "test-db-up.log"
                Invoke-Compose -ComposeArgs @("run", "--rm", "--no-deps", "maven-tool", "mvn", "-B", "-ntp", "verify") -LogName "api-tests.log"
            }
            finally {
                Invoke-Compose -ComposeArgs @("stop", "test-db") -LogName "test-db-stop.log"
            }
            Start-Runtime
            Invoke-Compose -ComposeArgs @("run", "--rm", "--no-deps", "e2e") -LogName "e2e.log"
            . (Join-Path $PSScriptRoot "verify-runtime.ps1")
            Test-CluesoRuntime
            Save-Json -Name "verification-summary.json" -Value ([ordered]@{
                phase = 1
                status = "passed"
                startedAt = $RunStarted
                finishedAt = [DateTime]::UtcNow.ToString("o")
                project = "clueso"
                web = "http://127.0.0.1:18109"
                api = "http://127.0.0.1:18209"
                remoteCi = "not executed"
                nextPhase = "Phase 2 - not started"
            })
        }
        "Status" {
            Invoke-Compose -ComposeArgs @("ps", "--all")
        }
    }
}
catch {
    if ($Action -eq "Verify" -and (Test-Path -LiteralPath $EvidenceDir)) {
        Save-Json -Name "verification-summary.json" -Value ([ordered]@{
            phase = 1
            status = "failed"
            startedAt = $RunStarted
            finishedAt = [DateTime]::UtcNow.ToString("o")
            error = $_.Exception.Message
        })
    }
    throw
}
finally {
    $env:COMPOSE_PARALLEL_LIMIT = $PreviousParallelLimit
    Pop-Location
}
