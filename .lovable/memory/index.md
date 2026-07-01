# AgroEco.Red - Design System & Architecture

## Branding
- Name: AgroEco.Red — previously RedAgroEco / MercadoAgroecológico
- Animated logo: src/components/AnimatedLogo.tsx (network nodes + leaf, framer-motion SVG)
- Use "sistema alimentario" instead of "cadena"
- "Marketplace" → "Mercado Agroecológico" / "Accedé al Mercado Agroecológico"
- Equinoxia agency removed from footer (no longer collaborator)

## Colors (HSL)
- Primary: 152 45% 28% (deep green)
- Secondary: 18 55% 55% (terracotta)
- Accent: 45 80% 55% (wheat/gold)
- Custom: earth, leaf, wheat, soil, forest

## Fonts
- Display: Playfair Display
- Body: DM Sans

## Pages
- / (landing), /mapa (Leaflet native API), /mercado (marketplace), /actores (directory + SPG tab), /registro (multi-step form), /ingresar (login), /reset-password, /comunidad, /servicios (holistic services hub)

## Architecture decisions
- Leaflet native API (NOT react-leaflet - incompatible with React 18)
- Lovable Cloud for backend (Supabase under the hood)
- Auth: email/password + Google OAuth (Lovable managed)
- Profiles table with actor_type enum, certification_level enum
- Auto-create profile on signup via trigger
- custom_categories table for user-created global categories
- Products: both producers AND admin can upload (TBD implementation)
- Order flow: WhatsApp + email to producer
- Services page: bio-inputs, seeds, weather (Open-Meteo), gov programs, storage, logistics

## Nav labels
- "Red" (not "Red de Actores") in all languages

## Workflow
- Implement new changes in Spanish first; translate ES/EN/FR/PT later only when explicitly requested.

## Auth
- AuthProvider context wraps routes
- Login page at /ingresar with email + Google
- Password reset flow with /reset-password page
