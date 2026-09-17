import{A as e,Ct as t,I as n,P as r,bt as i,i as a,it as o,lt as s,nt as c,pt as l,r as u,tt as d,ut as f}from"./store-zoERNQtG.js";import{r as p,t as m}from"./utils-DfYkxeJJ.js";import{a as h,i as g,n as _,o as v,r as y,s as b,t as x}from"./select-B1MzAjfs.js";import{t as S}from"./printer-Cqh04_AJ.js";import{a as C,i as w,n as T,r as E,t as D}from"./balance-BXgL0kwK.js";import{t as O}from"./trash-2-DLUorZI6.js";import{D as k,a as A,et as j,i as ee,o as M,q as N}from"./index-Dz46PwxD.js";import{t as P}from"./badge-CbqBOZt9.js";import{n as F,t as I}from"./card-w736TNvJ.js";import{i as L,n as R,r as te,t as ne}from"./tabs-Ycz7nGoq.js";import{t as z}from"./mode-badge-Dpm_onwP.js";import{t as B}from"./print-sheet-BH7ZU_tf.js";import{n as re,t as ie}from"./save-cube-sqaqYGLO.js";var V=t(i());function H(e){return Math.round(e).toLocaleString(`en-IN`)}function U(e){return e.checkOut?l(e.checkOut):`Continue`}function W(e){return e.status===`paid`?`✓ Paid`:e.status===`partial`?`Partial · ${H(e.remaining)}`:`Open`}function G(e,t){let n=`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${B(e)}</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700;900&family=Cinzel:wght@600;700&display=swap" />
  <style>
    @page { size: A4 portrait; margin: 10mm; }
    html, body { margin: 0; background: #fff; color: #111; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { font: 12.5px/1.4 Georgia, "Times New Roman", Times, serif; }
    .sheet { border: 2.5px solid #1a1a1a; min-height: 277mm; overflow: hidden; }
    .head {
      display: flex; align-items: center; gap: 14px;
      padding: 10px 14px; background: #14352c; color: #f4efe4;
    }
    .head img { height: 52px; width: auto; }
    .head h1 {
      margin: 0; font-family: "Cinzel Decorative", Algerian, serif;
      font-size: 22px; letter-spacing: .12em; color: #f4c430; font-weight: 900;
    }
    .head p { margin: 4px 0 0; font-family: Cinzel, Georgia, serif; font-size: 11px; letter-spacing: .08em; }
    .body { padding: 12px 14px 16px; }
    h2 {
      margin: 0 0 10px; text-align: center; font-family: Cinzel, Georgia, serif;
      font-size: 14px; letter-spacing: .16em; text-transform: uppercase;
      text-decoration: underline;
    }
    .src {
      margin: 16px 0 6px; font-family: Cinzel, Georgia, serif;
      font-size: 13px; letter-spacing: .1em; text-transform: uppercase;
      border-bottom: 1px solid #1a1a1a; padding-bottom: 3px;
    }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #1a1a1a; padding: 6px 8px; vertical-align: top; }
    th {
      font-size: 10px; letter-spacing: .08em; text-transform: uppercase;
      text-align: left; background: #efe8d8; font-weight: 700;
    }
    .num { text-align: right; font-variant-numeric: tabular-nums; }
    .ctr { text-align: center; }
    tfoot td { font-weight: 700; background: #f7f1e6; }
    .paid { color: #2f6b4f; font-weight: 700; }
    .open { color: #8a5a22; font-weight: 700; }
    .note { margin: 10px 0 0; color: #6f675c; font-size: 11px; }
  </style>
</head>
<body>${t}</body>
</html>`,r=document.createElement(`iframe`);r.title=e,r.setAttribute(`aria-hidden`,`true`),r.style.cssText=`position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0`,document.body.appendChild(r);let i=r.contentDocument,a=r.contentWindow;if(!i||!a){r.remove(),window.print();return}i.open(),i.write(n),i.close();let o=()=>{try{a.focus(),a.print()}catch{window.print()}setTimeout(()=>r.remove(),2e3)},s=()=>{if(i.fonts?.ready){i.fonts.ready.then(()=>setTimeout(o,80)).catch(()=>setTimeout(o,80));return}setTimeout(o,50)};i.readyState===`complete`?s():r.onload=s}function K(e,t,n){return`<div class="head">
    <img src="${j(`logo.png?v=2`)}" alt="" />
    <div style="flex:1;text-align:center">
      <h1>${B(e.toUpperCase())}</h1>
      <p>${B(t.toUpperCase())} · ${B(n)}</p>
    </div>
  </div>`}function ae(e,t,n){let r=e.map(e=>`<tr>
        <td>${B(e.key)}</td>
        <td class="ctr">${e.guestCount}</td>
        <td class="ctr">${e.stays.length}</td>
        <td class="num">${H(e.billed)}</td>
        <td class="num">${H(e.collected)}</td>
        <td class="num ${e.settled?`paid`:`open`}">${H(Math.max(0,e.remaining))}</td>
      </tr>`).join(``),i=e.reduce((e,t)=>e+t.billed,0),a=e.reduce((e,t)=>e+t.collected,0),o=e.reduce((e,t)=>e+Math.max(0,t.remaining),0);G(`Source balance`,`<div class="sheet">
    ${K(t,n,`Outstanding by source`)}
    <div class="body">
      <h2>Source balance</h2>
      <table>
        <thead>
          <tr>
            <th>Source</th>
            <th class="ctr">Guests</th>
            <th class="ctr">Stays</th>
            <th class="num">Billed</th>
            <th class="num">Paid</th>
            <th class="num">Balance</th>
          </tr>
        </thead>
        <tbody>
          ${r||`<tr><td colspan="6" class="ctr">No source dues</td></tr>`}
        </tbody>
        <tfoot>
          <tr>
            <td>Total</td>
            <td class="ctr">${e.reduce((e,t)=>e+t.guestCount,0)}</td>
            <td class="ctr">${e.reduce((e,t)=>e+t.stays.length,0)}</td>
            <td class="num">${H(i)}</td>
            <td class="num">${H(a)}</td>
            <td class="num">${H(o)}</td>
          </tr>
        </tfoot>
      </table>
      <p class="note">Guest names are not listed. Use Print guests on a source for Flysky / Motor detail.</p>
    </div>
  </div>`)}function q(e){return e.map(e=>`<tr>
        <td>${B(e.name)}</td>
        <td>${l(e.checkIn)}</td>
        <td>${U(e)}</td>
        <td class="ctr">${e.days}</td>
        <td class="num">${H(e.perDay)}</td>
        <td class="num">${H(e.billed)}</td>
        <td class="${e.status===`paid`?`paid`:`open`}">${B(W(e))}</td>
      </tr>`).join(``)}function J(e){return`<tfoot>
    <tr>
      <td colspan="3">${B(e.key)} · ${e.stays.length} stay${e.stays.length===1?``:`s`}</td>
      <td class="ctr">${e.stays.reduce((e,t)=>e+t.days,0)}</td>
      <td></td>
      <td class="num">${H(e.billed)}</td>
      <td class="num ${e.settled?`paid`:`open`}">${H(Math.max(0,e.remaining))} due</td>
    </tr>
  </tfoot>`}function Y(e,t,n){let r=`<div class="sheet">
    ${K(t,n,`${e.key} outstanding`)}
    <div class="body">
      <h2>${B(e.key)}</h2>
      <table>
        <thead>
          <tr>
            <th>Guest</th>
            <th>Check-in</th>
            <th>Check-out</th>
            <th class="ctr">Nights</th>
            <th class="num">Per day</th>
            <th class="num">Total</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${q(e.stays)||`<tr><td colspan="7" class="ctr">No guests</td></tr>`}
        </tbody>
        ${J(e)}
      </table>
      <p class="note">Hotel day ${c}–${c}. Nights = check-out date minus check-in date. Paid ${H(e.collected)} · billed ${H(e.billed)} · oldest stays tick Paid first when a collection is posted.</p>
    </div>
  </div>`;G(`${e.key} guests`,r)}var X=p();function Z(e){return e.checkOut?l(e.checkOut):`Continue`}function Q(){let t=a(e=>e.hotel),i=a(e=>e.guests),o=a(e=>e.balReceived),s=a(e=>e.selectedDate),c=a(e=>e.addBalReceived),l=a(e=>e.removeBalReceived),d=a(e=>e.sealedIds),{busy:p,sealAndSave:m}=re(),{gate:h}=ee(),[g,_]=(0,V.useState)(``),[v,y]=(0,V.useState)(!0),[b,x]=(0,V.useState)(null),T=(0,V.useMemo)(()=>D(i,o),[i,o]),O=u(s),A=(0,V.useMemo)(()=>{let e=g.trim().toLowerCase();return T.filter(t=>v&&t.settled?!1:!e||t.key.toLowerCase().includes(e)?!0:t.guests.some(t=>t.name.toLowerCase().includes(e)||t.roomNo.toLowerCase().includes(e)))},[T,v,g]),j=T.filter(e=>!e.settled).reduce((e,t)=>e+Math.max(0,t.remaining),0),P=T.reduce((e,t)=>e+t.collected,0),F=T.reduce((e,t)=>e+t.billed,0),z=E(T,g),B=(0,V.useMemo)(()=>w(i),[i]),H=(0,V.useMemo)(()=>z?A.filter(e=>e.key!==z.key):A,[A,z]),U=o.filter(e=>e.kind===`other`).slice().sort((e,t)=>t.date.localeCompare(e.date)||t.id.localeCompare(e.id)),W=U.filter(e=>e.date===s).reduce((e,t)=>e+t.amount,0),G=U.reduce((e,t)=>e+t.amount,0),K=o.filter(e=>e.date===s),q=K.map(e=>r.balance(e.id)),J=n(q,d).length>0;function Z(e,t,n){h(()=>{c({particular:e.key,mode:t,amount:n,kind:`due`}),N.success(`Collected ${f(n)} from ${e.key}`)},{title:`Are you sure?`,message:`Collect ${f(n)} from ${e.key}? Oldest open stays will tick Paid first.`,confirmLabel:`Collect`})}function Q(t){if(e(d,r.balance(t))){N.message(`Saved — this collection will not change`);return}h(()=>{l(t),N.success(`Collection removed`)},{title:`Are you sure?`,message:`Delete this collection?`,confirmLabel:`Delete`,danger:!0})}return(0,X.jsxs)(`div`,{className:`flex flex-col gap-5`,children:[(0,X.jsxs)(`div`,{className:`flex flex-wrap items-end justify-between gap-3`,children:[(0,X.jsxs)(`div`,{children:[(0,X.jsx)(`p`,{className:`text-xs font-medium uppercase tracking-[0.18em] text-muted`,children:`Outstanding`}),(0,X.jsx)(`h1`,{className:`mt-1 font-display text-3xl font-semibold tracking-tight`,children:`Balance`}),(0,X.jsx)(`p`,{className:`mt-1 text-sm text-muted`,children:`Collect, then press Save at the top. After save that collection will not change.`})]}),(0,X.jsx)(ie,{hasEntries:K.length>0,pending:J,busy:p,onSave:()=>m(q,`Account saved — today's collections will not change`)})]}),(0,X.jsxs)(`div`,{className:`grid grid-cols-2 gap-3 lg:grid-cols-4`,children:[(0,X.jsxs)(I,{className:`p-4`,children:[(0,X.jsx)(`div`,{className:`text-xs font-medium text-muted`,children:`Books C/B`}),(0,X.jsx)(`div`,{className:`mt-1 font-display text-2xl font-semibold tabular text-due`,children:f(O?.outstanding.cb??0)})]}),(0,X.jsxs)(I,{className:`p-4`,children:[(0,X.jsx)(`div`,{className:`text-xs font-medium text-muted`,children:`Open source dues`}),(0,X.jsx)(`div`,{className:`mt-1 font-display text-2xl font-semibold tabular`,children:f(j)})]}),(0,X.jsxs)(I,{className:`p-4`,children:[(0,X.jsx)(`div`,{className:`text-xs font-medium text-muted`,children:`Billed`}),(0,X.jsx)(`div`,{className:`mt-1 font-display text-2xl font-semibold tabular`,children:f(F)})]}),(0,X.jsxs)(I,{className:`p-4`,children:[(0,X.jsx)(`div`,{className:`text-xs font-medium text-muted`,children:`Collected`}),(0,X.jsx)(`div`,{className:`mt-1 font-display text-2xl font-semibold tabular text-ok`,children:f(P)})]})]}),(0,X.jsxs)(ne,{defaultValue:`balance`,children:[(0,X.jsxs)(te,{className:`grid w-full grid-cols-2`,"aria-label":`Balance sections`,children:[(0,X.jsx)(L,{value:`balance`,className:`w-full`,children:`Balance`}),(0,X.jsx)(L,{value:`other`,className:`w-full`,children:`Other`})]}),(0,X.jsxs)(R,{value:`balance`,className:`flex flex-col gap-5`,children:[(0,X.jsxs)(`div`,{className:`flex flex-col gap-3`,children:[(0,X.jsxs)(`div`,{className:`relative min-w-0`,children:[(0,X.jsx)(C,{className:`pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted`}),(0,X.jsx)(M,{className:`pl-9`,placeholder:`Source or guest — Flysky, Motor, name`,value:g,onChange:e=>_(e.target.value),"aria-label":`Search dues`,list:`balance-source-hints`,autoComplete:`off`}),(0,X.jsx)(`datalist`,{id:`balance-source-hints`,children:B.map(e=>(0,X.jsx)(`option`,{value:e},e))})]}),(0,X.jsxs)(`div`,{className:`flex flex-wrap gap-2`,children:[(0,X.jsx)(k,{variant:v?`default`:`outline`,onClick:()=>y(e=>!e),children:v?`Open dues`:`All sources`}),(0,X.jsxs)(k,{variant:`outline`,onClick:()=>{if(A.length===0){N.error(`No sources to print`);return}N.message(`Opening source print…`),ae(A,t.name,t.place)},children:[(0,X.jsx)(S,{className:`size-4`}),`Print sources`]})]}),(0,X.jsxs)(`p`,{className:`text-xs text-muted`,children:[(0,X.jsx)(`span`,{className:`font-medium text-fg`,children:`Print sources`}),` — Flysky, Motor, remaining only, no guest names.`,` `,(0,X.jsx)(`span`,{className:`font-medium text-fg`,children:`Print guests`}),` on a source — that company, then each guest stay.`]})]}),z?(0,X.jsxs)(`p`,{className:`text-sm text-muted`,children:[(0,X.jsx)(`span`,{className:`font-medium text-fg`,children:z.key}),` · `,z.guestCount,` guest`,z.guestCount===1?``:`s`,` · `,z.stays.length,` stay`,z.stays.length===1?``:`s`,` · billed `,f(z.billed),` · due `,f(Math.max(0,z.remaining))]}):null,z?(0,X.jsx)($,{account:z,open:!0,pinned:!0,month:s.slice(0,7),onToggle:()=>_(``),onCollect:(e,t)=>Z(z,e,t),onRemoveReceipt:Q,onPrintGuests:()=>{N.message(`Opening guest print…`),Y(z,t.name,t.place)}}):null,(0,X.jsxs)(`div`,{className:`flex flex-col gap-2`,children:[H.map(e=>(0,X.jsx)($,{account:e,open:b===e.key,month:s.slice(0,7),onToggle:()=>x(t=>t===e.key?null:e.key),onCollect:(t,n)=>Z(e,t,n),onRemoveReceipt:Q,onPrintGuests:()=>{N.message(`Opening guest print…`),Y(e,t.name,t.place)}},e.key)),H.length===0&&!z?(0,X.jsx)(I,{className:`p-8 text-center text-sm text-muted`,children:`No source dues match this filter.`}):null]})]}),(0,X.jsx)(R,{value:`other`,className:`flex flex-col gap-5`,children:(0,X.jsx)(oe,{booksCb:O?.outstanding.cb??0,today:W,total:G,rows:U,onAdd:(e,t,n)=>{h(()=>{c({particular:n,mode:e,amount:t,kind:`other`}),N.success(`Other ${f(t)} cut from main balance`)},{title:`Are you sure?`,message:`Cut ${f(t)} from main balance?`,confirmLabel:`Save`})},onRemove:e=>{h(()=>{l(e),N.success(`Other collection removed`)},{title:`Are you sure?`,message:`Delete this other collection?`,confirmLabel:`Delete`,danger:!0})}})})]})]})}function oe({booksCb:e,today:t,total:n,rows:r,onAdd:i,onRemove:a}){let[c,l]=(0,V.useState)(`CASH`),[u,p]=(0,V.useState)(``),[m,v]=(0,V.useState)(``);return(0,X.jsxs)(X.Fragment,{children:[(0,X.jsxs)(`div`,{className:`grid grid-cols-2 gap-3 lg:grid-cols-3`,children:[(0,X.jsxs)(I,{className:`p-4`,children:[(0,X.jsx)(`div`,{className:`text-xs font-medium text-muted`,children:`Main balance`}),(0,X.jsx)(`div`,{className:`mt-1 font-display text-2xl font-semibold tabular text-due`,children:f(e)})]}),(0,X.jsxs)(I,{className:`p-4`,children:[(0,X.jsx)(`div`,{className:`text-xs font-medium text-muted`,children:`Other today`}),(0,X.jsx)(`div`,{className:`mt-1 font-display text-2xl font-semibold tabular`,children:f(t)})]}),(0,X.jsxs)(I,{className:`col-span-2 p-4 lg:col-span-1`,children:[(0,X.jsx)(`div`,{className:`text-xs font-medium text-muted`,children:`Other posted`}),(0,X.jsx)(`div`,{className:`mt-1 font-display text-2xl font-semibold tabular`,children:f(n)})]})]}),(0,X.jsx)(I,{children:(0,X.jsxs)(F,{className:`flex flex-col gap-4 p-5`,children:[(0,X.jsxs)(`div`,{children:[(0,X.jsx)(`p`,{className:`font-display text-lg font-semibold tracking-tight`,children:`Cut from main balance`}),(0,X.jsx)(`p`,{className:`mt-1 text-sm text-muted`,children:`Amount only — no source name. Lands in cash / Santosh QR / P.K. QR and reduces the books outstanding.`})]}),(0,X.jsxs)(`form`,{className:`grid gap-3 sm:grid-cols-[9rem_1fr_auto]`,onSubmit:e=>{e.preventDefault();let t=Number(u);if(!Number.isFinite(t)||t<=0){N.error(`Enter an amount`);return}i(c,t,m.trim()||`Other`),p(``),v(``)},children:[(0,X.jsxs)(`div`,{className:`grid gap-1.5`,children:[(0,X.jsx)(A,{children:`Paid by`}),(0,X.jsxs)(x,{value:c,onValueChange:e=>l(e),children:[(0,X.jsx)(g,{"aria-label":`Other payment mode`,children:(0,X.jsx)(h,{})}),(0,X.jsx)(_,{children:d.map(e=>(0,X.jsx)(y,{value:e,children:o[e]},e))})]})]}),(0,X.jsxs)(`div`,{className:`grid gap-1.5`,children:[(0,X.jsx)(A,{children:`Amount`}),(0,X.jsx)(M,{type:`number`,min:0,value:u,onChange:e=>p(e.target.value),placeholder:`0`})]}),(0,X.jsx)(`div`,{className:`flex items-end`,children:(0,X.jsx)(k,{type:`submit`,className:`w-full`,children:`Cut balance`})}),(0,X.jsxs)(`div`,{className:`grid gap-1.5 sm:col-span-3`,children:[(0,X.jsx)(A,{htmlFor:`other-note`,children:`Note (optional)`}),(0,X.jsx)(M,{id:`other-note`,value:m,onChange:e=>v(e.target.value),placeholder:`Not a source name`})]})]})]})}),(0,X.jsx)(I,{children:(0,X.jsxs)(F,{className:`overflow-x-auto p-0`,children:[(0,X.jsxs)(`table`,{className:`w-full min-w-[32rem] text-left text-sm`,children:[(0,X.jsx)(`thead`,{className:`text-xs uppercase tracking-wide text-muted`,children:(0,X.jsxs)(`tr`,{className:`border-y border-border`,children:[(0,X.jsx)(`th`,{className:`px-5 py-2 font-medium`,children:`Date`}),(0,X.jsx)(`th`,{className:`px-3 py-2 font-medium`,children:`Note`}),(0,X.jsx)(`th`,{className:`px-3 py-2 font-medium`,children:`Paid by`}),(0,X.jsx)(`th`,{className:`px-3 py-2 text-right font-medium`,children:`Amount`}),(0,X.jsx)(`th`,{className:`px-3 py-2`})]})}),(0,X.jsx)(`tbody`,{children:r.map(e=>(0,X.jsxs)(`tr`,{className:`border-b border-border/70`,children:[(0,X.jsx)(`td`,{className:`px-5 py-2.5 tabular text-muted`,children:s(e.date)}),(0,X.jsx)(`td`,{className:`px-3 py-2.5`,children:e.particular}),(0,X.jsx)(`td`,{className:`px-3 py-2.5`,children:(0,X.jsx)(z,{mode:e.mode})}),(0,X.jsx)(`td`,{className:`px-3 py-2.5 text-right tabular`,children:f(e.amount)}),(0,X.jsx)(`td`,{className:`px-3 py-2.5 text-right`,children:(0,X.jsx)(k,{variant:`ghost`,size:`icon`,className:`size-9 min-h-9 text-muted hover:text-danger`,"aria-label":`Remove other collection`,onClick:()=>a(e.id),children:(0,X.jsx)(O,{className:`size-4`})})})]},e.id))})]}),r.length===0?(0,X.jsx)(`p`,{className:`py-10 text-center text-sm text-muted`,children:`No other cuts yet.`}):null]})})]})}function $({account:e,open:t,pinned:n,month:r,onToggle:i,onCollect:a,onRemoveReceipt:c,onPrintGuests:u}){let[p,b]=(0,V.useState)(`CASH`),[C,w]=(0,V.useState)(``),T=t||n,E=!e.settled&&!!e.lastDate&&e.lastDate.slice(0,7)<r;return(0,X.jsxs)(I,{className:m(`overflow-hidden`,n&&`ring-1 ring-primary/30`),children:[(0,X.jsxs)(`div`,{className:`flex w-full min-h-14 flex-wrap items-center gap-2 px-4 py-3 md:px-5`,children:[(0,X.jsxs)(`button`,{type:`button`,onClick:i,"aria-expanded":T,className:`flex min-w-0 flex-1 items-center gap-3 text-left`,children:[(0,X.jsx)(v,{className:m(`size-4 shrink-0 text-muted transition-transform duration-150`,T?`rotate-0`:`-rotate-90`)}),(0,X.jsxs)(`div`,{className:`min-w-0 flex-1`,children:[(0,X.jsx)(`div`,{className:`truncate font-display text-lg font-semibold tracking-tight`,children:e.key}),(0,X.jsxs)(`div`,{className:`text-xs text-muted`,children:[e.guestCount,` guest`,e.guestCount===1?``:`s`,` ·`,` `,e.stays.length,` stay`,e.stays.length===1?``:`s`,` ·`,` `,e.nights,` night`,e.nights===1?``:`s`,e.firstDate?` · ${s(e.firstDate)}–${s(e.lastDate)}`:``]})]})]}),(0,X.jsxs)(k,{type:`button`,variant:`outline`,size:`sm`,className:`shrink-0`,onClick:u,children:[(0,X.jsx)(S,{className:`size-4`}),`Print guests`]}),(0,X.jsxs)(`div`,{className:`text-right`,children:[(0,X.jsx)(`div`,{className:m(`font-display text-xl font-semibold tabular`,e.settled?`text-ok`:`text-due`),children:f(Math.max(0,e.remaining))}),(0,X.jsx)(P,{variant:e.settled?`ok`:`warn`,children:e.settled?`Settled`:E?`Carried`:`Open`})]})]}),T?(0,X.jsxs)(F,{className:`border-t border-border pt-4`,children:[(0,X.jsxs)(`div`,{className:`-mx-5 overflow-x-auto`,children:[(0,X.jsxs)(`table`,{className:`w-full min-w-[52rem] text-left text-sm`,children:[(0,X.jsx)(`thead`,{className:`text-xs uppercase tracking-wide text-muted`,children:(0,X.jsxs)(`tr`,{className:`border-b border-border`,children:[(0,X.jsx)(`th`,{className:`px-5 py-2 font-medium`,children:` `}),(0,X.jsx)(`th`,{className:`px-3 py-2 font-medium`,children:`Guest`}),(0,X.jsx)(`th`,{className:`px-3 py-2 font-medium`,children:`Check-in`}),(0,X.jsx)(`th`,{className:`px-3 py-2 font-medium`,children:`Check-out`}),(0,X.jsx)(`th`,{className:`px-3 py-2 text-right font-medium`,children:`Nights`}),(0,X.jsx)(`th`,{className:`px-3 py-2 text-right font-medium`,children:`Per day`}),(0,X.jsx)(`th`,{className:`px-3 py-2 text-right font-medium`,children:`Total`}),(0,X.jsx)(`th`,{className:`px-5 py-2 font-medium`,children:`Status`})]})}),(0,X.jsx)(`tbody`,{children:e.stays.map(e=>(0,X.jsxs)(`tr`,{className:m(`border-b border-border/70`,e.status===`paid`&&`bg-ok/5`),children:[(0,X.jsx)(`td`,{className:`px-5 py-2.5`,children:(0,X.jsx)(se,{stay:e})}),(0,X.jsxs)(`td`,{className:`px-3 py-2.5`,children:[(0,X.jsx)(`div`,{className:`font-medium`,children:e.name}),(0,X.jsxs)(`div`,{className:`text-xs text-muted`,children:[`Room `,e.roomNo]})]}),(0,X.jsx)(`td`,{className:`px-3 py-2.5 tabular`,children:l(e.checkIn)}),(0,X.jsx)(`td`,{className:`px-3 py-2.5 tabular text-muted`,children:Z(e)}),(0,X.jsx)(`td`,{className:`px-3 py-2.5 text-right tabular`,children:e.days}),(0,X.jsx)(`td`,{className:`px-3 py-2.5 text-right tabular`,children:f(e.perDay)}),(0,X.jsx)(`td`,{className:`px-3 py-2.5 text-right tabular font-medium`,children:f(e.billed)}),(0,X.jsx)(`td`,{className:`px-5 py-2.5`,children:(0,X.jsx)(ce,{stay:e})})]},e.id))})]}),e.stays.length===0?(0,X.jsx)(`p`,{className:`px-5 py-4 text-sm text-muted`,children:`No guest stays on this source.`}):null]}),(0,X.jsxs)(`div`,{className:`mt-3 flex flex-wrap justify-between gap-2 text-sm`,children:[(0,X.jsxs)(`span`,{className:`text-muted`,children:[e.guestCount,` guests · billed `,f(e.billed),` · paid`,` `,f(e.collected)]}),(0,X.jsxs)(`span`,{className:`font-semibold tabular`,children:[`Due `,f(Math.max(0,e.remaining))]})]}),e.receipts.length>0?(0,X.jsx)(`ul`,{className:`mt-3 divide-y divide-border rounded-lg border border-border`,children:e.receipts.map(e=>(0,X.jsxs)(`li`,{className:`flex items-center justify-between gap-3 px-3 py-2`,children:[(0,X.jsxs)(`div`,{className:`min-w-0`,children:[(0,X.jsxs)(`div`,{className:`truncate text-sm`,children:[s(e.date),` · `,e.particular]}),(0,X.jsx)(z,{mode:e.mode})]}),(0,X.jsxs)(`div`,{className:`flex items-center gap-1`,children:[(0,X.jsx)(`span`,{className:`tabular text-sm font-medium text-ok`,children:f(e.amount)}),(0,X.jsx)(k,{variant:`ghost`,size:`icon`,className:`size-9 min-h-9 text-muted hover:text-danger`,"aria-label":`Remove collection`,onClick:()=>c(e.id),children:(0,X.jsx)(O,{className:`size-4`})})]})]},e.id))}):null,e.settled?(0,X.jsx)(`p`,{className:`mt-4 text-sm text-ok`,children:`This source is settled. Every stay is ticked Paid.`}):(0,X.jsxs)(`form`,{className:`mt-4 grid gap-3 sm:grid-cols-[9rem_1fr_auto]`,onSubmit:t=>{t.preventDefault();let n=Number(C||Math.max(0,e.remaining));if(!Number.isFinite(n)||n<=0){N.error(`Enter an amount to collect`);return}a(p,n),w(``)},children:[(0,X.jsxs)(`div`,{className:`grid gap-1.5`,children:[(0,X.jsx)(A,{children:`Mode`}),(0,X.jsxs)(x,{value:p,onValueChange:e=>b(e),children:[(0,X.jsx)(g,{"aria-label":`Collection mode`,children:(0,X.jsx)(h,{})}),(0,X.jsx)(_,{children:d.map(e=>(0,X.jsx)(y,{value:e,children:o[e]},e))})]})]}),(0,X.jsxs)(`div`,{className:`grid gap-1.5`,children:[(0,X.jsx)(A,{children:`Amount`}),(0,X.jsx)(M,{type:`number`,min:0,value:C,onChange:e=>w(e.target.value),placeholder:String(Math.max(0,e.remaining))})]}),(0,X.jsx)(`div`,{className:`flex items-end`,children:(0,X.jsx)(k,{type:`submit`,className:`w-full`,children:`Collect`})})]})]}):null]})}function se({stay:e}){let t=e.status===`paid`;return(0,X.jsx)(`span`,{className:m(`grid size-7 place-items-center rounded-md border`,t?`border-ok/40 bg-ok text-primary-fg`:e.status===`partial`?`border-due/40 bg-due/10 text-due`:`border-border bg-card text-transparent`),"aria-label":T(e.status),children:(0,X.jsx)(b,{className:`size-3.5`,strokeWidth:3})})}function ce({stay:e}){return e.status===`paid`?(0,X.jsx)(P,{variant:`ok`,children:`Paid`}):e.status===`partial`?(0,X.jsxs)(`div`,{className:`flex flex-col gap-0.5`,children:[(0,X.jsx)(P,{variant:`warn`,children:`Partial`}),(0,X.jsxs)(`span`,{className:`text-xs tabular text-muted`,children:[`Due `,f(e.remaining)]})]}):(0,X.jsx)(P,{variant:`warn`,children:`Open`})}export{Q as component};