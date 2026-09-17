import{A as e,P as t,St as n,ct as r,et as i,ft as a,i as o,lt as s,r as c,rt as l,tt as u,yt as d}from"./store-qw0OHHVx.js";import{r as f,t as p}from"./utils-D1MTZvns.js";import{a as m,i as h,n as g,o as _,r as v,s as y,t as b}from"./select-DHA_jsWA.js";import{t as x}from"./printer-GhIKogIr.js";import{a as S,i as C,n as w,r as T,t as E}from"./balance-CCI2NGv4.js";import{t as D}from"./trash-2-Bqv1tMR4.js";import{D as O,a as k,et as A,i as j,o as M,q as N}from"./index-DV6mya9n.js";import{t as P}from"./badge-CMFsFI5C.js";import{n as F,t as I}from"./card-v9dUrwXb.js";import{i as L,n as R,r as ee,t as te}from"./tabs-CO2OuFT5.js";import{t as z}from"./mode-badge-stt_O1bf.js";import{t as B}from"./print-sheet-BYFLenwm.js";import{n as V,t as H}from"./save-cube-DaqgvLIR.js";var U=n(d());function W(e){return Math.round(e).toLocaleString(`en-IN`)}function G(e){return e.checkOut?a(e.checkOut):`Continue`}function K(e){return e.status===`paid`?`✓ Paid`:e.status===`partial`?`Partial · ${W(e.remaining)}`:`Open`}function q(e,t){let n=`<!doctype html>
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
</html>`,r=document.createElement(`iframe`);r.title=e,r.setAttribute(`aria-hidden`,`true`),r.style.cssText=`position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0`,document.body.appendChild(r);let i=r.contentDocument,a=r.contentWindow;if(!i||!a){r.remove(),window.print();return}i.open(),i.write(n),i.close();let o=()=>{try{a.focus(),a.print()}catch{window.print()}setTimeout(()=>r.remove(),2e3)},s=()=>{if(i.fonts?.ready){i.fonts.ready.then(()=>setTimeout(o,80)).catch(()=>setTimeout(o,80));return}setTimeout(o,50)};i.readyState===`complete`?s():r.onload=s}function J(e,t,n){return`<div class="head">
    <img src="${A(`logo.png?v=2`)}" alt="" />
    <div style="flex:1;text-align:center">
      <h1>${B(e.toUpperCase())}</h1>
      <p>${B(t.toUpperCase())} · ${B(n)}</p>
    </div>
  </div>`}function Y(e,t,n){let r=e.map(e=>`<tr>
        <td>${B(e.key)}</td>
        <td class="ctr">${e.guestCount}</td>
        <td class="ctr">${e.stays.length}</td>
        <td class="num">${W(e.billed)}</td>
        <td class="num">${W(e.collected)}</td>
        <td class="num ${e.settled?`paid`:`open`}">${W(Math.max(0,e.remaining))}</td>
      </tr>`).join(``),i=e.reduce((e,t)=>e+t.billed,0),a=e.reduce((e,t)=>e+t.collected,0),o=e.reduce((e,t)=>e+Math.max(0,t.remaining),0);q(`Source balance`,`<div class="sheet">
    ${J(t,n,`Outstanding by source`)}
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
            <td class="num">${W(i)}</td>
            <td class="num">${W(a)}</td>
            <td class="num">${W(o)}</td>
          </tr>
        </tfoot>
      </table>
      <p class="note">Guest names are not listed. Use Print guests on a source for Flysky / Motor detail.</p>
    </div>
  </div>`)}function X(e){return e.map(e=>`<tr>
        <td>${B(e.name)}</td>
        <td>${a(e.checkIn)}</td>
        <td>${G(e)}</td>
        <td class="ctr">${e.days}</td>
        <td class="num">${W(e.perDay)}</td>
        <td class="num">${W(e.billed)}</td>
        <td class="${e.status===`paid`?`paid`:`open`}">${B(K(e))}</td>
      </tr>`).join(``)}function ne(e){return`<tfoot>
    <tr>
      <td colspan="3">${B(e.key)} · ${e.stays.length} stay${e.stays.length===1?``:`s`}</td>
      <td class="ctr">${e.stays.reduce((e,t)=>e+t.days,0)}</td>
      <td></td>
      <td class="num">${W(e.billed)}</td>
      <td class="num ${e.settled?`paid`:`open`}">${W(Math.max(0,e.remaining))} due</td>
    </tr>
  </tfoot>`}function Z(e,t,n){let r=`<div class="sheet">
    ${J(t,n,`${e.key} outstanding`)}
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
          ${X(e.stays)||`<tr><td colspan="7" class="ctr">No guests</td></tr>`}
        </tbody>
        ${ne(e)}
      </table>
      <p class="note">Hotel day ${u}–${u}. Nights = check-out date minus check-in date. Paid ${W(e.collected)} · billed ${W(e.billed)} · oldest stays tick Paid first when a collection is posted.</p>
    </div>
  </div>`;q(`${e.key} guests`,r)}var Q=f();function re(e){return e.checkOut?a(e.checkOut):`Continue`}function ie(){let n=o(e=>e.hotel),r=o(e=>e.guests),i=o(e=>e.balReceived),a=o(e=>e.selectedDate),l=o(e=>e.addBalReceived),u=o(e=>e.removeBalReceived),d=o(e=>e.sealedIds),{busy:f,saveToServer:p}=V(),{gate:m}=j(),[h,g]=(0,U.useState)(``),[_,v]=(0,U.useState)(!0),[y,b]=(0,U.useState)(null),w=(0,U.useMemo)(()=>E(r,i),[r,i]),D=c(a),k=(0,U.useMemo)(()=>{let e=h.trim().toLowerCase();return w.filter(t=>_&&t.settled?!1:!e||t.key.toLowerCase().includes(e)?!0:t.guests.some(t=>t.name.toLowerCase().includes(e)||t.roomNo.toLowerCase().includes(e)))},[w,_,h]),A=w.reduce((e,t)=>e+Math.max(0,t.billed-t.listBilled-t.collected),0),P=w.reduce((e,t)=>e+t.collected,0),F=w.reduce((e,t)=>e+(t.billed-t.listBilled),0),z=T(w,h),B=(0,U.useMemo)(()=>C(r,i),[r,i]),W=(0,U.useMemo)(()=>z?k.filter(e=>e.key!==z.key):k,[k,z]),G=i.filter(e=>e.kind===`other`).slice().sort((e,t)=>t.date.localeCompare(e.date)||t.id.localeCompare(e.id)),K=G.filter(e=>e.date===a).reduce((e,t)=>e+t.amount,0),q=G.reduce((e,t)=>e+t.amount,0);function J(e,t,n){m(()=>{l({particular:e.key,mode:t,amount:n,kind:`due`}),N.success(`Collected ${s(n)} from ${e.key}`)},{title:`Are you sure?`,message:`Collect ${s(n)} from ${e.key}? Oldest open stays will tick Paid first.`,confirmLabel:`Collect`})}function X(n){if(e(d,t.balance(n))){N.message(`Saved — this collection will not change`);return}m(()=>{u(n),N.success(`Collection removed`)},{title:`Are you sure?`,message:`Delete this collection?`,confirmLabel:`Delete`,danger:!0})}return(0,Q.jsxs)(`div`,{className:`flex flex-col gap-5`,children:[(0,Q.jsxs)(`div`,{className:`flex flex-wrap items-end justify-between gap-3`,children:[(0,Q.jsxs)(`div`,{children:[(0,Q.jsx)(`p`,{className:`text-xs font-medium uppercase tracking-[0.18em] text-muted`,children:`Outstanding`}),(0,Q.jsx)(`h1`,{className:`mt-1 font-display text-3xl font-semibold tracking-tight`,children:`Balance`}),(0,Q.jsx)(`p`,{className:`mt-1 text-sm text-muted`,children:`Collect dues, then press Save to send the books to the server.`})]}),(0,Q.jsx)(H,{busy:f,onSave:()=>void p()})]}),(0,Q.jsxs)(`div`,{className:`grid grid-cols-2 gap-3 lg:grid-cols-4`,children:[(0,Q.jsxs)(I,{className:`p-4`,children:[(0,Q.jsx)(`div`,{className:`text-xs font-medium text-muted`,children:`Books C/B`}),(0,Q.jsx)(`div`,{className:`mt-1 font-display text-2xl font-semibold tabular text-due`,children:s(D?.outstanding.cb??0)})]}),(0,Q.jsxs)(I,{className:`p-4`,children:[(0,Q.jsx)(`div`,{className:`text-xs font-medium text-muted`,children:`Open source dues`}),(0,Q.jsx)(`div`,{className:`mt-1 font-display text-2xl font-semibold tabular`,children:s(A)})]}),(0,Q.jsxs)(I,{className:`p-4`,children:[(0,Q.jsx)(`div`,{className:`text-xs font-medium text-muted`,children:`Billed`}),(0,Q.jsx)(`div`,{className:`mt-1 font-display text-2xl font-semibold tabular`,children:s(F)})]}),(0,Q.jsxs)(I,{className:`p-4`,children:[(0,Q.jsx)(`div`,{className:`text-xs font-medium text-muted`,children:`Collected`}),(0,Q.jsx)(`div`,{className:`mt-1 font-display text-2xl font-semibold tabular text-ok`,children:s(P)})]})]}),(0,Q.jsxs)(te,{defaultValue:`balance`,children:[(0,Q.jsxs)(ee,{className:`grid w-full grid-cols-2`,"aria-label":`Balance sections`,children:[(0,Q.jsx)(L,{value:`balance`,className:`w-full`,children:`Balance`}),(0,Q.jsx)(L,{value:`other`,className:`w-full`,children:`Other`})]}),(0,Q.jsxs)(R,{value:`balance`,className:`flex flex-col gap-5`,children:[(0,Q.jsxs)(`div`,{className:`flex flex-col gap-3`,children:[(0,Q.jsxs)(`div`,{className:`relative min-w-0`,children:[(0,Q.jsx)(S,{className:`pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted`}),(0,Q.jsx)(M,{className:`pl-9`,placeholder:`Source or guest — Flysky, Motor, name`,value:h,onChange:e=>g(e.target.value),"aria-label":`Search dues`,list:`balance-source-hints`,autoComplete:`off`}),(0,Q.jsx)(`datalist`,{id:`balance-source-hints`,children:B.map(e=>(0,Q.jsx)(`option`,{value:e},e))})]}),(0,Q.jsxs)(`div`,{className:`flex flex-wrap gap-2`,children:[(0,Q.jsx)(O,{variant:_?`default`:`outline`,onClick:()=>v(e=>!e),children:_?`Open dues`:`All sources`}),(0,Q.jsxs)(O,{variant:`outline`,onClick:()=>{if(k.length===0){N.error(`No sources to print`);return}N.message(`Opening source print…`),Y(k,n.name,n.place)},children:[(0,Q.jsx)(x,{className:`size-4`}),`Print sources`]})]}),(0,Q.jsxs)(`p`,{className:`text-xs text-muted`,children:[(0,Q.jsx)(`span`,{className:`font-medium text-fg`,children:`Print sources`}),` — Flysky, Motor, remaining only, no guest names.`,` `,(0,Q.jsx)(`span`,{className:`font-medium text-fg`,children:`Print guests`}),` on a source — that company, then each guest stay.`]})]}),z?(0,Q.jsxs)(`p`,{className:`text-sm text-muted`,children:[(0,Q.jsx)(`span`,{className:`font-medium text-fg`,children:z.key}),` · `,z.guestCount,` guest`,z.guestCount===1?``:`s`,` · `,z.stays.length,` stay`,z.stays.length===1?``:`s`,` · billed `,s(z.billed),` · due `,s(Math.max(0,z.remaining))]}):null,z?(0,Q.jsx)($,{account:z,open:!0,pinned:!0,month:a.slice(0,7),onToggle:()=>g(``),onCollect:(e,t)=>J(z,e,t),onRemoveReceipt:X,onPrintGuests:()=>{N.message(`Opening guest print…`),Z(z,n.name,n.place)}}):null,(0,Q.jsxs)(`div`,{className:`flex flex-col gap-2`,children:[W.map(e=>(0,Q.jsx)($,{account:e,open:y===e.key,month:a.slice(0,7),onToggle:()=>b(t=>t===e.key?null:e.key),onCollect:(t,n)=>J(e,t,n),onRemoveReceipt:X,onPrintGuests:()=>{N.message(`Opening guest print…`),Z(e,n.name,n.place)}},e.key)),W.length===0&&!z?(0,Q.jsx)(I,{className:`p-8 text-center text-sm text-muted`,children:`No source dues match this filter.`}):null]})]}),(0,Q.jsx)(R,{value:`other`,className:`flex flex-col gap-5`,children:(0,Q.jsx)(ae,{booksCb:D?.outstanding.cb??0,today:K,total:q,rows:G,onAdd:(e,t,n)=>{m(()=>{l({particular:n.trim()?`Other · ${n.trim()}`:`Other`,mode:e,amount:t,kind:`other`}),N.success(`Other ${s(t)} saved`)},{title:`Save this Other entry?`,message:`Other ${s(t)}. It will not show on the Balance list.`,confirmLabel:`Save`})},onRemove:e=>{m(()=>{u(e),N.success(`Other entry removed`)},{title:`Delete this Other entry?`,message:`Remove this Other amount?`,confirmLabel:`Delete`,danger:!0})}})})]})]})}function ae({booksCb:e,today:t,total:n,rows:a,onAdd:o,onRemove:c}){let[u,d]=(0,U.useState)(`CASH`),[f,p]=(0,U.useState)(``),[_,y]=(0,U.useState)(``);return(0,Q.jsxs)(Q.Fragment,{children:[(0,Q.jsxs)(`div`,{className:`grid grid-cols-2 gap-3 lg:grid-cols-3`,children:[(0,Q.jsxs)(I,{className:`p-4`,children:[(0,Q.jsx)(`div`,{className:`text-xs font-medium text-muted`,children:`Books outstanding`}),(0,Q.jsx)(`div`,{className:`mt-1 font-display text-2xl font-semibold tabular text-due`,children:s(e)})]}),(0,Q.jsxs)(I,{className:`p-4`,children:[(0,Q.jsx)(`div`,{className:`text-xs font-medium text-muted`,children:`Other today`}),(0,Q.jsx)(`div`,{className:`mt-1 font-display text-2xl font-semibold tabular`,children:s(t)})]}),(0,Q.jsxs)(I,{className:`col-span-2 p-4 lg:col-span-1`,children:[(0,Q.jsx)(`div`,{className:`text-xs font-medium text-muted`,children:`Other posted`}),(0,Q.jsx)(`div`,{className:`mt-1 font-display text-2xl font-semibold tabular`,children:s(n)})]})]}),(0,Q.jsx)(I,{children:(0,Q.jsxs)(F,{className:`flex flex-col gap-4 p-5`,children:[(0,Q.jsxs)(`div`,{children:[(0,Q.jsx)(`p`,{className:`font-display text-lg font-semibold tracking-tight`,children:`Other`}),(0,Q.jsx)(`p`,{className:`mt-1 text-sm text-muted`,children:`Amount + note. Name stays Other. It does not appear on the Balance list.`})]}),(0,Q.jsxs)(`form`,{className:`grid gap-3 sm:grid-cols-[9rem_8rem_1fr_auto]`,onSubmit:e=>{e.preventDefault();let t=Number(f);if(!Number.isFinite(t)||t<=0){N.error(`Enter an amount`);return}o(u,t,_),p(``),y(``)},children:[(0,Q.jsxs)(`div`,{className:`grid gap-1.5`,children:[(0,Q.jsx)(k,{children:`Paid by`}),(0,Q.jsxs)(b,{value:u,onValueChange:e=>d(e),children:[(0,Q.jsx)(h,{"aria-label":`Other payment mode`,children:(0,Q.jsx)(m,{})}),(0,Q.jsx)(g,{children:i.map(e=>(0,Q.jsx)(v,{value:e,children:l[e]},e))})]})]}),(0,Q.jsxs)(`div`,{className:`grid gap-1.5`,children:[(0,Q.jsx)(k,{children:`Amount`}),(0,Q.jsx)(M,{type:`text`,inputMode:`decimal`,autoComplete:`off`,value:f,onChange:e=>p(e.target.value),placeholder:`0`})]}),(0,Q.jsxs)(`div`,{className:`grid gap-1.5`,children:[(0,Q.jsx)(k,{htmlFor:`other-note`,children:`Note`}),(0,Q.jsx)(M,{id:`other-note`,value:_,onChange:e=>y(e.target.value),placeholder:`Optional`})]}),(0,Q.jsx)(`div`,{className:`flex items-end`,children:(0,Q.jsx)(O,{type:`submit`,className:`w-full`,children:`Save`})})]})]})}),(0,Q.jsx)(I,{children:(0,Q.jsxs)(F,{className:`overflow-x-auto p-0`,children:[(0,Q.jsxs)(`table`,{className:`w-full min-w-[32rem] text-left text-sm`,children:[(0,Q.jsx)(`thead`,{className:`text-xs uppercase tracking-wide text-muted`,children:(0,Q.jsxs)(`tr`,{className:`border-y border-border`,children:[(0,Q.jsx)(`th`,{className:`px-5 py-2 font-medium`,children:`Date`}),(0,Q.jsx)(`th`,{className:`px-3 py-2 font-medium`,children:`Note`}),(0,Q.jsx)(`th`,{className:`px-3 py-2 font-medium`,children:`Paid by`}),(0,Q.jsx)(`th`,{className:`px-3 py-2 text-right font-medium`,children:`Amount`}),(0,Q.jsx)(`th`,{className:`px-3 py-2`})]})}),(0,Q.jsx)(`tbody`,{children:a.map(e=>(0,Q.jsxs)(`tr`,{className:`border-b border-border/70`,children:[(0,Q.jsx)(`td`,{className:`px-5 py-2.5 tabular text-muted`,children:r(e.date)}),(0,Q.jsx)(`td`,{className:`px-3 py-2.5`,children:e.particular}),(0,Q.jsx)(`td`,{className:`px-3 py-2.5`,children:(0,Q.jsx)(z,{mode:e.mode})}),(0,Q.jsx)(`td`,{className:`px-3 py-2.5 text-right tabular`,children:s(e.amount)}),(0,Q.jsx)(`td`,{className:`px-3 py-2.5 text-right`,children:(0,Q.jsx)(O,{variant:`ghost`,size:`icon`,className:`size-9 min-h-9 text-muted hover:text-danger`,"aria-label":`Remove other entry`,onClick:()=>c(e.id),children:(0,Q.jsx)(D,{className:`size-4`})})})]},e.id))})]}),a.length===0?(0,Q.jsx)(`p`,{className:`py-10 text-center text-sm text-muted`,children:`No Other entries yet.`}):null]})})]})}function $({account:e,open:t,pinned:n,month:o,onToggle:c,onCollect:u,onRemoveReceipt:d,onPrintGuests:f}){let[y,S]=(0,U.useState)(`CASH`),[C,w]=(0,U.useState)(``),T=t||n,E=!e.settled&&!!e.lastDate&&e.lastDate.slice(0,7)<o;return(0,Q.jsxs)(I,{className:p(`overflow-hidden`,n&&`ring-1 ring-primary/30`),children:[(0,Q.jsxs)(`div`,{className:`flex w-full min-h-14 flex-wrap items-center gap-2 px-4 py-3 md:px-5`,children:[(0,Q.jsxs)(`button`,{type:`button`,onClick:c,"aria-expanded":T,className:`flex min-w-0 flex-1 items-center gap-3 text-left`,children:[(0,Q.jsx)(_,{className:p(`size-4 shrink-0 text-muted transition-transform duration-150`,T?`rotate-0`:`-rotate-90`)}),(0,Q.jsxs)(`div`,{className:`min-w-0 flex-1`,children:[(0,Q.jsx)(`div`,{className:`truncate font-display text-lg font-semibold tracking-tight`,children:e.key}),(0,Q.jsxs)(`div`,{className:`text-xs text-muted`,children:[e.guestCount,` guest`,e.guestCount===1?``:`s`,` ·`,` `,e.stays.length,` stay`,e.stays.length===1?``:`s`,` ·`,` `,e.nights,` night`,e.nights===1?``:`s`,e.firstDate?` · ${r(e.firstDate)}–${r(e.lastDate)}`:``]})]})]}),(0,Q.jsxs)(O,{type:`button`,variant:`outline`,size:`sm`,className:`shrink-0`,onClick:f,children:[(0,Q.jsx)(x,{className:`size-4`}),`Print guests`]}),(0,Q.jsxs)(`div`,{className:`text-right`,children:[(0,Q.jsx)(`div`,{className:p(`font-display text-xl font-semibold tabular`,e.settled?`text-ok`:`text-due`),children:s(Math.max(0,e.remaining))}),(0,Q.jsx)(P,{variant:e.settled?`ok`:`warn`,children:e.settled?`Settled`:E?`Carried`:`Open`})]})]}),T?(0,Q.jsxs)(F,{className:`border-t border-border pt-4`,children:[(0,Q.jsxs)(`div`,{className:`-mx-5 overflow-x-auto`,children:[(0,Q.jsxs)(`table`,{className:`w-full min-w-[52rem] text-left text-sm`,children:[(0,Q.jsx)(`thead`,{className:`text-xs uppercase tracking-wide text-muted`,children:(0,Q.jsxs)(`tr`,{className:`border-b border-border`,children:[(0,Q.jsx)(`th`,{className:`px-5 py-2 font-medium`,children:` `}),(0,Q.jsx)(`th`,{className:`px-3 py-2 font-medium`,children:`Guest`}),(0,Q.jsx)(`th`,{className:`px-3 py-2 font-medium`,children:`Check-in`}),(0,Q.jsx)(`th`,{className:`px-3 py-2 font-medium`,children:`Check-out`}),(0,Q.jsx)(`th`,{className:`px-3 py-2 text-right font-medium`,children:`Nights`}),(0,Q.jsx)(`th`,{className:`px-3 py-2 text-right font-medium`,children:`Per day`}),(0,Q.jsx)(`th`,{className:`px-3 py-2 text-right font-medium`,children:`Total`}),(0,Q.jsx)(`th`,{className:`px-5 py-2 font-medium`,children:`Status`})]})}),(0,Q.jsx)(`tbody`,{children:e.stays.map(e=>(0,Q.jsxs)(`tr`,{className:p(`border-b border-border/70`,e.status===`paid`&&`bg-ok/5`),children:[(0,Q.jsx)(`td`,{className:`px-5 py-2.5`,children:(0,Q.jsx)(oe,{stay:e})}),(0,Q.jsxs)(`td`,{className:`px-3 py-2.5`,children:[(0,Q.jsx)(`div`,{className:`font-medium`,children:e.name}),(0,Q.jsxs)(`div`,{className:`text-xs text-muted`,children:[`Room `,e.roomNo]})]}),(0,Q.jsx)(`td`,{className:`px-3 py-2.5 tabular`,children:a(e.checkIn)}),(0,Q.jsx)(`td`,{className:`px-3 py-2.5 tabular text-muted`,children:re(e)}),(0,Q.jsx)(`td`,{className:`px-3 py-2.5 text-right tabular`,children:e.days}),(0,Q.jsx)(`td`,{className:`px-3 py-2.5 text-right tabular`,children:s(e.perDay)}),(0,Q.jsx)(`td`,{className:`px-3 py-2.5 text-right tabular font-medium`,children:s(e.billed)}),(0,Q.jsx)(`td`,{className:`px-5 py-2.5`,children:(0,Q.jsx)(se,{stay:e})})]},e.id))})]}),e.stays.length===0?(0,Q.jsx)(`p`,{className:`px-5 py-4 text-sm text-muted`,children:`No guest stays on this source.`}):null]}),(0,Q.jsxs)(`div`,{className:`mt-3 flex flex-wrap justify-between gap-2 text-sm`,children:[(0,Q.jsxs)(`span`,{className:`text-muted`,children:[e.guestCount,` guests · billed `,s(e.billed),` · paid`,` `,s(e.collected)]}),(0,Q.jsxs)(`span`,{className:`font-semibold tabular`,children:[`Due `,s(Math.max(0,e.remaining))]})]}),e.receipts.length>0?(0,Q.jsx)(`ul`,{className:`mt-3 divide-y divide-border rounded-lg border border-border`,children:e.receipts.map(e=>(0,Q.jsxs)(`li`,{className:`flex items-center justify-between gap-3 px-3 py-2`,children:[(0,Q.jsxs)(`div`,{className:`min-w-0`,children:[(0,Q.jsxs)(`div`,{className:`truncate text-sm`,children:[r(e.date),` · `,e.particular]}),(0,Q.jsx)(z,{mode:e.mode})]}),(0,Q.jsxs)(`div`,{className:`flex items-center gap-1`,children:[(0,Q.jsx)(`span`,{className:`tabular text-sm font-medium text-ok`,children:s(e.amount)}),(0,Q.jsx)(O,{variant:`ghost`,size:`icon`,className:`size-9 min-h-9 text-muted hover:text-danger`,"aria-label":`Remove collection`,onClick:()=>d(e.id),children:(0,Q.jsx)(D,{className:`size-4`})})]})]},e.id))}):null,e.settled?(0,Q.jsx)(`p`,{className:`mt-4 text-sm text-ok`,children:`This source is settled. Every stay is ticked Paid.`}):(0,Q.jsxs)(`form`,{className:`mt-4 grid gap-3 sm:grid-cols-[9rem_1fr_auto]`,onSubmit:t=>{t.preventDefault();let n=Number(C||Math.max(0,e.remaining));if(!Number.isFinite(n)||n<=0){N.error(`Enter an amount to collect`);return}u(y,n),w(``)},children:[(0,Q.jsxs)(`div`,{className:`grid gap-1.5`,children:[(0,Q.jsx)(k,{children:`Mode`}),(0,Q.jsxs)(b,{value:y,onValueChange:e=>S(e),children:[(0,Q.jsx)(h,{"aria-label":`Collection mode`,children:(0,Q.jsx)(m,{})}),(0,Q.jsx)(g,{children:i.map(e=>(0,Q.jsx)(v,{value:e,children:l[e]},e))})]})]}),(0,Q.jsxs)(`div`,{className:`grid gap-1.5`,children:[(0,Q.jsx)(k,{children:`Amount`}),(0,Q.jsx)(M,{type:`number`,min:0,value:C,onChange:e=>w(e.target.value),placeholder:String(Math.max(0,e.remaining))})]}),(0,Q.jsx)(`div`,{className:`flex items-end`,children:(0,Q.jsx)(O,{type:`submit`,className:`w-full`,children:`Collect`})})]})]}):null]})}function oe({stay:e}){let t=e.status===`paid`;return(0,Q.jsx)(`span`,{className:p(`grid size-7 place-items-center rounded-md border`,t?`border-ok/40 bg-ok text-primary-fg`:e.status===`partial`?`border-due/40 bg-due/10 text-due`:`border-border bg-card text-transparent`),"aria-label":w(e.status),children:(0,Q.jsx)(y,{className:`size-3.5`,strokeWidth:3})})}function se({stay:e}){return e.status===`paid`?(0,Q.jsx)(P,{variant:`ok`,children:`Paid`}):e.status===`partial`?(0,Q.jsxs)(`div`,{className:`flex flex-col gap-0.5`,children:[(0,Q.jsx)(P,{variant:`warn`,children:`Partial`}),(0,Q.jsxs)(`span`,{className:`text-xs tabular text-muted`,children:[`Due `,s(e.remaining)]})]}):(0,Q.jsx)(P,{variant:`warn`,children:`Open`})}export{ie as component};