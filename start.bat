@echo off
title AttendanceX - Smart Attendance System
echo ========================================================
echo        Starting AttendanceX Full-Stack Application
echo ========================================================
echo.

echo [1/2] Starting Backend Server (Express + SQLite3 on Port 5000)...
start "AttendanceX Backend (Port 5000)" cmd /k "cd server && npm start"

echo [2/2] Starting Frontend Client (Vite React on Port 5173)...
start "AttendanceX Frontend (Port 5173)" cmd /k "cd client && npm run dev"

echo.
echo ========================================================
echo Servers started successfully!
echo Frontend: http://localhost:5173
echo Backend API: http://localhost:5000
echo ========================================================
timeout /t 3 >nul
start http://localhost:5173
