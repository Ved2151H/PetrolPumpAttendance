const https = require('https');
const fs = require('fs');

const file = fs.createWriteStream("gradle-8.11.1.zip");
const url = "https://services.gradle.org/distributions/gradle-8.11.1-bin.zip";

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
