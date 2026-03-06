# PostgreSQL 密码重置脚本 - 需以管理员身份运行
# 右键此文件 -> 使用 PowerShell 运行，或：以管理员身份打开 PowerShell，cd 到项目目录后执行 .\reset-pg-password.ps1

$pgData = "C:\Program Files\PostgreSQL\16\data"
$pgBin = "C:\Program Files\PostgreSQL\16\bin"
$pgHba = "$pgData\pg_hba.conf"
$newPassword = "password"  # 新密码，与 .env 中 DATABASE_URL 一致

Write-Host "1. 停止 PostgreSQL 服务..." -ForegroundColor Cyan
Stop-Service postgresql-x64-16 -Force
Start-Sleep -Seconds 2

Write-Host "2. 修改 pg_hba.conf 为 trust 模式..." -ForegroundColor Cyan
$content = Get-Content $pgHba -Raw
$content = $content -replace '(host\s+all\s+all\s+127\.0\.0\.1/32\s+)scram-sha-256', '${1}trust'
$content = $content -replace '(host\s+all\s+all\s+::1/128\s+)scram-sha-256', '${1}trust'
Set-Content $pgHba -Value $content -NoNewline

Write-Host "3. 启动 PostgreSQL 服务..." -ForegroundColor Cyan
Start-Service postgresql-x64-16
Start-Sleep -Seconds 3

Write-Host "4. 重置 postgres 用户密码..." -ForegroundColor Cyan
$env:PGPASSWORD = $null  # trust 模式无需密码
& "$pgBin\psql.exe" -U postgres -h localhost -c "ALTER USER postgres PASSWORD '$newPassword';"

Write-Host "5. 恢复 pg_hba.conf 为 scram-sha-256..." -ForegroundColor Cyan
$content = Get-Content $pgHba -Raw
$content = $content -replace '(host\s+all\s+all\s+127\.0\.0\.1/32\s+)trust', '${1}scram-sha-256'
$content = $content -replace '(host\s+all\s+all\s+::1/128\s+)trust', '${1}scram-sha-256'
Set-Content $pgHba -Value $content -NoNewline

Write-Host "6. 重新加载配置..." -ForegroundColor Cyan
& "$pgBin\pg_ctl.exe" reload -D $pgData

Write-Host ""
Write-Host "Done. postgres password reset to: $newPassword" -ForegroundColor Green
Write-Host "正在创建数据库 agent_fiverr..."
$env:PGPASSWORD = $newPassword
& "$pgBin\psql.exe" -U postgres -h localhost -c "CREATE DATABASE agent_fiverr;" 2>$null
if ($LASTEXITCODE -eq 0) { Write-Host "Database agent_fiverr created" } else { Write-Host "Database may already exist" }
Write-Host ""
Write-Host "Next: npx prisma db push; npm run db:seed" -ForegroundColor Yellow
