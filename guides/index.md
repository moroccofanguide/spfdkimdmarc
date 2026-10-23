# Email authentication setup guides

> Step-by-step SPF, DKIM and DMARC setup guides for Google Workspace, Microsoft 365, Zoho Mail and OVHcloud, with the exact DNS records to publish.

URL: https://spfdkimdmarc.com/guides/  
Updated: 2026-10-18

Each guide gives the exact records for one provider, where to click in its admin console, and the problems that usually come up. Values are taken from the provider's official documentation.

## By provider

[**Google Workspace**SPF include, the google._domainkey key and DMARC.](https://spfdkimdmarc.com/guides/google-workspace/) [**Microsoft 365**SPF, the two DKIM CNAMEs and the Defender portal.](https://spfdkimdmarc.com/guides/microsoft-365/) [**Zoho Mail**SPF, adding and verifying a DKIM selector.](https://spfdkimdmarc.com/guides/zoho-mail/) [**OVHcloud**MX Plan, Email Pro and Exchange: SPF and DKIM.](https://spfdkimdmarc.com/guides/ovhcloud/)

## How each record works

[**SPF**Syntax, examples, ~all vs -all and the 10-lookup limit.](https://spfdkimdmarc.com/spf/) [**DKIM**Selectors, key length, TXT vs CNAME and common failures.](https://spfdkimdmarc.com/dkim/) [**DMARC**Tags, alignment, reports and moving from p=none to reject.](https://spfdkimdmarc.com/dmarc/)

**Check your domain now.** See your current SPF, DKIM and DMARC records and get the exact entries to fix them. Rather not touch DNS? [We can do it for you](https://spfdkimdmarc.com/setup-service/).
