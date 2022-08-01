
if [ -n "$1" ]; then

    buildPath=$1
    echo "build path: ${buildPath}"

    cp -rf dist/ ${buildPath}/
    echo "copy to ${buildPath}"

fi