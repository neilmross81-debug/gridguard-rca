/* ==========================================================================
   TotalRCA Native Bridge (Capacitor Preferences, Filesystem/Share, App, RevenueCat)
   Safe no-op fallback when running on Web.
   ========================================================================== */

(function () {
  const RC_ENTITLEMENT = 'totalrca_pro';
  const RC_API_KEYS = {
    ios: '',
    android: 'goog_uDdJOTBZUNmhlcWfhRoMqtZAqqj',
  };

  const cap = () => window.Capacitor || null;
  const isNative = () => !!(cap() && typeof cap().isNativePlatform === 'function' && cap().isNativePlatform());
  const platform = () => (cap() && typeof cap().getPlatform === 'function' ? cap().getPlatform() : 'web');
  const plugin = (name) => (cap() && cap().Plugins ? cap().Plugins[name] : null);

  let rcConfigured = false;
  let proActive = false;

  function loadLocalProFallback() {
    try {
      return localStorage.getItem('totalrca_pro_v1') === '1';
    } catch (_) {
      return false;
    }
  }

  function saveLocalProFallback(val) {
    proActive = !!val;
    try {
      localStorage.setItem('totalrca_pro_v1', proActive ? '1' : '0');
    } catch (_) {}
    window.dispatchEvent(new CustomEvent('totalrca:pro-changed', { detail: { isPro: proActive } }));
  }

  async function initStorageMirror(storeKey, onHydrated, hadLocalBeforeBoot = false) {
    const Prefs = plugin('Preferences');
    if (!isNative() || !Prefs) return;
    try {
      const [{ value }, { value: prefTsRaw }] = await Promise.all([
        Prefs.get({ key: storeKey }),
        Prefs.get({ key: `${storeKey}:ts` }),
      ]);
      if (!value || typeof value !== 'string') return;
      const localTs = Number(localStorage.getItem(`${storeKey}:ts`) || '0');
      const prefTs = Number(prefTsRaw || '0');
      if (!hadLocalBeforeBoot || prefTs > localTs) {
        localStorage.setItem(storeKey, value);
        if (prefTs) localStorage.setItem(`${storeKey}:ts`, String(prefTs));
        if (typeof onHydrated === 'function') onHydrated();
      }
    } catch (_) {}
  }

  async function mirrorSave(storeKey, jsonStr) {
    const ts = String(Date.now());
    try { localStorage.setItem(`${storeKey}:ts`, ts); } catch (_) {}
    const Prefs = plugin('Preferences');
    if (!isNative() || !Prefs) return;
    try {
      await Promise.all([
        Prefs.set({ key: storeKey, value: jsonStr }),
        Prefs.set({ key: `${storeKey}:ts`, value: ts }),
      ]);
    } catch (_) {}
  }

  async function initPurchases() {
    proActive = loadLocalProFallback();
    const Purchases = plugin('Purchases');
    if (!isNative() || !Purchases) return proActive;

    const plat = platform();
    const apiKey = RC_API_KEYS[plat] || '';
    if (!apiKey) return proActive;

    try {
      if (!rcConfigured) {
        await Purchases.configure({ apiKey });
        rcConfigured = true;
      }
      const info = await Purchases.getCustomerInfo();
      const active = !!(info && info.customerInfo && info.customerInfo.entitlements && info.customerInfo.entitlements.active && info.customerInfo.entitlements.active[RC_ENTITLEMENT]);
      saveLocalProFallback(active);
    } catch (_) {}
    return proActive;
  }

  async function ensurePurchasesReady() {
    const Purchases = plugin('Purchases');
    if (!isNative() || !Purchases) {
      throw new Error('In-app purchases are only available in the iOS & Android store apps.');
    }
    if (!rcConfigured) {
      await initPurchases();
    }
    if (!rcConfigured) {
      throw new Error('Store billing is currently unavailable — check your internet connection and try again.');
    }
    return Purchases;
  }

  async function purchasePlan(planId) {
    const Purchases = await ensurePurchasesReady();
    const offerings = await Purchases.getOfferings();
    const current = offerings && offerings.current;
    if (!current || !Array.isArray(current.availablePackages) || !current.availablePackages.length) {
      throw new Error('No store packages available right now.');
    }
    const want = String(planId || '').toLowerCase();
    const rcKey = `$rc_${want}`;
    const pkg = current.availablePackages.find(p =>
      p.identifier === rcKey ||
      p.identifier === want ||
      (p.packageType && p.packageType.toLowerCase() === want) ||
      (p.product && p.product.identifier && p.product.identifier.toLowerCase().includes(want))
    );
    if (!pkg) {
      throw new Error(`Requested plan (${want}) is not configured in the current offering.`);
    }

    const res = await Purchases.purchasePackage({ aPackage: pkg });
    const active = !!(res && res.customerInfo && res.customerInfo.entitlements && res.customerInfo.entitlements.active && res.customerInfo.entitlements.active[RC_ENTITLEMENT]);
    saveLocalProFallback(active);
    return active;
  }

  async function restorePurchases() {
    const Purchases = plugin('Purchases');
    if (!isNative() || !Purchases) return proActive;
    if (!rcConfigured) await initPurchases();
    if (!rcConfigured) throw new Error('Store billing is unavailable offline.');
    const res = await Purchases.restorePurchases();
    const active = !!(res && res.customerInfo && res.customerInfo.entitlements && res.customerInfo.entitlements.active && res.customerInfo.entitlements.active[RC_ENTITLEMENT]);
    saveLocalProFallback(active);
    return active;
  }

  async function shareFile(filename, base64OrText, isBase64 = false) {
    const Filesystem = plugin('Filesystem');
    const Share = plugin('Share');
    if (!isNative() || !Filesystem || !Share) return false;
    try {
      const writeOpts = {
        path: filename,
        data: base64OrText,
        directory: 'CACHE',
      };
      if (!isBase64) writeOpts.encoding = 'utf8';
      const saved = await Filesystem.writeFile(writeOpts);
      await Share.share({
        title: filename,
        url: saved.uri,
        dialogTitle: `Share ${filename}`,
      });
      return true;
    } catch (_) {
      return false;
    }
  }

  async function shareReportHtml(filename, title, bodyHtml) {
    const html = `<!DOCTYPE html>
<html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${String(title || 'TotalRCA Report').replace(/[<>&"]/g, '')}</title>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#1b1a19;margin:24px;line-height:1.5;font-size:14px}
  h1,h2,h3{color:#0f172a;margin:16px 0 8px} h1{font-size:22px} h2{font-size:17px;border-bottom:1px solid #d1d5db;padding-bottom:4px}
  table{width:100%;border-collapse:collapse;margin:10px 0 18px;font-size:12.5px}
  th,td{border:1px solid #d1d5db;padding:6px 8px;text-align:left;vertical-align:top} th{background:#f3f4f6}
  .chip{display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600;background:#e5e7eb;color:#111827}
  .no-print,.btn,button{display:none!important}
  .card,.report-cover,.report-toc,.report-why,.report-signoff{border:1px solid #d1d5db;border-radius:8px;padding:14px;margin-bottom:12px}
</style></head><body>${bodyHtml}</body></html>`;
    return shareFile(filename, html, false);
  }

  function initBackButton(handlers) {
    const App = plugin('App');
    if (!isNative() || !App || typeof App.addListener !== 'function') return;
    App.addListener('backButton', ({ canGoBack }) => {
      if (handlers && typeof handlers.onBack === 'function' && handlers.onBack()) {
        return;
      }
      if (canGoBack && location.hash && location.hash !== '#/' && location.hash !== '#') {
        history.back();
      } else if (typeof App.minimizeApp === 'function') {
        App.minimizeApp();
      }
    });
  }

  window.TotalRCANative = {
    isNative,
    platform,
    isPro: () => !isNative() || proActive || loadLocalProFallback(),
    setProDev: (v) => saveLocalProFallback(v),
    initStorageMirror,
    mirrorSave,
    initPurchases,
    purchasePlan,
    restorePurchases,
    shareFile,
    shareReportHtml,
    initBackButton,
  };
})();
