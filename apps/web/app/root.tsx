import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import { Provider } from "./components/ui/provider";
import { Box, Code, Container, Heading } from "@chakra-ui/react";
import styles from "./app.css?url";

export const links: Route.LinksFunction = () => [
  // Styles
  { rel: "stylesheet", href: styles },
  // Favicons
  { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
  { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
  {
    rel: "icon",
    type: "image/svg+xml",
    sizes: "16x16",
    href: "/favicon-16x16.svg",
  },
  {
    rel: "icon",
    type: "image/svg+xml",
    sizes: "32x32",
    href: "/favicon-32x32.svg",
  },
  {
    rel: "icon",
    type: "image/svg+xml",
    sizes: "48x48",
    href: "/favicon-48x48.svg",
  },
  // Apple Touch Icon
  { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.svg" },
  // Web App Manifest
  { rel: "manifest", href: "/site.webmanifest" },
  // Theme color
  { rel: "mask-icon", href: "/icon-light.svg", color: "#0F766E" },
  // Fonts
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0F766E" />
        <meta name="msapplication-TileColor" content="#0F766E" />
        <Meta />
        <Links />
      </head>
      <body>
        <Provider>{children}</Provider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <Container as={"main"} pt={16} p={4} mx={"auto"}>
      <Heading>{message}</Heading>
      <Box>{details}</Box>

      {stack && (
        <Code mt={4} overflowX={"auto"}>
          {stack}
        </Code>
      )}
    </Container>
  );
}
