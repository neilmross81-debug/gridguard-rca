/* ==========================================================================
   TotalRCA Native Bridge (Capacitor Preferences, Filesystem/Share, RevenueCat)
   Safe no-op fallback when running on Web.
   ========================================================================== */

(function () {
  const RC_ENTITLEMENT = 'pro';
  // Replace these with your RevenueCat public SDK keys when ready for store builds:
  const RC_API_KEYS = {
    ios: '',
    android: '',
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

  async function initStorageMirror(storeKey, onHydrated) {
    const Prefs = plugin('Preferences');
    if (!isNative() || !Prefs) return;
    try {
      const { value } = await Prefs.get({ key: storeKey });
      if (value && typeof value === 'string') {
        const current = localStorage.getItem(storeKey);
        if (!current || value.length > current.length) {
          localStorage.setItem(storeKey, value);
          if (typeof onHydrated === 'function') onHydrated();
        }
      }
    } catch (_) {}
  }

  async function mirrorSave(storeKey, jsonStr) {
    const Prefs = plugin('Preferences');
    if (!isNative() || !Prefs) return;
    try {
      await Prefs.set({ key: storeKey, value: jsonStr });
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

  async function purchasePlan(planId) {
    const Purchases = plugin('Purchases');
    if (!isNative() || !Purchases || !rcConfigured) {
      throw new Error('In-app purchases are active in the iOS & Android store builds once RevenueCat API keys are configured.');
    }
    const offerings = await Purchases.getOfferings();
    const current = offerings && offerings.current;
    if (!current || !Array.isArray(current.availablePackages)) {
      throw new Error('No store packages available right now.');
    }
    const pkg = current.availablePackages.find(p =>
      p.identifier === planId ||
      p.packageType?.toLowerCase() === planId ||
      p.product?.identifier?.includes(planId)
    ) || current.availablePackages[0];

    const res = await Purchases.purchasePackage({ aPackage: pkg });
    const active = !!(res && res.customerInfo && res.customerInfo.entitlements && res.customerInfo.entitlements.active && res.customerInfo.entitlements.active[RC_ENTITLEMENT]);
    saveLocalProFallback(active);
    return active;
  }

  async function restorePurchases() {
    const Purchases = plugin('Purchases');
    if (!isNative() || !Purchases || !rcConfigured) {
      return proActive;
    }
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

  window.TotalRCANative = {
    isNative,
    platform,
    isPro: () => proActive || loadLocalProFallback(),
    setProDev: (v) => saveLocalProFallback(v),
    initStorageMirror,
    mirrorSave,
    initPurchases,
    purchasePlan,
    restorePurchases,
    shareFile,
  };
})();
