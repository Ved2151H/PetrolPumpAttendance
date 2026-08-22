const https = require('https');
const fs = require('fs');

const file = fs.createWriteStream("jdk17.zip");
const url = "https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.12%2B7/OpenJDK17U-jdk_x64_windows_hotspot_17.0.12_7.zip";

https.get(url, function(response) {
  if (response.statusCode === 302 || response.statusCode === 301) {
    https.get(response.headers.location, function(redirectResponse) {
      redirectResponse.pipe(file);
      file.on("finish", () => {
        file.close();
        console.log("Download Completed");
      });
    });
  } else {
    response.pipe(file);
    file.on("finish", () => {
      file.close();
      console.log("Download Completed");
    });
  }
});
