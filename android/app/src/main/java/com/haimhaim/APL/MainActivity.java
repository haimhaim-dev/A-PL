package com.haimhaim.APL;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebView;
import android.app.AlertDialog;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;

/**
 * 하드웨어 뒤로가기 제어 및 딥링크(auth/callback) 처리
 */
public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // 1. 기존 뒤로가기 로직
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                WebView webView = getBridge() != null ? getBridge().getWebView() : null;
                if (webView != null && webView.canGoBack()) {
                    webView.goBack();
                } else {
                    new AlertDialog.Builder(MainActivity.this)
                            .setMessage("종료하시겠습니까?")
                            .setPositiveButton("예", (d, w) -> finish())
                            .setNegativeButton("아니오", (d, w) -> d.dismiss())
                            .setCancelable(true)
                            .show();
                }
            }
        });

        // 2. 앱 실행 시 딥링크 확인
        handleDeepLink(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        // 3. 앱이 이미 켜져 있을 때 딥링크 호출 시 처리
        handleDeepLink(intent);
    }

    private void handleDeepLink(Intent intent) {
        Uri data = intent.getData();
        if (data != null && "appl".equals(data.getScheme()) && "auth".equals(data.getHost())) {
            String code = data.getQueryParameter("code");
            if (code != null && !code.isEmpty()) {
                // Supabase 인증 처리를 위한 앱 내부 콜백 페이지로 이동
                String url = "https://a-pl.vercel.app/auth/app-callback?code=" + code;
                
                WebView webView = getBridge() != null ? getBridge().getWebView() : null;
                if (webView != null) {
                    webView.loadUrl(url);
                }
            }
        }
    }
}