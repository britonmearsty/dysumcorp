# Dashboard Design

## Overview
The dashboard features a modern, minimalist layout matching the landing page aesthetic with a sidebar and main content area. Uses the same design language with font-mono, #FF6B2C accent color, and clean borders.

## Design System

### Typography
- Font: Monospace (`font-mono`) throughout
- Uppercase labels for consistency with landing page
- Bold headings with clear hierarchy

### Colors
- Primary accent: `#FF6B2C` (orange)
- Borders: Clean, minimal borders
- Backgrounds: Simple background/foreground contrast
- Hover states: Orange accent on hover

### Components
- Buttons: `rounded-none` with orange background
- Cards: Border-based design (no rounded corners)
- Icons: Lucide React icons with orange accent backgrounds

## Components

### DashboardLayout (`components/dashboard-layout.tsx`)
- Main wrapper component that provides the layout structure
- Handles the flex container for sidebar and main content
- Responsive container with proper spacing

### DashboardSidebar (`components/dashboard-sidebar.tsx`)
- Fixed sidebar on desktop (sticky positioning)
- Collapsible mobile menu with overlay
- Navigation items with active state highlighting (orange background)
- Uppercase labels matching landing page style
- Logo integration with Dysumcorp branding
- User section at the bottom

### Dashboard Page (`app/dashboard/page.tsx`)
- Overview page with stats cards
- Quick actions section with CTA buttons
- Account information display
- Recent activity feed
- Fully responsive grid layout
- Monospace font throughout

## Features

### Responsive Design
- Desktop: Fixed sidebar (256px width) with main content area
- Mobile: Hamburger menu with slide-in sidebar and backdrop overlay
- Smooth transitions and animations

### Navigation Items
- OVERVIEW (Home)
- ANALYTICS
- DOCUMENTS
- PROJECTS
- TEAM
- SETTINGS

### Stats Cards
- Total Projects (12)
- Documents (48)
- Team Members (8)
- Storage Used (2.4 GB)
- Orange icon backgrounds
- Hover effect with orange border

### Quick Actions
- Create New Project (primary CTA)
- Upload Documents
- Invite Team Member

## Styling
- Matches landing page design system
- Monospace font for professional, technical feel
- #FF6B2C orange accent color
- Border-based cards (no rounded corners)
- Clean, minimal aesthetic
- Dark mode support via theme system

## Usage

```tsx
import { DashboardLayout } from "@/components/dashboard-layout";

export default function YourPage() {
  return (
    <DashboardLayout>
      {/* Your content here */}
    </DashboardLayout>
  );
}
```

## Design Consistency with Landing Page
- Same font-mono typography
- Same #FF6B2C accent color
- Same button style (rounded-none)
- Same border treatment
- Same hover effects
- Uppercase labels for navigation
- Clean, professional aesthetic
