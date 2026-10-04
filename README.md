# @denness/astro-consent

One cookie banner for all the Astro sites: [vanilla-cookieconsent](https://cookieconsent.orestbida.com/) wired to Google Consent Mode v2, for GA4, Google Ads and Microsoft Clarity.

- **Consent Mode v2, advanced.** Everything starts denied. The Google tag still loads and sends cookieless pings, so Google Ads can model conversions from people who decline. A returning visitor's stored choice is applied before the first hit.
- **Separate choices.** "Analytics" covers GA4 and Clarity; "Marketing" covers Google Ads. Only the categories a site actually uses are shown.
- **Equal "Accept all" / "Reject all"**, a "Manage preferences" panel, and a `CookieSettingsLink` to reopen it, which is what the ICO expects.
- **Search-friendly.** A slim fixed bar at the bottom: no layout shift, too small to become the largest element on the page, and it stays a bar on phones instead of a half-screen sheet.
- **View transitions.** Works with `<ClientRouter />`: consent is set up once per visit and the banner survives navigation.
- Nothing runs in `astro dev` unless `enabled` is set, so development sends nothing to Google.

Google only requires a Google-certified CMP for sites that *show* Google ads (AdSense, Ad Manager, AdMob). Sites that only advertise with Google Ads can use this.

## Install

```bash
npm install github:Denness/astro-consent#v1.1.0
```

## Use

In the layout's `<head>`, before anything else that calls `gtag()`:

```astro
---
import { Consent, CookieSettingsLink } from '@denness/astro-consent';
---
<head>
  <Consent gaId="G-XXXXXXXXXX" privacyUrl="/privacy" />
</head>
<body>
  …
  <footer>
    <CookieSettingsLink class="underline" />
  </footer>
</body>
```

| Prop | |
|---|---|
| `gaId` | GA4 measurement id. Adds the "Analytics" choice. |
| `adsId` | Google Ads id (`AW-…`). Adds the "Marketing" choice, `url_passthrough` and `ads_data_redaction`. |
| `clarityId` | Microsoft Clarity project id. Loaded only after "Analytics" consent. |
| `privacyUrl`, `contactUrl` | Linked from the banner and the preferences panel. |
| `revision` | Bump to ask everyone again, e.g. after adding a new tag. |
| `loadTag` | `immediately` (default) or `on-interaction`: wait for the first tap or key press, or 5 seconds after load. Better PageSpeed, but visits that leave within 5 seconds without touching the page aren't counted. |
| `pageViewsOnNavigation` | Send a GA4 `page_view` on view-transition navigations. Only if the GA4 stream's "Page changes based on browser history events" is off. |
| `theme` | vanilla-cookieconsent CSS variables without `--cc-`, e.g. `{ 'btn-primary-bg': '#1d4ed8' }`. |
| `enabled` | Defaults to production builds only. |

Site-specific events (lead forms, call clicks, Ads conversion labels) stay in each site and call `window.gtag` as usual; Consent Mode decides what Google may store.
