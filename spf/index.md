# SPF record: syntax, examples and the 10-lookup limit

> How an SPF record works, what each mechanism means, ready-to-use examples, why you can only have one record, and how to stay under the 10 DNS lookup limit.

URL: https://spfdkimdmarc.com/spf/  
Updated: 2026-10-21

SPF (Sender Policy Framework) is a TXT record on your domain that lists the servers allowed to send email for it. When a message arrives, the receiving server looks up that record and checks whether the connecting IP address is on the list. It is the oldest and simplest of the three checks, and also the easiest to break.

**On this page**

1. [What SPF actually checks](#how)
2. [Record syntax](#syntax)
3. [Examples](#examples)
4. [Only one SPF record per domain](#one)
5. [The 10 DNS lookup limit](#lookups)
6. [~all or -all](#all)
7. [Domains that never send email](#nosend)

## What SPF actually checks

SPF does not look at the From address shown in the mail client. It checks the **envelope sender**, also called the Return-Path or MAIL FROM: the address bounces go back to. When you send through a newsletter platform, that envelope address usually belongs to the platform, not to you, so your own SPF record is not even consulted.

This is why SPF alone does not stop spoofing of your visible From address, and why [DMARC](https://spfdkimdmarc.com/dmarc/) exists: it requires the domain that passed SPF (or DKIM) to match the From domain.

## Record syntax

An SPF record is a TXT record published on the domain itself (host `@` in most DNS panels). It starts with `v=spf1`, lists mechanisms, and ends with a rule for everything else.

```
v=spf1 include:_spf.google.com ip4:203.0.113.10 ~all
```

| Mechanism | Meaning | DNS lookup? |
| --- | --- | --- |
| `include:domain` | Also authorize the servers listed in another domain's SPF record. This is how you add a provider. | Yes, plus any lookups inside it |
| `ip4:` / `ip6:` | Authorize an address or a range, for example `ip4:203.0.113.0/24`. | No |
| `a` | Authorize the IP addresses of the domain's A/AAAA records. | Yes |
| `mx` | Authorize the domain's MX servers. | Yes, and more per MX host |
| `exists:` | Advanced macro-based check, rarely needed. | Yes |
| `ptr` | Reverse DNS check. Deprecated by RFC 7208: do not use it. | Yes |
| `redirect=` | Use another domain's SPF record instead of this one. | Yes |
| `all` | Matches everything not matched before. Always last. | No |

Each mechanism can take a qualifier: `+` pass (the default), `-` fail, `~` soft fail, `?` neutral. In practice you only write a qualifier on `all`. Never publish `+all`: it authorizes every server on the internet.

## Examples

### Google Workspace only

```
v=spf1 include:_spf.google.com ~all
```

### Microsoft 365 only

```
v=spf1 include:spf.protection.outlook.com -all
```

### Zoho Mail only

```
v=spf1 include:zohomail.com ~all
```

### OVHcloud email (MX Plan, Email Pro, Exchange)

```
v=spf1 include:mx.ovh.com ~all
```

### Google Workspace plus your own web server

Typical when a website (WordPress, PrestaShop, a Laravel app) sends contact forms or order emails directly from its server:

```
v=spf1 include:_spf.google.com ip4:203.0.113.10 ~all
```

Replace the address with your server's public outgoing IP. Prefer `ip4:` over `a` here: it costs no DNS lookup and does not change silently if the website moves.

The [generator](https://spfdkimdmarc.com/#check) builds the right combination for you from the services you tick.

## Only one SPF record per domain

This is one of the most common SPF mistakes. A domain must publish exactly one TXT record starting with `v=spf1`. When a second provider is added, many people create a second record instead of editing the first one. With two records, receivers return a **PermError** and SPF fails for every message, including the ones that were fine before.

Wrong: two records
`v=spf1 include:_spf.google.com ~all`
`v=spf1 include:mx.ovh.com ~all`

Right: one merged record
`v=spf1 include:_spf.google.com include:mx.ovh.com ~all`

Other TXT records on the same name (Google site verification, Facebook domain verification and so on) are not a problem. Only records starting with `v=spf1` count.

## The 10 DNS lookup limit

To evaluate your record, a receiver may perform at most 10 DNS lookups (RFC 7208, section 4.6.4). The mechanisms that cost a lookup are `include`, `a`, `mx`, `ptr`, `exists` and `redirect`. Lookups inside included records count too: one `include` can cost three or four lookups on its own. Past 10, the result is PermError and SPF fails.

The same section also limits **void lookups** (names that return nothing) to two, so an include pointing at a provider you stopped using years ago can break the record too.

### How to get back under the limit

- Remove services you no longer use. Old CRMs, newsletter tools and helpdesks are frequent leftovers.
- Replace `a` and `mx` with `ip4:` and `ip6:` for servers you control. IP mechanisms cost nothing.
- Check whether a service needs your SPF at all. Many bulk senders use their own envelope domain and rely on DKIM for DMARC alignment, so their include in your record is useless.
- Move a heavy sender to a subdomain, for example `mail.example.com`, with its own SPF record.

"SPF flattening", replacing includes with the IP addresses they resolve to, also reduces lookups, but the provider's IPs change without notice and your record silently goes stale. Only do it with a tool that updates the record automatically.

## ~all or -all

Both mark unlisted servers as unauthorized. `~all` (soft fail) asks receivers to accept the message but treat it as suspicious. `-all` (hard fail) says it should be rejected.

The providers do not agree: Google recommends `~all`, Microsoft recommends `-all`, and OVHcloud strongly recommends `-all` once you are sure the record is complete. A safe path is to start with `~all`, read your DMARC reports for a few weeks to find any sender you forgot, then switch to `-all`. Once DMARC is enforced, the difference matters less: DMARC decides what happens to failing mail.

## Domains that never send email

Parked domains and domains used only for a website are easy targets for spoofing. Tell the world they never send mail:

```
v=spf1 -all
```

Combine it with a DMARC `p=reject` record, described in the [DMARC guide](https://spfdkimdmarc.com/dmarc/#parked).

**Check your domain now.** See your current SPF, DKIM and DMARC records and get the exact entries to fix them. Rather not touch DNS? [We can do it for you](https://spfdkimdmarc.com/setup-service/).

## Questions

### Does SPF protect the From address people see?

Not on its own. SPF checks the envelope sender (the Return-Path), which users never see. DMARC is what links the SPF result to the visible From domain.

### Is there a maximum length for an SPF record?

A single TXT string is limited to 255 characters, but a record can be split into several strings that receivers join together. Most DNS panels do this for you. Keeping the record short also keeps DNS responses small.

### Do subdomains inherit the SPF record?

No. SPF is checked on the exact domain used in the envelope sender. If a service sends from news.example.com, that subdomain needs its own record.

### What does SPF PermError mean?

The record could not be evaluated: usually two SPF records on the same domain, more than 10 DNS lookups, or a syntax error. Receivers treat it as a failure.

## Related

[**DKIM explained: selectors, keys and how to check them**Selectors, key length, TXT vs CNAME and common failures.](https://spfdkimdmarc.com/dkim/) [**DMARC record: policies, reports and a safe rollout**Tags, alignment, reports and moving from p=none to reject.](https://spfdkimdmarc.com/dmarc/) [**SPF, DKIM and DMARC for Google Workspace**SPF include, the google._domainkey key and DMARC.](https://spfdkimdmarc.com/guides/google-workspace/)
