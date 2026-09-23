package com.uan.pantryguard;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.util.Base64;
import android.webkit.DownloadListener;
import android.widget.Toast;
import androidx.core.content.FileProvider;
import com.getcapacitor.BridgeActivity;
import java.io.File;
import java.io.FileOutputStream;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onResume() {
        super.onResume();
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().setDownloadListener(new DownloadListener() {
                @Override
                public void onDownloadStart(String url, String userAgent, String contentDisposition, String mimetype, long contentLength) {
                    try {
                        if (url != null && url.startsWith("data:")) {
                            String base64Data = url.substring(url.indexOf(",") + 1);
                            byte[] pdfAsBytes = Base64.decode(base64Data, Base64.DEFAULT);

                            File downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                            if (!downloadsDir.exists()) {
                                downloadsDir.mkdirs();
                            }
                            String fileName = "Pantry_Guard_" + System.currentTimeMillis() + ".pdf";
                            File file = new File(downloadsDir, fileName);
                            FileOutputStream fos = new FileOutputStream(file);
                            fos.write(pdfAsBytes);
                            fos.flush();
                            fos.close();

                            Toast.makeText(MainActivity.this, "PDF guardado en Descargas: " + fileName, Toast.LENGTH_SHORT).show();

                            Uri fileUri = FileProvider.getUriForFile(MainActivity.this, getPackageName() + ".fileprovider", file);
                            Intent intent = new Intent(Intent.ACTION_VIEW);
                            intent.setDataAndType(fileUri, "application/pdf");
                            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
                            startActivity(intent);
                        } else if (url != null) {
                            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                            startActivity(intent);
                        }
                    } catch (Exception e) {
                        e.printStackTrace();
                        try {
                            Toast.makeText(MainActivity.this, "Error al procesar descarga: " + e.getMessage(), Toast.LENGTH_SHORT).show();
                        } catch (Exception ignored) {}
                    }
                }
            });
        }
    }
}
