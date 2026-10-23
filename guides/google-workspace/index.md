# SPF, DKIM and DMARC for Google Workspace

> Google Workspace SPF, DKIM and DMARC: the exact SPF include, where to generate the DKIM key, the google._domainkey record and DMARC.

URL: https://spfdkimdmarc.com/guides/google-workspace/  
Updated: 2026-10-21

Google Workspace needs three records on your domain: an SPF include, a DKIM key you generate in the Admin console, and a DMARC policy. The whole setup takes about fifteen minutes of work, plus waiting for DNS. The values below come from Google's own documentation.

**On this page**

1. [SPF](#spf)
2. [DKIM](#dkim)
3. [DMARC](#dmarc)
4. [Common problems](#problems)

## 1. . SPF

If Google Workspace is the only service sending mail for your domain, publish this TXT record on the domain itself (host `@`):

```
v=spf1 include:_spf.google.com ~all
```

Google recommends `~all`. If your website, CRM or another tool also sends with your domain, add them to the **same** record rather than creating a second one, for example:

```
v=spf1 include:_spf.google.com ip4:203.0.113.10 ~all
```

If a `v=spf1` record already exists, edit it. Two SPF records make SPF fail. Details in the [SPF guide](https://spfdkimdmarc.com/spf/#one).

## 2. . DKIM

### Generate the key

1. Sign in to the Google Admin console with a super administrator account.
2. Go to **Menu > Apps > Google Workspace > Gmail**, then click **Authenticate email**.
3. Select your domain and click **Generate New Record**.
4. Choose a key length: **2048** if your DNS host supports it, **1024** otherwise.
5. Keep the default prefix selector `google`, unless another DKIM key on your domain already uses that name.
6. Click **Generate**. Do not click Start authentication yet.

### Publish the record

Create a TXT record with:

| Type | TXT |
| --- | --- |
| Host / Name | `google._domainkey` |
| --- | --- |
| Value | `v=DKIM1; k=rsa; p=…` (copy the full value from the Admin console) |
| --- | --- |

Some DNS panels limit TXT record length. If yours refuses the 2048-bit value or cuts it, either split it into several quoted strings in the same record or go back and generate a 1024-bit key.

### Turn on signing

Back on the Authenticate email page, select the domain and click **Start authentication**. The status should change to "Authenticating email with DKIM". Google says it can take up to 48 hours for DKIM authentication to start working.

Verify that the key is published with selector `google` in step 3 of the [checker](https://spfdkimdmarc.com/#check).

## 3. . DMARC

Wait until SPF and DKIM work (Google suggests 48 hours), then publish a monitoring record:

| Type | TXT |
| --- | --- |
| Host / Name | `_dmarc` |
| --- | --- |
| Value | `v=DMARC1; p=none; rua=mailto:dmarc-reports@yourdomain.com` |
| --- | --- |

Use a dedicated mailbox or Google Group for `rua`, not a personal inbox. After a few weeks of clean reports, move to `p=quarantine`, then `p=reject`, as described in the [DMARC rollout](https://spfdkimdmarc.com/dmarc/#rollout).

Google's help page still mentions the `pct` tag for gradual rollout. The current standard, RFC 9989, removed it in favor of `t=y`; see [what changed](https://spfdkimdmarc.com/dmarc/#rfc9989).

## Common problems

### Mail from my website fails DMARC

Contact forms and shop notifications sent by your web server do not go through Google. Either add the server's IP to SPF and make sure the server's envelope sender uses your domain, or better, configure the website to send through Google's SMTP relay or a transactional email service with DKIM on your domain.

### DKIM fails only for some messages

Usually a mailing list, a Google Group forwarding to outside addresses, or a security gateway adding a footer. See [common DKIM failures](https://spfdkimdmarc.com/dkim/#errors).

### The DKIM record is published under the wrong name

Some DNS panels add your domain automatically. If you typed `google._domainkey.example.com`, the record may now live at `google._domainkey.example.com.example.com`. Enter only `google._domainkey`.

Sources: Google Workspace Admin Help, [Set up SPF](https://knowledge.workspace.google.com/admin/security/set-up-spf), [Set up DKIM](https://knowledge.workspace.google.com/admin/security/set-up-dkim), [Set up DMARC](https://knowledge.workspace.google.com/admin/security/set-up-dmarc).

**Check your domain now.** See your current SPF, DKIM and DMARC records and get the exact entries to fix them. Rather not touch DNS? [We can do it for you](https://spfdkimdmarc.com/setup-service/).

## Questions

### Why can't I find the DKIM key in the Admin console?

Google says you may have to wait 24 to 72 hours after turning on Gmail for your organization before the key can be generated. You also need the super administrator role.

### The Admin console says I must update my DNS records, but the record is published.

Google notes this message can stay for up to 48 hours after the key is added. Check the record with the DKIM verifier: if it is found, wait.

### Is the Google Workspace SPF record different for Gmail.com users?

Yes. The include:_spf.google.com record is for Google Workspace on your own domain. A personal @gmail.com address cannot have your SPF, DKIM or DMARC.

## Related

[**SPF, DKIM and DMARC for Microsoft 365**SPF, the two DKIM CNAMEs and the Defender portal.](https://spfdkimdmarc.com/guides/microsoft-365/) [**DKIM explained: selectors, keys and how to check them**Selectors, key length, TXT vs CNAME and common failures.](https://spfdkimdmarc.com/dkim/) [**DMARC record: policies, reports and a safe rollout**Tags, alignment, reports and moving from p=none to reject.](https://spfdkimdmarc.com/dmarc/)
