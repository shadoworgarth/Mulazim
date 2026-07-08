import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import { WebView } from "react-native-webview";

import colors from "@/constants/colors";
import { CIRCULARS } from "@/constants/circulars";
import { CIRCULAR_FILES, CIRCULAR_FILE_EXTENSIONS } from "@/constants/circulars-files";
import { PDF_JS_LIB_SOURCE, PDF_WORKER_SOURCE } from "@/constants/pdfjs-lib";

const ACCENT = "#0e7c7c";

function buildAndroidPdfHtml(base64Pdf: string) {
  const safeLib = PDF_JS_LIB_SOURCE.replace(/<\/script/gi, "<\\/script");
  const safeWorker = PDF_WORKER_SOURCE.replace(/<\/script/gi, "<\\/script");

  return `<!DOCTYPE html>
<html dir="rtl">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=6.0, user-scalable=yes" />
<style>
  html, body { margin: 0; padding: 0; background: #525659; }
  #viewer { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 10px 6px; }
  canvas { max-width: 100%; height: auto; box-shadow: 0 1px 6px rgba(0,0,0,0.35); background: #fff; }
  #status { color: #fff; text-align: center; padding: 60px 20px; font-family: -apple-system, sans-serif; font-size: 15px; }
</style>
</head>
<body>
<div id="status">جاري تحضير العارض...</div>
<div id="viewer"></div>
<script>${safeLib}</script>
<script>${safeWorker}</script>
<script>
(function () {
  var statusEl = document.getElementById("status");
  var settled = false;

  function post(payload) {
    try {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify(payload));
      }
    } catch (e) {}
  }

  function showError(message) {
    if (settled) return;
    settled = true;
    statusEl.innerText = "تعذر عرض الملف: " + message;
    statusEl.style.display = "block";
    post({ type: "error", message: String(message) });
  }

  function showSuccess() {
    settled = true;
    statusEl.style.display = "none";
    post({ type: "success" });
  }

  window.onerror = function (message) {
    showError(message);
    return true;
  };
  window.addEventListener("unhandledrejection", function (event) {
    var reason = event && event.reason;
    showError((reason && reason.message) || String(reason));
  });

  var watchdog = setTimeout(function () {
    showError("انتهت مهلة تجهيز الملف");
  }, 18000);

  try {
    if (!window.pdfjsWorker) {
      showError("تعذر تحميل محرك عرض الملف");
      return;
    }
    // No real Worker/Blob is used here on purpose: file:// pages in Android
    // WebViews can silently fail to spin up a Worker from a blob: URL, which
    // hangs forever with no error. Instead we rely on pdf.js's documented
    // "fake worker" fallback: since window.pdfjsWorker is already defined
    // (from the script above) and GlobalWorkerOptions.workerSrc/workerPort
    // are left unset, pdf.js runs parsing on the main thread directly.
    statusEl.innerText = "جاري تحميل الملف...";

    var b64 = "${base64Pdf}";
    var binary = atob(b64);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    window.pdfjsLib.getDocument({ data: bytes }).promise.then(function (pdf) {
      clearTimeout(watchdog);
      var viewer = document.getElementById("viewer");
      showSuccess();

      function renderPage(pageNum) {
        statusEl.innerText = "جاري عرض الصفحة " + pageNum + " من " + pdf.numPages;
        return pdf.getPage(pageNum).then(function (page) {
          var viewport = page.getViewport({ scale: 2 });
          var canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.width = "100%";
          viewer.appendChild(canvas);
          var ctx = canvas.getContext("2d");
          return page.render({ canvasContext: ctx, viewport: viewport }).promise;
        });
      }

      var chain = Promise.resolve();
      var _loop = function (n) {
        chain = chain.then(function () { return renderPage(n); });
      };
      for (var n = 1; n <= pdf.numPages; n++) _loop(n);
      chain.catch(function (err) {
        post({ type: "error", message: "render: " + ((err && err.message) || err) });
      });
    }).catch(function (err) {
      clearTimeout(watchdog);
      showError((err && err.message) || err);
    });
  } catch (e) {
    clearTimeout(watchdog);
    showError(e && e.message ? e.message : e);
  }
})();
</script>
</body>
</html>`;
}

export default function CircularViewerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const numericId = Number(id);

  const entry = useMemo(() => CIRCULARS.find((c) => c.id === numericId), [numericId]);
  const fileModule = CIRCULAR_FILES[numericId];
  const ext = CIRCULAR_FILE_EXTENSIONS[numericId];

  const [localUri, setLocalUri] = useState<string | null>(null);
  const [androidHtmlUri, setAndroidHtmlUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [androidRenderSettled, setAndroidRenderSettled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timeoutId = setTimeout(() => {
      if (!cancelled) {
        cancelled = true;
        setError(
          "تعذر تحميل الملف خلال الوقت المتوقع. إذا كنت تختبر التطبيق عبر Expo Go، فإن الملفات يتم جلبها عبر الشبكة وليس من داخل التطبيق مباشرة؛ في النسخة النهائية المنشورة سيتم تحميل الملف فوراً من داخل التطبيق بدون إنترنت."
        );
      }
    }, 20000);

    async function load() {
      if (!fileModule) {
        clearTimeout(timeoutId);
        return;
      }
      try {
        const asset = Asset.fromModule(fileModule);
        await asset.downloadAsync();
        if (cancelled) return;

        const uri = asset.localUri || asset.uri;
        setLocalUri(uri);

        if (Platform.OS === "android" && ext === "pdf" && uri) {
          const base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          if (cancelled) return;
          const html = buildAndroidPdfHtml(base64);
          const htmlUri = `${FileSystem.cacheDirectory}circular-${numericId}.html`;
          await FileSystem.writeAsStringAsync(htmlUri, html);
          if (cancelled) return;
          setAndroidHtmlUri(htmlUri);
        }
        clearTimeout(timeoutId);
      } catch (e: any) {
        clearTimeout(timeoutId);
        if (!cancelled) setError(e?.message ?? "تعذر تحميل الملف");
      }
    }

    load();
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [fileModule, ext]);

  useEffect(() => {
    if (!androidHtmlUri || Platform.OS !== "android") return;
    setAndroidRenderSettled(false);
    const watchdogId = setTimeout(() => {
      setAndroidRenderSettled((settled) => {
        if (!settled) {
          setError("انتهت مهلة عرض الملف داخل التطبيق");
        }
        return settled;
      });
    }, 22000);
    return () => clearTimeout(watchdogId);
  }, [androidHtmlUri]);

  if (!entry) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>لم يتم العثور على التعميم</Text>
      </View>
    );
  }

  if (!fileModule) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>لا يوجد ملف مرفق لهذا التعميم</Text>
        <Pressable style={styles.linkBtn} onPress={() => Linking.openURL(entry.url)}>
          <Text style={styles.linkBtnText}>فتح صفحة التعميم على موقع الهيئة</Text>
        </Pressable>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.linkBtn} onPress={() => Linking.openURL(entry.pdfUrl)}>
          <Text style={styles.linkBtnText}>فتح الملف في المتصفح</Text>
        </Pressable>
      </View>
    );
  }

  if (!localUri) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={ACCENT} />
        <Text style={styles.loadingText}>جاري التحميل...</Text>
      </View>
    );
  }

  if (ext === "jpg" || ext === "jpeg" || ext === "png") {
    return (
      <View style={styles.imageContainer}>
        <Image source={{ uri: localUri }} style={styles.image} resizeMode="contain" />
      </View>
    );
  }

  if (Platform.OS === "web") {
    return (
      <View style={styles.container}>
        {React.createElement("iframe", {
          src: localUri,
          style: { flex: 1, border: "none", width: "100%", height: "100%" },
          title: entry.title,
        })}
      </View>
    );
  }

  if (Platform.OS === "ios") {
    return (
      <View style={styles.container}>
        <WebView source={{ uri: localUri }} style={styles.webview} originWhitelist={["*"]} />
      </View>
    );
  }

  // Android: render via bundled pdf.js while html is being prepared
  if (!androidHtmlUri) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={ACCENT} />
        <Text style={styles.loadingText}>جاري تجهيز العرض...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: androidHtmlUri }}
        style={styles.webview}
        originWhitelist={["*"]}
        javaScriptEnabled
        domStorageEnabled
        allowFileAccess
        allowingReadAccessToURL={FileSystem.cacheDirectory ?? undefined}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data?.type === "success") {
              setAndroidRenderSettled(true);
            } else if (data?.type === "error") {
              setAndroidRenderSettled(true);
              setError(data.message ? `تعذر عرض الملف: ${data.message}` : "تعذر عرض الملف");
            }
          } catch {
            // ignore malformed messages
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#525659" },
  webview: { flex: 1, backgroundColor: "#525659" },
  imageContainer: { flex: 1, backgroundColor: "#000" },
  image: { flex: 1, width: "100%", height: "100%" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 14,
    backgroundColor: colors.light.background,
  },
  errorText: {
    fontSize: 15,
    color: colors.light.text,
    textAlign: "center",
  },
  loadingText: { fontSize: 13, color: colors.light.mutedForeground },
  linkBtn: {
    backgroundColor: ACCENT,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  linkBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
});
