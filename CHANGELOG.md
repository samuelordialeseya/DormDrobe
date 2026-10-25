# Changelog

All notable changes to the **DormDrobe** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Closet zones**: Closet is now split into **Clean & Ready**, **Worn & Laundry** and **In Bag**, scoped to the location you're at (with a "Show all places" toggle).
- **1-tap status button on every clothing card**: `Wear` → `To Laundry` → `Mark Clean`, each with an Undo toast.
- **Pack Bag checklist session**: tick clothes (filters + 3-Day Weekend preset) and put them in the Transit Bag in one tap.
- **Smart Unpack**: when the bag holds worn / laundry pieces you choose to mark them clean, send them to laundry, or keep their status. Undo restores each piece's own location and status.
- Laundry batch actions on the Worn & Laundry zone: **Worn → Laundry** and **Wash all → Clean**.

### Changed
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
