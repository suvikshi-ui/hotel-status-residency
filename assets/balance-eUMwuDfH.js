import{A as e,E as t,F as n,M as r,R as i,T as a,b as o,i as s,j as c,r as l,v as u}from"./store-BkE5QQqA.js";import{n as d}from"./dist-Dbwxu2UB.js";import{r as f,t as p}from"./utils-knsow1Ry.js";import{a as m,c as h,d as g,f as _,i as v,l as y,n as b,o as x,r as S,s as C,t as w,u as T}from"./balance-DGrmBxVm.js";import{t as E}from"./printer-BioQDleB.js";import{t as D}from"./trash-2-Bb-WHEhs.js";import{E as O,M as k,a as A,i as j,t as M}from"./index-DK_wdYgq.js";import{t as N}from"./badge-D1db6yoX.js";import{n as P,t as F}from"./card-CWncbwHd.js";import{i as I,n as L,r as R,t as ee}from"./tabs-B0Tk7gQL.js";import{t as z}from"./mode-badge-BFeQ8p8x.js";import{t as B}from"./print-sheet-DIQsdIIR.js";var V=i(n());function H(t){try{let n=e(t);return r(n)?c(n,`dd/MM/yy`):t}catch{return t}}function U(e){return Math.round(e).toLocaleString(`en-IN`)}function W(e){return e.checkOut?H(e.checkOut):`In house`}function te(e){return e.status===`paid`?`✓ Paid`:e.status===`partial`?`Partial · ${U(e.remaining)}`:`Open`}function G(e,t){let n=`<!doctype html>
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
    <img src="${k(`logo.png?v=2`)}" alt="" />
    <div style="flex:1;text-align:center">
      <h1>${B(e.toUpperCase())}</h1>
      <p>${B(t.toUpperCase())} · ${B(n)}</p>
    </div>
  </div>`}function q(e,t,n){let r=e.map(e=>`<tr>
        <td>${B(e.key)}</td>
        <td class="ctr">${e.guestCount}</td>
        <td class="ctr">${e.stays.length}</td>
        <td class="num">${U(e.billed)}</td>
        <td class="num">${U(e.collected)}</td>
        <td class="num ${e.settled?`paid`:`open`}">${U(Math.max(0,e.remaining))}</td>
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
            <td class="num">${U(i)}</td>
            <td class="num">${U(a)}</td>
            <td class="num">${U(o)}</td>
          </tr>
        </tfoot>
      </table>
      <p class="note">Guest names are not listed. Use Print guests on a source for Flysky / Motor detail.</p>
    </div>
  </div>`)}function J(e){return e.map(e=>`<tr>
        <td>${B(e.name)}</td>
        <td>${H(e.checkIn)}</td>
        <td>${W(e)}</td>
        <td class="ctr">${e.days}</td>
        <td class="num">${U(e.perDay)}</td>
        <td class="num">${U(e.billed)}</td>
        <td class="${e.status===`paid`?`paid`:`open`}">${B(te(e))}</td>
      </tr>`).join(``)}function Y(e){return`<tfoot>
    <tr>
      <td colspan="3">${B(e.key)} · ${e.stays.length} stay${e.stays.length===1?``:`s`}</td>
      <td class="ctr">${e.stays.reduce((e,t)=>e+t.days,0)}</td>
      <td></td>
      <td class="num">${U(e.billed)}</td>
      <td class="num ${e.settled?`paid`:`open`}">${U(Math.max(0,e.remaining))} due</td>
    </tr>
  </tfoot>`}function X(e,t,n){let r=`<div class="sheet">
    ${K(t,n,`${e.key} outstanding`)}
    <div class="body">
      <h2>${B(e.key)}</h2>
      <table>
        <thead>
          <tr>
            <th>Guest</th>
            <th>Check-in</th>
            <th>Check-out</th>
            <th class="ctr">Days</th>
            <th class="num">Per day</th>
            <th class="num">Total</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${J(e.stays)||`<tr><td colspan="7" class="ctr">No guests</td></tr>`}
        </tbody>
        ${Y(e)}
      </table>
      <p class="note">Paid ${U(e.collected)} · billed ${U(e.billed)} · oldest stays tick Paid first when a collection is posted.</p>
    </div>
  </div>`;G(`${e.key} guests`,r)}var Z=f();function Q(e){return e.checkOut?a(e.checkOut):`In house`}function ne(){let e=s(e=>e.hotel),n=s(e=>e.guests),r=s(e=>e.balReceived),i=s(e=>e.selectedDate),a=s(e=>e.addBalReceived),o=s(e=>e.removeBalReceived),{gate:c}=M(),[u,f]=(0,V.useState)(``),[p,m]=(0,V.useState)(!0),[h,g]=(0,V.useState)(null),_=(0,V.useMemo)(()=>w(n,r),[n,r]),y=l(i),b=(0,V.useMemo)(()=>{let e=u.trim().toLowerCase();return _.filter(t=>p&&t.settled?!1:!e||t.key.toLowerCase().includes(e)?!0:t.guests.some(t=>t.name.toLowerCase().includes(e)||t.roomNo.toLowerCase().includes(e)))},[_,p,u]),x=_.filter(e=>!e.settled).reduce((e,t)=>e+Math.max(0,t.remaining),0),C=_.reduce((e,t)=>e+t.collected,0),D=_.reduce((e,t)=>e+t.billed,0),k=S(_,u),j=(0,V.useMemo)(()=>v(n),[n]),N=(0,V.useMemo)(()=>k?b.filter(e=>e.key!==k.key):b,[b,k]),P=r.filter(e=>e.kind===`other`).slice().sort((e,t)=>t.date.localeCompare(e.date)||t.id.localeCompare(e.id)),z=P.filter(e=>e.date===i).reduce((e,t)=>e+t.amount,0),B=P.reduce((e,t)=>e+t.amount,0);function H(e,n,r){c(()=>{a({particular:e.key,mode:n,amount:r,kind:`due`}),d.success(`Collected ${t(r)} from ${e.key}`)},{title:`Are you sure?`,message:`Collect ${t(r)} from ${e.key}? Oldest open stays will tick Paid first.`,confirmLabel:`Collect`})}function U(e){c(()=>{o(e),d.success(`Collection removed`)},{title:`Are you sure?`,message:`Delete this collection?`,confirmLabel:`Delete`,danger:!0})}return(0,Z.jsxs)(`div`,{className:`flex flex-col gap-5`,children:[(0,Z.jsxs)(`div`,{children:[(0,Z.jsx)(`p`,{className:`text-xs font-medium uppercase tracking-[0.18em] text-muted`,children:`Outstanding`}),(0,Z.jsx)(`h1`,{className:`mt-1 font-display text-3xl font-semibold tracking-tight`,children:`Balance`}),(0,Z.jsx)(`p`,{className:`mt-1 text-sm text-muted`,children:`Guest stays with check-in, days and rate. Print sources for Flysky / Motor totals, or print guests under one source. Collections tick the oldest stay Paid.`})]}),(0,Z.jsxs)(`div`,{className:`grid grid-cols-2 gap-3 lg:grid-cols-4`,children:[(0,Z.jsxs)(F,{className:`p-4`,children:[(0,Z.jsx)(`div`,{className:`text-xs font-medium text-muted`,children:`Books C/B`}),(0,Z.jsx)(`div`,{className:`mt-1 font-display text-2xl font-semibold tabular text-due`,children:t(y?.outstanding.cb??0)})]}),(0,Z.jsxs)(F,{className:`p-4`,children:[(0,Z.jsx)(`div`,{className:`text-xs font-medium text-muted`,children:`Open source dues`}),(0,Z.jsx)(`div`,{className:`mt-1 font-display text-2xl font-semibold tabular`,children:t(x)})]}),(0,Z.jsxs)(F,{className:`p-4`,children:[(0,Z.jsx)(`div`,{className:`text-xs font-medium text-muted`,children:`Billed`}),(0,Z.jsx)(`div`,{className:`mt-1 font-display text-2xl font-semibold tabular`,children:t(D)})]}),(0,Z.jsxs)(F,{className:`p-4`,children:[(0,Z.jsx)(`div`,{className:`text-xs font-medium text-muted`,children:`Collected`}),(0,Z.jsx)(`div`,{className:`mt-1 font-display text-2xl font-semibold tabular text-ok`,children:t(C)})]})]}),(0,Z.jsxs)(ee,{defaultValue:`balance`,children:[(0,Z.jsxs)(R,{className:`grid w-full grid-cols-2`,"aria-label":`Balance sections`,children:[(0,Z.jsx)(I,{value:`balance`,className:`w-full`,children:`Balance`}),(0,Z.jsx)(I,{value:`other`,className:`w-full`,children:`Other`})]}),(0,Z.jsxs)(L,{value:`balance`,className:`flex flex-col gap-5`,children:[(0,Z.jsxs)(`div`,{className:`flex flex-col gap-3`,children:[(0,Z.jsxs)(`div`,{className:`relative min-w-0`,children:[(0,Z.jsx)(T,{className:`pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted`}),(0,Z.jsx)(A,{className:`pl-9`,placeholder:`Source or guest — Flysky, Motor, name`,value:u,onChange:e=>f(e.target.value),"aria-label":`Search dues`,list:`balance-source-hints`,autoComplete:`off`}),(0,Z.jsx)(`datalist`,{id:`balance-source-hints`,children:j.map(e=>(0,Z.jsx)(`option`,{value:e},e))})]}),(0,Z.jsxs)(`div`,{className:`flex flex-wrap gap-2`,children:[(0,Z.jsx)(O,{variant:p?`default`:`outline`,onClick:()=>m(e=>!e),children:p?`Open dues`:`All sources`}),(0,Z.jsxs)(O,{variant:`outline`,onClick:()=>{if(b.length===0){d.error(`No sources to print`);return}d.message(`Opening source print…`),q(b,e.name,e.place)},children:[(0,Z.jsx)(E,{className:`size-4`}),`Print sources`]})]}),(0,Z.jsxs)(`p`,{className:`text-xs text-muted`,children:[(0,Z.jsx)(`span`,{className:`font-medium text-fg`,children:`Print sources`}),` — Flysky, Motor, remaining only, no guest names.`,` `,(0,Z.jsx)(`span`,{className:`font-medium text-fg`,children:`Print guests`}),` on a source — that company, then each guest stay.`]})]}),k?(0,Z.jsxs)(`p`,{className:`text-sm text-muted`,children:[(0,Z.jsx)(`span`,{className:`font-medium text-fg`,children:k.key}),` · `,k.guestCount,` guest`,k.guestCount===1?``:`s`,` · `,k.stays.length,` stay`,k.stays.length===1?``:`s`,` · billed `,t(k.billed),` · due `,t(Math.max(0,k.remaining))]}):null,k?(0,Z.jsx)($,{account:k,open:!0,pinned:!0,month:i.slice(0,7),onToggle:()=>f(``),onCollect:(e,t)=>H(k,e,t),onRemoveReceipt:U,onPrintGuests:()=>{d.message(`Opening guest print…`),X(k,e.name,e.place)}}):null,(0,Z.jsxs)(`div`,{className:`flex flex-col gap-2`,children:[N.map(t=>(0,Z.jsx)($,{account:t,open:h===t.key,month:i.slice(0,7),onToggle:()=>g(e=>e===t.key?null:t.key),onCollect:(e,n)=>H(t,e,n),onRemoveReceipt:U,onPrintGuests:()=>{d.message(`Opening guest print…`),X(t,e.name,e.place)}},t.key)),N.length===0&&!k?(0,Z.jsx)(F,{className:`p-8 text-center text-sm text-muted`,children:`No source dues match this filter.`}):null]})]}),(0,Z.jsx)(L,{value:`other`,className:`flex flex-col gap-5`,children:(0,Z.jsx)(re,{booksCb:y?.outstanding.cb??0,today:z,total:B,rows:P,onAdd:(e,n,r)=>{c(()=>{a({particular:r,mode:e,amount:n,kind:`other`}),d.success(`Other ${t(n)} cut from main balance`)},{title:`Are you sure?`,message:`Cut ${t(n)} from main balance?`,confirmLabel:`Save`})},onRemove:e=>{c(()=>{o(e),d.success(`Other collection removed`)},{title:`Are you sure?`,message:`Delete this other collection?`,confirmLabel:`Delete`,danger:!0})}})})]})]})}function re({booksCb:e,today:n,total:r,rows:i,onAdd:s,onRemove:c}){let[l,f]=(0,V.useState)(`CASH`),[p,g]=(0,V.useState)(``),[_,v]=(0,V.useState)(``);return(0,Z.jsxs)(Z.Fragment,{children:[(0,Z.jsxs)(`div`,{className:`grid grid-cols-2 gap-3 lg:grid-cols-3`,children:[(0,Z.jsxs)(F,{className:`p-4`,children:[(0,Z.jsx)(`div`,{className:`text-xs font-medium text-muted`,children:`Main balance`}),(0,Z.jsx)(`div`,{className:`mt-1 font-display text-2xl font-semibold tabular text-due`,children:t(e)})]}),(0,Z.jsxs)(F,{className:`p-4`,children:[(0,Z.jsx)(`div`,{className:`text-xs font-medium text-muted`,children:`Other today`}),(0,Z.jsx)(`div`,{className:`mt-1 font-display text-2xl font-semibold tabular`,children:t(n)})]}),(0,Z.jsxs)(F,{className:`col-span-2 p-4 lg:col-span-1`,children:[(0,Z.jsx)(`div`,{className:`text-xs font-medium text-muted`,children:`Other posted`}),(0,Z.jsx)(`div`,{className:`mt-1 font-display text-2xl font-semibold tabular`,children:t(r)})]})]}),(0,Z.jsx)(F,{children:(0,Z.jsxs)(P,{className:`flex flex-col gap-4 p-5`,children:[(0,Z.jsxs)(`div`,{children:[(0,Z.jsx)(`p`,{className:`font-display text-lg font-semibold tracking-tight`,children:`Cut from main balance`}),(0,Z.jsx)(`p`,{className:`mt-1 text-sm text-muted`,children:`Amount only — no source name. Lands in cash / Santosh QR / P.K. QR and reduces the books outstanding.`})]}),(0,Z.jsxs)(`form`,{className:`grid gap-3 sm:grid-cols-[9rem_1fr_auto]`,onSubmit:e=>{e.preventDefault();let t=Number(p);if(!Number.isFinite(t)||t<=0){d.error(`Enter an amount`);return}s(l,t,_.trim()||`Other`),g(``),v(``)},children:[(0,Z.jsxs)(`div`,{className:`grid gap-1.5`,children:[(0,Z.jsx)(j,{children:`Paid by`}),(0,Z.jsxs)(m,{value:l,onValueChange:e=>f(e),children:[(0,Z.jsx)(h,{"aria-label":`Other payment mode`,children:(0,Z.jsx)(y,{})}),(0,Z.jsx)(x,{children:u.map(e=>(0,Z.jsx)(C,{value:e,children:o[e]},e))})]})]}),(0,Z.jsxs)(`div`,{className:`grid gap-1.5`,children:[(0,Z.jsx)(j,{children:`Amount`}),(0,Z.jsx)(A,{type:`number`,min:0,value:p,onChange:e=>g(e.target.value),placeholder:`0`})]}),(0,Z.jsx)(`div`,{className:`flex items-end`,children:(0,Z.jsx)(O,{type:`submit`,className:`w-full`,children:`Cut balance`})}),(0,Z.jsxs)(`div`,{className:`grid gap-1.5 sm:col-span-3`,children:[(0,Z.jsx)(j,{htmlFor:`other-note`,children:`Note (optional)`}),(0,Z.jsx)(A,{id:`other-note`,value:_,onChange:e=>v(e.target.value),placeholder:`Not a source name`})]})]})]})}),(0,Z.jsx)(F,{children:(0,Z.jsxs)(P,{className:`overflow-x-auto p-0`,children:[(0,Z.jsxs)(`table`,{className:`w-full min-w-[32rem] text-left text-sm`,children:[(0,Z.jsx)(`thead`,{className:`text-xs uppercase tracking-wide text-muted`,children:(0,Z.jsxs)(`tr`,{className:`border-y border-border`,children:[(0,Z.jsx)(`th`,{className:`px-5 py-2 font-medium`,children:`Date`}),(0,Z.jsx)(`th`,{className:`px-3 py-2 font-medium`,children:`Note`}),(0,Z.jsx)(`th`,{className:`px-3 py-2 font-medium`,children:`Paid by`}),(0,Z.jsx)(`th`,{className:`px-3 py-2 text-right font-medium`,children:`Amount`}),(0,Z.jsx)(`th`,{className:`px-3 py-2`})]})}),(0,Z.jsx)(`tbody`,{children:i.map(e=>(0,Z.jsxs)(`tr`,{className:`border-b border-border/70`,children:[(0,Z.jsx)(`td`,{className:`px-5 py-2.5 tabular text-muted`,children:a(e.date)}),(0,Z.jsx)(`td`,{className:`px-3 py-2.5`,children:e.particular}),(0,Z.jsx)(`td`,{className:`px-3 py-2.5`,children:(0,Z.jsx)(z,{mode:e.mode})}),(0,Z.jsx)(`td`,{className:`px-3 py-2.5 text-right tabular`,children:t(e.amount)}),(0,Z.jsx)(`td`,{className:`px-3 py-2.5 text-right`,children:(0,Z.jsx)(O,{variant:`ghost`,size:`icon`,className:`size-9 min-h-9 text-muted hover:text-danger`,"aria-label":`Remove other collection`,onClick:()=>c(e.id),children:(0,Z.jsx)(D,{className:`size-4`})})})]},e.id))})]}),i.length===0?(0,Z.jsx)(`p`,{className:`py-10 text-center text-sm text-muted`,children:`No other cuts yet.`}):null]})})]})}function $({account:e,open:n,pinned:r,month:i,onToggle:s,onCollect:c,onRemoveReceipt:l,onPrintGuests:f}){let[_,v]=(0,V.useState)(`CASH`),[b,S]=(0,V.useState)(``),w=n||r,T=!e.settled&&!!e.lastDate&&e.lastDate.slice(0,7)<i;return(0,Z.jsxs)(F,{className:p(`overflow-hidden`,r&&`ring-1 ring-primary/30`),children:[(0,Z.jsxs)(`div`,{className:`flex w-full min-h-14 flex-wrap items-center gap-2 px-4 py-3 md:px-5`,children:[(0,Z.jsxs)(`button`,{type:`button`,onClick:s,"aria-expanded":w,className:`flex min-w-0 flex-1 items-center gap-3 text-left`,children:[(0,Z.jsx)(g,{className:p(`size-4 shrink-0 text-muted transition-transform duration-150`,w?`rotate-0`:`-rotate-90`)}),(0,Z.jsxs)(`div`,{className:`min-w-0 flex-1`,children:[(0,Z.jsx)(`div`,{className:`truncate font-display text-lg font-semibold tracking-tight`,children:e.key}),(0,Z.jsxs)(`div`,{className:`text-xs text-muted`,children:[e.guestCount,` guest`,e.guestCount===1?``:`s`,` ·`,` `,e.stays.length,` stay`,e.stays.length===1?``:`s`,` ·`,` `,e.nights,` night`,e.nights===1?``:`s`,e.firstDate?` · ${a(e.firstDate)}–${a(e.lastDate)}`:``]})]})]}),(0,Z.jsxs)(O,{type:`button`,variant:`outline`,size:`sm`,className:`shrink-0`,onClick:f,children:[(0,Z.jsx)(E,{className:`size-4`}),`Print guests`]}),(0,Z.jsxs)(`div`,{className:`text-right`,children:[(0,Z.jsx)(`div`,{className:p(`font-display text-xl font-semibold tabular`,e.settled?`text-ok`:`text-due`),children:t(Math.max(0,e.remaining))}),(0,Z.jsx)(N,{variant:e.settled?`ok`:`warn`,children:e.settled?`Settled`:T?`Carried`:`Open`})]})]}),w?(0,Z.jsxs)(P,{className:`border-t border-border pt-4`,children:[(0,Z.jsxs)(`div`,{className:`-mx-5 overflow-x-auto`,children:[(0,Z.jsxs)(`table`,{className:`w-full min-w-[52rem] text-left text-sm`,children:[(0,Z.jsx)(`thead`,{className:`text-xs uppercase tracking-wide text-muted`,children:(0,Z.jsxs)(`tr`,{className:`border-b border-border`,children:[(0,Z.jsx)(`th`,{className:`px-5 py-2 font-medium`,children:` `}),(0,Z.jsx)(`th`,{className:`px-3 py-2 font-medium`,children:`Guest`}),(0,Z.jsx)(`th`,{className:`px-3 py-2 font-medium`,children:`Check-in`}),(0,Z.jsx)(`th`,{className:`px-3 py-2 font-medium`,children:`Check-out`}),(0,Z.jsx)(`th`,{className:`px-3 py-2 text-right font-medium`,children:`Days`}),(0,Z.jsx)(`th`,{className:`px-3 py-2 text-right font-medium`,children:`Per day`}),(0,Z.jsx)(`th`,{className:`px-3 py-2 text-right font-medium`,children:`Total`}),(0,Z.jsx)(`th`,{className:`px-5 py-2 font-medium`,children:`Status`})]})}),(0,Z.jsx)(`tbody`,{children:e.stays.map(e=>(0,Z.jsxs)(`tr`,{className:p(`border-b border-border/70`,e.status===`paid`&&`bg-ok/5`),children:[(0,Z.jsx)(`td`,{className:`px-5 py-2.5`,children:(0,Z.jsx)(ie,{stay:e})}),(0,Z.jsxs)(`td`,{className:`px-3 py-2.5`,children:[(0,Z.jsx)(`div`,{className:`font-medium`,children:e.name}),(0,Z.jsxs)(`div`,{className:`text-xs text-muted`,children:[`Room `,e.roomNo]})]}),(0,Z.jsx)(`td`,{className:`px-3 py-2.5 tabular`,children:a(e.checkIn)}),(0,Z.jsx)(`td`,{className:`px-3 py-2.5 tabular text-muted`,children:Q(e)}),(0,Z.jsx)(`td`,{className:`px-3 py-2.5 text-right tabular`,children:e.days}),(0,Z.jsx)(`td`,{className:`px-3 py-2.5 text-right tabular`,children:t(e.perDay)}),(0,Z.jsx)(`td`,{className:`px-3 py-2.5 text-right tabular font-medium`,children:t(e.billed)}),(0,Z.jsx)(`td`,{className:`px-5 py-2.5`,children:(0,Z.jsx)(ae,{stay:e})})]},e.id))})]}),e.stays.length===0?(0,Z.jsx)(`p`,{className:`px-5 py-4 text-sm text-muted`,children:`No guest stays on this source.`}):null]}),(0,Z.jsxs)(`div`,{className:`mt-3 flex flex-wrap justify-between gap-2 text-sm`,children:[(0,Z.jsxs)(`span`,{className:`text-muted`,children:[e.guestCount,` guests · billed `,t(e.billed),` · paid`,` `,t(e.collected)]}),(0,Z.jsxs)(`span`,{className:`font-semibold tabular`,children:[`Due `,t(Math.max(0,e.remaining))]})]}),e.receipts.length>0?(0,Z.jsx)(`ul`,{className:`mt-3 divide-y divide-border rounded-lg border border-border`,children:e.receipts.map(e=>(0,Z.jsxs)(`li`,{className:`flex items-center justify-between gap-3 px-3 py-2`,children:[(0,Z.jsxs)(`div`,{className:`min-w-0`,children:[(0,Z.jsxs)(`div`,{className:`truncate text-sm`,children:[a(e.date),` · `,e.particular]}),(0,Z.jsx)(z,{mode:e.mode})]}),(0,Z.jsxs)(`div`,{className:`flex items-center gap-1`,children:[(0,Z.jsx)(`span`,{className:`tabular text-sm font-medium text-ok`,children:t(e.amount)}),(0,Z.jsx)(O,{variant:`ghost`,size:`icon`,className:`size-9 min-h-9 text-muted hover:text-danger`,"aria-label":`Remove collection`,onClick:()=>l(e.id),children:(0,Z.jsx)(D,{className:`size-4`})})]})]},e.id))}):null,e.settled?(0,Z.jsx)(`p`,{className:`mt-4 text-sm text-ok`,children:`This source is settled. Every stay is ticked Paid.`}):(0,Z.jsxs)(`form`,{className:`mt-4 grid gap-3 sm:grid-cols-[9rem_1fr_auto]`,onSubmit:t=>{t.preventDefault();let n=Number(b||Math.max(0,e.remaining));if(!Number.isFinite(n)||n<=0){d.error(`Enter an amount to collect`);return}c(_,n),S(``)},children:[(0,Z.jsxs)(`div`,{className:`grid gap-1.5`,children:[(0,Z.jsx)(j,{children:`Mode`}),(0,Z.jsxs)(m,{value:_,onValueChange:e=>v(e),children:[(0,Z.jsx)(h,{"aria-label":`Collection mode`,children:(0,Z.jsx)(y,{})}),(0,Z.jsx)(x,{children:u.map(e=>(0,Z.jsx)(C,{value:e,children:o[e]},e))})]})]}),(0,Z.jsxs)(`div`,{className:`grid gap-1.5`,children:[(0,Z.jsx)(j,{children:`Amount`}),(0,Z.jsx)(A,{type:`number`,min:0,value:b,onChange:e=>S(e.target.value),placeholder:String(Math.max(0,e.remaining))})]}),(0,Z.jsx)(`div`,{className:`flex items-end`,children:(0,Z.jsx)(O,{type:`submit`,className:`w-full`,children:`Collect`})})]})]}):null]})}function ie({stay:e}){let t=e.status===`paid`;return(0,Z.jsx)(`span`,{className:p(`grid size-7 place-items-center rounded-md border`,t?`border-ok/40 bg-ok text-primary-fg`:e.status===`partial`?`border-due/40 bg-due/10 text-due`:`border-border bg-card text-transparent`),"aria-label":b(e.status),children:(0,Z.jsx)(_,{className:`size-3.5`,strokeWidth:3})})}function ae({stay:e}){return e.status===`paid`?(0,Z.jsx)(N,{variant:`ok`,children:`Paid`}):e.status===`partial`?(0,Z.jsxs)(`div`,{className:`flex flex-col gap-0.5`,children:[(0,Z.jsx)(N,{variant:`warn`,children:`Partial`}),(0,Z.jsxs)(`span`,{className:`text-xs tabular text-muted`,children:[`Due `,t(e.remaining)]})]}):(0,Z.jsx)(N,{variant:`warn`,children:`Open`})}export{ne as component};