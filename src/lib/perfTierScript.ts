/**
 * Runs as the page starts up, before it hydrates (next/script beforeInteractive, in app/layout.tsx): marks
 * <html data-perf="low"> on an Android phone with 2 GB of memory or less, 4 or fewer cores, or Data Saver
 * on, so the cheaper styles are in place before anything that uses them is shown. `?perf=low|high` forces a
 * tier (and stops the runtime probe overriding it). The rest of the adaptive logic is in perfTier.ts.
 */
export const LOW_TIER_SCRIPT = `(function(){try{var q=new URLSearchParams(location.search).get("perf");var n=navigator,c=n.connection||{};var low=q?q==="low":/Android/i.test(n.userAgent)&&(c.saveData||(n.deviceMemory&&n.deviceMemory<=2)||(n.hardwareConcurrency&&n.hardwareConcurrency<=4));if(low)document.documentElement.dataset.perf="low";if(q)document.documentElement.dataset.perfForced=q;}catch(e){}})();`;
