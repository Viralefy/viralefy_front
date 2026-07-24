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
// Por que STRING ESTÁTICA e não interpolada: o conteúdo tem que ser byte-a-byte
// constante pra o `sha256` abaixo casar com o que o browser vê. A CSP autoriza
// este inline via `'sha256-…'` (não via nonce) — nonce forçaria render dinâmico.
// Qualquer edição AQUI muda o hash: o teste `security.test.mjs` recomputa e
// falha se `BOOTSTRAP_SHA256` sair de sincronia (piso 5 — não silenciar teste).
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

// sha256 (base64) do BOOTSTRAP_JS acima, no formato de source-expression da CSP.
// Gerado por:  node -e "import('crypto').then(c=>console.log('sha256-'+c.createHash('sha256').update(require('./src/lib/theme-bootstrap.ts').BOOTSTRAP_JS).digest('base64')))"
// (na prática o valor é fixado abaixo e o teste de segurança garante o sync).
export const BOOTSTRAP_SHA256 = "sha256-XqMsvR87A3zwR25kZkzATrJXfLoWXJI8Qh5jCqQvTYk=";
