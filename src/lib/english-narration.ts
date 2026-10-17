const HINDI: [RegExp, string][] = [
  [/बिजली(?:\s*का)?\s*बिल|बिजली/g, " electricity bill "],
  [/विद्युत/g, " electricity "],
  [/किराया/g, " rent "],
  [/वेतन|सैलरी|सैलिरी|पगार/g, " salary "],
  [/सब्जी|भाजी/g, " vegetables "],
  [/दूध/g, " milk "],
  [/गैस/g, " cooking gas "],
  [/पानी(?:\s*का)?\s*टैंकर|पानी\s*टैंकर|टैंकर/g, " water tanker "],
  [/पानी/g, " water "],
  [/धोबी|धुलाई/g, " laundry "],
  [/सफाई/g, " cleaning "],
  [/नाश्ता/g, " breakfast "],
  [/डिनर/g, " dinner "],
  [/लंच/g, " lunch "],
  [/खाना|भोजन/g, " food "],
  [/चाय/g, " tea "],
  [/कॉफी|काफी/g, " coffee "],
  [/पेट्रोल/g, " petrol "],
  [/डीजल/g, " diesel "],
  [/मरम्मत|रिपेयर/g, " repair "],
  [/रखरखाव|मेंटेनेंस|मेन्टेनेंस/g, " maintenance "],
  [/एडवांस|अग्रिम/g, " advance "],
  [/कमीशन/g, " commission "],
  [/टैक्सी/g, " taxi "],
  [/ऑटो/g, " auto rickshaw "],
  [/किराना/g, " groceries "],
  [/स्टेशनरी/g, " stationery "],
  [/इंटरनेट|वाई\s*फाई|वाईफाई/g, " internet "],
  [/मोबाइल\s*रिचार्ज|रिचार्ज/g, " mobile recharge "],
  [/मोबाइल/g, " mobile "],
  [/कचरा/g, " garbage "],
  [/फल/g, " fruit "],
  [/चिकन|मुर्गी|मुर्ग/g, " chicken "],
  [/मटन/g, " mutton "],
  [/चावल/g, " rice "],
  [/आटा/g, " flour "],
  [/तेल/g, " oil "],
  [/मसाला/g, " spices "],
  [/अंड[ाे]|अण्डा/g, " eggs "],
  [/ब्रेड/g, " bread "],
  [/चीनी/g, " sugar "],
  [/दाल/g, " lentils "],
  [/नकद/g, " cash "],
  [/खर्च/g, " expense "],
  [/जमा/g, " deposit "],
  [/निकासी/g, " withdrawal "],
  [/बकाया/g, " balance due "],
  [/भुगतान|पेमेंट/g, " payment "],
  [/बिल/g, " bill "],
  [/कमरा/g, " room "],
  [/रसीद/g, " receipt "],
  [/चेक/g, " cheque "],
  [/नगद/g, " cash "],
];

const ROMAN: [RegExp, string][] = [
  [/\bbijli bill\b|\bbijali bill\b|\blight bill\b/gi, "electricity bill"],
  [/\bbijli\b|\bbijali\b|\bbijlee\b/gi, "electricity"],
  [/\bkiraya\b/gi, "rent"],
  [/\bsabzi\b|\bbhaji\b/gi, "vegetables"],
  [/\bdudh\b/gi, "milk"],
  [/\bpani tanker\b|\bwater tanker\b/gi, "water tanker"],
  [/\bnashta\b/gi, "breakfast"],
  [/\bkhana\b/gi, "food"],
  [/\bkirana\b/gi, "groceries"],
  [/\bdhobi\b/gi, "laundry"],
];

const CHANNEL: Record<string, string> = {
  PAYTM: "Paytm",
  PYTM: "Paytm",
  GPAY: "Google Pay",
  GOOGLEPAY: "Google Pay",
  OKAXIS: "Google Pay",
  OKHDFCBANK: "Google Pay",
  OKSBI: "Google Pay",
  PHONEPE: "PhonePe",
  PHONEPEY: "PhonePe",
  YBL: "PhonePe",
  AXL: "PhonePe",
  IBL: "PhonePe",
  BHIM: "BHIM",
  UPI: "UPI",
};

const SKIP = new Set([
  "UPI",
  "NEFT",
  "RTGS",
  "IMPS",
  "NACH",
  "ACH",
  "ATM",
  "POS",
  "CLG",
  "CHQ",
  "CHEQUE",
  "CR",
  "DR",
  "IN",
  "OUT",
  "TO",
  "BY",
  "TRANSFER",
  "TRF",
  "P2A",
  "P2P",
  "PAYMENT",
  "FROM",
  "SENT",
  "RECV",
  "RECEIVED",
]);

function hasDevanagari(text: string) {
  return /[\u0900-\u097F]/.test(text);
}

function translateHindi(text: string) {
  let out = ` ${text} `;
  for (const [pattern, english] of HINDI) out = out.replace(pattern, english);
  return out.replace(/\s+/g, " ").trim();
}

function polishRoman(text: string) {
  let out = text;
  for (const [pattern, english] of ROMAN) out = out.replace(pattern, english);
  return out.replace(/\s+/g, " ").trim();
}

function sentence(text: string) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return "";
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

function pieces(text: string) {
  return text
    .split(/[/\-|]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function isRef(part: string) {
  const compact = part.replace(/\s/g, "");
  return /^\d{6,}$/.test(compact) || /^[A-Z]{4}0[A-Z0-9]{6}$/i.test(compact);
}

function partyName(parts: string[]) {
  const names = parts.filter((part) => {
    const key = part.replace(/\s/g, "").toUpperCase();
    if (!key || SKIP.has(key) || CHANNEL[key] || isRef(part)) return false;
    if (/^\d+$/.test(key)) return false;
    return /[A-Za-z\u0900-\u097F]/.test(part);
  });
  return names.join(" ").replace(/\s+/g, " ").trim();
}

function channelName(parts: string[]) {
  for (const part of parts) {
    const key = part.replace(/\s/g, "").toUpperCase();
    if (CHANNEL[key] && CHANNEL[key] !== "UPI") return CHANNEL[key];
  }
  return "";
}

function direction(text: string) {
  if (/\b(DR|DEBIT|WDL|WITHDRAW|PAID|ATM|POS)\b/i.test(text)) return "paid";
  if (/\b(CR|CREDIT|DEPOSIT|RECV|RECEIVED)\b/i.test(text)) return "received";
  return "";
}

function describeBank(text: string) {
  const instrument = text.match(/\b(UPI|NEFT|RTGS|IMPS|NACH|ACH|ATM|POS|CLG|CHQ|CHEQUE)\b/i);
  if (!instrument) return "";
  if (!/[/\-]/.test(text) && text.split(/\s+/).length <= 3 && !/\b(CR|DR)\b/i.test(text)) {
    return "";
  }
  const kind = instrument[1].toUpperCase();
  const parts = pieces(text);
  const refs = parts.filter(isRef).map((part) => part.replace(/\s/g, ""));
  const who = partyName(parts);
  const via = channelName(parts);
  const way = direction(text);
  const refBit = refs.length ? ` Reference ${refs.join(", ")}.` : "";
  const viaBit = via ? ` through ${via}` : "";
  if (kind === "ATM") {
    return sentence(`Cash withdrawn from ATM${who ? ` at ${who}` : ""}.${refBit}`);
  }
  if (kind === "POS") {
    return sentence(`Card payment at a shop machine${who ? ` (${who})` : ""}.${refBit}`);
  }
  if (kind === "CLG" || kind === "CHQ" || kind === "CHEQUE") {
    const cheque = refs[0] ? ` number ${refs[0]}` : "";
    const verb = way === "paid" ? "paid" : "deposited";
    return sentence(`Cheque ${verb}${cheque}${who ? ` for ${who}` : ""}.`);
  }
  const rail =
    kind === "UPI"
      ? "UPI"
      : kind === "NEFT"
        ? "NEFT"
        : kind === "RTGS"
          ? "RTGS"
          : kind === "IMPS"
            ? "IMPS"
            : kind === "NACH" || kind === "ACH"
              ? "auto debit"
              : kind;
  if (way === "paid") {
    return sentence(
      `${rail} payment sent${who ? ` to ${who}` : ""}${viaBit}.${refBit}`,
    );
  }
  if (way === "received") {
    return sentence(
      `${rail} payment received${who ? ` from ${who}` : ""}${viaBit}.${refBit}`,
    );
  }
  return sentence(`${rail} transfer${who ? ` with ${who}` : ""}${viaBit}.${refBit}`);
}

export function englishNarration(raw: string) {
  const original = raw.replace(/\s+/g, " ").trim();
  if (!original) return "";
  const translated = translateHindi(original);
  const hindiChanged = translated !== original || hasDevanagari(original);
  const bank = describeBank(translated);
  if (bank) return bank.replace(/[\u0900-\u097F]/g, "").replace(/\s+/g, " ").trim();
  if (!hindiChanged) {
    const polished = polishRoman(original);
    return polished === original ? original : sentence(polished);
  }
  return sentence(polishRoman(translated)).replace(/[\u0900-\u097F]/g, "").replace(/\s+/g, " ").trim();
}
