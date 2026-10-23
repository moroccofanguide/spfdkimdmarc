# SPF, DKIM and DMARC for OVHcloud email

> OVHcloud MX Plan, Email Pro and Exchange: the mx.ovh.com SPF include, enabling DKIM, the CNAME records and DMARC.

URL: https://spfdkimdmarc.com/guides/ovhcloud/  
Updated: 2026-10-21

OVHcloud offers several email services on the same domain: MX Plan (included with web hosting), Email Pro, Hosted Exchange and Private Exchange. SPF uses one include for the shared offers, and DKIM is enabled from the Control Panel. The details below follow the OVHcloud documentation.

**On this page**

1. [SPF](#spf)
2. [DKIM](#dkim)
3. [DMARC](#dmarc)
4. [Common problems](#problems)

## 1. . SPF

For MX Plan, Email Pro and Hosted Exchange, OVHcloud uses:

```
v=spf1 include:mx.ovh.com ~all
```

In the OVHcloud DNS zone editor, the SPF form has an option to include OVHcloud email servers that produces exactly this record. OVHcloud strongly recommends `-all` once you are certain every legitimate sender is listed.

Private Exchange does not use the shared servers: its record lists the server's own addresses with `ip4:` and `ip6:`, as shown in your Exchange service.

If your domain also has Google Workspace or another provider, merge everything into one record. Two SPF records on the same domain is a frequent leftover when a domain moves away from MX Plan.

## 2. . DKIM

OVHcloud supports DKIM on MX Plan, Email Pro, Exchange, Private Exchange and Zimbra. When the DNS zone is managed in the same OVHcloud Control Panel, the DKIM configuration is proposed and done by default. Otherwise, enable it as follows.

### MX Plan

1. In the OVHcloud Control Panel, go to **Web Cloud > Domain names** and select the domain.
2. In the **General information** tab, click the red **DKIM** badge, then **Validate**.

### Email Pro and Exchange

1. Open your Email Pro service, or **Microsoft > Exchange** and your service.
2. Open the **Associated domains** tab, click the red **DKIM** badge for your domain, then **Validate**.

For Zimbra, the DKIM steps are under **Zimbra Mail > Domain**, then the menu next to the domain, **Diagnostics > DKIM**.

### The records

OVHcloud publishes two CNAME records. Their names depend on the offer (`ovhmo…` for MX Plan, `ovhex…` for Exchange, `ovhemp…` for Email Pro) and look like this:

```
ovhmo3456789-selector1._domainkey  CNAME  ovhmo3456789-selector1._domainkey.123403.aj.dkim.mail.ovh.net.
ovhmo3456789-selector2._domainkey  CNAME  ovhmo3456789-selector2._domainkey.123403.aj.dkim.mail.ovh.net.
```

The numbers are specific to your service: copy the values shown in the Control Panel. If your DNS is hosted outside OVHcloud (Cloudflare, your registrar), add both CNAMEs there. Activation takes between 30 minutes and 24 hours.

To check it, use the selector part before `._domainkey`, for example `ovhmo3456789-selector1`, in step 3 of the [checker](https://spfdkimdmarc.com/#check).

## 3. . DMARC

| Type | TXT |
| --- | --- |
| Host / Name | `_dmarc` |
| --- | --- |
| Value | `v=DMARC1; p=none; rua=mailto:dmarc-reports@yourdomain.com` |
| --- | --- |

In the OVHcloud DNS zone, add it as a TXT record on the `_dmarc` subdomain. Then follow the [rollout](https://spfdkimdmarc.com/dmarc/#rollout) to `quarantine` and `reject`.

## Common problems

### Website mail fails SPF

Contact forms and CMS notifications sent with PHP `mail()` from a web hosting plan may not leave through the servers covered by `mx.ovh.com`. Configure the website (an SMTP plugin for WordPress, the mailer settings in PrestaShop or Laravel) to send through an authenticated mailbox instead.

### The DKIM badge stays red

If the DNS zone is not at OVHcloud, the CNAMEs must be added manually at your DNS host. With Cloudflare, keep them in DNS-only mode, not proxied.

Sources: OVHcloud documentation, [Configure an SPF record](https://docs.ovhcloud.com/en/guides/web-cloud/domains/dns-zone-spf) and [Configure DKIM](https://docs.ovhcloud.com/en/guides/web-cloud/domains/dns-zone-dkim).

**Check your domain now.** See your current SPF, DKIM and DMARC records and get the exact entries to fix them. Rather not touch DNS? [We can do it for you](https://spfdkimdmarc.com/setup-service/).

## Questions

### Is DKIM configured automatically at OVHcloud?

When the domain's DNS zone is managed in the same OVHcloud account as the email service, OVHcloud proposes and performs the DKIM configuration by default. If your DNS is elsewhere, you add the two CNAME records yourself.

### Which SPF include covers Private Exchange?

Private Exchange uses its own server addresses, so OVHcloud documents ip4 and ip6 entries for it instead. Add include:mx.ovh.com only if you also use a shared offer.

### What about mail sent by my OVHcloud web hosting?

Scripts on a web hosting plan (contact forms, WordPress notifications) do not necessarily use the same servers as your mailboxes. The most reliable fix is to make the website send through an authenticated mailbox over SMTP.

## Related

[**SPF, DKIM and DMARC for Microsoft 365**SPF, the two DKIM CNAMEs and the Defender portal.](https://spfdkimdmarc.com/guides/microsoft-365/) [**SPF record: syntax, examples and the 10-lookup limit**Syntax, examples, ~all vs -all and the 10-lookup limit.](https://spfdkimdmarc.com/spf/) [**DKIM explained: selectors, keys and how to check them**Selectors, key length, TXT vs CNAME and common failures.](https://spfdkimdmarc.com/dkim/)
