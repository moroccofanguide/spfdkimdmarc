# SPF, DKIM and DMARC for Microsoft 365

> Microsoft 365 SPF, DKIM and DMARC: the SPF include, the two DKIM CNAME records, where to enable signing in Defender, and DMARC.

URL: https://spfdkimdmarc.com/guides/microsoft-365/  
Updated: 2026-10-21

Microsoft 365 handles DKIM differently from most providers: instead of a TXT key, you publish two CNAME records that point to keys Microsoft manages. The steps below follow Microsoft's documentation for Exchange Online and Defender for Office 365.

**On this page**

1. [SPF](#spf)
2. [DKIM](#dkim)
3. [DMARC](#dmarc)
4. [Common problems](#problems)

## 1. . SPF

For a custom domain that sends only through Microsoft 365 (commercial and GCC), publish on the domain itself:

```
v=spf1 include:spf.protection.outlook.com -all
```

Microsoft recommends `-all` for domains that also use DKIM and DMARC. If other services send with your domain, add them to this same record. Microsoft notes that fewer than 10 includes does not guarantee fewer than 10 DNS lookups, because includes can contain nested lookups: see the [10-lookup limit](https://spfdkimdmarc.com/spf/#lookups).

Other clouds use other values: `include:spf.protection.office365.us` for GCC High and DoD, `include:spf.protection.partner.outlook.cn` for Microsoft 365 operated by 21Vianet.

## 2. . DKIM

### Get the two CNAME records

1. Open the Microsoft Defender portal at `security.microsoft.com`.
2. Go to **Email & collaboration > Policies & rules > Threat policies > Email authentication settings** and open the **DKIM** tab.
3. Select your custom domain. The details pane shows the two CNAME records to publish.

They look like one of these two formats. Always copy the exact values shown for your domain.

**New format** (custom domains added since May 2025):

```
selector1._domainkey  CNAME  selector1-example-com._domainkey.contoso.n-v1.dkim.mail.microsoft
selector2._domainkey  CNAME  selector2-example-com._domainkey.contoso.n-v1.dkim.mail.microsoft
```

**Older format** (existing domains):

```
selector1._domainkey  CNAME  selector1-example-com._domainkey.contoso.onmicrosoft.com
selector2._domainkey  CNAME  selector2-example-com._domainkey.contoso.onmicrosoft.com
```

Here `example-com` is your domain with dots replaced by dashes, and `contoso` is your tenant's initial domain prefix. In the new format, the letter before `-v1` is assigned by Microsoft. Microsoft states that the two formats cannot coexist for the same selector.

### Enable signing

Once the CNAMEs are published, return to the DKIM tab, select the domain and turn on **Sign messages for this domain with DKIM signatures**. If the portal reports that the CNAME records are missing, wait for DNS propagation and try again.

In Exchange Online PowerShell, the same configuration is managed with `Get-DkimSigningConfig`, `New-DkimSigningConfig` and `Set-DkimSigningConfig`. Keys are 1024 bits by default; 2048 is available, and `Rotate-DkimSigningConfig` switches between the two selectors.

Check the result with selector `selector1` in step 3 of the [checker](https://spfdkimdmarc.com/#check): it follows the CNAME to Microsoft's key.

## 3. . DMARC

Publish a monitoring record first:

| Type | TXT |
| --- | --- |
| Host / Name | `_dmarc` |
| --- | --- |
| Value | `v=DMARC1; p=none; rua=mailto:dmarc-reports@yourdomain.com` |
| --- | --- |

Then follow the [rollout](https://spfdkimdmarc.com/dmarc/#rollout) to `quarantine` and `reject`. Microsoft also applies requirements to high-volume senders delivering to Outlook.com, Hotmail and Live addresses, so this matters even if your own users are on Microsoft 365.

## Common problems

### "CNAME record does not exist" in the portal

The records are not visible yet, or were published under the wrong name. Some DNS panels append the domain automatically, so enter only `selector1._domainkey` as the host. If your DNS is behind Cloudflare, keep these records in DNS-only mode.

### Hybrid or third-party gateway breaks DKIM

If outgoing mail passes through an on-premises Exchange server or a filtering gateway that modifies messages after Microsoft signs them, the signature breaks. See [body hash did not verify](https://spfdkimdmarc.com/dkim/#errors).

Sources: Microsoft Learn, [Set up SPF](https://learn.microsoft.com/en-us/defender-office-365/email-authentication-spf-configure) and [Set up DKIM](https://learn.microsoft.com/en-us/defender-office-365/email-authentication-dkim-configure) for Microsoft 365.

**Check your domain now.** See your current SPF, DKIM and DMARC records and get the exact entries to fix them. Rather not touch DNS? [We can do it for you](https://spfdkimdmarc.com/setup-service/).

## Questions

### Do I need to do anything for my onmicrosoft.com domain?

No. Microsoft manages SPF and DKIM for the initial onmicrosoft.com domain. These steps are for each custom domain you add.

### Why does Microsoft recommend -all?

Microsoft explains that DMARC can effectively ignore an SPF ~all failure when a message has no DKIM signature, so it recommends -all for domains that also use DKIM and DMARC.

### Can I build the CNAME values myself?

Microsoft advises against it. Copy the exact values from the Defender portal or from Get-DkimSigningConfig, because the new format contains a partition letter assigned by Microsoft.

## Related

[**SPF, DKIM and DMARC for Google Workspace**SPF include, the google._domainkey key and DMARC.](https://spfdkimdmarc.com/guides/google-workspace/) [**DKIM explained: selectors, keys and how to check them**Selectors, key length, TXT vs CNAME and common failures.](https://spfdkimdmarc.com/dkim/) [**DMARC record: policies, reports and a safe rollout**Tags, alignment, reports and moving from p=none to reject.](https://spfdkimdmarc.com/dmarc/)
