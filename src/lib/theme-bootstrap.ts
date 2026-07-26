// Bootstrap inline — o ÚNICO <script> inline executável do site.
//
// O quê: roda no <head>, ANTES do paint e antes do React hidratar. Resolve o
//   tema (cookie vf_theme → localStorage → "system") e seta `data-theme` +
//   `data-theme-pref` no <html>; e semeia a moeda salva em `window.__vf_currency`
//   pra o Providers client evitar o flash USDT→moeda-salva (BUG-79/111).
// Onde: injetado por `app/[locale]/layout.tsx`. Substitui o SSR de tema/moeda
//   que antes lia `cookies()` no layout — leitura essa que tornava a árvore
//   inteira dinâmica e matava o ISR das landing pages (tráfego orgânico e pago).
//
// Autorizado pela CSP via `'unsafe-inline'` em script-src (ver middleware /
// ADR-0016): o App Router emite scripts inline por página (`self.__next_f.push`)
// que um hash estático não cobre, então a CSP estática precisa de `'unsafe-inline'`
// e este bootstrap entra junto. Mantido como STRING estática por higiene (fácil
// de auditar / mover pra externo depois).
//
// Nomes de cookie/LS são literais de propósito (o inline não importa módulos):
//   vf_theme / viralefy_theme  → ver src/lib/theme.ts
//   vf_currency                → ver src/lib/currency.ts (CURRENCY_COOKIE)
export const BOOTSTRAP_JS =
  "(function(){try{var d=document.documentElement,c=document.cookie,t=null," +
  "m=c.match(/(?:^|; )vf_theme=([^;]*)/);if(m)t=decodeURIComponent(m[1]);" +
  "if(t!=='dark'&&t!=='light'&&t!=='system'){try{var l=localStorage.getItem('viralefy_theme');" +
  "if(l==='dark'||l==='light'||l==='system')t=l;}catch(e){}}" +
  "if(t!=='dark'&&t!=='light'&&t!=='system')t='system';var eff=t;" +
  "if(t==='system')eff=(window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches)?'light':'dark';" +
  "d.setAttribute('data-theme',eff);d.setAttribute('data-theme-pref',t);" +
  "var cm=c.match(/(?:^|; )vf_currency=([^;]*)/);if(cm)window.__vf_currency=decodeURIComponent(cm[1]);" +
  "}catch(e){}})();";
