import{A as e,J as t,L as n,M as r,R as i,V as a,Z as o,i as s,k as c,r as l}from"./store-C4liFJ5g.js";import{n as u}from"./dist-hvETK0nd.js";import{r as d,t as f}from"./utils-FGRvfmJN.js";import{a as p,i as m,n as h,o as g,r as _,s as v,t as y}from"./select-ClN9ZNjM.js";import{t as b}from"./printer-ICb8xC-m.js";import{a as x,i as S,n as C,r as w,t as T}from"./balance-DPTm1irW.js";import{t as E}from"./trash-2-BzW_NN_d.js";import{P as D,n as O,r as k,t as A,w as j}from"./index-CzMTZNot.js";import{t as M}from"./badge-BxbO9hkO.js";import{n as N,t as P}from"./card-BCCyob9_.js";import{i as F,n as I,r as L,t as R}from"./tabs-BWuyovxt.js";import{t as z}from"./mode-badge-Bd3Tu9vz.js";import{t as B}from"./print-sheet-veDRnHLm.js";var V=o(t());function H(e){return Math.round(e).toLocaleString(`en-IN`)}function U(e){return e.checkOut?a(e.checkOut):`Continue`}function W(e){return e.status===`paid`?`✓ Paid`:e.status===`partial`?`Partial · ${H(e.remaining)}`:`Open`}function G(e,t){let n=`<!doctype html>
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
    <img src="${D(`logo.png?v=2`)}" alt="" />
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
  </div>`)}function ee(e){return e.map(e=>`<tr>
        <td>${B(e.name)}</td>
        <td>${a(e.checkIn)}</td>
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
  </tfoot>`}function Y(t,n,r){let i=`<div class="sheet">
    ${K(n,r,`${t.key} outstanding`)}
    <div class="body">
      <h2>${B(t.key)}</h2>
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
          ${ee(t.stays)||`<tr><td colspan="7" class="ctr">No guests</td></tr>`}
        </tbody>
        ${J(t)}
      </table>
      <p class="note">Hotel day ${e}–${e}. Nights = check-out date minus check-in date. Paid ${H(t.collected)} · billed ${H(t.billed)} · oldest stays tick Paid first when a collection is posted.</p>
    </div>
  </div>`;G(`${t.key} guests`,i)}var X=d();function Z(e){return e.checkOut?a(e.checkOut):`Continue`}function Q(){let t=s(e=>e.hotel),n=s(e=>e.guests),r=s(e=>e.balReceived),a=s(e=>e.selectedDate),o=s(e=>e.addBalReceived),c=s(e=>e.removeBalReceived),{gate:d}=A(),[f,p]=(0,V.useState)(``),[m,h]=(0,V.useState)(!0),[g,_]=(0,V.useState)(null),v=(0,V.useMemo)(()=>T(n,r),[n,r]),y=l(a),C=(0,V.useMemo)(()=>{let e=f.trim().toLowerCase();return v.filter(t=>m&&t.settled?!1:!e||t.key.toLowerCase().includes(e)?!0:t.guests.some(t=>t.name.toLowerCase().includes(e)||t.roomNo.toLowerCase().includes(e)))},[v,m,f]),E=v.filter(e=>!e.settled).reduce((e,t)=>e+Math.max(0,t.remaining),0),D=v.reduce((e,t)=>e+t.collected,0),O=v.reduce((e,t)=>e+t.billed,0),M=w(v,f),N=(0,V.useMemo)(()=>S(n),[n]),z=(0,V.useMemo)(()=>M?C.filter(e=>e.key!==M.key):C,[C,M]),B=r.filter(e=>e.kind===`other`).slice().sort((e,t)=>t.date.localeCompare(e.date)||t.id.localeCompare(e.id)),H=B.filter(e=>e.date===a).reduce((e,t)=>e+t.amount,0),U=B.reduce((e,t)=>e+t.amount,0);function W(e,t,n){d(()=>{o({particular:e.key,mode:t,amount:n,kind:`due`}),u.success(`Collected ${i(n)} from ${e.key}`)},{title:`Are you sure?`,message:`Collect ${i(n)} from ${e.key}? Oldest open stays will tick Paid first.`,confirmLabel:`Collect`})}function G(e){d(()=>{c(e),u.success(`Collection removed`)},{title:`Are you sure?`,message:`Delete this collection?`,confirmLabel:`Delete`,danger:!0})}return(0,X.jsxs)(`div`,{className:`flex flex-col gap-5`,children:[(0,X.jsxs)(`div`,{children:[(0,X.jsx)(`p`,{className:`text-xs font-medium uppercase tracking-[0.18em] text-muted`,children:`Outstanding`}),(0,X.jsx)(`h1`,{className:`mt-1 font-display text-3xl font-semibold tracking-tight`,children:`Balance`}),(0,X.jsxs)(`p`,{className:`mt-1 text-sm text-muted`,children:[`Check-out stays Continue until the next day chart is made and the guest is not ticked. Then the date is `,e,` the morning after the last night.`]})]}),(0,X.jsxs)(`div`,{className:`grid grid-cols-2 gap-3 lg:grid-cols-4`,children:[(0,X.jsxs)(P,{className:`p-4`,children:[(0,X.jsx)(`div`,{className:`text-xs font-medium text-muted`,children:`Books C/B`}),(0,X.jsx)(`div`,{className:`mt-1 font-display text-2xl font-semibold tabular text-due`,children:i(y?.outstanding.cb??0)})]}),(0,X.jsxs)(P,{className:`p-4`,children:[(0,X.jsx)(`div`,{className:`text-xs font-medium text-muted`,children:`Open source dues`}),(0,X.jsx)(`div`,{className:`mt-1 font-display text-2xl font-semibold tabular`,children:i(E)})]}),(0,X.jsxs)(P,{className:`p-4`,children:[(0,X.jsx)(`div`,{className:`text-xs font-medium text-muted`,children:`Billed`}),(0,X.jsx)(`div`,{className:`mt-1 font-display text-2xl font-semibold tabular`,children:i(O)})]}),(0,X.jsxs)(P,{className:`p-4`,children:[(0,X.jsx)(`div`,{className:`text-xs font-medium text-muted`,children:`Collected`}),(0,X.jsx)(`div`,{className:`mt-1 font-display text-2xl font-semibold tabular text-ok`,children:i(D)})]})]}),(0,X.jsxs)(R,{defaultValue:`balance`,children:[(0,X.jsxs)(L,{className:`grid w-full grid-cols-2`,"aria-label":`Balance sections`,children:[(0,X.jsx)(F,{value:`balance`,className:`w-full`,children:`Balance`}),(0,X.jsx)(F,{value:`other`,className:`w-full`,children:`Other`})]}),(0,X.jsxs)(I,{value:`balance`,className:`flex flex-col gap-5`,children:[(0,X.jsxs)(`div`,{className:`flex flex-col gap-3`,children:[(0,X.jsxs)(`div`,{className:`relative min-w-0`,children:[(0,X.jsx)(x,{className:`pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted`}),(0,X.jsx)(k,{className:`pl-9`,placeholder:`Source or guest — Flysky, Motor, name`,value:f,onChange:e=>p(e.target.value),"aria-label":`Search dues`,list:`balance-source-hints`,autoComplete:`off`}),(0,X.jsx)(`datalist`,{id:`balance-source-hints`,children:N.map(e=>(0,X.jsx)(`option`,{value:e},e))})]}),(0,X.jsxs)(`div`,{className:`flex flex-wrap gap-2`,children:[(0,X.jsx)(j,{variant:m?`default`:`outline`,onClick:()=>h(e=>!e),children:m?`Open dues`:`All sources`}),(0,X.jsxs)(j,{variant:`outline`,onClick:()=>{if(C.length===0){u.error(`No sources to print`);return}u.message(`Opening source print…`),q(C,t.name,t.place)},children:[(0,X.jsx)(b,{className:`size-4`}),`Print sources`]})]}),(0,X.jsxs)(`p`,{className:`text-xs text-muted`,children:[(0,X.jsx)(`span`,{className:`font-medium text-fg`,children:`Print sources`}),` — Flysky, Motor, remaining only, no guest names.`,` `,(0,X.jsx)(`span`,{className:`font-medium text-fg`,children:`Print guests`}),` on a source — that company, then each guest stay.`]})]}),M?(0,X.jsxs)(`p`,{className:`text-sm text-muted`,children:[(0,X.jsx)(`span`,{className:`font-medium text-fg`,children:M.key}),` · `,M.guestCount,` guest`,M.guestCount===1?``:`s`,` · `,M.stays.length,` stay`,M.stays.length===1?``:`s`,` · billed `,i(M.billed),` · due `,i(Math.max(0,M.remaining))]}):null,M?(0,X.jsx)($,{account:M,open:!0,pinned:!0,month:a.slice(0,7),onToggle:()=>p(``),onCollect:(e,t)=>W(M,e,t),onRemoveReceipt:G,onPrintGuests:()=>{u.message(`Opening guest print…`),Y(M,t.name,t.place)}}):null,(0,X.jsxs)(`div`,{className:`flex flex-col gap-2`,children:[z.map(e=>(0,X.jsx)($,{account:e,open:g===e.key,month:a.slice(0,7),onToggle:()=>_(t=>t===e.key?null:e.key),onCollect:(t,n)=>W(e,t,n),onRemoveReceipt:G,onPrintGuests:()=>{u.message(`Opening guest print…`),Y(e,t.name,t.place)}},e.key)),z.length===0&&!M?(0,X.jsx)(P,{className:`p-8 text-center text-sm text-muted`,children:`No source dues match this filter.`}):null]})]}),(0,X.jsx)(I,{value:`other`,className:`flex flex-col gap-5`,children:(0,X.jsx)(te,{booksCb:y?.outstanding.cb??0,today:H,total:U,rows:B,onAdd:(e,t,n)=>{d(()=>{o({particular:n,mode:e,amount:t,kind:`other`}),u.success(`Other ${i(t)} cut from main balance`)},{title:`Are you sure?`,message:`Cut ${i(t)} from main balance?`,confirmLabel:`Save`})},onRemove:e=>{d(()=>{c(e),u.success(`Other collection removed`)},{title:`Are you sure?`,message:`Delete this other collection?`,confirmLabel:`Delete`,danger:!0})}})})]})]})}function te({booksCb:e,today:t,total:a,rows:o,onAdd:s,onRemove:l}){let[d,f]=(0,V.useState)(`CASH`),[g,v]=(0,V.useState)(``),[b,x]=(0,V.useState)(``);return(0,X.jsxs)(X.Fragment,{children:[(0,X.jsxs)(`div`,{className:`grid grid-cols-2 gap-3 lg:grid-cols-3`,children:[(0,X.jsxs)(P,{className:`p-4`,children:[(0,X.jsx)(`div`,{className:`text-xs font-medium text-muted`,children:`Main balance`}),(0,X.jsx)(`div`,{className:`mt-1 font-display text-2xl font-semibold tabular text-due`,children:i(e)})]}),(0,X.jsxs)(P,{className:`p-4`,children:[(0,X.jsx)(`div`,{className:`text-xs font-medium text-muted`,children:`Other today`}),(0,X.jsx)(`div`,{className:`mt-1 font-display text-2xl font-semibold tabular`,children:i(t)})]}),(0,X.jsxs)(P,{className:`col-span-2 p-4 lg:col-span-1`,children:[(0,X.jsx)(`div`,{className:`text-xs font-medium text-muted`,children:`Other posted`}),(0,X.jsx)(`div`,{className:`mt-1 font-display text-2xl font-semibold tabular`,children:i(a)})]})]}),(0,X.jsx)(P,{children:(0,X.jsxs)(N,{className:`flex flex-col gap-4 p-5`,children:[(0,X.jsxs)(`div`,{children:[(0,X.jsx)(`p`,{className:`font-display text-lg font-semibold tracking-tight`,children:`Cut from main balance`}),(0,X.jsx)(`p`,{className:`mt-1 text-sm text-muted`,children:`Amount only — no source name. Lands in cash / Santosh QR / P.K. QR and reduces the books outstanding.`})]}),(0,X.jsxs)(`form`,{className:`grid gap-3 sm:grid-cols-[9rem_1fr_auto]`,onSubmit:e=>{e.preventDefault();let t=Number(g);if(!Number.isFinite(t)||t<=0){u.error(`Enter an amount`);return}s(d,t,b.trim()||`Other`),v(``),x(``)},children:[(0,X.jsxs)(`div`,{className:`grid gap-1.5`,children:[(0,X.jsx)(O,{children:`Paid by`}),(0,X.jsxs)(y,{value:d,onValueChange:e=>f(e),children:[(0,X.jsx)(m,{"aria-label":`Other payment mode`,children:(0,X.jsx)(p,{})}),(0,X.jsx)(h,{children:c.map(e=>(0,X.jsx)(_,{value:e,children:r[e]},e))})]})]}),(0,X.jsxs)(`div`,{className:`grid gap-1.5`,children:[(0,X.jsx)(O,{children:`Amount`}),(0,X.jsx)(k,{type:`number`,min:0,value:g,onChange:e=>v(e.target.value),placeholder:`0`})]}),(0,X.jsx)(`div`,{className:`flex items-end`,children:(0,X.jsx)(j,{type:`submit`,className:`w-full`,children:`Cut balance`})}),(0,X.jsxs)(`div`,{className:`grid gap-1.5 sm:col-span-3`,children:[(0,X.jsx)(O,{htmlFor:`other-note`,children:`Note (optional)`}),(0,X.jsx)(k,{id:`other-note`,value:b,onChange:e=>x(e.target.value),placeholder:`Not a source name`})]})]})]})}),(0,X.jsx)(P,{children:(0,X.jsxs)(N,{className:`overflow-x-auto p-0`,children:[(0,X.jsxs)(`table`,{className:`w-full min-w-[32rem] text-left text-sm`,children:[(0,X.jsx)(`thead`,{className:`text-xs uppercase tracking-wide text-muted`,children:(0,X.jsxs)(`tr`,{className:`border-y border-border`,children:[(0,X.jsx)(`th`,{className:`px-5 py-2 font-medium`,children:`Date`}),(0,X.jsx)(`th`,{className:`px-3 py-2 font-medium`,children:`Note`}),(0,X.jsx)(`th`,{className:`px-3 py-2 font-medium`,children:`Paid by`}),(0,X.jsx)(`th`,{className:`px-3 py-2 text-right font-medium`,children:`Amount`}),(0,X.jsx)(`th`,{className:`px-3 py-2`})]})}),(0,X.jsx)(`tbody`,{children:o.map(e=>(0,X.jsxs)(`tr`,{className:`border-b border-border/70`,children:[(0,X.jsx)(`td`,{className:`px-5 py-2.5 tabular text-muted`,children:n(e.date)}),(0,X.jsx)(`td`,{className:`px-3 py-2.5`,children:e.particular}),(0,X.jsx)(`td`,{className:`px-3 py-2.5`,children:(0,X.jsx)(z,{mode:e.mode})}),(0,X.jsx)(`td`,{className:`px-3 py-2.5 text-right tabular`,children:i(e.amount)}),(0,X.jsx)(`td`,{className:`px-3 py-2.5 text-right`,children:(0,X.jsx)(j,{variant:`ghost`,size:`icon`,className:`size-9 min-h-9 text-muted hover:text-danger`,"aria-label":`Remove other collection`,onClick:()=>l(e.id),children:(0,X.jsx)(E,{className:`size-4`})})})]},e.id))})]}),o.length===0?(0,X.jsx)(`p`,{className:`py-10 text-center text-sm text-muted`,children:`No other cuts yet.`}):null]})})]})}function $({account:e,open:t,pinned:o,month:s,onToggle:l,onCollect:d,onRemoveReceipt:v,onPrintGuests:x}){let[S,C]=(0,V.useState)(`CASH`),[w,T]=(0,V.useState)(``),D=t||o,A=!e.settled&&!!e.lastDate&&e.lastDate.slice(0,7)<s;return(0,X.jsxs)(P,{className:f(`overflow-hidden`,o&&`ring-1 ring-primary/30`),children:[(0,X.jsxs)(`div`,{className:`flex w-full min-h-14 flex-wrap items-center gap-2 px-4 py-3 md:px-5`,children:[(0,X.jsxs)(`button`,{type:`button`,onClick:l,"aria-expanded":D,className:`flex min-w-0 flex-1 items-center gap-3 text-left`,children:[(0,X.jsx)(g,{className:f(`size-4 shrink-0 text-muted transition-transform duration-150`,D?`rotate-0`:`-rotate-90`)}),(0,X.jsxs)(`div`,{className:`min-w-0 flex-1`,children:[(0,X.jsx)(`div`,{className:`truncate font-display text-lg font-semibold tracking-tight`,children:e.key}),(0,X.jsxs)(`div`,{className:`text-xs text-muted`,children:[e.guestCount,` guest`,e.guestCount===1?``:`s`,` ·`,` `,e.stays.length,` stay`,e.stays.length===1?``:`s`,` ·`,` `,e.nights,` night`,e.nights===1?``:`s`,e.firstDate?` · ${n(e.firstDate)}–${n(e.lastDate)}`:``]})]})]}),(0,X.jsxs)(j,{type:`button`,variant:`outline`,size:`sm`,className:`shrink-0`,onClick:x,children:[(0,X.jsx)(b,{className:`size-4`}),`Print guests`]}),(0,X.jsxs)(`div`,{className:`text-right`,children:[(0,X.jsx)(`div`,{className:f(`font-display text-xl font-semibold tabular`,e.settled?`text-ok`:`text-due`),children:i(Math.max(0,e.remaining))}),(0,X.jsx)(M,{variant:e.settled?`ok`:`warn`,children:e.settled?`Settled`:A?`Carried`:`Open`})]})]}),D?(0,X.jsxs)(N,{className:`border-t border-border pt-4`,children:[(0,X.jsxs)(`div`,{className:`-mx-5 overflow-x-auto`,children:[(0,X.jsxs)(`table`,{className:`w-full min-w-[52rem] text-left text-sm`,children:[(0,X.jsx)(`thead`,{className:`text-xs uppercase tracking-wide text-muted`,children:(0,X.jsxs)(`tr`,{className:`border-b border-border`,children:[(0,X.jsx)(`th`,{className:`px-5 py-2 font-medium`,children:` `}),(0,X.jsx)(`th`,{className:`px-3 py-2 font-medium`,children:`Guest`}),(0,X.jsx)(`th`,{className:`px-3 py-2 font-medium`,children:`Check-in`}),(0,X.jsx)(`th`,{className:`px-3 py-2 font-medium`,children:`Check-out`}),(0,X.jsx)(`th`,{className:`px-3 py-2 text-right font-medium`,children:`Nights`}),(0,X.jsx)(`th`,{className:`px-3 py-2 text-right font-medium`,children:`Per day`}),(0,X.jsx)(`th`,{className:`px-3 py-2 text-right font-medium`,children:`Total`}),(0,X.jsx)(`th`,{className:`px-5 py-2 font-medium`,children:`Status`})]})}),(0,X.jsx)(`tbody`,{children:e.stays.map(e=>(0,X.jsxs)(`tr`,{className:f(`border-b border-border/70`,e.status===`paid`&&`bg-ok/5`),children:[(0,X.jsx)(`td`,{className:`px-5 py-2.5`,children:(0,X.jsx)(ne,{stay:e})}),(0,X.jsxs)(`td`,{className:`px-3 py-2.5`,children:[(0,X.jsx)(`div`,{className:`font-medium`,children:e.name}),(0,X.jsxs)(`div`,{className:`text-xs text-muted`,children:[`Room `,e.roomNo]})]}),(0,X.jsx)(`td`,{className:`px-3 py-2.5 tabular`,children:a(e.checkIn)}),(0,X.jsx)(`td`,{className:`px-3 py-2.5 tabular text-muted`,children:Z(e)}),(0,X.jsx)(`td`,{className:`px-3 py-2.5 text-right tabular`,children:e.days}),(0,X.jsx)(`td`,{className:`px-3 py-2.5 text-right tabular`,children:i(e.perDay)}),(0,X.jsx)(`td`,{className:`px-3 py-2.5 text-right tabular font-medium`,children:i(e.billed)}),(0,X.jsx)(`td`,{className:`px-5 py-2.5`,children:(0,X.jsx)(re,{stay:e})})]},e.id))})]}),e.stays.length===0?(0,X.jsx)(`p`,{className:`px-5 py-4 text-sm text-muted`,children:`No guest stays on this source.`}):null]}),(0,X.jsxs)(`div`,{className:`mt-3 flex flex-wrap justify-between gap-2 text-sm`,children:[(0,X.jsxs)(`span`,{className:`text-muted`,children:[e.guestCount,` guests · billed `,i(e.billed),` · paid`,` `,i(e.collected)]}),(0,X.jsxs)(`span`,{className:`font-semibold tabular`,children:[`Due `,i(Math.max(0,e.remaining))]})]}),e.receipts.length>0?(0,X.jsx)(`ul`,{className:`mt-3 divide-y divide-border rounded-lg border border-border`,children:e.receipts.map(e=>(0,X.jsxs)(`li`,{className:`flex items-center justify-between gap-3 px-3 py-2`,children:[(0,X.jsxs)(`div`,{className:`min-w-0`,children:[(0,X.jsxs)(`div`,{className:`truncate text-sm`,children:[n(e.date),` · `,e.particular]}),(0,X.jsx)(z,{mode:e.mode})]}),(0,X.jsxs)(`div`,{className:`flex items-center gap-1`,children:[(0,X.jsx)(`span`,{className:`tabular text-sm font-medium text-ok`,children:i(e.amount)}),(0,X.jsx)(j,{variant:`ghost`,size:`icon`,className:`size-9 min-h-9 text-muted hover:text-danger`,"aria-label":`Remove collection`,onClick:()=>v(e.id),children:(0,X.jsx)(E,{className:`size-4`})})]})]},e.id))}):null,e.settled?(0,X.jsx)(`p`,{className:`mt-4 text-sm text-ok`,children:`This source is settled. Every stay is ticked Paid.`}):(0,X.jsxs)(`form`,{className:`mt-4 grid gap-3 sm:grid-cols-[9rem_1fr_auto]`,onSubmit:t=>{t.preventDefault();let n=Number(w||Math.max(0,e.remaining));if(!Number.isFinite(n)||n<=0){u.error(`Enter an amount to collect`);return}d(S,n),T(``)},children:[(0,X.jsxs)(`div`,{className:`grid gap-1.5`,children:[(0,X.jsx)(O,{children:`Mode`}),(0,X.jsxs)(y,{value:S,onValueChange:e=>C(e),children:[(0,X.jsx)(m,{"aria-label":`Collection mode`,children:(0,X.jsx)(p,{})}),(0,X.jsx)(h,{children:c.map(e=>(0,X.jsx)(_,{value:e,children:r[e]},e))})]})]}),(0,X.jsxs)(`div`,{className:`grid gap-1.5`,children:[(0,X.jsx)(O,{children:`Amount`}),(0,X.jsx)(k,{type:`number`,min:0,value:w,onChange:e=>T(e.target.value),placeholder:String(Math.max(0,e.remaining))})]}),(0,X.jsx)(`div`,{className:`flex items-end`,children:(0,X.jsx)(j,{type:`submit`,className:`w-full`,children:`Collect`})})]})]}):null]})}function ne({stay:e}){let t=e.status===`paid`;return(0,X.jsx)(`span`,{className:f(`grid size-7 place-items-center rounded-md border`,t?`border-ok/40 bg-ok text-primary-fg`:e.status===`partial`?`border-due/40 bg-due/10 text-due`:`border-border bg-card text-transparent`),"aria-label":C(e.status),children:(0,X.jsx)(v,{className:`size-3.5`,strokeWidth:3})})}function re({stay:e}){return e.status===`paid`?(0,X.jsx)(M,{variant:`ok`,children:`Paid`}):e.status===`partial`?(0,X.jsxs)(`div`,{className:`flex flex-col gap-0.5`,children:[(0,X.jsx)(M,{variant:`warn`,children:`Partial`}),(0,X.jsxs)(`span`,{className:`text-xs tabular text-muted`,children:[`Due `,i(e.remaining)]})]}):(0,X.jsx)(M,{variant:`warn`,children:`Open`})}export{Q as component};