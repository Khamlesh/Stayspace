@echo off
echo Compiling StaySpace C++ Core Engine (64-bit)...
"C:\Program Files (x86)\Dev-Cpp\MinGW64\bin\g++.exe" -std=c++11 -o stayspace_core.exe CPP/main.cpp CPP/Database/MySqlConnector.cpp CPP/Database/DatabaseConnection.cpp CPP/Utils/HashUtils.cpp CPP/Authentication/Auth.cpp CPP/Property/Property.cpp
if %ERRORLEVEL% NEQ 0 (
    echo Compilation failed.
    exit /b %ERRORLEVEL%
)
echo Compilation successful! Created stayspace_core.exe
