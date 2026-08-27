package com.namrata.attendance.v2;

import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.DownloadListener;
import android.webkit.URLUtil;
import android.app.DownloadManager;
import android.net.Uri;
import android.os.Environment;
import android.content.Context;
import android.widget.Toast;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.util.Base64;
import java.io.File;
import java.io.FileOutputStream;
import android.content.Intent;
import androidx.core.content.FileProvider;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onStart() {
        super.onStart();
        
        WebView webView = this.bridge.getWebView();
        
        // Add JavascriptInterface for Blob and Data download
        webView.addJavascriptInterface(new JavaScriptInterface(this), "AndroidDownloader");

        // Inject script to delay blob revocation so Android has time to intercept it
        webView.setWebViewClient(new com.getcapacitor.BridgeWebViewClient(this.bridge) {
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                view.evaluateJavascript(
                    "if (!window.capacitorRevokeInjected) {" +
                    "  window.capacitorRevokeInjected = true;" +
                    "  var originalRevoke = URL.revokeObjectURL;" +
                    "  URL.revokeObjectURL = function(url) {" +
                    "    setTimeout(function() { originalRevoke(url); }, 15000);" + // delay 15 seconds
                    "  };" +
                    "}", null
                );
            }
        });

        webView.setDownloadListener(new DownloadListener() {
            @Override
            public void onDownloadStart(String url, String userAgent, String contentDisposition, String mimeType, long contentLength) {
                if (url.startsWith("data:")) {
                    // Directly handle Data URLs
                    new JavaScriptInterface(MainActivity.this).getBase64FromBlobData(url, mimeType, contentDisposition);
                } else if (url.startsWith("blob:")) {
                    // Fetch the blob via JS and pass it to Android
                    webView.evaluateJavascript(
                        "javascript:(function() {" +
                        "  var xhr = new XMLHttpRequest();" +
                        "  xhr.open('GET', '" + url + "', true);" +
                        "  xhr.responseType = 'blob';" +
                        "  xhr.onload = function(e) {" +
                        "    if (this.status == 200) {" +
                        "      var blob = this.response;" +
                        "      var reader = new FileReader();" +
                        "      reader.readAsDataURL(blob);" +
                        "      reader.onloadend = function() {" +
                        "        var base64data = reader.result;" +
                        "        AndroidDownloader.getBase64FromBlobData(base64data, '" + mimeType + "', '" + contentDisposition + "');" +
                        "      }" +
                        "    }" +
                        "  };" +
                        "  xhr.send();" +
                        "})();", null);
                } else {
                    try {
                        DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
                        request.setMimeType(mimeType);
                        String cookies = CookieManager.getInstance().getCookie(url);
                        request.addRequestHeader("cookie", cookies);
                        request.addRequestHeader("User-Agent", userAgent);
                        request.setDescription("Downloading file...");
                        request.setTitle(URLUtil.guessFileName(url, contentDisposition, mimeType));
                        request.allowScanningByMediaScanner();
                        request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                        request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, URLUtil.guessFileName(url, contentDisposition, mimeType));
                        DownloadManager dm = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
                        dm.enqueue(request);
                        Toast.makeText(getApplicationContext(), "Downloading File...", Toast.LENGTH_LONG).show();
                    } catch (Exception e) {
                        Toast.makeText(getApplicationContext(), "Download failed: " + e.getMessage(), Toast.LENGTH_LONG).show();
                    }
                }
            }
        });
    }
    
    public class JavaScriptInterface {
        private Context context;
        public JavaScriptInterface(Context context) {
            this.context = context;
        }

        @JavascriptInterface
        public void getBase64FromBlobData(String base64Data, String mimeType, String contentDisposition) {
            try {
                // The base64Data looks like "data:image/png;base64,iVBORw0K..."
                String base64File = base64Data.substring(base64Data.indexOf(",") + 1);
                byte[] fileAsBytes = Base64.decode(base64File, Base64.DEFAULT);

                String fileName = "downloaded_file";
                if (contentDisposition != null && contentDisposition.contains("filename=")) {
                    try {
                        fileName = contentDisposition.split("filename=")[1].replace("\"", "");
                    } catch(Exception e) {}
                } else {
                    if (mimeType.contains("pdf")) fileName = "document_" + System.currentTimeMillis() + ".pdf";
                    else if (mimeType.contains("excel") || mimeType.contains("spreadsheet") || mimeType.contains("xlsx")) fileName = "export_" + System.currentTimeMillis() + ".xlsx";
                    else if (mimeType.contains("csv")) fileName = "data_" + System.currentTimeMillis() + ".csv";
                    else if (mimeType.contains("png")) fileName = "image_" + System.currentTimeMillis() + ".png";
                    else if (mimeType.contains("jpeg") || mimeType.contains("jpg")) fileName = "image_" + System.currentTimeMillis() + ".jpg";
                    else fileName = "download_" + System.currentTimeMillis();
                }

                File path = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                File file = new File(path, fileName);
                FileOutputStream os = new FileOutputStream(file);
                os.write(fileAsBytes);
                os.flush();
                os.close();

                // Notify download manager so user can tap it to open
                DownloadManager dm = (DownloadManager) context.getSystemService(Context.DOWNLOAD_SERVICE);
                if (dm != null) {
                    dm.addCompletedDownload(fileName, fileName, true, mimeType, file.getAbsolutePath(), file.length(), true);
                }

                final String finalFileName = fileName;
                android.os.Handler handler = new android.os.Handler(android.os.Looper.getMainLooper());
                handler.post(() -> {
                    Toast.makeText(context, "Saved to Downloads: " + finalFileName, Toast.LENGTH_LONG).show();
                    
                    // Attempt to open the file automatically
                    try {
                        Intent intent = new Intent(Intent.ACTION_VIEW);
                        Uri uri = FileProvider.getUriForFile(context, context.getPackageName() + ".fileprovider", file);
                        intent.setDataAndType(uri, mimeType);
                        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        context.startActivity(intent);
                    } catch (Exception e) {
                        // Ignore if no app can open it
                    }
                });

            } catch (Exception e) {
                e.printStackTrace();
                android.os.Handler handler = new android.os.Handler(android.os.Looper.getMainLooper());
                handler.post(() -> Toast.makeText(context, "Download failed", Toast.LENGTH_LONG).show());
            }
        }
    }
}
