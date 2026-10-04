export interface ConsentProps {
  /** GA4 measurement id, e.g. `G-XXXXXXXXXX`. Asks for "Analytics" consent. */
  gaId?: string;
  /** Google Ads id, e.g. `AW-123456789`. Asks for "Marketing" consent. */
  adsId?: string;
  /** Microsoft Clarity project id. Loaded only after "Analytics" consent. */
  clarityId?: string;
  /** Linked from the banner and the preferences panel. Leave out if the site has no privacy page. */
  privacyUrl?: string;
  /** Linked from the preferences panel as the place to ask about cookies. */
  contactUrl?: string;
  /** Bump to ask everyone again, e.g. after adding a new tag. */
  revision?: number;
  /**
   * Send a GA4 page_view on Astro view-transition navigations (`astro:page-load`).
   * Only for sites using `<ClientRouter />` whose GA4 stream has "Page changes based on
   * browser history events" switched off; otherwise GA4 already counts them.
   */
  pageViewsOnNavigation?: boolean;
  /** Banner colours etc. Keys are vanilla-cookieconsent CSS variables without `--cc-`, e.g. `{ 'btn-primary-bg': '#1d4ed8' }`. */
  theme?: Record<string, string>;
  /** Defaults to production builds only, so dev and test runs send nothing to Google. */
  enabled?: boolean;
}

/** What the browser script needs; serialised into the page as JSON. */
export interface ClientConfig {
  analytics: boolean;
  marketing: boolean;
  services: { ga: boolean; ads: boolean; clarity: boolean };
  privacyUrl?: string;
  contactUrl?: string;
  revision: number;
}
