'use client';
import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { initPostHog, track } from '@/lib/analytics';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    initPostHog();
  }, []);

  useEffect(() => {
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
    track.pageView(url);
  }, [pathname, searchParams]);

  return null;
}

export default function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Google Analytics 4 */}
      {GA_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}', {
                page_path: window.location.pathname,
                anonymize_ip: true,
                cookie_flags: 'SameSite=None;Secure'
              });
            `}
          </Script>
        </>
      )}

      {/* PostHog page tracker — wrapped in Suspense for useSearchParams */}
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>

      {children}
    </>
  );
}
