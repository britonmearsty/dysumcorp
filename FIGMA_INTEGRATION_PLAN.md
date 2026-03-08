# Figma Design Integration Plan

## Overview
Integrate the Figma-designed upload portal page into dysumcorp, replacing the current portal design while maintaining all existing functionality.

## Design Analysis - Figma Upload Portal

### Color Scheme (New Defaults)
- **Primary Gradient**: `linear-gradient(135deg, #6366f1, #8b5cf6)` (Indigo to Purple)
- **Primary Color**: `#6366f1` (Indigo-500)
- **Secondary Color**: `#8b5cf6` (Purple-500)
- **Background**: `#f1f5f9` (Slate-100)
- **Card Background**: `#ffffff` (White)
- **Text Primary**: `#1e293b` (Slate-800)
- **Text Secondary**: `#64748b` (Slate-500)
- **Border**: `#e2e8f0` (Slate-200)
- **Success**: `#10b981` (Emerald-500)
- **Success Background**: `#f0fdf4` (Emerald-50)

### Design Features
1. **Header Section**
   - Logo in gradient rounded square (12x12, rounded-2xl)
   - Company name with gradient text for domain/email
   - Two-tier header with description section
   - Clean border separation

2. **Upload Form Card**
   - Large rounded corners (rounded-2xl)
   - Soft shadow with layered effect
   - Clean white background
   - Generous padding (p-8)

3. **Form Fields**
   - Rounded-xl inputs
   - Indigo focus rings
   - Placeholder text styling
   - Label styling with font-weight-600

4. **Drop Zone**
   - Dashed border with indigo color
   - Gradient background on hover
   - Large upload icon in circle
   - Clear instructions

5. **File List**
   - Color-coded file type icons
   - Progress bars with gradient
   - Smooth animations
   - Badge for file count

6. **Success Page**
   - Large success icon with layered circles
   - Gradient button styling
   - File summary card
   - Clean layout

7. **Footer**
   - Minimal branding
   - Centered layout
   - Light text

## Implementation Tasks

### Phase 1: Update Default Branding Colors
- [ ] Update default `primaryColor` from `#3b82f6` to `#6366f1`
- [ ] Add `secondaryColor` field with default `#8b5cf6`
- [ ] Update default `backgroundColor` to `#f1f5f9`
- [ ] Update default `textColor` to `#1e293b`
- [ ] Add `gradientEnabled` boolean field (default: true)
- [ ] Add database migration for new fields

### Phase 2: Update Portal Schema
**File**: `prisma/schema.prisma`
- [ ] Add `secondaryColor` field
- [ ] Add `gradientEnabled` field
- [ ] Add `headerStyle` enum (single-tier, two-tier)
- [ ] Add `buttonStyle` enum (solid, gradient)
- [ ] Add `borderRadius` enum (sm, md, lg, xl, 2xl)
- [ ] Add `shadowStyle` enum (none, sm, md, lg)

### Phase 3: Update Portal Creation/Edit Forms
**Files**: 
- `app/dashboard/portals/create/page.tsx`
- `app/dashboard/portals/[id]/edit/page.tsx`

- [ ] Add secondary color picker in branding section
- [ ] Add gradient toggle
- [ ] Add style customization options
- [ ] Update form validation
- [ ] Update preview component

### Phase 4: Redesign Portal Upload Page
**File**: `app/portal/[slug]/page.tsx`

#### Header Section
- [ ] Implement two-tier header design
- [ ] Logo in gradient rounded square container
- [ ] Company name with gradient accent for contact info
- [ ] Description section with background color
- [ ] Border styling

#### Main Upload Form
- [ ] Update card styling (rounded-2xl, new shadows)
- [ ] Redesign form inputs (rounded-xl, new focus states)
- [ ] Update label styling
- [ ] Implement new drop zone design
- [ ] Add gradient backgrounds on hover/focus

#### File Management
- [ ] Color-coded file type icons
- [ ] Gradient progress bars
- [ ] New file list item design
- [ ] Badge styling for file count
- [ ] Smooth animations

#### Upload Button
- [ ] Gradient button option
- [ ] New hover/active states
- [ ] Icon integration
- [ ] Loading state with spinner

#### Success State
- [ ] Redesign success page layout
- [ ] Layered success icon
- [ ] File summary card
- [ ] Gradient "Upload More" button

#### Footer
- [ ] Update footer design
- [ ] Minimal branding approach
- [ ] Centered layout

### Phase 5: Create Reusable Components
**New Files**: `components/portal/`

- [ ] `PortalHeader.tsx` - Header with logo and description
- [ ] `PortalCard.tsx` - Main card wrapper with styling
- [ ] `PortalInput.tsx` - Styled input component
- [ ] `PortalButton.tsx` - Button with gradient support
- [ ] `PortalDropZone.tsx` - File drop zone
- [ ] `PortalFileList.tsx` - File list with icons
- [ ] `PortalProgressBar.tsx` - Gradient progress bar
- [ ] `PortalSuccessView.tsx` - Success state component
- [ ] `FileTypeIcon.tsx` - Color-coded file icons

### Phase 6: Update API Routes
**Files**: `app/api/portals/`

- [ ] Update create portal endpoint for new fields
- [ ] Update edit portal endpoint
- [ ] Update public portal endpoint to return new fields
- [ ] Add validation for new color fields

### Phase 7: Styling & Theme
**Files**: `app/globals.css` or new theme file

- [ ] Add CSS custom properties for new colors
- [ ] Add gradient utilities
- [ ] Add shadow utilities
- [ ] Add border radius utilities
- [ ] Add animation utilities

### Phase 8: Testing & Polish
- [ ] Test all portal creation flows
- [ ] Test portal editing
- [ ] Test public portal upload
- [ ] Test with different branding configurations
- [ ] Test gradient vs solid color modes
- [ ] Test responsive design
- [ ] Test file upload functionality
- [ ] Test success states
- [ ] Browser compatibility testing

## Configuration Examples

### Default Portal Configuration (Figma Style)
```typescript
{
  primaryColor: "#6366f1",
  secondaryColor: "#8b5cf6",
  backgroundColor: "#f1f5f9",
  cardBackgroundColor: "#ffffff",
  textColor: "#1e293b",
  gradientEnabled: true,
  buttonStyle: "gradient",
  borderRadius: "2xl",
  shadowStyle: "md"
}
```

### Classic Portal Configuration (Current Style)
```typescript
{
  primaryColor: "#3b82f6",
  secondaryColor: "#3b82f6",
  backgroundColor: "#ffffff",
  cardBackgroundColor: "#ffffff",
  textColor: "#0f172a",
  gradientEnabled: false,
  buttonStyle: "solid",
  borderRadius: "xl",
  shadowStyle: "sm"
}
```

## Migration Strategy
1. Add new fields with defaults to schema
2. Run migration to update existing portals
3. Implement new UI components
4. Gradually replace old components
5. Keep backward compatibility
6. Test thoroughly before deployment

## Notes
- All existing functionality must be preserved
- Upload logic remains unchanged
- Storage integration remains unchanged
- Security features remain unchanged
- Only UI/UX is being updated
- New branding options are additive, not breaking