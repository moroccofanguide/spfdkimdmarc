# About spfdkimdmarc.com

> Who runs spfdkimdmarc.com, how the checker works and where the provider values come from.

URL: https://spfdkimdmarc.com/about/  
Updated: 2026-10-21

spfdkimdmarc.com is a free tool to check and fix the three DNS records that decide whether your email is trusted: SPF, DKIM and DMARC.

## Who is behind it

I'm a Linux systems engineer with more than ten years of experience running servers, DNS and email for agencies and their clients, across a fleet of over a hundred servers. I built this site because the same questions keep coming back: duplicate SPF records, website mail failing DMARC, DKIM keys published under the wrong name. The guides answer them the way I would explain them to a client.

## How the checker works

The checker runs entirely in your browser. It reads your public DNS records through DNS-over-HTTPS (Cloudflare's resolver, with Google Public DNS as a fallback) and builds the records from the options you choose. There is no account, no server-side processing and nothing is stored.

## Where the values come from

Every provider value (SPF includes, DKIM selectors, console paths) is taken from that provider's official documentation, linked at the bottom of each guide. Providers change their interfaces from time to time: if something on this site no longer matches what you see, trust your provider's admin console.

## How the guides are written

I use research and AI tools to draft faster, then every value is checked against the provider's official documentation and the relevant RFCs before publication. Every page lists the documentation it relies on and shows the date of its last update.

When a provider changes its interface or its recommended values, I update the page and its date. If you spot something out of date, write to me at [help@spfdkimdmarc.com](mailto:help@spfdkimdmarc.com).

## Independence

This site is independent and is not affiliated with Google, Microsoft, Zoho, OVHcloud or any email provider. Product names belong to their owners.
