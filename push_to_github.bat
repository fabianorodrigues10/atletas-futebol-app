@echo off
chcp 65001 >nul
cls
echo.
echo ========================================
echo  ENVIANDO CÓDIGO PARA GITHUB
echo ========================================
echo.

cd /d "%~dp0"

echo Configurando Git...
git config user.email "fabianorodrigues10@hotmail.com"
git config user.name "Fabiano Rodrigues"

echo.
echo Enviando código para GitHub...
git push -u origin main

echo.
echo ========================================
if %errorlevel% equ 0 (
    echo ✓ SUCESSO! Código enviado para GitHub
    echo.
    echo O Vercel vai fazer o build automaticamente...
    echo Aguarde 2-3 minutos e acesse:
    echo https://marciliodias.app.br
) else (
    echo ✗ ERRO! Verifique a mensagem acima
)
echo ========================================
echo.
pause
