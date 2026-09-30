import { GTM_CONTAINER_ID } from "@/constants/gtm";

/**
 * Official Google Tag Manager container snippet.
 * Google checks the raw HTML: this function must sit in <head>, and the
 * noscript iframe must be the first thing inside <body>.
 * next/script rewrites the snippet and fails that check.
 */
const GTM_HEAD_SCRIPT = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_CONTAINER_ID}');`;

export function GoogleTagManagerScript() {
  return <script dangerouslySetInnerHTML={{ __html: GTM_HEAD_SCRIPT }} />;
}

export function GoogleTagManagerNoscript() {
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_CONTAINER_ID}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
      />
    </noscript>
  );
}
