@echo off
for %%a in ("Multivalue", "Tlke", "Tlec", "Tlgr") do (	
	cd %%a
	npm test
	pause
	cd ..
)