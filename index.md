# SPF, DKIM & DMARC checker and record generator

> Check your domain's SPF, DKIM and DMARC records and get the exact DNS entries for Google Workspace, Microsoft 365, Zoho Mail or OVHcloud. Free.

URL: https://spfdkimdmarc.com/  
Updated: 2026-10-18

## 1. Check your domain

Enter your domain to read its MX, SPF and DMARC records, then get the exact DNS entries to fix them. Everything runs in your browser: nothing is stored.

## 2. Generate your SPF record

Tick every service that sends email with your domain in the From address. Detected providers are pre-selected after a check.

Other services (optional)

Your own servers' IPs (optional)

Policy for everything else

## 3. Set up and verify DKIM

DKIM keys are created by your email provider, not by you. Follow the steps for each service, then check the record is published.

## 4. Generate your DMARC record

Start with `p=none` to monitor, then move to `quarantine` and `reject` once SPF and DKIM pass for all your senders.

Policy

Where to send aggregate reports (optional)

## What these three records do

Email was designed without any proof of who sent a message. SPF, DKIM and DMARC are three DNS records that add that proof. Receiving servers such as Gmail and Outlook read them on every message to decide whether it is genuine, suspicious or forged.

[**SPF**A list of the servers allowed to send mail for your domain. Published as one TXT record on the domain itself.](https://spfdkimdmarc.com/spf/) [**DKIM**A cryptographic signature added to each message. The public key lives in DNS under a selector.](https://spfdkimdmarc.com/dkim/) [**DMARC**Ties SPF and DKIM to the From address, tells receivers what to do with failures, and sends you reports.](https://spfdkimdmarc.com/dmarc/)

Since February 2024, Gmail and Yahoo require SPF or DKIM from every sender, and SPF, DKIM and a DMARC record from anyone sending more than 5,000 messages a day. Microsoft announced comparable rules for Outlook.com addresses in 2025. Mail that fails these checks is sent to spam or rejected.

## Step-by-step guides by provider

Where to click, which records to publish and what usually goes wrong.

[**Google Workspace**SPF include, the google._domainkey key and DMARC.](https://spfdkimdmarc.com/guides/google-workspace/) [**Microsoft 365**SPF, the two DKIM CNAMEs and the Defender portal.](https://spfdkimdmarc.com/guides/microsoft-365/) [**Zoho Mail**SPF, adding and verifying a DKIM selector.](https://spfdkimdmarc.com/guides/zoho-mail/) [**OVHcloud**MX Plan, Email Pro and Exchange: SPF and DKIM.](https://spfdkimdmarc.com/guides/ovhcloud/)

## Questions

### Can I have two SPF records?

No. A domain must publish a single TXT record starting with `v=spf1`. Two records make SPF fail with a permanent error. Merge every service into one record, as the generator does. [More on SPF](https://spfdkimdmarc.com/spf/).

### Why is my email still going to spam?

SPF, DKIM and DMARC prove that mail really comes from you, but content, sending reputation, complaint rates and blocklists also matter. Fix authentication first, then look at the rest.

### ~all or -all?

Google recommends `~all`, Microsoft recommends `-all`. Start with `~all`, and switch to `-all` once you are sure every legitimate sender is in the record.

### Do I need all three?

Yes, if you send any volume. Gmail and Yahoo require SPF and DKIM plus a DMARC record from senders of more than 5,000 messages a day, and even small senders get better delivery with all three in place.

### Where do I find my DKIM selector?

Open a message you sent, view its original headers, and look for the `s=` value in the `DKIM-Signature` header. Google Workspace uses `google` by default and Microsoft 365 uses `selector1` and `selector2`.

### How long until DNS changes are visible?

Usually minutes, sometimes a few hours depending on the record's TTL. Run the check again later if a new record does not show up yet.
