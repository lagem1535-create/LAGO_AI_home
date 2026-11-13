; 예전 Electron 판 LAGO(0.3.x)가 깔려 있으면 먼저 조용히 지워요. (설치 위치가 달라서 두 개가 남지 않게)
!macro LAGO_REMOVE_OLD KEY
  ReadRegStr $R0 HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${KEY}" "UninstallString"
  ReadRegStr $R1 HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${KEY}" "InstallLocation"
  ${If} $R0 != ""
  ${AndIf} $R1 != ""
  ${AndIf} $R1 != $INSTDIR
    ExecWait '$R0 /S _?=$R1'
    Delete "$R1\Uninstall LAGO.exe"
    RMDir "$R1"
  ${EndIf}
!macroend

!macro NSIS_HOOK_PREINSTALL
  !insertmacro LAGO_REMOVE_OLD "b2cf777d-ad0e-560b-8ed2-d6e7d6178937"
  !insertmacro LAGO_REMOVE_OLD "{b2cf777d-ad0e-560b-8ed2-d6e7d6178937}"
!macroend
