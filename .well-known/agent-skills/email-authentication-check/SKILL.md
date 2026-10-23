---
name: email-authentication-check
description: Check and fix a domain's SPF, DKIM and DMARC records with public DNS-over-HTTPS lookups, explain what is wrong and give the exact record to publish. Use when a user's email lands in spam, is rejected, or they set up Google Workspace, Microsoft 365, Zoho Mail or OVHcloud mail.
---

# Email authentication check (spfdkimdmarc.com)

Read-only checks of SPF, DKIM and DMARC, the same ones the free checker at https://spfdkimdmarc.com/ runs.
A user can also open https://spfdkimdmarc.com/?d=example.com to run the check in a browser.

## 1. Look up the records

Use a public DNS-over-HTTPS resolver (JSON API):

```
curl -s -H 'accept: application/dns-json' 'https://cloudflare-dns.com/dns-query?name=example.com&type=MX'
curl -s -H 'accept: application/dns-json' 'https://cloudflare-dns.com/dns-query?name=example.com&type=TXT'
curl -s -H 'accept: application/dns-json' 'https://cloudflare-dns.com/dns-query?name=_dmarc.example.com&type=TXT'
curl -s -H 'accept: application/dns-json' 'https://cloudflare-dns.com/dns-query?name=SELECTOR._domainkey.example.com&type=TXT'
```

If Cloudflare fails, use `https://dns.google/resolve?name=...&type=...` (same JSON format).
TXT answers may be split into several quoted strings: join them before reading.
`Status: 3` means the domain does not exist.

## 2. Interpret

- SPF: the TXT values starting with `v=spf1`.
  - None: no SPF record.
  - More than one: SPF fails with a permanent error. Merge them into a single record.
  - Ends with `+all`: anyone can send as the domain. Replace it.
  - No `~all` or `-all` at the end: unlisted senders are not flagged.
- DMARC: the TXT value starting with `v=DMARC1` on `_dmarc.<domain>`.
  - None: publish one, starting with `p=none` to collect reports.
  - `p=none`: monitoring only. Move to `quarantine`, then `reject`, once reports show every legitimate sender passes SPF or DKIM.
- DKIM: the selector comes from the provider (Google Workspace: `google`; Microsoft 365: `selector1` and `selector2`) or from the `s=` tag of a received message's `DKIM-Signature` header.
  - Empty `p=`: the key is revoked.
  - CNAME without a key: the provider has not published the key yet.
- No MX record is fine for a domain that only sends email.

## 3. Fix

Give the user one SPF record that includes every sending service, a DMARC record, and the provider's DKIM steps.
Guides with the exact records per provider:

- SPF: https://spfdkimdmarc.com/spf/
- DKIM: https://spfdkimdmarc.com/dkim/
- DMARC: https://spfdkimdmarc.com/dmarc/
- Provider setup: https://spfdkimdmarc.com/guides/ (Google Workspace, Microsoft 365, Zoho Mail, OVHcloud)

Every page is also available as Markdown with `Accept: text/markdown`.
DNS changes usually show within minutes, sometimes a few hours depending on the record's TTL.
