import{A as e,B as t,D as n,E as r,L as i,i as a,r as o,v as s,x as c,y as l}from"./store-DY_UMfT5.js";import{n as u}from"./dist-DD_2LsxA.js";import{r as d,t as f}from"./utils-D7wukrTQ.js";import{a as p,c as m,d as h,f as g,i as _,l as v,n as y,o as b,r as x,s as S,t as C,u as w}from"./balance-D5dS1DId.js";import{t as T}from"./printer-CkoVMUuH.js";import{t as E}from"./trash-2-B1ce-b5b.js";import{E as D,M as O,a as k,i as A,t as j}from"./index-CFs7IslX.js";import{t as M}from"./badge-DFV5ESdw.js";import{n as N,t as P}from"./card-pWDypV8a.js";import{i as F,n as I,r as L,t as R}from"./tabs-Ui4b27N1.js";import{t as z}from"./mode-badge-C9NgIMOp.js";import{t as B}from"./print-sheet-C1zG23sQ.js";var V=t(i());function H(e){return Math.round(e).toLocaleString(`en-IN`)}function U(t){return t.checkOut?e(t.checkOut):`In house`}function W(e){return e.status===`paid`?`✓ Paid`:e.status===`partial`?`Partial · ${H(e.remaining)}`:`Open`}function G(e,t){let n=`<!doctype html>
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
    <img src="${O(`logo.png?v=2`)}" alt="" />
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
  </div>`)}function J(t){return t.map(t=>`<tr>
        <td>${B(t.name)}</td>
        <td>${e(t.checkIn)}</td>
        <td>${U(t)}</td>
        <td class="ctr">${t.days}</td>
        <td class="num">${H(t.perDay)}</td>
        <td class="num">${H(t.billed)}</td>
        <td class="${t.status===`paid`?`paid`:`open`}">${B(W(t))}</td>
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
  </div>`;G(`${e.key} guests`,r)}var Z=d();function Q(t){return t.checkOut?e(t.checkOut):`In house`}function ee(){let e=a(e=>e.hotel),t=a(e=>e.guests),r=a(e=>e.balReceived),i=a(e=>e.selectedDate),s=a(e=>e.addBalReceived),c=a(e=>e.removeBalReceived),{gate:d}=j(),[f,p]=(0,V.useState)(``),[m,h]=(0,V.useState)(!0),[g,v]=(0,V.useState)(null),y=(0,V.useMemo)(()=>C(t,r),[t,r]),b=o(i),S=(0,V.useMemo)(()=>{let e=f.trim().toLowerCase();return y.filter(t=>m&&t.settled?!1:!e||t.key.toLowerCase().includes(e)?!0:t.guests.some(t=>t.name.toLowerCase().includes(e)||t.roomNo.toLowerCase().includes(e)))},[y,m,f]),E=y.filter(e=>!e.settled).reduce((e,t)=>e+Math.max(0,t.remaining),0),O=y.reduce((e,t)=>e+t.collected,0),A=y.reduce((e,t)=>e+t.billed,0),M=x(y,f),N=(0,V.useMemo)(()=>_(t),[t]),z=(0,V.useMemo)(()=>M?S.filter(e=>e.key!==M.key):S,[S,M]),B=r.filter(e=>e.kind===`other`).slice().sort((e,t)=>t.date.localeCompare(e.date)||t.id.localeCompare(e.id)),H=B.filter(e=>e.date===i).reduce((e,t)=>e+t.amount,0),U=B.reduce((e,t)=>e+t.amount,0);function W(e,t,r){d(()=>{s({particular:e.key,mode:t,amount:r,kind:`due`}),u.success(`Collected ${n(r)} from ${e.key}`)},{title:`Are you sure?`,message:`Collect ${n(r)} from ${e.key}? Oldest open stays will tick Paid first.`,confirmLabel:`Collect`})}function G(e){d(()=>{c(e),u.success(`Collection removed`)},{title:`Are you sure?`,message:`Delete this collection?`,confirmLabel:`Delete`,danger:!0})}return(0,Z.jsxs)(`div`,{className:`flex flex-col gap-5`,children:[(0,Z.jsxs)(`div`,{children:[(0,Z.jsx)(`p`,{className:`text-xs font-medium uppercase tracking-[0.18em] text-muted`,children:`Outstanding`}),(0,Z.jsx)(`h1`,{className:`mt-1 font-display text-3xl font-semibold tracking-tight`,children:`Balance`}),(0,Z.jsxs)(`p`,{className:`mt-1 text-sm text-muted`,children:[`Hotel day is `,l,` to `,l,`. Nights = check-out date minus check-in date. Stay the 9th, leave the 10th `,l,` — that is 1 night. Grab the check-out morning, not the last night date.`]})]}),(0,Z.jsxs)(`div`,{className:`grid grid-cols-2 gap-3 lg:grid-cols-4`,children:[(0,Z.jsxs)(P,{className:`p-4`,children:[(0,Z.jsx)(`div`,{className:`text-xs font-medium text-muted`,children:`Books C/B`}),(0,Z.jsx)(`div`,{className:`mt-1 font-display text-2xl font-semibold tabular text-due`,children:n(b?.outstanding.cb??0)})]}),(0,Z.jsxs)(P,{className:`p-4`,children:[(0,Z.jsx)(`div`,{className:`text-xs font-medium text-muted`,children:`Open source dues`}),(0,Z.jsx)(`div`,{className:`mt-1 font-display text-2xl font-semibold tabular`,children:n(E)})]}),(0,Z.jsxs)(P,{className:`p-4`,children:[(0,Z.jsx)(`div`,{className:`text-xs font-medium text-muted`,children:`Billed`}),(0,Z.jsx)(`div`,{className:`mt-1 font-display text-2xl font-semibold tabular`,children:n(A)})]}),(0,Z.jsxs)(P,{className:`p-4`,children:[(0,Z.jsx)(`div`,{className:`text-xs font-medium text-muted`,children:`Collected`}),(0,Z.jsx)(`div`,{className:`mt-1 font-display text-2xl font-semibold tabular text-ok`,children:n(O)})]})]}),(0,Z.jsxs)(R,{defaultValue:`balance`,children:[(0,Z.jsxs)(L,{className:`grid w-full grid-cols-2`,"aria-label":`Balance sections`,children:[(0,Z.jsx)(F,{value:`balance`,className:`w-full`,children:`Balance`}),(0,Z.jsx)(F,{value:`other`,className:`w-full`,children:`Other`})]}),(0,Z.jsxs)(I,{value:`balance`,className:`flex flex-col gap-5`,children:[(0,Z.jsxs)(`div`,{className:`flex flex-col gap-3`,children:[(0,Z.jsxs)(`div`,{className:`relative min-w-0`,children:[(0,Z.jsx)(w,{className:`pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted`}),(0,Z.jsx)(k,{className:`pl-9`,placeholder:`Source or guest — Flysky, Motor, name`,value:f,onChange:e=>p(e.target.value),"aria-label":`Search dues`,list:`balance-source-hints`,autoComplete:`off`}),(0,Z.jsx)(`datalist`,{id:`balance-source-hints`,children:N.map(e=>(0,Z.jsx)(`option`,{value:e},e))})]}),(0,Z.jsxs)(`div`,{className:`flex flex-wrap gap-2`,children:[(0,Z.jsx)(D,{variant:m?`default`:`outline`,onClick:()=>h(e=>!e),children:m?`Open dues`:`All sources`}),(0,Z.jsxs)(D,{variant:`outline`,onClick:()=>{if(S.length===0){u.error(`No sources to print`);return}u.message(`Opening source print…`),q(S,e.name,e.place)},children:[(0,Z.jsx)(T,{className:`size-4`}),`Print sources`]})]}),(0,Z.jsxs)(`p`,{className:`text-xs text-muted`,children:[(0,Z.jsx)(`span`,{className:`font-medium text-fg`,children:`Print sources`}),` — Flysky, Motor, remaining only, no guest names.`,` `,(0,Z.jsx)(`span`,{className:`font-medium text-fg`,children:`Print guests`}),` on a source — that company, then each guest stay.`]})]}),M?(0,Z.jsxs)(`p`,{className:`text-sm text-muted`,children:[(0,Z.jsx)(`span`,{className:`font-medium text-fg`,children:M.key}),` · `,M.guestCount,` guest`,M.guestCount===1?``:`s`,` · `,M.stays.length,` stay`,M.stays.length===1?``:`s`,` · billed `,n(M.billed),` · due `,n(Math.max(0,M.remaining))]}):null,M?(0,Z.jsx)($,{account:M,open:!0,pinned:!0,month:i.slice(0,7),onToggle:()=>p(``),onCollect:(e,t)=>W(M,e,t),onRemoveReceipt:G,onPrintGuests:()=>{u.message(`Opening guest print…`),X(M,e.name,e.place)}}):null,(0,Z.jsxs)(`div`,{className:`flex flex-col gap-2`,children:[z.map(t=>(0,Z.jsx)($,{account:t,open:g===t.key,month:i.slice(0,7),onToggle:()=>v(e=>e===t.key?null:t.key),onCollect:(e,n)=>W(t,e,n),onRemoveReceipt:G,onPrintGuests:()=>{u.message(`Opening guest print…`),X(t,e.name,e.place)}},t.key)),z.length===0&&!M?(0,Z.jsx)(P,{className:`p-8 text-center text-sm text-muted`,children:`No source dues match this filter.`}):null]})]}),(0,Z.jsx)(I,{value:`other`,className:`flex flex-col gap-5`,children:(0,Z.jsx)(te,{booksCb:b?.outstanding.cb??0,today:H,total:U,rows:B,onAdd:(e,t,r)=>{d(()=>{s({particular:r,mode:e,amount:t,kind:`other`}),u.success(`Other ${n(t)} cut from main balance`)},{title:`Are you sure?`,message:`Cut ${n(t)} from main balance?`,confirmLabel:`Save`})},onRemove:e=>{d(()=>{c(e),u.success(`Other collection removed`)},{title:`Are you sure?`,message:`Delete this other collection?`,confirmLabel:`Delete`,danger:!0})}})})]})]})}function te({booksCb:e,today:t,total:i,rows:a,onAdd:o,onRemove:l}){let[d,f]=(0,V.useState)(`CASH`),[h,g]=(0,V.useState)(``),[_,y]=(0,V.useState)(``);return(0,Z.jsxs)(Z.Fragment,{children:[(0,Z.jsxs)(`div`,{className:`grid grid-cols-2 gap-3 lg:grid-cols-3`,children:[(0,Z.jsxs)(P,{className:`p-4`,children:[(0,Z.jsx)(`div`,{className:`text-xs font-medium text-muted`,children:`Main balance`}),(0,Z.jsx)(`div`,{className:`mt-1 font-display text-2xl font-semibold tabular text-due`,children:n(e)})]}),(0,Z.jsxs)(P,{className:`p-4`,children:[(0,Z.jsx)(`div`,{className:`text-xs font-medium text-muted`,children:`Other today`}),(0,Z.jsx)(`div`,{className:`mt-1 font-display text-2xl font-semibold tabular`,children:n(t)})]}),(0,Z.jsxs)(P,{className:`col-span-2 p-4 lg:col-span-1`,children:[(0,Z.jsx)(`div`,{className:`text-xs font-medium text-muted`,children:`Other posted`}),(0,Z.jsx)(`div`,{className:`mt-1 font-display text-2xl font-semibold tabular`,children:n(i)})]})]}),(0,Z.jsx)(P,{children:(0,Z.jsxs)(N,{className:`flex flex-col gap-4 p-5`,children:[(0,Z.jsxs)(`div`,{children:[(0,Z.jsx)(`p`,{className:`font-display text-lg font-semibold tracking-tight`,children:`Cut from main balance`}),(0,Z.jsx)(`p`,{className:`mt-1 text-sm text-muted`,children:`Amount only — no source name. Lands in cash / Santosh QR / P.K. QR and reduces the books outstanding.`})]}),(0,Z.jsxs)(`form`,{className:`grid gap-3 sm:grid-cols-[9rem_1fr_auto]`,onSubmit:e=>{e.preventDefault();let t=Number(h);if(!Number.isFinite(t)||t<=0){u.error(`Enter an amount`);return}o(d,t,_.trim()||`Other`),g(``),y(``)},children:[(0,Z.jsxs)(`div`,{className:`grid gap-1.5`,children:[(0,Z.jsx)(A,{children:`Paid by`}),(0,Z.jsxs)(p,{value:d,onValueChange:e=>f(e),children:[(0,Z.jsx)(m,{"aria-label":`Other payment mode`,children:(0,Z.jsx)(v,{})}),(0,Z.jsx)(b,{children:s.map(e=>(0,Z.jsx)(S,{value:e,children:c[e]},e))})]})]}),(0,Z.jsxs)(`div`,{className:`grid gap-1.5`,children:[(0,Z.jsx)(A,{children:`Amount`}),(0,Z.jsx)(k,{type:`number`,min:0,value:h,onChange:e=>g(e.target.value),placeholder:`0`})]}),(0,Z.jsx)(`div`,{className:`flex items-end`,children:(0,Z.jsx)(D,{type:`submit`,className:`w-full`,children:`Cut balance`})}),(0,Z.jsxs)(`div`,{className:`grid gap-1.5 sm:col-span-3`,children:[(0,Z.jsx)(A,{htmlFor:`other-note`,children:`Note (optional)`}),(0,Z.jsx)(k,{id:`other-note`,value:_,onChange:e=>y(e.target.value),placeholder:`Not a source name`})]})]})]})}),(0,Z.jsx)(P,{children:(0,Z.jsxs)(N,{className:`overflow-x-auto p-0`,children:[(0,Z.jsxs)(`table`,{className:`w-full min-w-[32rem] text-left text-sm`,children:[(0,Z.jsx)(`thead`,{className:`text-xs uppercase tracking-wide text-muted`,children:(0,Z.jsxs)(`tr`,{className:`border-y border-border`,children:[(0,Z.jsx)(`th`,{className:`px-5 py-2 font-medium`,children:`Date`}),(0,Z.jsx)(`th`,{className:`px-3 py-2 font-medium`,children:`Note`}),(0,Z.jsx)(`th`,{className:`px-3 py-2 font-medium`,children:`Paid by`}),(0,Z.jsx)(`th`,{className:`px-3 py-2 text-right font-medium`,children:`Amount`}),(0,Z.jsx)(`th`,{className:`px-3 py-2`})]})}),(0,Z.jsx)(`tbody`,{children:a.map(e=>(0,Z.jsxs)(`tr`,{className:`border-b border-border/70`,children:[(0,Z.jsx)(`td`,{className:`px-5 py-2.5 tabular text-muted`,children:r(e.date)}),(0,Z.jsx)(`td`,{className:`px-3 py-2.5`,children:e.particular}),(0,Z.jsx)(`td`,{className:`px-3 py-2.5`,children:(0,Z.jsx)(z,{mode:e.mode})}),(0,Z.jsx)(`td`,{className:`px-3 py-2.5 text-right tabular`,children:n(e.amount)}),(0,Z.jsx)(`td`,{className:`px-3 py-2.5 text-right`,children:(0,Z.jsx)(D,{variant:`ghost`,size:`icon`,className:`size-9 min-h-9 text-muted hover:text-danger`,"aria-label":`Remove other collection`,onClick:()=>l(e.id),children:(0,Z.jsx)(E,{className:`size-4`})})})]},e.id))})]}),a.length===0?(0,Z.jsx)(`p`,{className:`py-10 text-center text-sm text-muted`,children:`No other cuts yet.`}):null]})})]})}function $({account:t,open:i,pinned:a,month:o,onToggle:l,onCollect:d,onRemoveReceipt:g,onPrintGuests:_}){let[y,x]=(0,V.useState)(`CASH`),[C,w]=(0,V.useState)(``),O=i||a,j=!t.settled&&!!t.lastDate&&t.lastDate.slice(0,7)<o;return(0,Z.jsxs)(P,{className:f(`overflow-hidden`,a&&`ring-1 ring-primary/30`),children:[(0,Z.jsxs)(`div`,{className:`flex w-full min-h-14 flex-wrap items-center gap-2 px-4 py-3 md:px-5`,children:[(0,Z.jsxs)(`button`,{type:`button`,onClick:l,"aria-expanded":O,className:`flex min-w-0 flex-1 items-center gap-3 text-left`,children:[(0,Z.jsx)(h,{className:f(`size-4 shrink-0 text-muted transition-transform duration-150`,O?`rotate-0`:`-rotate-90`)}),(0,Z.jsxs)(`div`,{className:`min-w-0 flex-1`,children:[(0,Z.jsx)(`div`,{className:`truncate font-display text-lg font-semibold tracking-tight`,children:t.key}),(0,Z.jsxs)(`div`,{className:`text-xs text-muted`,children:[t.guestCount,` guest`,t.guestCount===1?``:`s`,` ·`,` `,t.stays.length,` stay`,t.stays.length===1?``:`s`,` ·`,` `,t.nights,` night`,t.nights===1?``:`s`,t.firstDate?` · ${r(t.firstDate)}–${r(t.lastDate)}`:``]})]})]}),(0,Z.jsxs)(D,{type:`button`,variant:`outline`,size:`sm`,className:`shrink-0`,onClick:_,children:[(0,Z.jsx)(T,{className:`size-4`}),`Print guests`]}),(0,Z.jsxs)(`div`,{className:`text-right`,children:[(0,Z.jsx)(`div`,{className:f(`font-display text-xl font-semibold tabular`,t.settled?`text-ok`:`text-due`),children:n(Math.max(0,t.remaining))}),(0,Z.jsx)(M,{variant:t.settled?`ok`:`warn`,children:t.settled?`Settled`:j?`Carried`:`Open`})]})]}),O?(0,Z.jsxs)(N,{className:`border-t border-border pt-4`,children:[(0,Z.jsxs)(`div`,{className:`-mx-5 overflow-x-auto`,children:[(0,Z.jsxs)(`table`,{className:`w-full min-w-[52rem] text-left text-sm`,children:[(0,Z.jsx)(`thead`,{className:`text-xs uppercase tracking-wide text-muted`,children:(0,Z.jsxs)(`tr`,{className:`border-b border-border`,children:[(0,Z.jsx)(`th`,{className:`px-5 py-2 font-medium`,children:` `}),(0,Z.jsx)(`th`,{className:`px-3 py-2 font-medium`,children:`Guest`}),(0,Z.jsx)(`th`,{className:`px-3 py-2 font-medium`,children:`Check-in`}),(0,Z.jsx)(`th`,{className:`px-3 py-2 font-medium`,children:`Check-out`}),(0,Z.jsx)(`th`,{className:`px-3 py-2 text-right font-medium`,children:`Nights`}),(0,Z.jsx)(`th`,{className:`px-3 py-2 text-right font-medium`,children:`Per day`}),(0,Z.jsx)(`th`,{className:`px-3 py-2 text-right font-medium`,children:`Total`}),(0,Z.jsx)(`th`,{className:`px-5 py-2 font-medium`,children:`Status`})]})}),(0,Z.jsx)(`tbody`,{children:t.stays.map(t=>(0,Z.jsxs)(`tr`,{className:f(`border-b border-border/70`,t.status===`paid`&&`bg-ok/5`),children:[(0,Z.jsx)(`td`,{className:`px-5 py-2.5`,children:(0,Z.jsx)(ne,{stay:t})}),(0,Z.jsxs)(`td`,{className:`px-3 py-2.5`,children:[(0,Z.jsx)(`div`,{className:`font-medium`,children:t.name}),(0,Z.jsxs)(`div`,{className:`text-xs text-muted`,children:[`Room `,t.roomNo]})]}),(0,Z.jsx)(`td`,{className:`px-3 py-2.5 tabular`,children:e(t.checkIn)}),(0,Z.jsx)(`td`,{className:`px-3 py-2.5 tabular text-muted`,children:Q(t)}),(0,Z.jsx)(`td`,{className:`px-3 py-2.5 text-right tabular`,children:t.days}),(0,Z.jsx)(`td`,{className:`px-3 py-2.5 text-right tabular`,children:n(t.perDay)}),(0,Z.jsx)(`td`,{className:`px-3 py-2.5 text-right tabular font-medium`,children:n(t.billed)}),(0,Z.jsx)(`td`,{className:`px-5 py-2.5`,children:(0,Z.jsx)(re,{stay:t})})]},t.id))})]}),t.stays.length===0?(0,Z.jsx)(`p`,{className:`px-5 py-4 text-sm text-muted`,children:`No guest stays on this source.`}):null]}),(0,Z.jsxs)(`div`,{className:`mt-3 flex flex-wrap justify-between gap-2 text-sm`,children:[(0,Z.jsxs)(`span`,{className:`text-muted`,children:[t.guestCount,` guests · billed `,n(t.billed),` · paid`,` `,n(t.collected)]}),(0,Z.jsxs)(`span`,{className:`font-semibold tabular`,children:[`Due `,n(Math.max(0,t.remaining))]})]}),t.receipts.length>0?(0,Z.jsx)(`ul`,{className:`mt-3 divide-y divide-border rounded-lg border border-border`,children:t.receipts.map(e=>(0,Z.jsxs)(`li`,{className:`flex items-center justify-between gap-3 px-3 py-2`,children:[(0,Z.jsxs)(`div`,{className:`min-w-0`,children:[(0,Z.jsxs)(`div`,{className:`truncate text-sm`,children:[r(e.date),` · `,e.particular]}),(0,Z.jsx)(z,{mode:e.mode})]}),(0,Z.jsxs)(`div`,{className:`flex items-center gap-1`,children:[(0,Z.jsx)(`span`,{className:`tabular text-sm font-medium text-ok`,children:n(e.amount)}),(0,Z.jsx)(D,{variant:`ghost`,size:`icon`,className:`size-9 min-h-9 text-muted hover:text-danger`,"aria-label":`Remove collection`,onClick:()=>g(e.id),children:(0,Z.jsx)(E,{className:`size-4`})})]})]},e.id))}):null,t.settled?(0,Z.jsx)(`p`,{className:`mt-4 text-sm text-ok`,children:`This source is settled. Every stay is ticked Paid.`}):(0,Z.jsxs)(`form`,{className:`mt-4 grid gap-3 sm:grid-cols-[9rem_1fr_auto]`,onSubmit:e=>{e.preventDefault();let n=Number(C||Math.max(0,t.remaining));if(!Number.isFinite(n)||n<=0){u.error(`Enter an amount to collect`);return}d(y,n),w(``)},children:[(0,Z.jsxs)(`div`,{className:`grid gap-1.5`,children:[(0,Z.jsx)(A,{children:`Mode`}),(0,Z.jsxs)(p,{value:y,onValueChange:e=>x(e),children:[(0,Z.jsx)(m,{"aria-label":`Collection mode`,children:(0,Z.jsx)(v,{})}),(0,Z.jsx)(b,{children:s.map(e=>(0,Z.jsx)(S,{value:e,children:c[e]},e))})]})]}),(0,Z.jsxs)(`div`,{className:`grid gap-1.5`,children:[(0,Z.jsx)(A,{children:`Amount`}),(0,Z.jsx)(k,{type:`number`,min:0,value:C,onChange:e=>w(e.target.value),placeholder:String(Math.max(0,t.remaining))})]}),(0,Z.jsx)(`div`,{className:`flex items-end`,children:(0,Z.jsx)(D,{type:`submit`,className:`w-full`,children:`Collect`})})]})]}):null]})}function ne({stay:e}){let t=e.status===`paid`;return(0,Z.jsx)(`span`,{className:f(`grid size-7 place-items-center rounded-md border`,t?`border-ok/40 bg-ok text-primary-fg`:e.status===`partial`?`border-due/40 bg-due/10 text-due`:`border-border bg-card text-transparent`),"aria-label":y(e.status),children:(0,Z.jsx)(g,{className:`size-3.5`,strokeWidth:3})})}function re({stay:e}){return e.status===`paid`?(0,Z.jsx)(M,{variant:`ok`,children:`Paid`}):e.status===`partial`?(0,Z.jsxs)(`div`,{className:`flex flex-col gap-0.5`,children:[(0,Z.jsx)(M,{variant:`warn`,children:`Partial`}),(0,Z.jsxs)(`span`,{className:`text-xs tabular text-muted`,children:[`Due `,n(e.remaining)]})]}):(0,Z.jsx)(M,{variant:`warn`,children:`Open`})}export{ee as component};