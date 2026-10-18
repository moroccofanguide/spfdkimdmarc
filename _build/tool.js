(function(){
"use strict";
var PROVIDERS = [
  { id:"google", name:"Google Workspace", include:"include:_spf.google.com", mx:/(^|\.)(google\.com|googlemail\.com)\.?$/i,
    dkim:["Google Admin console > Apps > Google Workspace > Gmail > Authenticate email.","Generate a new record (2048-bit if your DNS host accepts it). The default selector is <code>google</code>.","Publish the TXT record shown at <code>google._domainkey</code>, then click Start authentication. <a href=\"/guides/google-workspace/\">Full Google Workspace guide</a>."], selector:"google" },
  { id:"m365", name:"Microsoft 365", include:"include:spf.protection.outlook.com", mx:/mail\.protection\.outlook\.com\.?$/i,
    dkim:["Microsoft Defender portal, in the email authentication settings, DKIM tab.","Publish the two CNAME records it gives you: <code>selector1._domainkey</code> and <code>selector2._domainkey</code>.","Back in the portal, enable DKIM signing for the domain. <a href=\"/guides/microsoft-365/\">Full Microsoft 365 guide</a>."], selector:"selector1" },
  { id:"zoho", name:"Zoho Mail", include:"include:zohomail.com", mx:/(^|\.)zoho(mail)?\.(com|eu|in|com\.au|jp|ca|sa)\.?$/i,
    dkim:["Zoho Mail Admin Console > Domains > your domain > Email Configuration > DKIM.","Add a selector, copy the TXT value Zoho generates and publish it at <code>selector._domainkey</code>.","Click Verify in Zoho once the record is live, then enable DKIM. <a href=\"/guides/zoho-mail/\">Full Zoho Mail guide</a>."], selector:"" },
  { id:"ovh", name:"OVHcloud (MX Plan, Email Pro, Exchange)", include:"include:mx.ovh.com", mx:/(^|\.)ovh\.net\.?$/i,
    dkim:["MX Plan: Control Panel > Web Cloud > Domain names > your domain > General information, click the red DKIM badge. Email Pro or Exchange: open the service, Associated domains tab, DKIM badge.","If your DNS zone is at OVHcloud, the two CNAME records are added for you. Otherwise publish the two CNAMEs OVHcloud shows (selectors like <code>ovhmo…-selector1</code>).","Activation takes from 30 minutes to 24 hours. <a href=\"/guides/ovhcloud/\">Full OVHcloud guide</a>."], selector:"" }
];
var $ = function(id){ return document.getElementById(id); };
var esc = function(s){ return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c];}); };

function cleanDomain(v){
  v = String(v||"").trim().toLowerCase();
  v = v.replace(/^[a-z]+:\/\//,"").replace(/^www\./,"").split(/[\/?#\s]/)[0].replace(/\.$/,"");
  if (v.indexOf("@")>=0) v = v.split("@").pop();
  return /^([a-z0-9-]+\.)+[a-z]{2,}$/i.test(v) ? v : "";
}
function domainOrExample(){ return cleanDomain($("domain").value) || "example.com"; }

async function doh(name, type){
  var urls = [
    "https://cloudflare-dns.com/dns-query?name="+encodeURIComponent(name)+"&type="+type,
    "https://dns.google/resolve?name="+encodeURIComponent(name)+"&type="+type
  ];
  var lastErr;
  for (var i=0;i<urls.length;i++){
    try {
      var r = await fetch(urls[i], { headers:{ "accept":"application/dns-json" } });
      if (!r.ok) throw new Error("HTTP "+r.status);
      var j = await r.json();
      return j;
    } catch(e){ lastErr = e; }
  }
  throw lastErr || new Error("DNS lookup failed");
}
function txtValues(j, typeNum){
  return (j.Answer||[]).filter(function(a){ return a.type===typeNum; }).map(function(a){
    var d = a.data || "";
    var parts = d.match(/"((?:[^"\\]|\\.)*)"/g);
    return parts ? parts.map(function(p){ return p.slice(1,-1).replace(/\\"/g,'"'); }).join("") : d;
  });
}
function status(cls, title, detail){
  return '<div class="status '+cls+'"><b>'+title+'</b>'+(detail?'<div class="detail">'+detail+'</div>':'')+'</div>';
}
function record(type, host, value, id){
  return '<div class="rec"><div class="head"><div><span>Type</span> <strong>'+type+'</strong> &nbsp; <span>Host / Name</span> <strong>'+esc(host)+'</strong></div>'+
    '<button class="ghost" type="button" data-copy="'+id+'">Copy value</button></div><code id="'+id+'">'+esc(value)+'</code></div>';
}
document.addEventListener("click", function(e){
  var b = e.target.closest("[data-copy]"); if(!b) return;
  var t = $(b.getAttribute("data-copy")).textContent;
  var done = function(){ var o=b.textContent; b.textContent="Copied"; setTimeout(function(){ b.textContent=o; },1200); };
  if (navigator.clipboard) navigator.clipboard.writeText(t).then(done, function(){});
});

/* Providers UI */
$("providers").innerHTML = PROVIDERS.map(function(p){
  return '<label class="chk"><input type="checkbox" value="'+p.id+'"> <span>'+esc(p.name)+'</span></label>';
}).join("");
function selected(){ return Array.prototype.slice.call(document.querySelectorAll("#providers input:checked")).map(function(i){ return i.value; }); }

function spfMechanisms(){
  var mech = [];
  selected().forEach(function(id){ var p = PROVIDERS.filter(function(x){return x.id===id;})[0]; if(p) mech.push(p.include); });
  ($("extra-inc").value||"").split(/[\s,;]+/).forEach(function(t){
    t = t.trim(); if(!t) return;
    if (!/^(include:|a\b|mx\b|ip4:|ip6:|exists:)/i.test(t)) t = "include:"+t.replace(/^include:/i,"");
    mech.push(t.toLowerCase());
  });
  ($("extra-ip").value||"").split(/[\s,;]+/).forEach(function(t){
    t = t.trim(); if(!t) return;
    if (/^\d{1,3}(\.\d{1,3}){3}(\/\d{1,2})?$/.test(t)) mech.push("ip4:"+t);
    else if (/^[0-9a-f:]+(\/\d{1,3})?$/i.test(t) && t.indexOf(":")>=0) mech.push("ip6:"+t);
  });
  return mech.filter(function(m,i){ return mech.indexOf(m)===i; });
}
function renderSpf(){
  var mech = spfMechanisms();
  var out = "";
  if (!mech.length){ $("r-spf").innerHTML = '<p class="note">Select at least one service to generate your record.</p>'; renderDkimHelp(); return; }
  var value = "v=spf1 " + mech.join(" ") + " " + $("spf-all").value;
  var lookups = mech.filter(function(m){ return /^(include:|a\b|mx\b|exists:)/.test(m); }).length;
  out += record("TXT", "@", value, "c-spf");
  out += '<p class="note">Replace any existing <code>v=spf1</code> record with this one: a domain must have only one.</p>';
  if (lookups > 10) out += status("bad","Too many DNS lookups","This record needs more than 10 lookups and will fail SPF. Remove services you no longer use.");
  else if (lookups > 6) out += status("warn","Close to the 10-lookup limit","Each include can trigger extra lookups of its own. Check the final count with a full SPF validator.");
  $("r-spf").innerHTML = out;
  renderDkimHelp();
}
["extra-inc","extra-ip","spf-all"].forEach(function(id){ $(id).addEventListener("input", renderSpf); });
$("providers").addEventListener("change", renderSpf);

function renderDkimHelp(){
  var ids = selected();
  if (!ids.length){ $("dkim-help").innerHTML = '<p class="note">Select your services in step 2 to see where to create their DKIM keys.</p>'; return; }
  $("dkim-help").innerHTML = ids.map(function(id){
    var p = PROVIDERS.filter(function(x){return x.id===id;})[0];
    return '<details open><summary>'+esc(p.name)+'</summary><ul class="steps">'+p.dkim.map(function(s){return "<li>"+s+"</li>";}).join("")+'</ul></details>';
  }).join("");
  if (!$("selector").value){ var p0 = PROVIDERS.filter(function(x){return x.id===ids[0];})[0]; if (p0 && p0.selector) $("selector").placeholder = "DKIM selector, e.g. "+p0.selector; }
}

function renderDmarc(){
  var d = domainOrExample();
  var v = "v=DMARC1; p=" + $("dm-p").value;
  var rua = ($("dm-rua").value||"").trim();
  if (rua) v += "; rua=mailto:" + rua.replace(/^mailto:/i,"");
  var out = record("TXT", "_dmarc", v, "c-dmarc");
  out += '<p class="note">Host is <code>_dmarc</code> (some DNS panels want the full name <code>_dmarc.'+esc(d)+'</code>).</p>';
  if (rua && rua.split("@").pop().toLowerCase() !== d && cleanDomain($("domain").value))
    out += status("warn","Reports go to another domain","That domain must publish an authorization record, otherwise reports will not be delivered.");
  $("r-dmarc").innerHTML = out;
}
["dm-p","dm-rua"].forEach(function(id){ $(id).addEventListener("input", renderDmarc); });

/* Step 1: check */
$("f-check").addEventListener("submit", async function(e){
  e.preventDefault();
  var d = cleanDomain($("domain").value);
  if (!d){ $("r-check").innerHTML = status("bad","Enter a valid domain","For example: example.com"); return; }
  $("domain").value = d;
  var b = $("b-check"); b.disabled = true; b.textContent = "Checking…";
  try {
    var res = await Promise.all([doh(d,"MX"), doh(d,"TXT"), doh("_dmarc."+d,"TXT")]);
    var mx = (res[0].Answer||[]).filter(function(a){return a.type===15;}).map(function(a){ return a.data.split(" ").pop(); });
    var spfs = txtValues(res[1],16).filter(function(t){ return /^v=spf1(\s|$)/i.test(t); });
    var dmarcs = txtValues(res[2],16).filter(function(t){ return /^v=DMARC1/i.test(t); });
    var out = "";
    if (res[0].Status === 3) out += status("bad","Domain not found","This domain does not exist in DNS.");
    else if (!mx.length) out += status("warn","No MX record","This domain cannot receive email. That is fine for a send-only domain.");
    else out += status("ok","MX found", mx.map(esc).join("<br>"));
    if (!spfs.length) out += status("bad","No SPF record","Generate one in step 2 and publish it as a TXT record on @.");
    else if (spfs.length > 1) out += status("bad","Several SPF records","Only one is allowed, so SPF fails. Merge them into the record from step 2.<br>"+spfs.map(esc).join("<br>"));
    else {
      var s = spfs[0];
      var cls = /\+all\b/.test(s) ? "bad" : (/[~-]all\b/.test(s) ? "ok" : "warn");
      var msg = /\+all\b/.test(s) ? "+all lets anyone send as you. Replace it." : (/[~-]all\b/.test(s) ? "" : "No ~all or -all at the end: unlisted senders are not flagged.");
      out += status(cls, cls==="ok" ? "SPF found" : "SPF needs attention", esc(s)+(msg?"<br>"+msg:""));
    }
    if (!dmarcs.length) out += status("bad","No DMARC record","Generate one in step 4 and publish it on _dmarc.");
    else {
      var dm = dmarcs[0], p = (dm.match(/;\s*p=(\w+)/i)||[])[1];
      out += status(p==="none" ? "warn" : "ok", p==="none" ? "DMARC found (monitoring only)" : "DMARC found", esc(dm)+(p==="none"?"<br>p=none does not protect your domain yet: move to quarantine once reports look clean.":""));
    }
    $("r-check").innerHTML = out;
    var detected = [];
    PROVIDERS.forEach(function(p){
      var hit = mx.some(function(h){ return p.mx.test(h); }) || spfs.some(function(s){ return s.toLowerCase().indexOf(p.include)>=0; });
      if (hit) detected.push(p.id);
    });
    document.querySelectorAll("#providers input").forEach(function(i){ i.checked = detected.indexOf(i.value)>=0; });
    $("extra-inc").value = ""; $("extra-ip").value = ""; $("spf-all").value = "~all";
    if (spfs.length===1){
      var known = PROVIDERS.map(function(p){return p.include;});
      var extras = spfs[0].split(/\s+/).slice(1).filter(function(t){ return !/^[~+?-]?all$/i.test(t) && known.indexOf(t.toLowerCase())<0 && !/^(ip4|ip6):/i.test(t); });
      var ips = spfs[0].split(/\s+/).filter(function(t){ return /^(ip4|ip6):/i.test(t); }).map(function(t){ return t.slice(4); });
      if (extras.length) $("extra-inc").value = extras.join(" ");
      if (ips.length) $("extra-ip").value = ips.join(", ");
      if (/\s-all\b/.test(spfs[0])) $("spf-all").value = "-all";
    }
    renderSpf(); renderDmarc();
  } catch(err){
    $("r-check").innerHTML = status("bad","DNS lookup failed","Check your connection and try again. ("+esc(err.message)+")");
  } finally { b.disabled = false; b.textContent = "Check"; }
});

/* Step 3: verify DKIM */
$("f-dkim").addEventListener("submit", async function(e){
  e.preventDefault();
  var d = cleanDomain($("domain").value);
  var sel = ($("selector").value||"").trim().toLowerCase().replace(/\._domainkey.*$/,"");
  if (!d){ $("r-dkim").innerHTML = status("bad","Enter your domain in step 1 first",""); return; }
  if (!/^[a-z0-9._-]+$/.test(sel)){ $("r-dkim").innerHTML = status("bad","Enter a DKIM selector","Your provider shows it in its DKIM settings, for example google or selector1."); return; }
  var b = $("b-dkim"); b.disabled = true; b.textContent = "Checking…";
  var name = sel+"._domainkey."+d;
  try {
    var j = await doh(name,"TXT");
    var cname = (j.Answer||[]).filter(function(a){return a.type===5;}).map(function(a){return a.data;});
    var keys = txtValues(j,16).filter(function(t){ return /(^|;)\s*(v=DKIM1|k=|p=)/i.test(t); });
    if (keys.length){
      var empty = keys.some(function(k){ return /(^|;)\s*p=\s*(;|$)/i.test(k); });
      $("r-dkim").innerHTML = empty ? status("bad","DKIM key revoked","The record exists but its p= value is empty: "+esc(name))
        : status("ok","DKIM record found", esc(name)+(cname.length?"<br>via CNAME "+esc(cname.join(" → ")):"")+"<br>"+esc(keys[0].slice(0,120))+(keys[0].length>120?"…":""));
    } else if (cname.length){
      $("r-dkim").innerHTML = status("warn","CNAME found, key not reachable yet", esc(name)+" → "+esc(cname.join(" → "))+"<br>If you just enabled DKIM, your provider may still be publishing the key.");
    } else {
      $("r-dkim").innerHTML = status("bad","No DKIM record at "+esc(name),"Check the selector name in your provider's DKIM settings, then publish the record it gives you.");
    }
  } catch(err){
    $("r-dkim").innerHTML = status("bad","DNS lookup failed","Try again in a moment. ("+esc(err.message)+")");
  } finally { b.disabled = false; b.textContent = "Verify DKIM"; }
});

renderSpf(); renderDmarc();

/* Prefill from ?d=example.com (links from the guides) */
try {
  var qd = new URLSearchParams(location.search).get("d");
  if (qd && cleanDomain(qd)){
    $("domain").value = cleanDomain(qd);
    $("f-check").requestSubmit ? $("f-check").requestSubmit() : $("b-check").click();
  }
} catch(e){}
})();
