package com.alraqamalawwal.app;

import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import java.util.Locale;

public class MainActivity extends BridgeActivity {
    private TextToSpeech tts;
    private boolean isTtsReady = false;

    public class NativeTTSBridge {
        @JavascriptInterface
        public boolean isAvailable() {
            return isTtsReady && tts != null;
        }

        @JavascriptInterface
        public void speak(final String text, final String utteranceId) {
            if (tts == null || !isTtsReady || text == null || text.trim().isEmpty()) {
                return;
            }
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    try {
                        Bundle params = new Bundle();
                        String id = (utteranceId != null && !utteranceId.isEmpty()) ? utteranceId : "tts_" + System.currentTimeMillis();
                        params.putString(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, id);
                        tts.speak(text, TextToSpeech.QUEUE_FLUSH, params, id);
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
            });
        }

        @JavascriptInterface
        public void stop() {
            if (tts != null) {
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        try {
                            tts.stop();
                        } catch (Exception e) {
                            e.printStackTrace();
                        }
                    }
                });
            }
        }
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // 1. تهيئة محرك النطق الصوتي الأصلي للأندرويد (Native Arabic TextToSpeech)
        try {
            tts = new TextToSpeech(this, new TextToSpeech.OnInitListener() {
                @Override
                public void onInit(int status) {
                    if (status == TextToSpeech.SUCCESS) {
                        try {
                            Locale arabicLocale = new Locale("ar", "SA");
                            int result = tts.setLanguage(arabicLocale);
                            if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) {
                                tts.setLanguage(new Locale("ar"));
                            }
                            tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                                @Override
                                public void onStart(String utteranceId) {
                                    notifyJs("window.dispatchEvent(new CustomEvent('nativeTtsStart', { detail: { id: '" + utteranceId + "' } }));");
                                }

                                @Override
                                public void onDone(String utteranceId) {
                                    notifyJs("window.dispatchEvent(new CustomEvent('nativeTtsEnd', { detail: { id: '" + utteranceId + "' } }));");
                                }

                                @Override
                                public void onError(String utteranceId) {
                                    notifyJs("window.dispatchEvent(new CustomEvent('nativeTtsError', { detail: { id: '" + utteranceId + "' } }));");
                                }
                            });
                            isTtsReady = true;
                        } catch (Exception e) {
                            isTtsReady = true;
                        }
                    }
                }
            });
        } catch (Exception e) {
            e.printStackTrace();
        }

        // 2. تمكين الصلاحيات المباشرة للصوت والميكروفون والكاميرا والربط الأصلي داخل WebView
        try {
            WebView webView = this.getBridge().getWebView();
            if (webView != null) {
                webView.getSettings().setMediaPlaybackRequiresUserGesture(false);
                webView.getSettings().setJavaScriptEnabled(true);
                webView.getSettings().setDomStorageEnabled(true);
                webView.addJavascriptInterface(new NativeTTSBridge(), "AndroidNativeTTS");

                webView.setWebChromeClient(new WebChromeClient() {
                    @Override
                    public void onPermissionRequest(final PermissionRequest request) {
                        runOnUiThread(new Runnable() {
                            @Override
                            public void run() {
                                request.grant(request.getResources());
                            }
                        });
                    }
                });
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void notifyJs(final String script) {
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    WebView webView = getBridge().getWebView();
                    if (webView != null) {
                        webView.evaluateJavascript(script, null);
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        });
    }

    @Override
    public void onDestroy() {
        if (tts != null) {
            try {
                tts.stop();
                tts.shutdown();
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        super.onDestroy();
    }
}

