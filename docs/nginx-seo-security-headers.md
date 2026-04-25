# nginx SEO/security headers

В репозитории нет nginx-конфига, поэтому базовые headers добавлены через `next.config.mjs`.
Для production nginx добавьте этот snippet в HTTPS `server` или нужный `location`:

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
```

CSP intentionally не включен в enforce-режиме, чтобы не сломать Next.js/RSC и сторонние ассеты.
