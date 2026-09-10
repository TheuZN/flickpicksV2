# FlickPicks

🇧🇷 [Leia em português](README.md)

Discover, rate, and organize what to watch — movies and TV shows in one place, powered by [The Movie Database (TMDB)](https://www.themoviedb.org/) API.

![FlickPicks — hero section](public/image.png)

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Known Limitations](#known-limitations)
- [Roadmap](#roadmap)
- [How This Was Built](#how-this-was-built)
- [Attribution](#attribution)

## Overview

FlickPicks is a movie/TV discovery app built with Angular 22 (standalone components, signals, zoneless change detection) and Tailwind CSS 4, consuming the TMDB API directly from the client. It's a personal project built to explore Angular's newest reactive primitives (`signal`, `computed`, `httpResource`, `linkedSignal`) on top of a real, data-heavy application — not a toy CRUD app.

Login is real, not mocked: signing in uses TMDB's own OAuth-style flow, so watchlist, favorites, ratings, and custom lists you create in FlickPicks are the same ones on your actual TMDB account.

## Features

### Discovery
- **Home** — a rotating hero carousel of trending titles, a genre-filter carousel, and horizontally-scrolling rows (Latest, Popular, Top Rated, Dev List, Nerd List) with a Movies/TV Shows toggle per row.
- **Browse pages** (`/movies`, `/tv`, `/people`) — paginated grids with "Load more", and filters for Sort (Popularity, Rating, Newest, Oldest, Most Voted), Genre, Where to Watch (Netflix, Prime Video, Disney+, Max, Apple TV+), and Minimum Rating.
- **Unified search** — one search bar in the header, results split by Movies / TV Shows / People, reusing the same filtered-grid UI as Browse.
- **"No idea what to watch?" quiz** — a short multi-step quiz (mood, era, runtime, streaming service) that turns your answers into a TMDB `discover` query and shows a curated pick.

### Title details (movies & TV shows)
- Full detail page: backdrop banner, poster, genres, rating, runtime, budget, release date, certification (falls back from BR to US rating boards).
- Director/creator and writer credits, full cast list linking to person profiles.
- Trailer (click-to-load YouTube embed — nothing loads until you ask for it).
- Tagline shown as a pull quote, when TMDB has one.
- Reviews, with the reviewer's own score when they left one.
- Image gallery that opens in an in-page lightbox (not a new tab).
- "Related" row at the bottom, reusing the same row component as the home page.

### People
- Person profile: photo, biography (with read-more), personal info (birthday with computed age, place of birth, known-for department), and social links pulled from TMDB's `external_ids` (only shown when the person actually has them).
- "Known For" row, ranked by TMDB's own popularity score — the same logic TMDB's own site uses.

### Your account
- **Real TMDB login** — "Continue with TMDB" sends you through TMDB's official request-token → approve → session flow. No FlickPicks-specific password exists.
- **Watchlist & Favorites** — add/remove from any title's page; buttons reflect your *actual* saved state on page load (via TMDB's `account_states` endpoint), not a guess.
- **Ratings** — rate 1–10 on any title. If you're logged in it's a real TMDB rating; if you're not, it still works as a guest rating stored for your browser, so nobody's blocked from trying the feature.
- **Custom lists** — create your own lists, add titles to them from the detail page, view and delete them from your dashboard. (Movies only — see [Known Limitations](#known-limitations).)
- **Account dashboard** (`/account`) — a persistent sidebar (avatar, name, nav) with Watchlist / Favorites / Ratings / My Lists as swappable sections, each with a confirmation dialog before removing anything.

<details>
<summary><strong>See it in action</strong> (no login required to watch)</summary>
<br>

**Login** — signing in with a real TMDB account via the official OAuth-style flow:

![Login demo](public/image1.gif)

**Custom lists** — creating a list, opening it, removing a title, deleting the list:

![Custom lists demo](public/image2.gif)

**Ratings** — rating a title as a guest, then viewing saved ratings on the dashboard:

![Ratings demo](public/image3.gif)

</details>

### Interface
- **Dark and light themes**, toggled from the header, respecting your OS preference on first visit.
- Fully responsive, down to small phones — including the account dashboard, which collapses from a side-by-side layout to a stacked one when there isn't room for both the sidebar and the content grid.
- Horizontally-scrolling rows use native scroll with CSS `scroll-snap` (so arrow clicks and swipes always land on a card edge, never mid-card), plus custom prev/next arrows and position dots layered on top.
- Skeleton loading states and crossfade transitions when switching tabs, so the UI never flashes to an empty grid.
- Every dropdown (sort, genre, "add to a list", etc.) is a custom-built component, not a native `<select>` — so it actually matches the app's theme instead of the browser's default styling.

## Tech Stack

- **[Angular 22](https://angular.dev)** — standalone components, signals, `httpResource`, `linkedSignal`, zoneless change detection, the new `@Service()` decorator, and native control flow (`@if`/`@for`).
- **[Tailwind CSS 4](https://tailwindcss.com)** — CSS-first theming via `@theme`, no separate config file.
- **[TMDB API v3](https://developer.themoviedb.org/docs)** — all data, search, auth, and account actions.

No backend of its own — this is a client-side SPA that talks to TMDB directly.

## Getting Started

```bash
# 1. Clone
git clone https://github.com/your-username/flickpicks.git
cd flickpicks

# 2. Install (requires Node 22.22.3+, 24.15+, or 26+)
npm install

# 3. Set up your TMDB credentials
cp src/environments/environment.example.ts src/environments/environment.ts
cp src/environments/environment.example.ts src/environments/environment.development.ts
# then paste your token into both files — see below

# 4. Run
ng serve
```

Open `http://localhost:4200`.

## Environment Variables

FlickPicks needs a TMDB **API Read Access Token (v4 auth)** — get one free at [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api).

```ts
// src/environments/environment.ts
export const environment = {
  linkUrl: 'https://api.themoviedb.org/3',
  linkImageUrl: 'https://image.tmdb.org/t/p/w500',
  acessToken: 'YOUR_TMDB_READ_ACCESS_TOKEN',
};
```

`environment.ts` and `environment.development.ts` are git-ignored — never commit your real token. Use `environment.example.ts` as the template.

> **Heads up:** this token ships in the browser bundle, same as any purely client-side app calling a third-party API directly. Its scope is read-only, so the practical risk is someone using your request quota, not account takeover — but if you deploy this publicly, consider proxying TMDB calls through a small serverless function (Vercel/Netlify/Cloudflare) that injects the token server-side instead.

## Project Structure

```
src/app/
├── pages/          # Routed pages: home, browse, titledetail, persondetail, login, account*
├── components/      # Reusable pieces: header, footer, hero, movieCard, movieRow, quiz, etc.
├── services/         # TmdbLists (reads/writes), AuthService (session), ThemeService
└── environments/      # API config (git-ignored except the .example template)
```

## Known Limitations

- **Custom lists are movies-only.** TMDB's `/list` endpoint predates TV show support in their API and was never extended — this isn't a FlickPicks gap, it's the underlying API.
- **Write actions (watchlist/favorite/rating) need a valid, logged-in session.** They're not available to a signed-out visitor except rating, which falls back to a guest session.
- **Guest ratings don't migrate.** If you rate something as a guest and then log in, TMDB has no API to merge that rating into your real account — it stays a separate, local-only guest rating.

## Roadmap

Ideas that don't exist yet, in rough order of how much they'd add:
- Add-to-list support surfaced directly from Browse/search results, not just the detail page.
- Lazy-loaded routes to shrink the initial bundle.
- A proxy-based deployment option for the API token (see the note above).

## How This Was Built

This project was built in collaboration with **Claude Sonnet 5** (Anthropic). Product decisions were mine throughout — the recommendation quiz, the split between the curated Dev List/Nerd List rows and a personal watchlist, the account dashboard layout, and every fix along the way started from something I noticed and directed, often from a screenshot or screen recording of an actual bug. Claude wrote and iterated on the code under that direction, checking each change against a real build before handing it back.

## Attribution

This product uses the TMDB API but is not endorsed or certified by TMDB.

Made by Mateus Melo.