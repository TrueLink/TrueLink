echo off
for %%a in ("Multivalue", "Tlke", "Tlht", "Tlec", "Tlgr") do (	
	cd %%a
	npm test
	pause
	cd ..
)