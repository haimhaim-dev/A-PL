package com.haimhaim.APL;

import android.os.Bundle;
import android.webkit.WebView;
import android.app.AlertDialog;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;

/**
 * 하드웨어 뒤로가기: 히스토리 있으면 웹뷰 뒤로가기,
 * 메인 페이지면 "종료하시겠습니까?" 팝업(아니오/예) 후, "예" 선택 시에만 앱 종료.
 */
public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

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
    }
}
