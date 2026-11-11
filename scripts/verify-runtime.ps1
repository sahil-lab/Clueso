function Assert-Observed {
    param([bool]$Condition, [string]$Message)
    if (-not $Condition) {
        throw "Runtime verification failed: $Message"
    }
    Write-Host "PASS: $Message"
}

function Invoke-LocalHttp {
    param([string]$Url, [string]$JsonBody = "")
    Add-Type -AssemblyName System.Net.Http
    $handler = [System.Net.Http.HttpClientHandler]::new()
    $handler.UseProxy = $false
    $client = [System.Net.Http.HttpClient]::new($handler)
    $client.Timeout = [TimeSpan]::FromSeconds(20)
    try {
        if ($JsonBody) {
            $content = [System.Net.Http.StringContent]::new($JsonBody, [System.Text.Encoding]::UTF8, "application/json")
            try {
                $response = $client.PostAsync($Url, $content).GetAwaiter().GetResult()
            }
            finally {
                $content.Dispose()
            }
        }
        else {
            $response = $client.GetAsync($Url).GetAwaiter().GetResult()
        }
        try {
            $text = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
            $contentType = $response.Content.Headers.ContentType.ToString()
            $body = $text
            if ($contentType -match "json") {
                $body = $text | ConvertFrom-Json
            }
            return [ordered]@{
                url = $Url
                statusCode = [int]$response.StatusCode
                contentType = $contentType
                body = $body
            }
        }
        finally {
            $response.Dispose()
        }
    }
    finally {
        $client.Dispose()
    }
}

function Get-MigrationSnapshot {
    $sql = "SELECT json_build_object('schemaVersion', schema_version, 'createdAt', created_at, 'migrationCount', (SELECT COUNT(*) FROM flyway_schema_history WHERE success), 'v1Count', (SELECT COUNT(*) FROM flyway_schema_history WHERE version = '1' AND success), 'checksum', (SELECT checksum FROM flyway_schema_history WHERE version = '1')) FROM platform_metadata"
    $output = Invoke-Compose -ComposeArgs @("exec", "-T", "db", "psql", "-U", "clueso", "-d", "clueso", "-Atc", $sql)
    return (($output | Out-String).Trim() | ConvertFrom-Json)
}

function Test-CluesoRuntime {
    $webHealth = Invoke-LocalHttp -Url "http://127.0.0.1:18109/healthz"
    $readiness = Invoke-LocalHttp -Url "http://127.0.0.1:18209/actuator/health/readiness"
    $liveness = Invoke-LocalHttp -Url "http://127.0.0.1:18209/actuator/health/liveness"
    $diagnostic = Invoke-LocalHttp -Url "http://127.0.0.1:18109/api/v1/system/check" -JsonBody '{"label":"runtime-smoke"}'
    Assert-Observed ($webHealth.statusCode -eq 200 -and $webHealth.body.Trim() -eq "ok") "Host web health is HTTP 200 / ok."
    Assert-Observed ($readiness.statusCode -eq 200 -and $readiness.body.status -eq "UP") "Host API readiness is HTTP 200 / UP."
    Assert-Observed ($liveness.statusCode -eq 200 -and $liveness.body.status -eq "UP") "Host API liveness is HTTP 200 / UP."
    Assert-Observed ($diagnostic.statusCode -eq 200 -and $diagnostic.body.label -eq "runtime-smoke" -and $diagnostic.body.schemaVersion -eq 1 -and $diagnostic.body.service -eq "clueso-api" -and $diagnostic.body.status -eq "ready") "Host web proxy completes the actual API/database contract."
    Assert-Observed (@($diagnostic.body.PSObject.Properties).Count -eq 4) "The success response has exactly four fields."

    $ids = @(Invoke-Compose -ComposeArgs @("ps", "--quiet", "db", "api", "web"))
    $containers = Invoke-Docker -Arguments (@("inspect") + $ids) | ConvertFrom-Json
    Assert-Observed ($containers.Count -eq 3) "Exactly three Clueso runtime containers are running."
    $containerEvidence = foreach ($container in $containers) {
        $service = $container.Config.Labels.'com.docker.compose.service'
        Assert-Observed ($container.Config.Labels.'com.docker.compose.project' -eq "clueso") "$service belongs only to Compose project clueso."
        Assert-Observed ($container.HostConfig.Memory -gt 0 -and $container.HostConfig.NanoCpus -gt 0 -and $container.HostConfig.PidsLimit -gt 0) "$service has memory, CPU, and PID limits."
        $ports = @($container.NetworkSettings.Ports.PSObject.Properties | Where-Object { $null -ne $_.Value })
        if ($service -eq "db") {
            Assert-Observed ($ports.Count -eq 0) "PostgreSQL has no published port."
            $attachedNetworks = @($container.NetworkSettings.Networks.PSObject.Properties.Name)
            Assert-Observed ($attachedNetworks.Count -eq 1 -and $attachedNetworks[0] -eq "clueso_runtime") "PostgreSQL is attached only to the private runtime network."
        }
        else {
            $expectedPort = if ($service -eq "web") { "18109" } else { "18209" }
            Assert-Observed ($ports.Count -eq 1) "$service publishes exactly one container port."
            $bindings = @($ports[0].Value)
            Assert-Observed ($bindings.Count -eq 1 -and $bindings[0].HostIp -eq "127.0.0.1" -and $bindings[0].HostPort -eq $expectedPort) "$service publishes only 127.0.0.1:$expectedPort."
            Assert-Observed ($container.Config.User -ne "" -and $container.Config.User -ne "root" -and $container.Config.User -ne "0") "$service runs as a non-root user."
        }
        [ordered]@{
            service = $service
            image = $container.Config.Image
            health = $container.State.Health.Status
            memoryBytes = $container.HostConfig.Memory
            nanoCpus = $container.HostConfig.NanoCpus
            pidsLimit = $container.HostConfig.PidsLimit
            readOnlyRoot = $container.HostConfig.ReadonlyRootfs
            user = $container.Config.User
            publishedPorts = @($ports | ForEach-Object { $_.Value })
        }
    }
    $network = Invoke-Docker -Arguments @("network", "inspect", "clueso_runtime") | ConvertFrom-Json
    Assert-Observed ($network.Internal -eq $true) "The database runtime network is internal."

    $before = Get-MigrationSnapshot
    Assert-Observed ($before.schemaVersion -eq 1 -and $before.migrationCount -eq 1 -and $before.v1Count -eq 1) "Flyway V1 is applied exactly once with schema version 1."

    try {
        Invoke-Compose -ComposeArgs @("stop", "db") -LogName "outage-db-stop.log"
        $unready = Invoke-LocalHttp -Url "http://127.0.0.1:18209/actuator/health/readiness"
        $stillLive = Invoke-LocalHttp -Url "http://127.0.0.1:18209/actuator/health/liveness"
        $unavailable = Invoke-LocalHttp -Url "http://127.0.0.1:18209/api/v1/system/check" -JsonBody '{"label":"outage-smoke"}'
        Assert-Observed ($unready.statusCode -eq 503 -and $unready.body.status -eq "DOWN") "A real database outage makes readiness HTTP 503 / DOWN."
        Assert-Observed ($stillLive.statusCode -eq 200 -and $stillLive.body.status -eq "UP") "Liveness stays HTTP 200 / UP during the database outage."
        Assert-Observed ($unavailable.statusCode -eq 503 -and $unavailable.contentType -match "application/problem\+json") "A real database outage produces an explicit diagnostic HTTP 503 problem."
    }
    finally {
        Invoke-Compose -ComposeArgs @("up", "--detach", "--wait", "--wait-timeout", "120", "db") -LogName "outage-db-recover.log"
        Invoke-Compose -ComposeArgs @("restart", "api") -LogName "api-restart.log"
        Invoke-Compose -ComposeArgs @("up", "--detach", "--wait", "--wait-timeout", "180", "db", "api", "web") -LogName "recovery-up.log"
    }

    $after = Get-MigrationSnapshot
    Assert-Observed (($before | ConvertTo-Json -Compress) -eq ($after | ConvertTo-Json -Compress)) "Metadata and Flyway V1 checksum/count survive database and API restarts unchanged."
    $recovered = Invoke-LocalHttp -Url "http://127.0.0.1:18109/api/v1/system/check" -JsonBody '{"label":"recovery-smoke"}'
    Assert-Observed ($recovered.statusCode -eq 200 -and $recovered.body.schemaVersion -eq 1) "The real web/API/database round trip recovers after restart."

    $logLines = @(Invoke-Compose -ComposeArgs @("logs", "--no-color", "--no-log-prefix", "api") -LogName "api-runtime.log")
    $jsonLogs = @($logLines | Where-Object { $_.ToString().StartsWith("{") } | ForEach-Object { $_.ToString() | ConvertFrom-Json })
    $checks = @($jsonLogs | Where-Object { $_.message -like "system_check_completed*" })
    Assert-Observed ($checks.Count -gt 0) "Observed diagnostic application logs are parseable structured JSON."
    $lastCheck = $checks[-1]
    $trace = @("traceId", "trace.id") | ForEach-Object {
        $property = $lastCheck.PSObject.Properties[$_]
        if ($null -ne $property) { $property.Value }
    }
    Assert-Observed (@($trace | Where-Object { $_ -match "^[a-f0-9]{32}$" }).Count -gt 0) "The actual diagnostic log contains an OpenTelemetry trace ID."
    $logText = $logLines -join "`n"
    $secret = [System.IO.File]::ReadAllText((Join-Path $LocalDir "secrets\spring.datasource.password"))
    Assert-Observed (-not $logText.Contains($secret) -and -not $logText.Contains("runtime-smoke") -and -not $logText.Contains("outage-smoke") -and -not $logText.Contains("recovery-smoke")) "Observed API logs contain neither the local DB secret nor diagnostic labels."

    Save-Json -Name "runtime-results.json" -Value ([ordered]@{
        observedAt = [DateTime]::UtcNow.ToString("o")
        webHealth = $webHealth
        readiness = $readiness
        liveness = $liveness
        diagnostic = $diagnostic
        containers = @($containerEvidence)
        internalNetwork = $network.Internal
        migrationBefore = $before
        outageReadiness = $unready
        outageLiveness = $stillLive
        outageDiagnostic = $unavailable
        migrationAfter = $after
        recoveredDiagnostic = $recovered
        diagnosticLog = $lastCheck
        labelAndSecretAbsentFromLogs = $true
    })
}
