# DMARC record: policies, reports and a safe rollout

> What DMARC does, every tag explained, how alignment works, a safe path from p=none to reject, and what changed with RFC 9989.

URL: https://spfdkimdmarc.com/dmarc/  
Updated: 2026-10-21

DMARC (Domain-based Message Authentication, Reporting and Conformance) is the record that makes [SPF](https://spfdkimdmarc.com/spf/) and [DKIM](https://spfdkimdmarc.com/dkim/) actually protect your domain. It does three things: it requires the domain that passed SPF or DKIM to match the From address people see, it tells receivers what to do with mail that fails, and it asks them to send you reports.

**On this page**

1. [The DMARC record](#record)
2. [Alignment, the part people miss](#alignment)
3. [A safe rollout: none, quarantine, reject](#rollout)
4. [Reading DMARC reports](#reports)
5. [What changed with RFC 9989](#rfc9989)
6. [Domains that never send email](#parked)

## The DMARC record

DMARC is a TXT record published on the `_dmarc` subdomain:

```
_dmarc.example.com  TXT  "v=DMARC1; p=none; rua=mailto:dmarc-reports@example.com"
```

| Tag | Meaning |
| --- | --- |
| `v=DMARC1` | Version. Required, and must come first. |
| `p=` | Policy for mail that fails: `none` (monitor only), `quarantine` (spam folder) or `reject` (refuse). Required. |
| `rua=` | Where to send daily aggregate reports, as `mailto:` addresses. Strongly recommended. |
| `ruf=` | Where to send per-message failure reports. Few receivers send them, and they can contain personal data. |
| `sp=` | Policy for subdomains, if different from `p`. |
| `np=` | Policy for subdomains that do not exist. Added by RFC 9989. |
| `adkim=` / `aspf=` | Alignment mode for DKIM and SPF: `r` relaxed (default) or `s` strict. |
| `t=` | Test mode. `t=y` asks receivers to apply the next weaker policy. Added by RFC 9989. |
| `fo=` | When failure reports should be generated. Only useful with `ruf`. |

A domain can have only one DMARC record. Two records on `_dmarc` make receivers ignore DMARC entirely.

## Alignment, the part people miss

DMARC passes when **either** SPF or DKIM passes **and** the domain it validated is aligned with the From domain.

- **SPF alignment:** the envelope sender (Return-Path) domain matches the From domain.
- **DKIM alignment:** the `d=` domain of the signature matches the From domain.

With relaxed alignment, the default, subdomains count as a match: a DKIM signature with `d=mail.example.com` aligns with `From: news@example.com`. With strict alignment they must be identical. Relaxed is what most domains should use.

This is why a message can show `spf=pass` and `dkim=pass` and still fail DMARC: a newsletter platform sending with its own Return-Path and signing with `d=itsplatform.com` passes both checks for *its* domain, not yours. The fix is to set up the platform's custom domain authentication so it signs with your domain.

## A safe rollout: none, quarantine, reject

1. **Prerequisites.** SPF and DKIM are published and working for your main mail provider. Google recommends waiting 48 hours after setting them up before adding DMARC.
2. **Monitor.** Publish `v=DMARC1; p=none; rua=mailto:…`. Nothing changes for delivery. Collect reports for two to four weeks, longer if you send monthly invoices or newsletters, so every sender shows up at least once.
3. **Fix every legitimate source.** Each service listed in the reports that fails alignment needs either an SPF include (if it uses your Return-Path) or, better, DKIM signing with your domain.
4. **Test quarantine.** Publish `p=quarantine; t=y`. Receivers that follow RFC 9989 still treat failures as `none`, but you signal intent and keep receiving reports. Then remove `t=y` so failures go to spam.
5. **Reject.** When reports show only spoofing attempts failing, switch to `p=reject`. Forged mail using your domain is now refused.

Keep the `rua` address after reaching reject: new tools get added to a company over time, and the reports are how you notice a sender that is not authenticated.

The [generator](https://spfdkimdmarc.com/#check) builds the record for each stage.

## Reading DMARC reports

Aggregate reports are XML files, usually compressed, sent once a day by each large receiver (Google, Yahoo, Microsoft and others). Each one lists the IP addresses that sent mail using your domain, how many messages, and whether SPF, DKIM and alignment passed. They contain no message content.

They are not meant to be read by hand. Send them to a dedicated mailbox, not your personal inbox, and use a report analyzer to turn them into a list of senders. Google advises against using your own address for `rua`, because the volume grows quickly.

### Sending reports to another domain

If `rua` points to an address on a different domain (a reporting service, or your agency's domain), that domain must accept the reports by publishing a record. For reports about `example.com` sent to `reports.net`:

```
example.com._report._dmarc.reports.net  TXT  "v=DMARC1"
```

Reporting services do this for you. Without it, receivers do not send the reports.

## What changed with RFC 9989

In May 2026 the IETF published RFC 9989, the updated DMARC standard (often called DMARCbis), together with RFC 9990 for aggregate reports and RFC 9991 for failure reports. It replaces RFC 7489. Existing records keep working and the version stays `v=DMARC1`. The main changes:

- **`pct` is removed.** It used to apply the policy to a percentage of failing mail. It is replaced by `t=y`, a test flag that steps the policy down one level. Note that `t=y` is not the same as the old `pct=0`.
- **`rf` and `ri` are removed.** They were rarely used.
- **`np` is added** to set a policy for non-existent subdomains, a common spoofing trick.
- **The organizational domain is found by walking the DNS tree** instead of relying on the Public Suffix List.

Some receivers still honor `pct` during the transition, so an existing record with it is not broken. For new records, leave it out.

## Domains that never send email

A domain that only hosts a website, or is parked, should say so explicitly. Spammers favor domains with no protection at all. Publish:

```
example.com          TXT  "v=spf1 -all"
_dmarc.example.com   TXT  "v=DMARC1; p=reject"
```

If the domain does not receive mail either, a null MX record (`MX 0 .`, defined in RFC 7505) tells senders not to try.

**Check your domain now.** See your current SPF, DKIM and DMARC records and get the exact entries to fix them. Rather not touch DNS? [We can do it for you](https://spfdkimdmarc.com/setup-service/).

## Questions

### Is p=none enough?

It is enough to meet the Gmail and Yahoo bulk sender requirements, but it does not protect your domain: spoofed mail is still delivered. Treat p=none as a monitoring phase, not a final state.

### Will DMARC break my email?

Not with p=none, which changes nothing about delivery. Problems appear only when you move to quarantine or reject before every legitimate sender passes SPF or DKIM with alignment. Read your reports first.

### Do I need a DMARC record on each subdomain?

No. Subdomains use the policy of the parent domain unless you set a different one with sp= or publish a record on the subdomain itself.

### Should I still use pct=?

RFC 9989 removed pct. Some receivers still honor it during the transition, but new records should use t=y for a test phase instead.

## Related

[**SPF record: syntax, examples and the 10-lookup limit**Syntax, examples, ~all vs -all and the 10-lookup limit.](https://spfdkimdmarc.com/spf/) [**DKIM explained: selectors, keys and how to check them**Selectors, key length, TXT vs CNAME and common failures.](https://spfdkimdmarc.com/dkim/) [**SPF, DKIM and DMARC for Google Workspace**SPF include, the google._domainkey key and DMARC.](https://spfdkimdmarc.com/guides/google-workspace/)
