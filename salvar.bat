@echo off
echo Salvando codigo no Git...
git add .
git commit -m "Salvamento automatico - %date% %time%"
echo.
echo Codigo salvo com sucesso!
echo.
echo Para ver o historico: git log --oneline
echo Para desfazer: git restore arquivo.tsx
pause

