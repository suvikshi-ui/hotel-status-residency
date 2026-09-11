import{M as e}from"./index-Bse5r5Ir.js";function t(e){return e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`)}function n(e,t,n=!1){let r=document.createElement(`iframe`);r.title=e,r.setAttribute(`aria-hidden`,`true`),r.style.cssText=`position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0`,document.body.appendChild(r);let i=r.contentDocument,a=r.contentWindow;if(!i||!a){r.remove(),window.print();return}i.open(),i.write(t),i.close();let o=()=>{try{a.focus(),a.print()}catch{window.print()}setTimeout(()=>r.remove(),2e3)},s=()=>{if(n&&i.fonts?.ready){i.fonts.ready.then(()=>setTimeout(o,80)).catch(()=>setTimeout(o,80));return}setTimeout(o,50)};i.readyState===`complete`?s():r.onload=s}function r({title:r,heading:i,sub:a,table:o}){n(r,`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${t(r)}</title>
  <style>
    @page { size: A4; margin: 12mm; }
    body { margin: 0; color: #1c1915; font: 13px/1.45 Georgia, "Times New Roman", serif; }
    .brand { display: flex; align-items: center; gap: 12px; margin: 0 0 12px; }
    .brand img { height: 56px; width: auto; }
    h1 { margin: 0 0 4px; font-size: 22px; }
    .sub { margin: 0 0 16px; color: #6f675c; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 7px 8px; border-bottom: 1px solid #ddd4c2; text-align: left; }
    th { font-size: 10px; letter-spacing: .08em; text-transform: uppercase; color: #6f675c; }
    .num { text-align: right; font-variant-numeric: tabular-nums; }
    tfoot td { font-weight: 700; border-top: 2px solid #1c1915; }
  </style>
</head>
<body>
  <div class="brand">
    <img src="${e(`logo.png?v=2`)}" alt="" />
    <div>
      <h1>${t(i)}</h1>
      <p class="sub" style="margin:0">${t(a)}</p>
    </div>
  </div>
  ${o}
</body>
</html>`)}function i(e,r){n(e,`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${t(e)}</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700;900&family=Cinzel:wght@600;700&display=swap" />
  <style>
    @page { size: A4 portrait; margin: 8mm; background: #fff; }
    html, body { margin: 0; background: #fff !important; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
    .daily-a4 { background: #fff !important; }
    .daily-a4-head { background: #14352c !important; color: #f4efe4 !important; }
    .day-chart { background: #f7f1e6 !important; }
  </style>
</head>
<body>${r}</body>
</html>`,!0)}export{r as n,i as r,t};