echo "Copying GDJS Runtime files to Binaries/Output/release/JSPlatform/Runtime.."

if [ ! -d ../../Binaries/Output/Release_Linux/JsPlatform/Runtime/ ]; then
	mkdir ../../Binaries/Output/Release_Linux/JsPlatform/Runtime/
fi
cp -R ../Runtime/* ../../Binaries/Output/Release_Linux/JsPlatform/Runtime/
rsync -r -u --include=*.js --include=*/ --exclude=* ../../Extensions/  ../../Binaries/Output/Release_Linux/JsPlatform/Runtime/Extensions/

echo "done."