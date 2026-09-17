import{$ as e,Dt as t,Ft as n,Gt as r,Ht as i,Ot as a,St as o,Y as s,bt as c,i as l,r as u,yt as d}from"./store-BstUcbCW.js";import{r as f,t as p}from"./utils-_CoenGCd.js";import{a as m,i as h,n as g,o as _,r as v,s as y,t as b}from"./select-CU9odH1q.js";import{t as x}from"./printer-CvH9rQOL.js";import{t as S}from"./search-BLDturRE.js";import{t as C}from"./trash-2-B_XOSOVh.js";import{D as w,J as T,a as E,i as D,o as O,tt as k}from"./index-DDIdDKyv.js";import{t as A}from"./badge-Cibpu8RX.js";import{n as j,t as M}from"./card-D6T69S16.js";import{i as N,n as P,r as F,t as I}from"./tabs-avX4G4Sn.js";import{t as L}from"./mode-badge-BFGfdwK-.js";import{i as R,n as z,r as B,t as V}from"./balance-CGHccyMC.js";import{t as H}from"./print-sheet-BmX_p_7Z.js";import{n as U,t as ee}from"./save-cube-DDHTFWec.js";var W=r(i());function G(e){return Math.round(e).toLocaleString(`en-IN`)}function K(e){return e.checkOut?n(e.checkOut):`Continue`}function q(e){return e.status===`paid`?`✓ Paid`:e.status===`partial`?`Partial · ${G(e.remaining)}`:`Open`}function J(e,t){let n=`<!doctype html>
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
    <img src="${k(`logo.png?v=2`)}" alt="" />
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
  </div>`)}function X(e){return e.map(e=>`<tr>
        <td>${H(e.name)}</td>
        <td>${n(e.checkIn)}</td>
        <td>${K(e)}</td>
        <td class="ctr">${e.days}</td>
        <td class="num">${G(e.perDay)}</td>
        <td class="num">${G(e.billed)}</td>
        <td class="${e.status===`paid`?`paid`:`open`}">${H(q(e))}</td>
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
      <p class="note">Hotel day ${c}–${c}. Nights = check-out date minus check-in date. Paid ${G(e.collected)} · billed ${G(e.billed)} · oldest stays tick Paid first when a collection is posted.</p>
    </div>
  </div>`;J(`${e.key} guests`,r)}var Q=f();function re(e){return e.checkOut?n(e.checkOut):`Continue`}function ie(){let t=l(e=>e.hotel),n=l(e=>e.guests),r=l(e=>e.balReceived),i=l(e=>e.selectedDate),o=l(e=>e.addBalReceived),c=l(e=>e.removeBalReceived),d=l(e=>e.sealedIds),{busy:f,saveToServer:p}=U(),{gate:m}=D(),[h,g]=(0,W.useState)(``),[_,v]=(0,W.useState)(!0),[y,b]=(0,W.useState)(null),C=(0,W.useMemo)(()=>V(n,r),[n,r]),E=u(i),k=(0,W.useMemo)(()=>{let e=h.trim().toLowerCase();return C.filter(t=>_&&t.settled?!1:!e||t.key.toLowerCase().includes(e)?!0:t.guests.some(t=>t.name.toLowerCase().includes(e)||t.roomNo.toLowerCase().includes(e)))},[C,_,h]),A=C.reduce((e,t)=>e+Math.max(0,t.billed-t.listBilled-t.collected),0),j=C.reduce((e,t)=>e+t.collected,0),L=C.reduce((e,t)=>e+(t.billed-t.listBilled),0),z=B(C,h),H=(0,W.useMemo)(()=>R(n,r),[n,r]),G=(0,W.useMemo)(()=>z?k.filter(e=>e.key!==z.key):k,[k,z]),K=r.filter(e=>e.kind===`other`).slice().sort((e,t)=>t.date.localeCompare(e.date)||t.id.localeCompare(e.id)),q=K.filter(e=>e.date===i).reduce((e,t)=>e+t.amount,0),J=K.reduce((e,t)=>e+t.amount,0);function Y(e,t,n){m(()=>{o({particular:e.key,mode:t,amount:n,kind:`due`}),T.success(`Collected ${a(n)} from ${e.key}`)},{title:`Are you sure?`,message:`Collect ${a(n)} from ${e.key}? Oldest open stays will tick Paid first.`,confirmLabel:`Collect`})}function X(t){if(s(d,e.balance(t))){T.message(`Saved — this collection will not change`);return}m(()=>{c(t),T.success(`Collection removed`)},{title:`Are you sure?`,message:`Delete this collection?`,confirmLabel:`Delete`,danger:!0})}return(0,Q.jsxs)(`div`,{className:`flex flex-col gap-5`,children:[(0,Q.jsxs)(`div`,{className:`flex flex-wrap items-end justify-between gap-3`,children:[(0,Q.jsxs)(`div`,{children:[(0,Q.jsx)(`p`,{className:`text-xs font-medium uppercase tracking-[0.18em] text-muted`,children:`Outstanding`}),(0,Q.jsx)(`h1`,{className:`mt-1 font-display text-3xl font-semibold tracking-tight`,children:`Balance`}),(0,Q.jsx)(`p`,{className:`mt-1 text-sm text-muted`,children:`Collect dues, then press Save to send the books to the server.`})]}),(0,Q.jsx)(ee,{busy:f,onSave:()=>void p()})]}),(0,Q.jsxs)(`div`,{className:`grid grid-cols-2 gap-3 lg:grid-cols-4`,children:[(0,Q.jsxs)(M,{className:`p-4`,children:[(0,Q.jsx)(`div`,{className:`text-xs font-medium text-muted`,children:`Books C/B`}),(0,Q.jsx)(`div`,{className:`mt-1 font-display text-2xl font-semibold tabular text-due`,children:a(E?.outstanding.cb??0)})]}),(0,Q.jsxs)(M,{className:`p-4`,children:[(0,Q.jsx)(`div`,{className:`text-xs font-medium text-muted`,children:`Open source dues`}),(0,Q.jsx)(`div`,{className:`mt-1 font-display text-2xl font-semibold tabular`,children:a(A)})]}),(0,Q.jsxs)(M,{className:`p-4`,children:[(0,Q.jsx)(`div`,{className:`text-xs font-medium text-muted`,children:`Billed`}),(0,Q.jsx)(`div`,{className:`mt-1 font-display text-2xl font-semibold tabular`,children:a(L)})]}),(0,Q.jsxs)(M,{className:`p-4`,children:[(0,Q.jsx)(`div`,{className:`text-xs font-medium text-muted`,children:`Collected`}),(0,Q.jsx)(`div`,{className:`mt-1 font-display text-2xl font-semibold tabular text-ok`,children:a(j)})]})]}),(0,Q.jsxs)(I,{defaultValue:`balance`,children:[(0,Q.jsxs)(F,{className:`grid w-full grid-cols-2`,"aria-label":`Balance sections`,children:[(0,Q.jsx)(N,{value:`balance`,className:`w-full`,children:`Balance`}),(0,Q.jsx)(N,{value:`other`,className:`w-full`,children:`Other`})]}),(0,Q.jsxs)(P,{value:`balance`,className:`flex flex-col gap-5`,children:[(0,Q.jsxs)(`div`,{className:`flex flex-col gap-3`,children:[(0,Q.jsxs)(`div`,{className:`relative min-w-0`,children:[(0,Q.jsx)(S,{className:`pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted`}),(0,Q.jsx)(O,{className:`pl-9`,placeholder:`Source or guest — Flysky, Motor, name`,value:h,onChange:e=>g(e.target.value),"aria-label":`Search dues`,list:`balance-source-hints`,autoComplete:`off`}),(0,Q.jsx)(`datalist`,{id:`balance-source-hints`,children:H.map(e=>(0,Q.jsx)(`option`,{value:e},e))})]}),(0,Q.jsxs)(`div`,{className:`flex flex-wrap gap-2`,children:[(0,Q.jsx)(w,{variant:_?`default`:`outline`,onClick:()=>v(e=>!e),children:_?`Open dues`:`All sources`}),(0,Q.jsxs)(w,{variant:`outline`,onClick:()=>{if(k.length===0){T.error(`No sources to print`);return}T.message(`Opening source print…`),te(k,t.name,t.place)},children:[(0,Q.jsx)(x,{className:`size-4`}),`Print sources`]})]}),(0,Q.jsxs)(`p`,{className:`text-xs text-muted`,children:[(0,Q.jsx)(`span`,{className:`font-medium text-fg`,children:`Print sources`}),` — Flysky, Motor, remaining only, no guest names.`,` `,(0,Q.jsx)(`span`,{className:`font-medium text-fg`,children:`Print guests`}),` on a source — that company, then each guest stay.`]})]}),z?(0,Q.jsxs)(`p`,{className:`text-sm text-muted`,children:[(0,Q.jsx)(`span`,{className:`font-medium text-fg`,children:z.key}),` · `,z.guestCount,` guest`,z.guestCount===1?``:`s`,` · `,z.stays.length,` stay`,z.stays.length===1?``:`s`,` · billed `,a(z.billed),` · due `,a(Math.max(0,z.remaining))]}):null,z?(0,Q.jsx)($,{account:z,open:!0,pinned:!0,month:i.slice(0,7),onToggle:()=>g(``),onCollect:(e,t)=>Y(z,e,t),onRemoveReceipt:X,onPrintGuests:()=>{T.message(`Opening guest print…`),Z(z,t.name,t.place)}}):null,(0,Q.jsxs)(`div`,{className:`flex flex-col gap-2`,children:[G.map(e=>(0,Q.jsx)($,{account:e,open:y===e.key,month:i.slice(0,7),onToggle:()=>b(t=>t===e.key?null:e.key),onCollect:(t,n)=>Y(e,t,n),onRemoveReceipt:X,onPrintGuests:()=>{T.message(`Opening guest print…`),Z(e,t.name,t.place)}},e.key)),G.length===0&&!z?(0,Q.jsx)(M,{className:`p-8 text-center text-sm text-muted`,children:`No source dues match this filter.`}):null]})]}),(0,Q.jsx)(P,{value:`other`,className:`flex flex-col gap-5`,children:(0,Q.jsx)(ae,{booksCb:E?.outstanding.cb??0,today:q,total:J,rows:K,onAdd:(e,t,n)=>{m(()=>{o({particular:n.trim()?`Other · ${n.trim()}`:`Other`,mode:e,amount:t,kind:`other`}),T.success(`Other ${a(t)} saved`)},{title:`Save this Other entry?`,message:`Other ${a(t)}. It will not show on the Balance list.`,confirmLabel:`Save`})},onRemove:e=>{m(()=>{c(e),T.success(`Other entry removed`)},{title:`Delete this Other entry?`,message:`Remove this Other amount?`,confirmLabel:`Delete`,danger:!0})}})})]})]})}function ae({booksCb:e,today:n,total:r,rows:i,onAdd:s,onRemove:c}){let[l,u]=(0,W.useState)(`CASH`),[f,p]=(0,W.useState)(``),[_,y]=(0,W.useState)(``);return(0,Q.jsxs)(Q.Fragment,{children:[(0,Q.jsxs)(`div`,{className:`grid grid-cols-2 gap-3 lg:grid-cols-3`,children:[(0,Q.jsxs)(M,{className:`p-4`,children:[(0,Q.jsx)(`div`,{className:`text-xs font-medium text-muted`,children:`Books outstanding`}),(0,Q.jsx)(`div`,{className:`mt-1 font-display text-2xl font-semibold tabular text-due`,children:a(e)})]}),(0,Q.jsxs)(M,{className:`p-4`,children:[(0,Q.jsx)(`div`,{className:`text-xs font-medium text-muted`,children:`Other today`}),(0,Q.jsx)(`div`,{className:`mt-1 font-display text-2xl font-semibold tabular`,children:a(n)})]}),(0,Q.jsxs)(M,{className:`col-span-2 p-4 lg:col-span-1`,children:[(0,Q.jsx)(`div`,{className:`text-xs font-medium text-muted`,children:`Other posted`}),(0,Q.jsx)(`div`,{className:`mt-1 font-display text-2xl font-semibold tabular`,children:a(r)})]})]}),(0,Q.jsx)(M,{children:(0,Q.jsxs)(j,{className:`flex flex-col gap-4 p-5`,children:[(0,Q.jsxs)(`div`,{children:[(0,Q.jsx)(`p`,{className:`font-display text-lg font-semibold tracking-tight`,children:`Other`}),(0,Q.jsx)(`p`,{className:`mt-1 text-sm text-muted`,children:`Amount + note. Name stays Other. It does not appear on the Balance list.`})]}),(0,Q.jsxs)(`form`,{className:`grid gap-3 sm:grid-cols-[9rem_8rem_1fr_auto]`,onSubmit:e=>{e.preventDefault();let t=Number(f);if(!Number.isFinite(t)||t<=0){T.error(`Enter an amount`);return}s(l,t,_),p(``),y(``)},children:[(0,Q.jsxs)(`div`,{className:`grid gap-1.5`,children:[(0,Q.jsx)(E,{children:`Paid by`}),(0,Q.jsxs)(b,{value:l,onValueChange:e=>u(e),children:[(0,Q.jsx)(h,{"aria-label":`Other payment mode`,children:(0,Q.jsx)(m,{})}),(0,Q.jsx)(g,{children:d.map(e=>(0,Q.jsx)(v,{value:e,children:o[e]},e))})]})]}),(0,Q.jsxs)(`div`,{className:`grid gap-1.5`,children:[(0,Q.jsx)(E,{children:`Amount`}),(0,Q.jsx)(O,{type:`text`,inputMode:`decimal`,autoComplete:`off`,value:f,onChange:e=>p(e.target.value),placeholder:`0`})]}),(0,Q.jsxs)(`div`,{className:`grid gap-1.5`,children:[(0,Q.jsx)(E,{htmlFor:`other-note`,children:`Note`}),(0,Q.jsx)(O,{id:`other-note`,value:_,onChange:e=>y(e.target.value),placeholder:`Optional`})]}),(0,Q.jsx)(`div`,{className:`flex items-end`,children:(0,Q.jsx)(w,{type:`submit`,className:`w-full`,children:`Save`})})]})]})}),(0,Q.jsx)(M,{children:(0,Q.jsxs)(j,{className:`overflow-x-auto p-0`,children:[(0,Q.jsxs)(`table`,{className:`w-full min-w-[32rem] text-left text-sm`,children:[(0,Q.jsx)(`thead`,{className:`text-xs uppercase tracking-wide text-muted`,children:(0,Q.jsxs)(`tr`,{className:`border-y border-border`,children:[(0,Q.jsx)(`th`,{className:`px-5 py-2 font-medium`,children:`Date`}),(0,Q.jsx)(`th`,{className:`px-3 py-2 font-medium`,children:`Note`}),(0,Q.jsx)(`th`,{className:`px-3 py-2 font-medium`,children:`Paid by`}),(0,Q.jsx)(`th`,{className:`px-3 py-2 text-right font-medium`,children:`Amount`}),(0,Q.jsx)(`th`,{className:`px-3 py-2`})]})}),(0,Q.jsx)(`tbody`,{children:i.map(e=>(0,Q.jsxs)(`tr`,{className:`border-b border-border/70`,children:[(0,Q.jsx)(`td`,{className:`px-5 py-2.5 tabular text-muted`,children:t(e.date)}),(0,Q.jsx)(`td`,{className:`px-3 py-2.5`,children:e.particular}),(0,Q.jsx)(`td`,{className:`px-3 py-2.5`,children:(0,Q.jsx)(L,{mode:e.mode})}),(0,Q.jsx)(`td`,{className:`px-3 py-2.5 text-right tabular`,children:a(e.amount)}),(0,Q.jsx)(`td`,{className:`px-3 py-2.5 text-right`,children:(0,Q.jsx)(w,{variant:`ghost`,size:`icon`,className:`size-9 min-h-9 text-muted hover:text-danger`,"aria-label":`Remove other entry`,onClick:()=>c(e.id),children:(0,Q.jsx)(C,{className:`size-4`})})})]},e.id))})]}),i.length===0?(0,Q.jsx)(`p`,{className:`py-10 text-center text-sm text-muted`,children:`No Other entries yet.`}):null]})})]})}function $({account:e,open:r,pinned:i,month:s,onToggle:c,onCollect:l,onRemoveReceipt:u,onPrintGuests:f}){let[y,S]=(0,W.useState)(`CASH`),[D,k]=(0,W.useState)(``),N=r||i,P=!e.settled&&!!e.lastDate&&e.lastDate.slice(0,7)<s;return(0,Q.jsxs)(M,{className:p(`overflow-hidden`,i&&`ring-1 ring-primary/30`),children:[(0,Q.jsxs)(`div`,{className:`flex w-full min-h-14 flex-wrap items-center gap-2 px-4 py-3 md:px-5`,children:[(0,Q.jsxs)(`button`,{type:`button`,onClick:c,"aria-expanded":N,className:`flex min-w-0 flex-1 items-center gap-3 text-left`,children:[(0,Q.jsx)(_,{className:p(`size-4 shrink-0 text-muted transition-transform duration-150`,N?`rotate-0`:`-rotate-90`)}),(0,Q.jsxs)(`div`,{className:`min-w-0 flex-1`,children:[(0,Q.jsx)(`div`,{className:`truncate font-display text-lg font-semibold tracking-tight`,children:e.key}),(0,Q.jsxs)(`div`,{className:`text-xs text-muted`,children:[e.guestCount,` guest`,e.guestCount===1?``:`s`,` ·`,` `,e.stays.length,` stay`,e.stays.length===1?``:`s`,` ·`,` `,e.nights,` night`,e.nights===1?``:`s`,e.firstDate?` · ${t(e.firstDate)}–${t(e.lastDate)}`:``]})]})]}),(0,Q.jsxs)(w,{type:`button`,variant:`outline`,size:`sm`,className:`shrink-0`,onClick:f,children:[(0,Q.jsx)(x,{className:`size-4`}),`Print guests`]}),(0,Q.jsxs)(`div`,{className:`text-right`,children:[(0,Q.jsx)(`div`,{className:p(`font-display text-xl font-semibold tabular`,e.settled?`text-ok`:`text-due`),children:a(Math.max(0,e.remaining))}),(0,Q.jsx)(A,{variant:e.settled?`ok`:`warn`,children:e.settled?`Settled`:P?`Carried`:`Open`})]})]}),N?(0,Q.jsxs)(j,{className:`border-t border-border pt-4`,children:[(0,Q.jsxs)(`div`,{className:`-mx-5 overflow-x-auto`,children:[(0,Q.jsxs)(`table`,{className:`w-full min-w-[52rem] text-left text-sm`,children:[(0,Q.jsx)(`thead`,{className:`text-xs uppercase tracking-wide text-muted`,children:(0,Q.jsxs)(`tr`,{className:`border-b border-border`,children:[(0,Q.jsx)(`th`,{className:`px-5 py-2 font-medium`,children:` `}),(0,Q.jsx)(`th`,{className:`px-3 py-2 font-medium`,children:`Guest`}),(0,Q.jsx)(`th`,{className:`px-3 py-2 font-medium`,children:`Check-in`}),(0,Q.jsx)(`th`,{className:`px-3 py-2 font-medium`,children:`Check-out`}),(0,Q.jsx)(`th`,{className:`px-3 py-2 text-right font-medium`,children:`Nights`}),(0,Q.jsx)(`th`,{className:`px-3 py-2 text-right font-medium`,children:`Per day`}),(0,Q.jsx)(`th`,{className:`px-3 py-2 text-right font-medium`,children:`Total`}),(0,Q.jsx)(`th`,{className:`px-5 py-2 font-medium`,children:`Status`})]})}),(0,Q.jsx)(`tbody`,{children:e.stays.map(e=>(0,Q.jsxs)(`tr`,{className:p(`border-b border-border/70`,e.status===`paid`&&`bg-ok/5`),children:[(0,Q.jsx)(`td`,{className:`px-5 py-2.5`,children:(0,Q.jsx)(oe,{stay:e})}),(0,Q.jsxs)(`td`,{className:`px-3 py-2.5`,children:[(0,Q.jsx)(`div`,{className:`font-medium`,children:e.name}),(0,Q.jsxs)(`div`,{className:`text-xs text-muted`,children:[`Room `,e.roomNo]})]}),(0,Q.jsx)(`td`,{className:`px-3 py-2.5 tabular`,children:n(e.checkIn)}),(0,Q.jsx)(`td`,{className:`px-3 py-2.5 tabular text-muted`,children:re(e)}),(0,Q.jsx)(`td`,{className:`px-3 py-2.5 text-right tabular`,children:e.days}),(0,Q.jsx)(`td`,{className:`px-3 py-2.5 text-right tabular`,children:a(e.perDay)}),(0,Q.jsx)(`td`,{className:`px-3 py-2.5 text-right tabular font-medium`,children:a(e.billed)}),(0,Q.jsx)(`td`,{className:`px-5 py-2.5`,children:(0,Q.jsx)(se,{stay:e})})]},e.id))})]}),e.stays.length===0?(0,Q.jsx)(`p`,{className:`px-5 py-4 text-sm text-muted`,children:`No guest stays on this source.`}):null]}),(0,Q.jsxs)(`div`,{className:`mt-3 flex flex-wrap justify-between gap-2 text-sm`,children:[(0,Q.jsxs)(`span`,{className:`text-muted`,children:[e.guestCount,` guests · billed `,a(e.billed),` · paid`,` `,a(e.collected)]}),(0,Q.jsxs)(`span`,{className:`font-semibold tabular`,children:[`Due `,a(Math.max(0,e.remaining))]})]}),e.receipts.length>0?(0,Q.jsx)(`ul`,{className:`mt-3 divide-y divide-border rounded-lg border border-border`,children:e.receipts.map(e=>(0,Q.jsxs)(`li`,{className:`flex items-center justify-between gap-3 px-3 py-2`,children:[(0,Q.jsxs)(`div`,{className:`min-w-0`,children:[(0,Q.jsxs)(`div`,{className:`truncate text-sm`,children:[t(e.date),` · `,e.particular]}),(0,Q.jsx)(L,{mode:e.mode})]}),(0,Q.jsxs)(`div`,{className:`flex items-center gap-1`,children:[(0,Q.jsx)(`span`,{className:`tabular text-sm font-medium text-ok`,children:a(e.amount)}),(0,Q.jsx)(w,{variant:`ghost`,size:`icon`,className:`size-9 min-h-9 text-muted hover:text-danger`,"aria-label":`Remove collection`,onClick:()=>u(e.id),children:(0,Q.jsx)(C,{className:`size-4`})})]})]},e.id))}):null,e.settled?(0,Q.jsx)(`p`,{className:`mt-4 text-sm text-ok`,children:`This source is settled. Every stay is ticked Paid.`}):(0,Q.jsxs)(`form`,{className:`mt-4 grid gap-3 sm:grid-cols-[9rem_1fr_auto]`,onSubmit:t=>{t.preventDefault();let n=Number(D||Math.max(0,e.remaining));if(!Number.isFinite(n)||n<=0){T.error(`Enter an amount to collect`);return}l(y,n),k(``)},children:[(0,Q.jsxs)(`div`,{className:`grid gap-1.5`,children:[(0,Q.jsx)(E,{children:`Mode`}),(0,Q.jsxs)(b,{value:y,onValueChange:e=>S(e),children:[(0,Q.jsx)(h,{"aria-label":`Collection mode`,children:(0,Q.jsx)(m,{})}),(0,Q.jsx)(g,{children:d.map(e=>(0,Q.jsx)(v,{value:e,children:o[e]},e))})]})]}),(0,Q.jsxs)(`div`,{className:`grid gap-1.5`,children:[(0,Q.jsx)(E,{children:`Amount`}),(0,Q.jsx)(O,{type:`number`,min:0,value:D,onChange:e=>k(e.target.value),placeholder:String(Math.max(0,e.remaining))})]}),(0,Q.jsx)(`div`,{className:`flex items-end`,children:(0,Q.jsx)(w,{type:`submit`,className:`w-full`,children:`Collect`})})]})]}):null]})}function oe({stay:e}){let t=e.status===`paid`;return(0,Q.jsx)(`span`,{className:p(`grid size-7 place-items-center rounded-md border`,t?`border-ok/40 bg-ok text-primary-fg`:e.status===`partial`?`border-due/40 bg-due/10 text-due`:`border-border bg-card text-transparent`),"aria-label":z(e.status),children:(0,Q.jsx)(y,{className:`size-3.5`,strokeWidth:3})})}function se({stay:e}){return e.status===`paid`?(0,Q.jsx)(A,{variant:`ok`,children:`Paid`}):e.status===`partial`?(0,Q.jsxs)(`div`,{className:`flex flex-col gap-0.5`,children:[(0,Q.jsx)(A,{variant:`warn`,children:`Partial`}),(0,Q.jsxs)(`span`,{className:`text-xs tabular text-muted`,children:[`Due `,a(e.remaining)]})]}):(0,Q.jsx)(A,{variant:`warn`,children:`Open`})}export{ie as component};