# Changelog

All notable changes to the **DormDrobe** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Discreet Intimates Apparel Mockup Badges**: Replaced all realistic photographic images of underwear and socks across the Fit Generator swiper, Lookbook collage, Wear Log, Closet cards, and garment sheets with refined boutique apparel packaging mockup badges (`IntimatesMockupBadge`). Emblazoned with boutique vector emblems (`SockIcon` and `UnderwearBriefsIcon`), prominent garment names, brand labels, and color swatches for instant, aesthetic identification without photographic intimacy.
- **5P & 6P Outfits Studio Options**: Expanded the Outfits tab (Fit Studio) with 5-piece and 6-piece combinations accommodating Socks and Undergarments, featuring dedicated tier dividers, lock pins, custom Sock boutique glyphs, horizontal Lookbook piece collage preview, and complete wear logging.
- **Closet zones**: Closet is now split into **Clean & Ready**, **Worn & Laundry** and **In Bag**, scoped to the location you're at (with a "Show all places" toggle).
- **1-tap status button on every clothing card**: `Wear` → `To Laundry` → `Mark Clean`, each with an Undo toast.
- **Pack Bag checklist session**: tick clothes (filters + 3-Day Weekend preset) and put them in the Transit Bag in one tap.
- **Smart Unpack**: when the bag holds worn / laundry pieces you choose to mark them clean, send them to laundry, or keep their status. Undo restores each piece's own location and status.
- Laundry batch actions on the Worn & Laundry zone: **Worn → Laundry** and **Wash all → Clean**.

### Changed
- **Smooth Apple Page-Sheet Transition for Pack Bag**: Replaced the abrupt screen cut of the Pack Bag checklist session with a hardware-accelerated spring-based modal sheet transition (`Easing.bezier(0.23, 1, 0.32, 1)`). The underlying closet view gently recedes with subtle depth scaling (0.955) and dark scrim backdrop while preserving scroll position and filters. Supports interactive swipe-down gesture to dismiss, tactile micro-press haptics, and snappy drawer sweep exit (`Easing.bezier(0.32, 0.72, 0, 1)`).
- Bottom navigation is now 4 tabs (Home, Closet, Outfits, Settings); the separate Pack & Wash tab is gone.
- Enhanced liquid glassmorphism texture on bottom navigation bar with dual specular sheen, beveled top rim reflection, multi-stop diffusion, and blur backdrop.
- Home is simplified to a bag banner, three tappable Clean / Laundry / Bag counters and three quick actions.
- Cleanliness lifecycle simplified to `Clean → Worn → In Laundry → Clean`. Stored `drying` items are migrated to `In Laundry`.
- Outfits follows the Home location switch and defaults to "Clean items only".

### Removed
- `BatchActionScreen` and `ClosetFilterDrawer` (replaced by the Closet zones).

## [1.0.0] - 2026-10-22

### Added
- **Interactive Garment Detail Sheet**: Spring-based bottom sheet interaction with one-tap status cycling and location moves.
- **Botanical Cleanliness Lifecycle**: Five-state triage flow (`Clean` -> `Worn` -> `In Laundry` -> `Drying` -> `Clean`).
- **Commuter Packing & Luggage Assistant**: Automated packing formulas and batch suitcase transfers between Dorm, Home, and In-Transit Bag.
- **Fit Studio Lookbook**: Multi-row capsule outfit mixer with live item availability indicators.
- **Offline-First Storage Engine**: Fast local caching with optimistic UI state transitions and Supabase cloud synchronization.

### Changed
- Replaced emoji indicators with standardized Phosphor vector iconography.
- Upgraded navigation bar and action cards to Apple-inspired Frost Liquid Glass aesthetic.
- Enhanced color hierarchy across all screens to ensure high-contrast readability.
