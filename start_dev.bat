@echo off
title Ksar El Boukhari - Dev Server

echo 🚀 Lancement du backend sur le port 10000...
start cmd /k "cd /d C:\ksar-el-boukhari\backend && set PORT=10000 && node index.js"

echo 🌐 Lancement du frontend React...
start cmd /k "cd /d C:\ksar-el-boukhari\frontend && npm start"

echo ✅ Tout est lancé !
pause
