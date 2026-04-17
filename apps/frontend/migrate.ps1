# ===============================================================
# Script de migracion a estructura feature-based
# Ejecutar desde: apps/frontend/
# Uso: .\migrate.ps1
# ===============================================================

Write-Host ""
Write-Host "Migrando estructura de LicitaApp frontend..." -ForegroundColor Cyan
Write-Host ""

# --- PASO 1: Crear estructura ---
Write-Host "[1/4] Creando estructura de carpetas..." -ForegroundColor Yellow

$folders = @(
    "src/features/home/components",
    "src/features/home/config",
    "src/features/home/pages",
    "src/features/licitaciones/api",
    "src/features/licitaciones/components",
    "src/features/licitaciones/hooks",
    "src/features/licitaciones/pages",
    "src/components/layout",
    "src/lib",
    "src/providers",
    "src/stores",
    "src/types"
)

foreach ($folder in $folders) {
    if (-not (Test-Path $folder)) {
        New-Item -ItemType Directory -Path $folder -Force | Out-Null
        Write-Host "   [OK] $folder" -ForegroundColor Green
    } else {
        Write-Host "   [--] $folder (ya existe)" -ForegroundColor Gray
    }
}

# --- PASO 2: Eliminar archivos antiguos ---
Write-Host ""
Write-Host "[2/4] Eliminando archivos en ubicaciones antiguas..." -ForegroundColor Yellow

$oldFiles = @(
    "src/api/client.ts",
    "src/api/licitaciones.ts",
    "src/hooks/use-licitaciones.ts",
    "src/components/licitation-card.tsx",
    "src/pages/buscar/home-page.tsx",
    "src/pages/buscar/buscar-page.tsx",
    "src/pages/licitacion/licitacion-page.tsx"
)

foreach ($file in $oldFiles) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "   [OK] Eliminado: $file" -ForegroundColor Green
    } else {
        Write-Host "   [--] No existe: $file" -ForegroundColor Gray
    }
}

# --- PASO 3: Eliminar carpetas vacias ---
Write-Host ""
Write-Host "[3/4] Eliminando carpetas vacias..." -ForegroundColor Yellow

$emptyFolders = @(
    "src/api",
    "src/hooks",
    "src/pages/buscar",
    "src/pages/licitacion",
    "src/pages"
)

foreach ($folder in $emptyFolders) {
    if (Test-Path $folder) {
        $items = Get-ChildItem $folder -Recurse -File -ErrorAction SilentlyContinue
        if ($null -eq $items -or $items.Count -eq 0) {
            Remove-Item $folder -Recurse -Force
            Write-Host "   [OK] Eliminada: $folder" -ForegroundColor Green
        } else {
            Write-Host "   [WARN] $folder tiene archivos, revisar a mano" -ForegroundColor Yellow
        }
    }
}

# --- PASO 4: Verificacion final ---
Write-Host ""
Write-Host "[4/4] Verificando estructura..." -ForegroundColor Yellow

$requiredFolders = @(
    "src/features/home/pages",
    "src/features/licitaciones/components",
    "src/features/licitaciones/pages",
    "src/components/layout",
    "src/lib"
)

$allOk = $true
foreach ($folder in $requiredFolders) {
    if (Test-Path $folder) {
        Write-Host "   [OK] $folder" -ForegroundColor Green
    } else {
        Write-Host "   [FAIL] $folder NO EXISTE" -ForegroundColor Red
        $allOk = $false
    }
}

Write-Host ""
if ($allOk) {
    Write-Host "===============================================" -ForegroundColor Green
    Write-Host "  Estructura migrada correctamente" -ForegroundColor Green
    Write-Host "===============================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Siguiente paso: copia los 19 archivos nuevos a sus rutas" -ForegroundColor Cyan
    Write-Host "(ver MIGRACION.md para la tabla completa)" -ForegroundColor Cyan
} else {
    Write-Host "Algo fallo, revisa los mensajes arriba" -ForegroundColor Red
}

Write-Host ""