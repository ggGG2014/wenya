@echo off
REM 文芽项目启动脚本

echo ============================================================
echo 文芽项目启动中...
echo ============================================================

REM 设置 Node.js 路径
set PATH=C:\Program Files\nodejs;%PATH%

REM 启动后端
echo.
echo [1/2] 启动 Flask 后端...
start "文芽后端" cmd /k "cd /d %~dp0 && python app.py"
timeout /t 3 >nul

REM 启动前端
echo.
echo [2/2] 启动 Vue 前端...
start "文芽前端" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ============================================================
echo 启动完成！
echo ============================================================
echo.
echo 后端地址：http://localhost:5000
echo 前端地址：http://localhost:5173
echo.
echo 测试账号：test_student / Passw0rd123
echo ============================================================
