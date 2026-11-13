import { THEME_BOOT_SCRIPT } from '../shared/theme.js'

export function Shell({ dev, version }) {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="color-scheme" content="light dark" />
        <meta name="theme-color" content="#14110f" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#faf6f1" media="(prefers-color-scheme: light)" />
        <title>Jazz Setlist</title>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
        {!dev && <link rel="stylesheet" href={`/assets/app.css?v=${version}`} />}
      </head>
      <body>
        <div id="app"></div>
        {dev ? (
          <>
            <script type="module" src="/@vite/client"></script>
            <script type="module" src="/src/client/main.js"></script>
          </>
        ) : (
          <script type="module" src={`/assets/app.js?v=${version}`}></script>
        )}
      </body>
    </html>
  )
}
