SETLOCAL

@REM:===========================================================================
@REM: Description : Run a bugfix
@REM: Author      : Daniel S. A. Khan (c) 2022
@REM: Date        : 14-03-2022
@REM: Version  	  : 1.0
@REM:===========================================================================


@REM: ================= Globale variabelen ======================================


IF "%~1" == "" GOTO JIRATAGERR
IF "%~2" == "" GOTO COMMENTERR
IF "%~3" == "" GOTO VERSIONERR


git flow bugfix start  %~1
git add --all
git commit -m "%~2"
git push --set-upstream origin bugfix/%~1
git flow bugfix finish -F %~1
git flow release start %~3
call npm version %~3
git flow release finish %~3 -m "fixed %~1"


git push -u origin HEAD:main
git push -u origin HEAD:develop
git push origin --tags



:DONE
@ECHO - -------------------------------------------------
@ECHO - SUCCES: Uitvoering van [%PROGNAME%] succesvol beindigd.
@ECHO - -------------------------------------------------
GOTO SUCCESS


		

:JIRATAGERR
@ECHO - -------------------------------------------------		
@ECHO - ERROR: Didn't add Any Jira Tag, Leaving
@ECHO - -------------------------------------------------		
EXIT /B 1
GOTO ERROR	

:COMMENTERR
@ECHO - -------------------------------------------------		
@ECHO - ERROR: Didn't add Any commit message, Leaving
@ECHO - -------------------------------------------------		
EXIT /B 1
GOTO ERROR	

:VERSIONERR
@ECHO - -------------------------------------------------		
@ECHO - ERROR: Didn't add any version, Leaving
@ECHO - -------------------------------------------------		
EXIT /B 1
GOTO ERROR	

:ERROR
@ECHO - -------------------------------------------------		
@ECHO - ERROR:  Het programma %PROGNAME% is met een fout geeindigd
@ECHO - -------------------------------------------------		

GOTO FINAL	

:SUCCESS
@ECHO - -------------------------------------------------
@ECHO - SUCCES: Uitvoering van [%PROGNAME%] succesvol beindigd.
@ECHO - -------------------------------------------------
ENDLOCAL
@ECHO ON


:FINAL
@ECHO - ==========================================================================
@ECHO - FIN
@ECHO - ==========================================================================
ENDLOCAL
@ECHO ON

EXIT /B 0

@REM:===========================================================================
@REM: Change History:                                                              
@REM: $Log: $
@REM:===========================================================================

@REM: CVS stamp
@REM: $Author: decaan $
@REM: $Branch$
@REM: $CommitId: a104c5e76fa1793 $
@REM: $Date: 2011/05/29 05:59:51 $
@REM: $Header: /home/cvs/CVSR/ICS\040logLib/bin/_clean.bat,v 1.1 2011/05/29 05:59:51 decaan Exp $
@REM: $RCSHeader$
@REM: $Id: _clean.bat,v 1.1 2011/05/29 05:59:51 decaan Exp $
@REM: $Name:  $
@REM: $Locker:  $
@REM: $rcsfile$
@REM: $Revision: 1.1 $
@REM: $Source: /home/cvs/CVSR/ICS\040logLib/bin/_clean.bat,v $
@REM: $State: Exp $le$
@REM: 1.1
@REM: /home/cvs/CVSR/ICS\040Cassey\0402011/env/Env.bat,v
@REM: Exp