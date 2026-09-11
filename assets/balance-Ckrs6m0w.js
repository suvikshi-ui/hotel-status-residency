import{K as e,R as t,V as n,X as r,i,ot as a,q as o,r as s,rt as c,z as l}from"./store-B45HCGez.js";import{a as u,i as d,n as f,o as p,r as m,s as h,t as g}from"./select-DNHSLuFN.js";import{t as _}from"./printer-D3ox358P.js";import{a as v,i as y,n as b,r as x,t as S}from"./balance-BGcA6ALq.js";import{t as C}from"./trash-2-BxIw66_Q.js";import{B as w,D as T,G as E,K as D,Z as O,a as k,i as A,o as j}from"./index-D-hjty4h.js";import{t as M}from"./badge-CaWWIvk9.js";import{n as N,t as P}from"./card-DTX5Ocu0.js";import{i as F,n as I,r as L,t as R}from"./tabs-CrnzePtg.js";import{t as z}from"./mode-badge-ByaUuw8r.js";import{t as B}from"./print-sheet-DCpEgBzm.js";var V=a(c());function H(e){return Math.round(e).toLocaleString(`en-IN`)}function U(e){return e.checkOut?r(e.checkOut):`Continue`}function W(e){return e.status===`paid`?`✓ Paid`:e.status===`partial`?`Partial · ${H(e.remaining)}`:`Open`}function G(e,t){let n=`<!doctype html>
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
    <img src="${E(`logo.png?v=2`)}" alt="" />
    <div style="flex:1;text-align:center">
      <h1>${B(e.toUpperCase())}</h1>
      <p>${B(t.toUpperCase())} · ${B(n)}</p>
    </div>
  </div>`}function q(e,t,n){let r=e.map(e=>`<tr>
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
  </div>`)}function J(e){return e.map(e=>`<tr>
        <td>${B(e.name)}</td>
        <td>${r(e.checkIn)}</td>
        <td>${U(e)}</td>
        <td class="ctr">${e.days}</td>
        <td class="num">${H(e.perDay)}</td>
        <td class="num">${H(e.billed)}</td>
        <td class="${e.status===`paid`?`paid`:`open`}">${B(W(e))}</td>
      </tr>`).join(``)}function Y(e){return`<tfoot>
    <tr>
      <td colspan="3">${B(e.key)} · ${e.stays.length} stay${e.stays.length===1?``:`s`}</td>
      <td class="ctr">${e.stays.reduce((e,t)=>e+t.days,0)}</td>
      <td></td>
      <td class="num">${H(e.billed)}</td>
      <td class="num ${e.settled?`paid`:`open`}">${H(Math.max(0,e.remaining))} due</td>
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
            <th class="ctr">Nights</th>
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
      <p class="note">Hotel day ${l}–${l}. Nights = check-out date minus check-in date. Paid ${H(e.collected)} · billed ${H(e.billed)} · oldest stays tick Paid first when a collection is posted.</p>
    </div>
  </div>`;G(`${e.key} guests`,r)}var Z=O();function Q(e){return e.checkOut?r(e.checkOut):`Continue`}function ee(){let e=i(e=>e.hotel),t=i(e=>e.guests),n=i(e=>e.balReceived),r=i(e=>e.selectedDate),a=i(e=>e.addBalReceived),c=i(e=>e.removeBalReceived),{gate:u}=A(),[d,f]=(0,V.useState)(``),[p,m]=(0,V.useState)(!0),[h,g]=(0,V.useState)(null),b=(0,V.useMemo)(()=>S(t,n),[t,n]),C=s(r),E=(0,V.useMemo)(()=>{let e=d.trim().toLowerCase();return b.filter(t=>p&&t.settled?!1:!e||t.key.toLowerCase().includes(e)?!0:t.guests.some(t=>t.name.toLowerCase().includes(e)||t.roomNo.toLowerCase().includes(e)))},[b,p,d]),D=b.filter(e=>!e.settled).reduce((e,t)=>e+Math.max(0,t.remaining),0),O=b.reduce((e,t)=>e+t.collected,0),k=b.reduce((e,t)=>e+t.billed,0),M=x(b,d),N=(0,V.useMemo)(()=>y(t),[t]),z=(0,V.useMemo)(()=>M?E.filter(e=>e.key!==M.key):E,[E,M]),B=n.filter(e=>e.kind===`other`).slice().sort((e,t)=>t.date.localeCompare(e.date)||t.id.localeCompare(e.id)),H=B.filter(e=>e.date===r).reduce((e,t)=>e+t.amount,0),U=B.reduce((e,t)=>e+t.amount,0);function W(e,t,n){u(()=>{a({particular:e.key,mode:t,amount:n,kind:`due`}),w.success(`Collected ${o(n)} from ${e.key}`)},{title:`Are you sure?`,message:`Collect ${o(n)} from ${e.key}? Oldest open stays will tick Paid first.`,confirmLabel:`Collect`})}function G(e){u(()=>{c(e),w.success(`Collection removed`)},{title:`Are you sure?`,message:`Delete this collection?`,confirmLabel:`Delete`,danger:!0})}return(0,Z.jsxs)(`div`,{className:`flex flex-col gap-5`,children:[(0,Z.jsxs)(`div`,{children:[(0,Z.jsx)(`p`,{className:`text-xs font-medium uppercase tracking-[0.18em] text-muted`,children:`Outstanding`}),(0,Z.jsx)(`h1`,{className:`mt-1 font-display text-3xl font-semibold tracking-tight`,children:`Balance`}),(0,Z.jsxs)(`p`,{className:`mt-1 text-sm text-muted`,children:[`Check-out stays Continue until the next day chart is made and the guest is not ticked. Then the date is `,l,` the morning after the last night.`]})]}),(0,Z.jsxs)(`div`,{className:`grid grid-cols-2 gap-3 lg:grid-cols-4`,children:[(0,Z.jsxs)(P,{className:`p-4`,children:[(0,Z.jsx)(`div`,{className:`text-xs font-medium text-muted`,children:`Books C/B`}),(0,Z.jsx)(`div`,{className:`mt-1 font-display text-2xl font-semibold tabular text-due`,children:o(C?.outstanding.cb??0)})]}),(0,Z.jsxs)(P,{className:`p-4`,children:[(0,Z.jsx)(`div`,{className:`text-xs font-medium text-muted`,children:`Open source dues`}),(0,Z.jsx)(`div`,{className:`mt-1 font-display text-2xl font-semibold tabular`,children:o(D)})]}),(0,Z.jsxs)(P,{className:`p-4`,children:[(0,Z.jsx)(`div`,{className:`text-xs font-medium text-muted`,children:`Billed`}),(0,Z.jsx)(`div`,{className:`mt-1 font-display text-2xl font-semibold tabular`,children:o(k)})]}),(0,Z.jsxs)(P,{className:`p-4`,children:[(0,Z.jsx)(`div`,{className:`text-xs font-medium text-muted`,children:`Collected`}),(0,Z.jsx)(`div`,{className:`mt-1 font-display text-2xl font-semibold tabular text-ok`,children:o(O)})]})]}),(0,Z.jsxs)(R,{defaultValue:`balance`,children:[(0,Z.jsxs)(L,{className:`grid w-full grid-cols-2`,"aria-label":`Balance sections`,children:[(0,Z.jsx)(F,{value:`balance`,className:`w-full`,children:`Balance`}),(0,Z.jsx)(F,{value:`other`,className:`w-full`,children:`Other`})]}),(0,Z.jsxs)(I,{value:`balance`,className:`flex flex-col gap-5`,children:[(0,Z.jsxs)(`div`,{className:`flex flex-col gap-3`,children:[(0,Z.jsxs)(`div`,{className:`relative min-w-0`,children:[(0,Z.jsx)(v,{className:`pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted`}),(0,Z.jsx)(j,{className:`pl-9`,placeholder:`Source or guest — Flysky, Motor, name`,value:d,onChange:e=>f(e.target.value),"aria-label":`Search dues`,list:`balance-source-hints`,autoComplete:`off`}),(0,Z.jsx)(`datalist`,{id:`balance-source-hints`,children:N.map(e=>(0,Z.jsx)(`option`,{value:e},e))})]}),(0,Z.jsxs)(`div`,{className:`flex flex-wrap gap-2`,children:[(0,Z.jsx)(T,{variant:p?`default`:`outline`,onClick:()=>m(e=>!e),children:p?`Open dues`:`All sources`}),(0,Z.jsxs)(T,{variant:`outline`,onClick:()=>{if(E.length===0){w.error(`No sources to print`);return}w.message(`Opening source print…`),q(E,e.name,e.place)},children:[(0,Z.jsx)(_,{className:`size-4`}),`Print sources`]})]}),(0,Z.jsxs)(`p`,{className:`text-xs text-muted`,children:[(0,Z.jsx)(`span`,{className:`font-medium text-fg`,children:`Print sources`}),` — Flysky, Motor, remaining only, no guest names.`,` `,(0,Z.jsx)(`span`,{className:`font-medium text-fg`,children:`Print guests`}),` on a source — that company, then each guest stay.`]})]}),M?(0,Z.jsxs)(`p`,{className:`text-sm text-muted`,children:[(0,Z.jsx)(`span`,{className:`font-medium text-fg`,children:M.key}),` · `,M.guestCount,` guest`,M.guestCount===1?``:`s`,` · `,M.stays.length,` stay`,M.stays.length===1?``:`s`,` · billed `,o(M.billed),` · due `,o(Math.max(0,M.remaining))]}):null,M?(0,Z.jsx)($,{account:M,open:!0,pinned:!0,month:r.slice(0,7),onToggle:()=>f(``),onCollect:(e,t)=>W(M,e,t),onRemoveReceipt:G,onPrintGuests:()=>{w.message(`Opening guest print…`),X(M,e.name,e.place)}}):null,(0,Z.jsxs)(`div`,{className:`flex flex-col gap-2`,children:[z.map(t=>(0,Z.jsx)($,{account:t,open:h===t.key,month:r.slice(0,7),onToggle:()=>g(e=>e===t.key?null:t.key),onCollect:(e,n)=>W(t,e,n),onRemoveReceipt:G,onPrintGuests:()=>{w.message(`Opening guest print…`),X(t,e.name,e.place)}},t.key)),z.length===0&&!M?(0,Z.jsx)(P,{className:`p-8 text-center text-sm text-muted`,children:`No source dues match this filter.`}):null]})]}),(0,Z.jsx)(I,{value:`other`,className:`flex flex-col gap-5`,children:(0,Z.jsx)(te,{booksCb:C?.outstanding.cb??0,today:H,total:U,rows:B,onAdd:(e,t,n)=>{u(()=>{a({particular:n,mode:e,amount:t,kind:`other`}),w.success(`Other ${o(t)} cut from main balance`)},{title:`Are you sure?`,message:`Cut ${o(t)} from main balance?`,confirmLabel:`Save`})},onRemove:e=>{u(()=>{c(e),w.success(`Other collection removed`)},{title:`Are you sure?`,message:`Delete this other collection?`,confirmLabel:`Delete`,danger:!0})}})})]})]})}function te({booksCb:r,today:i,total:a,rows:s,onAdd:c,onRemove:l}){let[p,h]=(0,V.useState)(`CASH`),[_,v]=(0,V.useState)(``),[y,b]=(0,V.useState)(``);return(0,Z.jsxs)(Z.Fragment,{children:[(0,Z.jsxs)(`div`,{className:`grid grid-cols-2 gap-3 lg:grid-cols-3`,children:[(0,Z.jsxs)(P,{className:`p-4`,children:[(0,Z.jsx)(`div`,{className:`text-xs font-medium text-muted`,children:`Main balance`}),(0,Z.jsx)(`div`,{className:`mt-1 font-display text-2xl font-semibold tabular text-due`,children:o(r)})]}),(0,Z.jsxs)(P,{className:`p-4`,children:[(0,Z.jsx)(`div`,{className:`text-xs font-medium text-muted`,children:`Other today`}),(0,Z.jsx)(`div`,{className:`mt-1 font-display text-2xl font-semibold tabular`,children:o(i)})]}),(0,Z.jsxs)(P,{className:`col-span-2 p-4 lg:col-span-1`,children:[(0,Z.jsx)(`div`,{className:`text-xs font-medium text-muted`,children:`Other posted`}),(0,Z.jsx)(`div`,{className:`mt-1 font-display text-2xl font-semibold tabular`,children:o(a)})]})]}),(0,Z.jsx)(P,{children:(0,Z.jsxs)(N,{className:`flex flex-col gap-4 p-5`,children:[(0,Z.jsxs)(`div`,{children:[(0,Z.jsx)(`p`,{className:`font-display text-lg font-semibold tracking-tight`,children:`Cut from main balance`}),(0,Z.jsx)(`p`,{className:`mt-1 text-sm text-muted`,children:`Amount only — no source name. Lands in cash / Santosh QR / P.K. QR and reduces the books outstanding.`})]}),(0,Z.jsxs)(`form`,{className:`grid gap-3 sm:grid-cols-[9rem_1fr_auto]`,onSubmit:e=>{e.preventDefault();let t=Number(_);if(!Number.isFinite(t)||t<=0){w.error(`Enter an amount`);return}c(p,t,y.trim()||`Other`),v(``),b(``)},children:[(0,Z.jsxs)(`div`,{className:`grid gap-1.5`,children:[(0,Z.jsx)(k,{children:`Paid by`}),(0,Z.jsxs)(g,{value:p,onValueChange:e=>h(e),children:[(0,Z.jsx)(d,{"aria-label":`Other payment mode`,children:(0,Z.jsx)(u,{})}),(0,Z.jsx)(f,{children:t.map(e=>(0,Z.jsx)(m,{value:e,children:n[e]},e))})]})]}),(0,Z.jsxs)(`div`,{className:`grid gap-1.5`,children:[(0,Z.jsx)(k,{children:`Amount`}),(0,Z.jsx)(j,{type:`number`,min:0,value:_,onChange:e=>v(e.target.value),placeholder:`0`})]}),(0,Z.jsx)(`div`,{className:`flex items-end`,children:(0,Z.jsx)(T,{type:`submit`,className:`w-full`,children:`Cut balance`})}),(0,Z.jsxs)(`div`,{className:`grid gap-1.5 sm:col-span-3`,children:[(0,Z.jsx)(k,{htmlFor:`other-note`,children:`Note (optional)`}),(0,Z.jsx)(j,{id:`other-note`,value:y,onChange:e=>b(e.target.value),placeholder:`Not a source name`})]})]})]})}),(0,Z.jsx)(P,{children:(0,Z.jsxs)(N,{className:`overflow-x-auto p-0`,children:[(0,Z.jsxs)(`table`,{className:`w-full min-w-[32rem] text-left text-sm`,children:[(0,Z.jsx)(`thead`,{className:`text-xs uppercase tracking-wide text-muted`,children:(0,Z.jsxs)(`tr`,{className:`border-y border-border`,children:[(0,Z.jsx)(`th`,{className:`px-5 py-2 font-medium`,children:`Date`}),(0,Z.jsx)(`th`,{className:`px-3 py-2 font-medium`,children:`Note`}),(0,Z.jsx)(`th`,{className:`px-3 py-2 font-medium`,children:`Paid by`}),(0,Z.jsx)(`th`,{className:`px-3 py-2 text-right font-medium`,children:`Amount`}),(0,Z.jsx)(`th`,{className:`px-3 py-2`})]})}),(0,Z.jsx)(`tbody`,{children:s.map(t=>(0,Z.jsxs)(`tr`,{className:`border-b border-border/70`,children:[(0,Z.jsx)(`td`,{className:`px-5 py-2.5 tabular text-muted`,children:e(t.date)}),(0,Z.jsx)(`td`,{className:`px-3 py-2.5`,children:t.particular}),(0,Z.jsx)(`td`,{className:`px-3 py-2.5`,children:(0,Z.jsx)(z,{mode:t.mode})}),(0,Z.jsx)(`td`,{className:`px-3 py-2.5 text-right tabular`,children:o(t.amount)}),(0,Z.jsx)(`td`,{className:`px-3 py-2.5 text-right`,children:(0,Z.jsx)(T,{variant:`ghost`,size:`icon`,className:`size-9 min-h-9 text-muted hover:text-danger`,"aria-label":`Remove other collection`,onClick:()=>l(t.id),children:(0,Z.jsx)(C,{className:`size-4`})})})]},t.id))})]}),s.length===0?(0,Z.jsx)(`p`,{className:`py-10 text-center text-sm text-muted`,children:`No other cuts yet.`}):null]})})]})}function $({account:i,open:a,pinned:s,month:c,onToggle:l,onCollect:h,onRemoveReceipt:v,onPrintGuests:y}){let[b,x]=(0,V.useState)(`CASH`),[S,E]=(0,V.useState)(``),O=a||s,A=!i.settled&&!!i.lastDate&&i.lastDate.slice(0,7)<c;return(0,Z.jsxs)(P,{className:D(`overflow-hidden`,s&&`ring-1 ring-primary/30`),children:[(0,Z.jsxs)(`div`,{className:`flex w-full min-h-14 flex-wrap items-center gap-2 px-4 py-3 md:px-5`,children:[(0,Z.jsxs)(`button`,{type:`button`,onClick:l,"aria-expanded":O,className:`flex min-w-0 flex-1 items-center gap-3 text-left`,children:[(0,Z.jsx)(p,{className:D(`size-4 shrink-0 text-muted transition-transform duration-150`,O?`rotate-0`:`-rotate-90`)}),(0,Z.jsxs)(`div`,{className:`min-w-0 flex-1`,children:[(0,Z.jsx)(`div`,{className:`truncate font-display text-lg font-semibold tracking-tight`,children:i.key}),(0,Z.jsxs)(`div`,{className:`text-xs text-muted`,children:[i.guestCount,` guest`,i.guestCount===1?``:`s`,` ·`,` `,i.stays.length,` stay`,i.stays.length===1?``:`s`,` ·`,` `,i.nights,` night`,i.nights===1?``:`s`,i.firstDate?` · ${e(i.firstDate)}–${e(i.lastDate)}`:``]})]})]}),(0,Z.jsxs)(T,{type:`button`,variant:`outline`,size:`sm`,className:`shrink-0`,onClick:y,children:[(0,Z.jsx)(_,{className:`size-4`}),`Print guests`]}),(0,Z.jsxs)(`div`,{className:`text-right`,children:[(0,Z.jsx)(`div`,{className:D(`font-display text-xl font-semibold tabular`,i.settled?`text-ok`:`text-due`),children:o(Math.max(0,i.remaining))}),(0,Z.jsx)(M,{variant:i.settled?`ok`:`warn`,children:i.settled?`Settled`:A?`Carried`:`Open`})]})]}),O?(0,Z.jsxs)(N,{className:`border-t border-border pt-4`,children:[(0,Z.jsxs)(`div`,{className:`-mx-5 overflow-x-auto`,children:[(0,Z.jsxs)(`table`,{className:`w-full min-w-[52rem] text-left text-sm`,children:[(0,Z.jsx)(`thead`,{className:`text-xs uppercase tracking-wide text-muted`,children:(0,Z.jsxs)(`tr`,{className:`border-b border-border`,children:[(0,Z.jsx)(`th`,{className:`px-5 py-2 font-medium`,children:` `}),(0,Z.jsx)(`th`,{className:`px-3 py-2 font-medium`,children:`Guest`}),(0,Z.jsx)(`th`,{className:`px-3 py-2 font-medium`,children:`Check-in`}),(0,Z.jsx)(`th`,{className:`px-3 py-2 font-medium`,children:`Check-out`}),(0,Z.jsx)(`th`,{className:`px-3 py-2 text-right font-medium`,children:`Nights`}),(0,Z.jsx)(`th`,{className:`px-3 py-2 text-right font-medium`,children:`Per day`}),(0,Z.jsx)(`th`,{className:`px-3 py-2 text-right font-medium`,children:`Total`}),(0,Z.jsx)(`th`,{className:`px-5 py-2 font-medium`,children:`Status`})]})}),(0,Z.jsx)(`tbody`,{children:i.stays.map(e=>(0,Z.jsxs)(`tr`,{className:D(`border-b border-border/70`,e.status===`paid`&&`bg-ok/5`),children:[(0,Z.jsx)(`td`,{className:`px-5 py-2.5`,children:(0,Z.jsx)(ne,{stay:e})}),(0,Z.jsxs)(`td`,{className:`px-3 py-2.5`,children:[(0,Z.jsx)(`div`,{className:`font-medium`,children:e.name}),(0,Z.jsxs)(`div`,{className:`text-xs text-muted`,children:[`Room `,e.roomNo]})]}),(0,Z.jsx)(`td`,{className:`px-3 py-2.5 tabular`,children:r(e.checkIn)}),(0,Z.jsx)(`td`,{className:`px-3 py-2.5 tabular text-muted`,children:Q(e)}),(0,Z.jsx)(`td`,{className:`px-3 py-2.5 text-right tabular`,children:e.days}),(0,Z.jsx)(`td`,{className:`px-3 py-2.5 text-right tabular`,children:o(e.perDay)}),(0,Z.jsx)(`td`,{className:`px-3 py-2.5 text-right tabular font-medium`,children:o(e.billed)}),(0,Z.jsx)(`td`,{className:`px-5 py-2.5`,children:(0,Z.jsx)(re,{stay:e})})]},e.id))})]}),i.stays.length===0?(0,Z.jsx)(`p`,{className:`px-5 py-4 text-sm text-muted`,children:`No guest stays on this source.`}):null]}),(0,Z.jsxs)(`div`,{className:`mt-3 flex flex-wrap justify-between gap-2 text-sm`,children:[(0,Z.jsxs)(`span`,{className:`text-muted`,children:[i.guestCount,` guests · billed `,o(i.billed),` · paid`,` `,o(i.collected)]}),(0,Z.jsxs)(`span`,{className:`font-semibold tabular`,children:[`Due `,o(Math.max(0,i.remaining))]})]}),i.receipts.length>0?(0,Z.jsx)(`ul`,{className:`mt-3 divide-y divide-border rounded-lg border border-border`,children:i.receipts.map(t=>(0,Z.jsxs)(`li`,{className:`flex items-center justify-between gap-3 px-3 py-2`,children:[(0,Z.jsxs)(`div`,{className:`min-w-0`,children:[(0,Z.jsxs)(`div`,{className:`truncate text-sm`,children:[e(t.date),` · `,t.particular]}),(0,Z.jsx)(z,{mode:t.mode})]}),(0,Z.jsxs)(`div`,{className:`flex items-center gap-1`,children:[(0,Z.jsx)(`span`,{className:`tabular text-sm font-medium text-ok`,children:o(t.amount)}),(0,Z.jsx)(T,{variant:`ghost`,size:`icon`,className:`size-9 min-h-9 text-muted hover:text-danger`,"aria-label":`Remove collection`,onClick:()=>v(t.id),children:(0,Z.jsx)(C,{className:`size-4`})})]})]},t.id))}):null,i.settled?(0,Z.jsx)(`p`,{className:`mt-4 text-sm text-ok`,children:`This source is settled. Every stay is ticked Paid.`}):(0,Z.jsxs)(`form`,{className:`mt-4 grid gap-3 sm:grid-cols-[9rem_1fr_auto]`,onSubmit:e=>{e.preventDefault();let t=Number(S||Math.max(0,i.remaining));if(!Number.isFinite(t)||t<=0){w.error(`Enter an amount to collect`);return}h(b,t),E(``)},children:[(0,Z.jsxs)(`div`,{className:`grid gap-1.5`,children:[(0,Z.jsx)(k,{children:`Mode`}),(0,Z.jsxs)(g,{value:b,onValueChange:e=>x(e),children:[(0,Z.jsx)(d,{"aria-label":`Collection mode`,children:(0,Z.jsx)(u,{})}),(0,Z.jsx)(f,{children:t.map(e=>(0,Z.jsx)(m,{value:e,children:n[e]},e))})]})]}),(0,Z.jsxs)(`div`,{className:`grid gap-1.5`,children:[(0,Z.jsx)(k,{children:`Amount`}),(0,Z.jsx)(j,{type:`number`,min:0,value:S,onChange:e=>E(e.target.value),placeholder:String(Math.max(0,i.remaining))})]}),(0,Z.jsx)(`div`,{className:`flex items-end`,children:(0,Z.jsx)(T,{type:`submit`,className:`w-full`,children:`Collect`})})]})]}):null]})}function ne({stay:e}){let t=e.status===`paid`;return(0,Z.jsx)(`span`,{className:D(`grid size-7 place-items-center rounded-md border`,t?`border-ok/40 bg-ok text-primary-fg`:e.status===`partial`?`border-due/40 bg-due/10 text-due`:`border-border bg-card text-transparent`),"aria-label":b(e.status),children:(0,Z.jsx)(h,{className:`size-3.5`,strokeWidth:3})})}function re({stay:e}){return e.status===`paid`?(0,Z.jsx)(M,{variant:`ok`,children:`Paid`}):e.status===`partial`?(0,Z.jsxs)(`div`,{className:`flex flex-col gap-0.5`,children:[(0,Z.jsx)(M,{variant:`warn`,children:`Partial`}),(0,Z.jsxs)(`span`,{className:`text-xs tabular text-muted`,children:[`Due `,o(e.remaining)]})]}):(0,Z.jsx)(M,{variant:`warn`,children:`Open`})}export{ee as component};