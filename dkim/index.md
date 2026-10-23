# DKIM explained: selectors, keys and how to check them

> How DKIM signing works, how to find your selector, TXT vs CNAME records, 1024 vs 2048-bit keys, and fixes for common DKIM failures.

URL: https://spfdkimdmarc.com/dkim/  
Updated: 2026-10-21

DKIM (DomainKeys Identified Mail) adds a digital signature to every message you send. Your provider signs with a private key it keeps secret, and publishes the matching public key in your DNS. The receiving server fetches that key, verifies the signature, and knows two things: the message really was authorized by your domain, and it was not modified on the way.

**On this page**

1. [How a DKIM signature works](#how)
2. [Selectors and how to find yours](#selector)
3. [The DNS record: TXT or CNAME](#record)
4. [1024 or 2048-bit keys](#keys)
5. [Third-party senders](#thirdparty)
6. [Common DKIM failures](#errors)

## How a DKIM signature works

Each signed message carries a `DKIM-Signature` header. Two of its tags matter to you:

- `d=` is the signing domain, for example `d=example.com`.
- `s=` is the selector, for example `s=google`.

The receiver combines them to find the public key at `selector._domainkey.domain`, here `google._domainkey.example.com`. If the key is there and the signature matches, DKIM passes.

Unlike [SPF](https://spfdkimdmarc.com/spf/), DKIM survives forwarding, because the signature travels with the message. That makes it the more reliable of the two for [DMARC](https://spfdkimdmarc.com/dmarc/).

## Selectors and how to find yours

A selector is just a name that lets one domain hold several keys. Common defaults:

| Provider | Selector | Record type |
| --- | --- | --- |
| Google Workspace | `google` (default prefix) | TXT |
| Microsoft 365 | `selector1` and `selector2` | CNAME |
| Zoho Mail | The name you choose, for example `zoho` | TXT |
| OVHcloud MX Plan | `ovhmo…-selector1` and `-selector2` | CNAME |

If you are not sure, read it from a real message. Send an email from your domain to a Gmail address, open it, choose **Show original**, and find the `DKIM-Signature` header. The value after `s=` is your selector. The same page shows `dkim=pass` or `dkim=fail` in the Authentication-Results header.

Then check it with the [DKIM verifier](https://spfdkimdmarc.com/#check) in step 3 of the checker.

## The DNS record: TXT or CNAME

A DKIM public key is a TXT record:

```
google._domainkey.example.com  TXT  "v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA..."
```

`v=DKIM1` is the version, `k=rsa` the key type and `p=` the public key itself. A record with an empty `p=` means the key has been revoked.

Some providers ask for a **CNAME** instead. Microsoft 365 and OVHcloud do this: your `selector1._domainkey` points to a name they control, and they publish the actual key there. The advantage is that they can rotate keys without you touching your DNS. The DKIM verifier on this site follows those CNAMEs automatically.

### Long keys and the 255-character limit

A 2048-bit key is longer than the 255 characters allowed in one TXT string. The record must then be split into several quoted strings in the same record, which receivers join together. Most DNS panels split automatically. Older ones sometimes cut the key or refuse it: if verification fails right after publishing a 2048-bit key, compare the published value with the original character by character.

## 1. 024 or 2048-bit keys

RFC 8301 requires at least 1024 bits and recommends 2048. Gmail requires a DKIM key of at least 1024 bits for mail sent to personal Gmail accounts. Use 2048 whenever your DNS host accepts it. Choose 1024 only if your DNS panel cannot store the longer record, and plan to switch later.

## Third-party senders

Newsletter tools, CRMs, invoicing and helpdesk software usually sign with **their own** domain by default (`d=theirplatform.com`). DKIM passes, but it does not help your DMARC, because the signing domain is not yours. Look for a "custom domain", "domain authentication" or "sender authentication" setting in each tool: it gives you DNS records (often CNAMEs) so it can sign with `d=yourdomain.com`.

## Common DKIM failures

### No key found

The receiver could not find a record at `selector._domainkey.domain`. Check the selector spelling, check that you did not publish the record as `selector._domainkey.example.com.example.com` (some panels add the domain automatically), and wait for DNS propagation.

### Body hash did not verify

The message was changed after it was signed. Typical causes: a mailing list or security gateway adding a footer, a disclaimer or signature appended by a server after the provider signed, or a forwarding service rewriting content. The fix is to make those changes before signing, or to have the last hop sign the message.

### Signature verification failed

The key in DNS does not match the private key used for signing. This happens when a key was regenerated in the provider console but the old DNS record is still published, or when a long key was truncated by the DNS panel.

### DKIM enabled in DNS but messages are not signed

Publishing the record is only half the job. Google Workspace needs **Start authentication**, Microsoft 365 needs signing enabled in the Defender portal, and Zoho needs the selector verified and enabled. See the [provider guides](https://spfdkimdmarc.com/guides/).

**Check your domain now.** See your current SPF, DKIM and DMARC records and get the exact entries to fix them. Rather not touch DNS? [We can do it for you](https://spfdkimdmarc.com/setup-service/).

## Questions

### Can I create a DKIM key myself?

Only if you run the mail server yourself. With a hosted provider (Google Workspace, Microsoft 365, Zoho, OVHcloud), the provider holds the private key and gives you the public record to publish. A key you generate elsewhere is useless to them.

### Can a domain have several DKIM records?

Yes, one per selector. Each sending service uses its own selector, so Google, a newsletter tool and a helpdesk can all sign for the same domain without conflict.

### Does DKIM encrypt my email?

No. DKIM signs the message so receivers can verify where it comes from and that it was not altered. The content is not hidden.

### How often should I rotate DKIM keys?

There is no fixed rule. Microsoft 365 provides two selectors so you can rotate without downtime. Rotating at least once a year, and immediately if you suspect a key was exposed, is a reasonable practice.

## Related

[**SPF record: syntax, examples and the 10-lookup limit**Syntax, examples, ~all vs -all and the 10-lookup limit.](https://spfdkimdmarc.com/spf/) [**DMARC record: policies, reports and a safe rollout**Tags, alignment, reports and moving from p=none to reject.](https://spfdkimdmarc.com/dmarc/) [**SPF, DKIM and DMARC for Microsoft 365**SPF, the two DKIM CNAMEs and the Defender portal.](https://spfdkimdmarc.com/guides/microsoft-365/)
