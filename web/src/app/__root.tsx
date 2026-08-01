import { ClerkProvider } from "@clerk/tanstack-react-start";
import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";

import { ThemeProvider } from "@/components/theme-provider";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Nala" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico" },
    ],
  }),
  component: RootComponent,
});

/**
 * The document shell. The fonts come from the stylesheet (`@nala/ui` imports
 * them from Fontsource and binds them to `--font-sans` / `--font-mono`), so
 * unlike the `next/font` setup there is nothing to wire up per-render here.
 */
function RootComponent() {
  return (
    <ClerkProvider>
      <html
        lang="en"
        suppressHydrationWarning
        className="font-sans antialiased"
      >
        <head>
          <HeadContent />
        </head>
        <body>
          <ThemeProvider>
            <Outlet />
          </ThemeProvider>
          <Scripts />
        </body>
      </html>
    </ClerkProvider>
  );
}
