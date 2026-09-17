import{Dt as e,G as t,Lt as n,Pt as r,V as i,bt as a,dt as o,ft as s,i as c,mt as l,r as u,yt as d}from"./store-CX3r53Uy.js";import{r as f,t as p}from"./utils-0DRdLfg2.js";import{a as m,i as h,n as g,o as _,r as v,s as y,t as b}from"./select-DYBX3Me4.js";import{t as x}from"./printer-5Jm1l6HW.js";import{a as S,i as C,n as w,r as T,t as E}from"./balance-irgy8opx.js";import{t as D}from"./trash-2-CzMDwYR2.js";import{D as O,a as k,et as A,i as j,o as M,q as N}from"./index-RoFnkrXs.js";import{t as P}from"./badge-B3yYPZDO.js";import{n as F,t as I}from"./card-q30gXVNx.js";import{i as L,n as R,r as z,t as B}from"./tabs-CsaxcrTD.js";import{t as V}from"./mode-badge-DZId3lnY.js";import{t as H}from"./print-sheet-56njsD6o.js";import{n as U,t as ee}from"./save-cube-37K7clpw.js";var W=n(r());function G(e){return Math.round(e).toLocaleString(`en-IN`)}function K(t){return t.checkOut?e(t.checkOut):`Continue`}function q(e){return e.status===`paid`?`✓ Paid`:e.status===`partial`?`Partial · ${G(e.remaining)}`:`Open`}function J(e,t){let n=`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${H(e)}</title>
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
</html>`,r=document.createElement(`iframe`);r.title=e,r.setAttribute(`aria-hidden`,`true`),r.style.cssText=`position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0`,document.body.appendChild(r);let i=r.contentDocument,a=r.contentWindow;if(!i||!a){r.remove(),window.print();return}i.open(),i.write(n),i.close();let o=()=>{try{a.focus(),a.print()}catch{window.print()}setTimeout(()=>r.remove(),2e3)},s=()=>{if(i.fonts?.ready){i.fonts.ready.then(()=>setTimeout(o,80)).catch(()=>setTimeout(o,80));return}setTimeout(o,50)};i.readyState===`complete`?s():r.onload=s}function Y(e,t,n){return`<div class="head">
    <img src="${A(`logo.png?v=2`)}" alt="" />
    <div style="flex:1;text-align:center">
      <h1>${H(e.toUpperCase())}</h1>
      <p>${H(t.toUpperCase())} · ${H(n)}</p>
    </div>
  </div>`}function te(e,t,n){let r=e.map(e=>`<tr>
        <td>${H(e.key)}</td>
        <td class="ctr">${e.guestCount}</td>
        <td class="ctr">${e.stays.length}</td>
        <td class="num">${G(e.billed)}</td>
        <td class="num">${G(e.collected)}</td>
        <td class="num ${e.settled?`paid`:`open`}">${G(Math.max(0,e.remaining))}</td>
      </tr>`).join(``),i=e.reduce((e,t)=>e+t.billed,0),a=e.reduce((e,t)=>e+t.collected,0),o=e.reduce((e,t)=>e+Math.max(0,t.remaining),0);J(`Source balance`,`<div class="sheet">
    ${Y(t,n,`Outstanding by source`)}
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
            <td class="num">${G(i)}</td>
            <td class="num">${G(a)}</td>
            <td class="num">${G(o)}</td>
          </tr>
        </tfoot>
      </table>
      <p class="note">Guest names are not listed. Use Print guests on a source for Flysky / Motor detail.</p>
    </div>
  </div>`)}function X(t){return t.map(t=>`<tr>
        <td>${H(t.name)}</td>
        <td>${e(t.checkIn)}</td>
        <td>${K(t)}</td>
        <td class="ctr">${t.days}</td>
        <td class="num">${G(t.perDay)}</td>
        <td class="num">${G(t.billed)}</td>
        <td class="${t.status===`paid`?`paid`:`open`}">${H(q(t))}</td>
      </tr>`).join(``)}function ne(e){return`<tfoot>
    <tr>
      <td colspan="3">${H(e.key)} · ${e.stays.length} stay${e.stays.length===1?``:`s`}</td>
      <td class="ctr">${e.stays.reduce((e,t)=>e+t.days,0)}</td>
      <td></td>
      <td class="num">${G(e.billed)}</td>
      <td class="num ${e.settled?`paid`:`open`}">${G(Math.max(0,e.remaining))} due</td>
    </tr>
  </tfoot>`}function Z(e,t,n){let r=`<div class="sheet">
    ${Y(t,n,`${e.key} outstanding`)}
    <div class="body">
      <h2>${H(e.key)}</h2>
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
      <p class="note">Hotel day ${s}–${s}. Nights = check-out date minus check-in date. Paid ${G(e.collected)} · billed ${G(e.billed)} · oldest stays tick Paid first when a collection is posted.</p>
    </div>
  </div>`;J(`${e.key} guests`,r)}var Q=f();function re(t){return t.checkOut?e(t.checkOut):`Continue`}function ie(){let e=c(e=>e.hotel),n=c(e=>e.guests),r=c(e=>e.balReceived),o=c(e=>e.selectedDate),s=c(e=>e.addBalReceived),l=c(e=>e.removeBalReceived),d=c(e=>e.sealedIds),{busy:f,saveToServer:p}=U(),{gate:m}=j(),[h,g]=(0,W.useState)(``),[_,v]=(0,W.useState)(!0),[y,b]=(0,W.useState)(null),w=(0,W.useMemo)(()=>E(n,r),[n,r]),D=u(o),k=(0,W.useMemo)(()=>{let e=h.trim().toLowerCase();return w.filter(t=>_&&t.settled?!1:!e||t.key.toLowerCase().includes(e)?!0:t.guests.some(t=>t.name.toLowerCase().includes(e)||t.roomNo.toLowerCase().includes(e)))},[w,_,h]),A=w.reduce((e,t)=>e+Math.max(0,t.billed-t.listBilled-t.collected),0),P=w.reduce((e,t)=>e+t.collected,0),F=w.reduce((e,t)=>e+(t.billed-t.listBilled),0),V=T(w,h),H=(0,W.useMemo)(()=>C(n,r),[n,r]),G=(0,W.useMemo)(()=>V?k.filter(e=>e.key!==V.key):k,[k,V]),K=r.filter(e=>e.kind===`other`).slice().sort((e,t)=>t.date.localeCompare(e.date)||t.id.localeCompare(e.id)),q=K.filter(e=>e.date===o).reduce((e,t)=>e+t.amount,0),J=K.reduce((e,t)=>e+t.amount,0);function Y(e,t,n){m(()=>{s({particular:e.key,mode:t,amount:n,kind:`due`}),N.success(`Collected ${a(n)} from ${e.key}`)},{title:`Are you sure?`,message:`Collect ${a(n)} from ${e.key}? Oldest open stays will tick Paid first.`,confirmLabel:`Collect`})}function X(e){if(i(d,t.balance(e))){N.message(`Saved — this collection will not change`);return}m(()=>{l(e),N.success(`Collection removed`)},{title:`Are you sure?`,message:`Delete this collection?`,confirmLabel:`Delete`,danger:!0})}return(0,Q.jsxs)(`div`,{className:`flex flex-col gap-5`,children:[(0,Q.jsxs)(`div`,{className:`flex flex-wrap items-end justify-between gap-3`,children:[(0,Q.jsxs)(`div`,{children:[(0,Q.jsx)(`p`,{className:`text-xs font-medium uppercase tracking-[0.18em] text-muted`,children:`Outstanding`}),(0,Q.jsx)(`h1`,{className:`mt-1 font-display text-3xl font-semibold tracking-tight`,children:`Balance`}),(0,Q.jsx)(`p`,{className:`mt-1 text-sm text-muted`,children:`Collect dues, then press Save to send the books to the server.`})]}),(0,Q.jsx)(ee,{busy:f,onSave:()=>void p()})]}),(0,Q.jsxs)(`div`,{className:`grid grid-cols-2 gap-3 lg:grid-cols-4`,children:[(0,Q.jsxs)(I,{className:`p-4`,children:[(0,Q.jsx)(`div`,{className:`text-xs font-medium text-muted`,children:`Books C/B`}),(0,Q.jsx)(`div`,{className:`mt-1 font-display text-2xl font-semibold tabular text-due`,children:a(D?.outstanding.cb??0)})]}),(0,Q.jsxs)(I,{className:`p-4`,children:[(0,Q.jsx)(`div`,{className:`text-xs font-medium text-muted`,children:`Open source dues`}),(0,Q.jsx)(`div`,{className:`mt-1 font-display text-2xl font-semibold tabular`,children:a(A)})]}),(0,Q.jsxs)(I,{className:`p-4`,children:[(0,Q.jsx)(`div`,{className:`text-xs font-medium text-muted`,children:`Billed`}),(0,Q.jsx)(`div`,{className:`mt-1 font-display text-2xl font-semibold tabular`,children:a(F)})]}),(0,Q.jsxs)(I,{className:`p-4`,children:[(0,Q.jsx)(`div`,{className:`text-xs font-medium text-muted`,children:`Collected`}),(0,Q.jsx)(`div`,{className:`mt-1 font-display text-2xl font-semibold tabular text-ok`,children:a(P)})]})]}),(0,Q.jsxs)(B,{defaultValue:`balance`,children:[(0,Q.jsxs)(z,{className:`grid w-full grid-cols-2`,"aria-label":`Balance sections`,children:[(0,Q.jsx)(L,{value:`balance`,className:`w-full`,children:`Balance`}),(0,Q.jsx)(L,{value:`other`,className:`w-full`,children:`Other`})]}),(0,Q.jsxs)(R,{value:`balance`,className:`flex flex-col gap-5`,children:[(0,Q.jsxs)(`div`,{className:`flex flex-col gap-3`,children:[(0,Q.jsxs)(`div`,{className:`relative min-w-0`,children:[(0,Q.jsx)(S,{className:`pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted`}),(0,Q.jsx)(M,{className:`pl-9`,placeholder:`Source or guest — Flysky, Motor, name`,value:h,onChange:e=>g(e.target.value),"aria-label":`Search dues`,list:`balance-source-hints`,autoComplete:`off`}),(0,Q.jsx)(`datalist`,{id:`balance-source-hints`,children:H.map(e=>(0,Q.jsx)(`option`,{value:e},e))})]}),(0,Q.jsxs)(`div`,{className:`flex flex-wrap gap-2`,children:[(0,Q.jsx)(O,{variant:_?`default`:`outline`,onClick:()=>v(e=>!e),children:_?`Open dues`:`All sources`}),(0,Q.jsxs)(O,{variant:`outline`,onClick:()=>{if(k.length===0){N.error(`No sources to print`);return}N.message(`Opening source print…`),te(k,e.name,e.place)},children:[(0,Q.jsx)(x,{className:`size-4`}),`Print sources`]})]}),(0,Q.jsxs)(`p`,{className:`text-xs text-muted`,children:[(0,Q.jsx)(`span`,{className:`font-medium text-fg`,children:`Print sources`}),` — Flysky, Motor, remaining only, no guest names.`,` `,(0,Q.jsx)(`span`,{className:`font-medium text-fg`,children:`Print guests`}),` on a source — that company, then each guest stay.`]})]}),V?(0,Q.jsxs)(`p`,{className:`text-sm text-muted`,children:[(0,Q.jsx)(`span`,{className:`font-medium text-fg`,children:V.key}),` · `,V.guestCount,` guest`,V.guestCount===1?``:`s`,` · `,V.stays.length,` stay`,V.stays.length===1?``:`s`,` · billed `,a(V.billed),` · due `,a(Math.max(0,V.remaining))]}):null,V?(0,Q.jsx)($,{account:V,open:!0,pinned:!0,month:o.slice(0,7),onToggle:()=>g(``),onCollect:(e,t)=>Y(V,e,t),onRemoveReceipt:X,onPrintGuests:()=>{N.message(`Opening guest print…`),Z(V,e.name,e.place)}}):null,(0,Q.jsxs)(`div`,{className:`flex flex-col gap-2`,children:[G.map(t=>(0,Q.jsx)($,{account:t,open:y===t.key,month:o.slice(0,7),onToggle:()=>b(e=>e===t.key?null:t.key),onCollect:(e,n)=>Y(t,e,n),onRemoveReceipt:X,onPrintGuests:()=>{N.message(`Opening guest print…`),Z(t,e.name,e.place)}},t.key)),G.length===0&&!V?(0,Q.jsx)(I,{className:`p-8 text-center text-sm text-muted`,children:`No source dues match this filter.`}):null]})]}),(0,Q.jsx)(R,{value:`other`,className:`flex flex-col gap-5`,children:(0,Q.jsx)(ae,{booksCb:D?.outstanding.cb??0,today:q,total:J,rows:K,onAdd:(e,t,n)=>{m(()=>{s({particular:n.trim()?`Other · ${n.trim()}`:`Other`,mode:e,amount:t,kind:`other`}),N.success(`Other ${a(t)} saved`)},{title:`Save this Other entry?`,message:`Other ${a(t)}. It will not show on the Balance list.`,confirmLabel:`Save`})},onRemove:e=>{m(()=>{l(e),N.success(`Other entry removed`)},{title:`Delete this Other entry?`,message:`Remove this Other amount?`,confirmLabel:`Delete`,danger:!0})}})})]})]})}function ae({booksCb:e,today:t,total:n,rows:r,onAdd:i,onRemove:s}){let[c,u]=(0,W.useState)(`CASH`),[f,p]=(0,W.useState)(``),[_,y]=(0,W.useState)(``);return(0,Q.jsxs)(Q.Fragment,{children:[(0,Q.jsxs)(`div`,{className:`grid grid-cols-2 gap-3 lg:grid-cols-3`,children:[(0,Q.jsxs)(I,{className:`p-4`,children:[(0,Q.jsx)(`div`,{className:`text-xs font-medium text-muted`,children:`Books outstanding`}),(0,Q.jsx)(`div`,{className:`mt-1 font-display text-2xl font-semibold tabular text-due`,children:a(e)})]}),(0,Q.jsxs)(I,{className:`p-4`,children:[(0,Q.jsx)(`div`,{className:`text-xs font-medium text-muted`,children:`Other today`}),(0,Q.jsx)(`div`,{className:`mt-1 font-display text-2xl font-semibold tabular`,children:a(t)})]}),(0,Q.jsxs)(I,{className:`col-span-2 p-4 lg:col-span-1`,children:[(0,Q.jsx)(`div`,{className:`text-xs font-medium text-muted`,children:`Other posted`}),(0,Q.jsx)(`div`,{className:`mt-1 font-display text-2xl font-semibold tabular`,children:a(n)})]})]}),(0,Q.jsx)(I,{children:(0,Q.jsxs)(F,{className:`flex flex-col gap-4 p-5`,children:[(0,Q.jsxs)(`div`,{children:[(0,Q.jsx)(`p`,{className:`font-display text-lg font-semibold tracking-tight`,children:`Other`}),(0,Q.jsx)(`p`,{className:`mt-1 text-sm text-muted`,children:`Amount + note. Name stays Other. It does not appear on the Balance list.`})]}),(0,Q.jsxs)(`form`,{className:`grid gap-3 sm:grid-cols-[9rem_8rem_1fr_auto]`,onSubmit:e=>{e.preventDefault();let t=Number(f);if(!Number.isFinite(t)||t<=0){N.error(`Enter an amount`);return}i(c,t,_),p(``),y(``)},children:[(0,Q.jsxs)(`div`,{className:`grid gap-1.5`,children:[(0,Q.jsx)(k,{children:`Paid by`}),(0,Q.jsxs)(b,{value:c,onValueChange:e=>u(e),children:[(0,Q.jsx)(h,{"aria-label":`Other payment mode`,children:(0,Q.jsx)(m,{})}),(0,Q.jsx)(g,{children:o.map(e=>(0,Q.jsx)(v,{value:e,children:l[e]},e))})]})]}),(0,Q.jsxs)(`div`,{className:`grid gap-1.5`,children:[(0,Q.jsx)(k,{children:`Amount`}),(0,Q.jsx)(M,{type:`text`,inputMode:`decimal`,autoComplete:`off`,value:f,onChange:e=>p(e.target.value),placeholder:`0`})]}),(0,Q.jsxs)(`div`,{className:`grid gap-1.5`,children:[(0,Q.jsx)(k,{htmlFor:`other-note`,children:`Note`}),(0,Q.jsx)(M,{id:`other-note`,value:_,onChange:e=>y(e.target.value),placeholder:`Optional`})]}),(0,Q.jsx)(`div`,{className:`flex items-end`,children:(0,Q.jsx)(O,{type:`submit`,className:`w-full`,children:`Save`})})]})]})}),(0,Q.jsx)(I,{children:(0,Q.jsxs)(F,{className:`overflow-x-auto p-0`,children:[(0,Q.jsxs)(`table`,{className:`w-full min-w-[32rem] text-left text-sm`,children:[(0,Q.jsx)(`thead`,{className:`text-xs uppercase tracking-wide text-muted`,children:(0,Q.jsxs)(`tr`,{className:`border-y border-border`,children:[(0,Q.jsx)(`th`,{className:`px-5 py-2 font-medium`,children:`Date`}),(0,Q.jsx)(`th`,{className:`px-3 py-2 font-medium`,children:`Note`}),(0,Q.jsx)(`th`,{className:`px-3 py-2 font-medium`,children:`Paid by`}),(0,Q.jsx)(`th`,{className:`px-3 py-2 text-right font-medium`,children:`Amount`}),(0,Q.jsx)(`th`,{className:`px-3 py-2`})]})}),(0,Q.jsx)(`tbody`,{children:r.map(e=>(0,Q.jsxs)(`tr`,{className:`border-b border-border/70`,children:[(0,Q.jsx)(`td`,{className:`px-5 py-2.5 tabular text-muted`,children:d(e.date)}),(0,Q.jsx)(`td`,{className:`px-3 py-2.5`,children:e.particular}),(0,Q.jsx)(`td`,{className:`px-3 py-2.5`,children:(0,Q.jsx)(V,{mode:e.mode})}),(0,Q.jsx)(`td`,{className:`px-3 py-2.5 text-right tabular`,children:a(e.amount)}),(0,Q.jsx)(`td`,{className:`px-3 py-2.5 text-right`,children:(0,Q.jsx)(O,{variant:`ghost`,size:`icon`,className:`size-9 min-h-9 text-muted hover:text-danger`,"aria-label":`Remove other entry`,onClick:()=>s(e.id),children:(0,Q.jsx)(D,{className:`size-4`})})})]},e.id))})]}),r.length===0?(0,Q.jsx)(`p`,{className:`py-10 text-center text-sm text-muted`,children:`No Other entries yet.`}):null]})})]})}function $({account:t,open:n,pinned:r,month:i,onToggle:s,onCollect:c,onRemoveReceipt:u,onPrintGuests:f}){let[y,S]=(0,W.useState)(`CASH`),[C,w]=(0,W.useState)(``),T=n||r,E=!t.settled&&!!t.lastDate&&t.lastDate.slice(0,7)<i;return(0,Q.jsxs)(I,{className:p(`overflow-hidden`,r&&`ring-1 ring-primary/30`),children:[(0,Q.jsxs)(`div`,{className:`flex w-full min-h-14 flex-wrap items-center gap-2 px-4 py-3 md:px-5`,children:[(0,Q.jsxs)(`button`,{type:`button`,onClick:s,"aria-expanded":T,className:`flex min-w-0 flex-1 items-center gap-3 text-left`,children:[(0,Q.jsx)(_,{className:p(`size-4 shrink-0 text-muted transition-transform duration-150`,T?`rotate-0`:`-rotate-90`)}),(0,Q.jsxs)(`div`,{className:`min-w-0 flex-1`,children:[(0,Q.jsx)(`div`,{className:`truncate font-display text-lg font-semibold tracking-tight`,children:t.key}),(0,Q.jsxs)(`div`,{className:`text-xs text-muted`,children:[t.guestCount,` guest`,t.guestCount===1?``:`s`,` ·`,` `,t.stays.length,` stay`,t.stays.length===1?``:`s`,` ·`,` `,t.nights,` night`,t.nights===1?``:`s`,t.firstDate?` · ${d(t.firstDate)}–${d(t.lastDate)}`:``]})]})]}),(0,Q.jsxs)(O,{type:`button`,variant:`outline`,size:`sm`,className:`shrink-0`,onClick:f,children:[(0,Q.jsx)(x,{className:`size-4`}),`Print guests`]}),(0,Q.jsxs)(`div`,{className:`text-right`,children:[(0,Q.jsx)(`div`,{className:p(`font-display text-xl font-semibold tabular`,t.settled?`text-ok`:`text-due`),children:a(Math.max(0,t.remaining))}),(0,Q.jsx)(P,{variant:t.settled?`ok`:`warn`,children:t.settled?`Settled`:E?`Carried`:`Open`})]})]}),T?(0,Q.jsxs)(F,{className:`border-t border-border pt-4`,children:[(0,Q.jsxs)(`div`,{className:`-mx-5 overflow-x-auto`,children:[(0,Q.jsxs)(`table`,{className:`w-full min-w-[52rem] text-left text-sm`,children:[(0,Q.jsx)(`thead`,{className:`text-xs uppercase tracking-wide text-muted`,children:(0,Q.jsxs)(`tr`,{className:`border-b border-border`,children:[(0,Q.jsx)(`th`,{className:`px-5 py-2 font-medium`,children:` `}),(0,Q.jsx)(`th`,{className:`px-3 py-2 font-medium`,children:`Guest`}),(0,Q.jsx)(`th`,{className:`px-3 py-2 font-medium`,children:`Check-in`}),(0,Q.jsx)(`th`,{className:`px-3 py-2 font-medium`,children:`Check-out`}),(0,Q.jsx)(`th`,{className:`px-3 py-2 text-right font-medium`,children:`Nights`}),(0,Q.jsx)(`th`,{className:`px-3 py-2 text-right font-medium`,children:`Per day`}),(0,Q.jsx)(`th`,{className:`px-3 py-2 text-right font-medium`,children:`Total`}),(0,Q.jsx)(`th`,{className:`px-5 py-2 font-medium`,children:`Status`})]})}),(0,Q.jsx)(`tbody`,{children:t.stays.map(t=>(0,Q.jsxs)(`tr`,{className:p(`border-b border-border/70`,t.status===`paid`&&`bg-ok/5`),children:[(0,Q.jsx)(`td`,{className:`px-5 py-2.5`,children:(0,Q.jsx)(oe,{stay:t})}),(0,Q.jsxs)(`td`,{className:`px-3 py-2.5`,children:[(0,Q.jsx)(`div`,{className:`font-medium`,children:t.name}),(0,Q.jsxs)(`div`,{className:`text-xs text-muted`,children:[`Room `,t.roomNo]})]}),(0,Q.jsx)(`td`,{className:`px-3 py-2.5 tabular`,children:e(t.checkIn)}),(0,Q.jsx)(`td`,{className:`px-3 py-2.5 tabular text-muted`,children:re(t)}),(0,Q.jsx)(`td`,{className:`px-3 py-2.5 text-right tabular`,children:t.days}),(0,Q.jsx)(`td`,{className:`px-3 py-2.5 text-right tabular`,children:a(t.perDay)}),(0,Q.jsx)(`td`,{className:`px-3 py-2.5 text-right tabular font-medium`,children:a(t.billed)}),(0,Q.jsx)(`td`,{className:`px-5 py-2.5`,children:(0,Q.jsx)(se,{stay:t})})]},t.id))})]}),t.stays.length===0?(0,Q.jsx)(`p`,{className:`px-5 py-4 text-sm text-muted`,children:`No guest stays on this source.`}):null]}),(0,Q.jsxs)(`div`,{className:`mt-3 flex flex-wrap justify-between gap-2 text-sm`,children:[(0,Q.jsxs)(`span`,{className:`text-muted`,children:[t.guestCount,` guests · billed `,a(t.billed),` · paid`,` `,a(t.collected)]}),(0,Q.jsxs)(`span`,{className:`font-semibold tabular`,children:[`Due `,a(Math.max(0,t.remaining))]})]}),t.receipts.length>0?(0,Q.jsx)(`ul`,{className:`mt-3 divide-y divide-border rounded-lg border border-border`,children:t.receipts.map(e=>(0,Q.jsxs)(`li`,{className:`flex items-center justify-between gap-3 px-3 py-2`,children:[(0,Q.jsxs)(`div`,{className:`min-w-0`,children:[(0,Q.jsxs)(`div`,{className:`truncate text-sm`,children:[d(e.date),` · `,e.particular]}),(0,Q.jsx)(V,{mode:e.mode})]}),(0,Q.jsxs)(`div`,{className:`flex items-center gap-1`,children:[(0,Q.jsx)(`span`,{className:`tabular text-sm font-medium text-ok`,children:a(e.amount)}),(0,Q.jsx)(O,{variant:`ghost`,size:`icon`,className:`size-9 min-h-9 text-muted hover:text-danger`,"aria-label":`Remove collection`,onClick:()=>u(e.id),children:(0,Q.jsx)(D,{className:`size-4`})})]})]},e.id))}):null,t.settled?(0,Q.jsx)(`p`,{className:`mt-4 text-sm text-ok`,children:`This source is settled. Every stay is ticked Paid.`}):(0,Q.jsxs)(`form`,{className:`mt-4 grid gap-3 sm:grid-cols-[9rem_1fr_auto]`,onSubmit:e=>{e.preventDefault();let n=Number(C||Math.max(0,t.remaining));if(!Number.isFinite(n)||n<=0){N.error(`Enter an amount to collect`);return}c(y,n),w(``)},children:[(0,Q.jsxs)(`div`,{className:`grid gap-1.5`,children:[(0,Q.jsx)(k,{children:`Mode`}),(0,Q.jsxs)(b,{value:y,onValueChange:e=>S(e),children:[(0,Q.jsx)(h,{"aria-label":`Collection mode`,children:(0,Q.jsx)(m,{})}),(0,Q.jsx)(g,{children:o.map(e=>(0,Q.jsx)(v,{value:e,children:l[e]},e))})]})]}),(0,Q.jsxs)(`div`,{className:`grid gap-1.5`,children:[(0,Q.jsx)(k,{children:`Amount`}),(0,Q.jsx)(M,{type:`number`,min:0,value:C,onChange:e=>w(e.target.value),placeholder:String(Math.max(0,t.remaining))})]}),(0,Q.jsx)(`div`,{className:`flex items-end`,children:(0,Q.jsx)(O,{type:`submit`,className:`w-full`,children:`Collect`})})]})]}):null]})}function oe({stay:e}){let t=e.status===`paid`;return(0,Q.jsx)(`span`,{className:p(`grid size-7 place-items-center rounded-md border`,t?`border-ok/40 bg-ok text-primary-fg`:e.status===`partial`?`border-due/40 bg-due/10 text-due`:`border-border bg-card text-transparent`),"aria-label":w(e.status),children:(0,Q.jsx)(y,{className:`size-3.5`,strokeWidth:3})})}function se({stay:e}){return e.status===`paid`?(0,Q.jsx)(P,{variant:`ok`,children:`Paid`}):e.status===`partial`?(0,Q.jsxs)(`div`,{className:`flex flex-col gap-0.5`,children:[(0,Q.jsx)(P,{variant:`warn`,children:`Partial`}),(0,Q.jsxs)(`span`,{className:`text-xs tabular text-muted`,children:[`Due `,a(e.remaining)]})]}):(0,Q.jsx)(P,{variant:`warn`,children:`Open`})}export{ie as component};