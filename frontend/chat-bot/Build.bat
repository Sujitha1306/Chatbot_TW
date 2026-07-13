RD /s/q Angular-build-project
set config=%1%

CALL ng build --configuration=%config%
cd Angular-build-project
REM ..\7z\7z.exe a %config%.zip *
"C:\Program Files\7-Zip\7z.exe" a %config%.zip *
REM move /Y %config%.zip ..\Build\ovitag_%config%.zip
move /Y %config%.zip E:\Angular-build-project\ovitag_%config%.zip
cd ..
RD /s/q Angular-build-project
