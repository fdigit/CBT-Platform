@echo off
echo Fixing remaining relative import paths...

REM Fix teacher pages
powershell -Command "(Get-Content 'src\app\teacher\lessons\page.tsx') -replace \"from '\.\./\.\./\.\./components/ui/\", \"from '@/components/ui/\" | Set-Content 'src\app\teacher\lessons\page.tsx'"
powershell -Command "(Get-Content 'src\app\teacher\students\page.tsx') -replace \"from '\.\./\.\./\.\./components/ui/\", \"from '@/components/ui/\" | Set-Content 'src\app\teacher\students\page.tsx'"
powershell -Command "(Get-Content 'src\app\teacher\exams\page.tsx') -replace \"from '\.\./\.\./\.\./components/ui/\", \"from '@/components/ui/\" | Set-Content 'src\app\teacher\exams\page.tsx'"
powershell -Command "(Get-Content 'src\app\teacher\classes\page.tsx') -replace \"from '\.\./\.\./\.\./components/ui/\", \"from '@/components/ui/\" | Set-Content 'src\app\teacher\classes\page.tsx'"
powershell -Command "(Get-Content 'src\app\teacher\assignments\page.tsx') -replace \"from '\.\./\.\./\.\./components/ui/\", \"from '@/components/ui/\" | Set-Content 'src\app\teacher\assignments\page.tsx'"

REM Fix student pages
powershell -Command "(Get-Content 'src\app\student\support\page.tsx') -replace \"from '\.\./\.\./\.\./components/ui/\", \"from '@/components/ui/\" | Set-Content 'src\app\student\support\page.tsx'"
powershell -Command "(Get-Content 'src\app\student\results\page.tsx') -replace \"from '\.\./\.\./\.\./components/ui/\", \"from '@/components/ui/\" | Set-Content 'src\app\student\results\page.tsx'"
powershell -Command "(Get-Content 'src\app\student\profile\page.tsx') -replace \"from '\.\./\.\./\.\./components/ui/\", \"from '@/components/ui/\" | Set-Content 'src\app\student\profile\page.tsx'"
powershell -Command "(Get-Content 'src\app\student\exams\page.tsx') -replace \"from '\.\./\.\./\.\./components/ui/\", \"from '@/components/ui/\" | Set-Content 'src\app\student\exams\page.tsx'"

echo Done fixing import paths!
