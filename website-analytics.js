/* Public website analytics: Google loads only after a visitor accepts. */
(() => {
  'use strict';
  const config = document.currentScript.dataset;
  const id = config.measurementId;
  const hosts = (config.hosts || '').split(',');
  if (!/^G-[A-Z0-9]+$/.test(id || '') || !hosts.includes(location.hostname)) return;
  const key = 'naxos_analytics_consent_v1';
  let enabled = false;
  let loaded = false;
  let panel;
  function saved() {
    try { const value = JSON.parse(localStorage.getItem(key)); return value && Date.now() - value.at < 180*86400000 ? value.choice : null; } catch (_) { return null; }
  }
  function cleanUrl(raw, campaigns) {
    try {
      const u = new URL(raw);
      const out = new URL(u.origin + u.pathname);
      if (campaigns) ['utm_source','utm_medium','utm_campaign','utm_content','utm_term'].forEach(k => {
        const v = u.searchParams.get(k); if (v) out.searchParams.set(k, v.slice(0,150));
      });
      return out.href;
    } catch (_) { return ''; }
  }
  window.dataLayer = window.dataLayer || [];
  function tag() { window.dataLayer.push(arguments); }
  tag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
  function start() {
    enabled = true;
    window['ga-disable-' + id] = false;
    tag('consent','update',{analytics_storage:'granted'});
    if (loaded) return;
    loaded = true;
    tag('js',new Date());
    tag('config',id,{allow_google_signals:false,allow_ad_personalization_signals:false,
      cookie_domain:location.hostname,page_location:cleanUrl(location.href,true),page_referrer:cleanUrl(document.referrer,false)});
    const script = document.createElement('script');
    script.async = true; script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
    document.head.appendChild(script);
  }
  function choose(choice) {
    try { localStorage.setItem(key,JSON.stringify({choice,at:Date.now()})); } catch (_) {}
    if (choice === 'yes') start();
    else {
      enabled = false; window['ga-disable-' + id] = true;
      tag('consent','update',{analytics_storage:'denied'});
      document.cookie.split(';').forEach(part => {
        const name = part.trim().split('=')[0];
        if (name === '_ga' || name.startsWith('_ga_')) {
          document.cookie = name + '=; Max-Age=0; path=/';
          document.cookie = name + '=; Max-Age=0; path=/; domain=' + location.hostname;
        }
      });
    }
    panel.hidden = true;
  }
  function setup() {
    const style = document.createElement('style');
    style.textContent = '#naxos-analytics-choice{position:fixed;bottom:18px;left:18px;right:18px;max-width:520px;padding:20px;background:#fff;color:#222;border:1px solid #ddd;border-radius:12px;box-shadow:0 6px 30px #0003;z-index:99999;font:14px/1.5 system-ui,sans-serif}#naxos-analytics-choice[hidden]{display:none}#naxos-analytics-choice p{margin:0 0 12px;color:#222}#naxos-analytics-choice a{color:#305b92;text-decoration:underline}#naxos-analytics-choice button{font:inherit;padding:8px 16px;margin:0 8px 0 0;border:1px solid #555;border-radius:6px;background:#fff;color:#222;cursor:pointer}#naxos-analytics-settings{display:block;margin:16px auto;padding:6px 12px;font:12px system-ui,sans-serif;background:transparent;border:1px solid currentColor;color:inherit;cursor:pointer}';
    document.head.appendChild(style);
    panel = document.createElement('section'); panel.id = 'naxos-analytics-choice'; panel.setAttribute('aria-label','Analytics preferences');
    panel.innerHTML = '<p><strong>Website analytics</strong></p><p>With your permission, Google Analytics uses cookies to measure visits, traffic sources and interactions. You can decline or change your choice at any time. Advertising personalization is disabled.</p><p><a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener">How Google uses data</a></p><button type="button" data-choice="yes">Accept analytics</button><button type="button" data-choice="no">Decline</button>';
    panel.querySelectorAll('button').forEach(button => button.addEventListener('click',() => choose(button.dataset.choice)));
    document.body.appendChild(panel);
    const settings = document.createElement('button'); settings.type='button'; settings.id='naxos-analytics-settings'; settings.textContent='Analytics preferences';
    settings.addEventListener('click',() => {panel.hidden=false; panel.querySelector('button').focus();});
    (document.querySelector('footer') || document.body).appendChild(settings);
    const choice = saved(); panel.hidden=!!choice; if (choice==='yes') start();
    document.addEventListener('click',event => {
      if (!enabled) return;
      const anchor = event.target.closest('a[href]'); if (!anchor) return;
      const url = new URL(anchor.href,location.href);
      const kind = url.protocol==='tel:' ? 'phone' : url.hostname==='book.bouchon-wine-bar.com' ? 'reservation' : url.hostname==='t.me' ? 'telegram' : null;
      if (kind) tag('event','contact_click',{contact_method:kind,transport_type:'beacon'});
    });
  }
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',setup,{once:true}); else setup();
})();
