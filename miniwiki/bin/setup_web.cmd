@echo on

cd /d "%~dp0"

if "%EMULATED%"=="true" if DEFINED APPCMD goto emulator_setup
if "%EMULATED%"== "true" exit /b 0

echo Granting permissions for Network Service to the web root directory...
icacls ..\ /grant "Network Service":(OI)(CI)W
if %ERRORLEVEL% neq 0 goto error
echo OK

echo Ensuring the "%programfiles(x86)%\nodejs" directory exists...
md "%programfiles(x86)%\nodejs"

echo Copying node.exe to the "%programfiles(x86)%\nodejs" directory...
copy /y node.exe "%programfiles(x86)%\nodejs" 
if %ERRORLEVEL% neq 0 goto error
echo OK

echo Copying web.cloud.config to web.config...
copy /y ..\Web.cloud.config ..\Web.config
if %ERRORLEVEL% neq 0 goto error
echo OK

echo Installing Visual Studio 2010 C++ Redistributable Package...
vcredist_x64.exe /q 
if %ERRORLEVEL% neq 0 goto error
echo OK

echo Installing iisnode...
msiexec.exe /quiet /i iisnode.msi
if %ERRORLEVEL neq 0 goto error
echo OK

echo SUCCESS
exit /b 0

:error

echo FAILED
exit /b -1

:emulator_setup
echo Running in emulator adding iisnode to application host config
FOR /F "tokens=1,2 delims=/" %%a in ("%APPCMD%") DO set FN=%%a&set OPN=%%b
if "%OPN%"=="%OPN:apphostconfig:=%" (
    echo "Could not parse appcmd '%appcmd% for configuration file, exiting"
    goto error
)

set IISNODE_BINARY_DIRECTORY=%programfiles%\Microsoft SDKs\Windows Azure\PowerShell\Azure\x86
if "%PROCESSOR_ARCHITECTURE%"=="AMD64" set IISNODE_BINARY_DIRECTORY=%programfiles(x86)%\Microsoft SDKs\Windows Azure\PowerShell\Azure\x64

echo "Using iisnode binaries location '%IISNODE_BINARY_DIRECTORY%'"
echo installing iisnode module using AppCMD alias %appcmd%
%appcmd% install module /name:"iisnode" /image:"%IISNODE_BINARY_DIRECTORY%\iisnode.dll"

set apphostconfigfile=%OPN:apphostconfig:=%
powershell -c "set-executionpolicy unrestricted"
powershell .\ChangeConfig.ps1 %apphostconfigfile%
if %ERRORLEVEL% neq 0 goto error

if "%PROCESSOR_ARCHITECTURE%"=="AMD64" set 
copy /y "%IISNODE_BINARY_DIRECTORY%\iisnode_schema.xml" "%programfiles%\IIS Express\config\schema\iisnode_schema.xml"
if %ERRORLEVEL% neq 0 goto error
exit /b 0