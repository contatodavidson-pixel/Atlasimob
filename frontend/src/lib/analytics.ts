/**
 * Atlas Analytics — centralized tracking
 * PostHog: behavioral analytics, funnels, session recordings
 * GA4: traffic, SEO, conversions
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

// ── PostHog ────────────────────────────────────────────────────────────────
let posthogInstance: import('posthog-js').PostHog | null = null;

export async function initPostHog() {
  if (typeof window === 'undefined') return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;
  const { default: posthog } = await import('posthog-js');
  if (!posthogInstance) {
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
      capture_pageview: false, // manual, para controle fino
      persistence: 'localStorage',
      autocapture: true,
      session_recording: { maskAllInputs: true },
    });
    posthogInstance = posthog;
  }
  return posthogInstance;
}

export function getPostHog() {
  return posthogInstance;
}

// ── GA4 ────────────────────────────────────────────────────────────────────
export function gtagEvent(event: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', event, params);
}

// ── Eventos de negócio ─────────────────────────────────────────────────────
export const track = {
  pageView: (path: string) => {
    posthogInstance?.capture('$pageview', { $current_url: path });
    gtagEvent('page_view', { page_path: path });
  },

  // Aquisição
  waitlistSignup: (email: string, city?: string) => {
    posthogInstance?.capture('waitlist_signup', { email, city });
    gtagEvent('generate_lead', { method: 'waitlist', value: 1 });
  },
  registerStarted: () => {
    posthogInstance?.capture('register_started');
    gtagEvent('begin_checkout');
  },
  registerCompleted: (userId: string) => {
    posthogInstance?.identify(userId);
    posthogInstance?.capture('register_completed', { user_id: userId });
    gtagEvent('sign_up', { method: 'email' });
  },

  // Feed & Deals
  dealViewed: (propertyId: string, tag: string, score: number) => {
    posthogInstance?.capture('deal_viewed', { property_id: propertyId, tag, score });
    gtagEvent('view_item', { item_id: propertyId, item_category: tag });
  },
  dealSaved: (propertyId: string, tag: string) => {
    posthogInstance?.capture('deal_saved', { property_id: propertyId, tag });
    gtagEvent('add_to_wishlist', { item_id: propertyId });
  },
  dealShared: (propertyId: string, platform: string) => {
    posthogInstance?.capture('deal_shared', { property_id: propertyId, platform });
    gtagEvent('share', { method: platform, item_id: propertyId });
  },
  dealOfDayViewed: () => {
    posthogInstance?.capture('deal_of_day_viewed');
    gtagEvent('view_promotion', { promotion_name: 'deal_of_day' });
  },

  // Features de retenção
  feedOpened: () => posthogInstance?.capture('feed_opened'),
  mapOpened: () => posthogInstance?.capture('map_opened'),
  comparadorOpened: () => posthogInstance?.capture('comparador_opened'),
  watchlistOpened: () => posthogInstance?.capture('watchlist_opened'),
  alertConfigured: (type: string) => posthogInstance?.capture('alert_configured', { type }),
  pushPermissionGranted: () => {
    posthogInstance?.capture('push_permission_granted');
    gtagEvent('notification_permission', { status: 'granted' });
  },

  // Conversão
  pricingViewed: (plan: string) => {
    posthogInstance?.capture('pricing_viewed', { plan });
    gtagEvent('view_item', { item_id: plan });
  },
  upgradeClicked: (plan: string) => {
    posthogInstance?.capture('upgrade_clicked', { plan });
    gtagEvent('add_to_cart', { item_id: plan });
  },
};
