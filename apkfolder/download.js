const https = require('https');
const fs = require('fs');

const file = fs.createWriteStream("gradle.zip");
https.get("https://services.gradle.org/distributions/gradle-8.7-bin.zip", function(response) {
  response.pipe(file);
  file.on("finish", () => {
    file.close();
    console.log("Download Completed");
  });
});
