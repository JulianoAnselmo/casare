@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

:: ─── Atualizar Produtos ───
:: Escaneia a pasta produtos/ e regenera produtos-data.js
:: Uso: basta dar duplo-clique neste arquivo

cd /d "%~dp0"

set "OUTPUT=produtos-data.js"
set "FIRST_CAT=1"

echo /* Auto-gerado — rode atualizar-produtos.bat para atualizar */ > "%OUTPUT%"
echo const PRODUTOS_DATA = [ >> "%OUTPUT%"

for /d %%D in (produtos\*) do (
    set "CATID=%%~nxD"
    set "CATNAME=%%~nxD"

    :: Capitalize first letter
    for %%A in (A B C D E F G H I J K L M N O P Q R S T U V W X Y Z) do (
        set "CATNAME=!CATNAME:%%A=%%A!"
    )

    set "CAPA="
    if exist "%%D\capa.png" set "CAPA=%%D/capa.png"
    if exist "%%D\capa.jpg" set "CAPA=%%D/capa.jpg"

    if defined CAPA (
        if !FIRST_CAT!==0 echo   , >> "%OUTPUT%"
        set "FIRST_CAT=0"

        :: Replace backslashes with forward slashes in CAPA
        set "CAPA=!CAPA:\=/!"

        echo   { >> "%OUTPUT%"
        echo     "id": "!CATID!", >> "%OUTPUT%"
        echo     "nome": "!CATID!", >> "%OUTPUT%"
        echo     "capa": "!CAPA!", >> "%OUTPUT%"
        echo     "produtos": [ >> "%OUTPUT%"

        set "FIRST_PROD=1"
        for %%F in ("%%D\*.jpg" "%%D\*.jpeg" "%%D\*.png" "%%D\*.webp") do (
            set "FNAME=%%~nxF"
            if /i not "!FNAME!"=="capa.png" if /i not "!FNAME!"=="capa.jpg" (
                set "FPATH=%%F"
                set "FPATH=!FPATH:\=/!"

                :: Build product name from filename (remove extension, replace - with space, remove dimensions)
                set "PNAME=%%~nF"
                set "PNAME=!PNAME:-= !"
                :: Remove common dimension suffixes
                set "PNAME=!PNAME: 708x1024=!"
                set "PNAME=!PNAME: 1=!"

                if !FIRST_PROD!==0 echo       , >> "%OUTPUT%"
                set "FIRST_PROD=0"
                echo       { "img": "!FPATH!", "nome": "!PNAME!" } >> "%OUTPUT%"
            )
        )

        echo     ] >> "%OUTPUT%"
        echo   } >> "%OUTPUT%"
    )
)

echo ]; >> "%OUTPUT%"

echo.
echo ✓ produtos-data.js atualizado com sucesso!
echo   Agora basta recarregar o site no navegador.
echo.
pause
