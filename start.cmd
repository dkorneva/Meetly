@echo off
setlocal

node "%~dp0scripts\start.cjs" %*
exit /b %errorlevel%
