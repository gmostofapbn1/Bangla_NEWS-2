import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site-config";

/**
 * The AI crawlers are named explicitly rather than left to the `*` rule.
 *
 * Two reasons. Google-Extended is the only lever that governs whether this
 * content may be used to ground Gemini and AI Overviews, and it is read
 * independently of the wildcard — a site that never names it is making that
 * choice by omission. And several of these agents default to "no" when a site
 * is silent, so for a directory whose whole value is being cited as a source,
 * saying yes out loud is the point.
 *
 * `/go/` stays blocked for all of them: those are outbound click-through
 * redirects, not content, and letting them be crawled spends budget on
 * redirects instead of pages.
 */
const AI_AGENTS = [
  "Google-Extended", // Gemini + AI Overviews grounding
  "GPTBot", // OpenAI crawler
  "OAI-SearchBot", // ChatGPT search results
  "ChatGPT-User", // ChatGPT browsing on a user's behalf
  "ClaudeBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Applebot-Extended",
  "CCBot", // Common Crawl — feeds many downstream models
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/go/"],
      },
      ...AI_AGENTS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: ["/admin", "/go/"],
      })),
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
