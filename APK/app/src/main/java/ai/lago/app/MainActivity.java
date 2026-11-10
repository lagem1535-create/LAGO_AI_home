package ai.lago.app;

import android.app.Activity;
import android.app.Dialog;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Bundle;
import android.os.Message;
import android.view.ViewGroup;
import android.webkit.CookieManager;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/** LAGO 웹앱을 전체 화면 WebView로 여는 앱. LAGO 주소와 로그인 주소만 앱 안에서 열고, 나머지는 브라우저로 보내요. */
public class MainActivity extends Activity {
    static final String APP_URL = "https://lago-ai-home.lagem1535.workers.dev";
    static final String APP_HOST = "lago-ai-home.lagem1535.workers.dev";
    static final int PICK = 41;

    WebView web;
    Dialog popup;
    ValueCallback<Uri[]> fileCb;

    static boolean isAuth(String host) {
        return host != null && (host.equals("accounts.google.com") || host.endsWith(".firebaseapp.com") || host.endsWith(".web.app") || host.endsWith(".google.com") || host.endsWith(".googleusercontent.com") || host.endsWith(".gstatic.com"));
    }

    static boolean inApp(Uri u) {
        String h = u.getHost();
        return APP_HOST.equals(h) || isAuth(h);
    }

    void setup(WebView w) {
        WebSettings s = w.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setSupportMultipleWindows(true);
        s.setJavaScriptCanOpenWindowsAutomatically(true);
        s.setMediaPlaybackRequiresUserGesture(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        // Google 로그인이 WebView를 막지 않게 "wv" 표시를 빼고, 앱 표시를 붙여요
        String ua = s.getUserAgentString().replace("; wv", "").replaceAll(" Version/\\d+\\.\\d+", "");
        s.setUserAgentString(ua + " LAGOAndroid/" + BuildConfigLite.VERSION);
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(w, true);
    }

    void openOutside(Uri u) {
        try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (ActivityNotFoundException e) { /* 열 앱이 없어요 */ }
    }

    class Client extends WebViewClient {
        @Override
        public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
            Uri u = r.getUrl();
            String sc = u.getScheme();
            if (("https".equals(sc) || "http".equals(sc)) && inApp(u)) return false;
            openOutside(u);
            return true;
        }

        @Override
        public void onReceivedError(WebView v, WebResourceRequest r, WebResourceError e) {
            if (r.isForMainFrame() && v == web) v.loadDataWithBaseURL(null, OFFLINE, "text/html", "utf-8", null);
        }

        @Override
        public void onPageStarted(WebView v, String url, Bitmap f) { }
    }

    class Chrome extends WebChromeClient {
        @Override
        public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb, FileChooserParams p) {
            if (fileCb != null) fileCb.onReceiveValue(null);
            fileCb = cb;
            try {
                startActivityForResult(p.createIntent(), PICK);
            } catch (ActivityNotFoundException e) {
                fileCb = null;
                cb.onReceiveValue(null);
            }
            return true;
        }

        // 로그인 팝업(window.open)은 앱 안의 창으로 띄워요
        @Override
        public boolean onCreateWindow(WebView v, boolean isDialog, boolean userGesture, Message msg) {
            closePopup();
            WebView pw = new WebView(MainActivity.this);
            setup(pw);
            pw.setWebViewClient(new Client());
            pw.setWebChromeClient(new WebChromeClient() {
                @Override
                public void onCloseWindow(WebView w) { closePopup(); }
            });
            popup = new Dialog(MainActivity.this, android.R.style.Theme_Material_Light_NoActionBar);
            popup.setContentView(pw, new ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
            popup.setOnDismissListener(d -> { pw.destroy(); if (popup != null && !popup.isShowing()) popup = null; });
            popup.show();
            ((WebView.WebViewTransport) msg.obj).setWebView(pw);
            msg.sendToTarget();
            return true;
        }

        @Override
        public void onCloseWindow(WebView w) { closePopup(); }
    }

    void closePopup() {
        if (popup != null) { Dialog p = popup; popup = null; p.dismiss(); }
    }

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        web = new WebView(this);
        setContentView(web);
        setup(web);
        web.setWebViewClient(new Client());
        web.setWebChromeClient(new Chrome());
        if (b != null) web.restoreState(b); else web.loadUrl(APP_URL);
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    @Override
    protected void onActivityResult(int req, int res, Intent data) {
        if (req == PICK && fileCb != null) {
            fileCb.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(res, data));
            fileCb = null;
        }
    }

    @Override
    public void onBackPressed() {
        if (web.canGoBack()) web.goBack(); else super.onBackPressed();
    }

    @Override
    protected void onDestroy() {
        closePopup();
        web.destroy();
        super.onDestroy();
    }

    static final String OFFLINE = "<!doctype html><html lang='ko'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'>"
            + "<style>body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:sans-serif;background:#fff;color:#111A33}main{text-align:center;padding:24px}"
            + "b{font-size:28px;color:#2563EB}p{color:#56627A;line-height:1.6}a{display:inline-block;border-radius:11px;padding:10px 20px;font-weight:600;color:#fff;background:linear-gradient(90deg,#2563EB,#16A34A);text-decoration:none}</style></head>"
            + "<body><main><b>LAGO</b><p>인터넷에 연결하지 못했어요.<br>연결을 확인하고 다시 시도해 주세요.</p><a href='" + APP_URL + "'>다시 시도</a></main></body></html>";
}
