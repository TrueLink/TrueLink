@echo off
if [%1]==[] (
	for %%a in ("Multivalue", "Tlke", "Tlec", "Tlgr") do (	
		cd %%a
		npm test
		pause
		cd ..
	)
) else (
	cd .\%1 & npm test & cd ..
) 