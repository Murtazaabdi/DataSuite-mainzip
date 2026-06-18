# Linear Design System - Accurate Implementation

DataSuite now uses **Linear's exact design system** for a professional, minimalist interface matching the real Linear app.

## 🎯 Design Principles

Linear is built on:
- **Pure Black Foundation** - `#000000` background
- **Minimal Hierarchy** - Clean grays for contrast
- **Premium Feel** - Subtle, not harsh
- **Functional Elegance** - Form follows function
- **Smooth Interactions** - Eased transitions
- **Modern Typography** - System fonts (Inter, Segoe UI)

## 🎨 Color System

### Primary Colors
- **Blue (Primary)** - `#0066FF` (Interactive, hover, focus)
- **Blue Light** - `#1A7FFF` (Hover state)
- **Blue Dark** - `#004BD9` (Active/pressed state)

### Grayscale (Pure Blacks)
| Variable | RGB | Usage |
|----------|-----|-------|
| `--linear-black` | #000000 | Base black |
| `--linear-gray-50` | #0A0A0A | Sidebar background |
| `--linear-gray-100` | #141414 | Primary background |
| `--linear-gray-150` | #1A1A1A | Secondary background |
| `--linear-gray-200` | #242424 | Tertiary/elevated |
| `--linear-gray-300` | #2D2D2D | Hover overlay |
| `--linear-gray-400` | #383838 | Input borders |
| `--linear-gray-500` | #505050 | Disabled text |
| `--linear-gray-600` | #757575 | Tertiary text |
| `--linear-gray-700` | #9B9B9B | Secondary text |
| `--linear-gray-800` | #B5B5B5 | Primary text (light) |
| `--linear-gray-900` | #FFFFFF | Text/white |

### Text Colors
- **Primary** - `#FFFFFF` (Main text, high contrast)
- **Secondary** - `#B5B5B5` (Secondary text, icons)
- **Tertiary** - `#7B7B7B` (Disabled, hints, placeholders)
- **Disabled** - `#505050` (Disabled state)

### Semantic/Status Colors
- **Success** - `#0FB247` (Green, confirmations)
- **Warning** - `#F0883E` (Orange, cautions)
- **Error** - `#F44236` (Red, errors)
- **Info** - `#0066FF` (Blue, information)

## 🔤 Typography

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;
```

**Why:** Cross-platform native fonts for consistency
- macOS: System Font
- Windows: Segoe UI
- Fallback: Inter (if available)

### Size Reference
| Element | Size | Weight | Letter Spacing | Line Height |
|---------|------|--------|-----------------|------------|
| H1 | 20px | 600 | -0.5px | 1.2 |
| H2 | 18px | 600 | -0.3px | 1.25 |
| H3 | 16px | 600 | -0.2px | 1.3 |
| Body | 14px | 400 | -0.2px | 1.5 |
| Small | 13px | 400 | -0.1px | 1.4 |
| XS | 12px | 400 | -0.1px | 1.4 |

**Key:** Linear uses **negative letter spacing** (-0.2px to -0.5px) for tighter, more premium feel.

## 🎭 Components

### Buttons
- **Padding**: 8px 12px
- **Border Radius**: 8px (md)
- **Font Size**: 14px, weight 500
- **Transition**: 100ms cubic-bezier(0.4, 0, 0.2, 1)
- **Hover**: Opacity 0.8
- **Focus**: 2px solid primary with 2px offset

### Input Fields
- **Padding**: 8px 12px  
- **Border Radius**: 8px (md)
- **Border**: 1px solid `--linear-gray-400`
- **Background**: `--linear-gray-200` (tertiary)
- **Focus**: 2px blue outline, bg lightens to `--linear-gray-200`
- **Placeholder**: `--linear-gray-600` (tertiary text)

### Sidebar Items
- **Padding**: 12px 16px
- **Margin**: 2px 8px (compact spacing)
- **Border Radius**: 6px (sm)
- **Font Size**: 13px
- **Default Color**: `--linear-gray-700` (secondary)
- **Hover**: Background `--linear-gray-150`, text to primary
- **Active**: Background `--linear-gray-150`, border-left blue

### Cards
- **Padding**: 16px
- **Border Radius**: 12px (lg)
- **Border**: 1px solid `--linear-gray-400`
- **Background**: `--linear-gray-150`
- **Box Shadow**: Subtle (0 1px 2px rgba(0,0,0,0.5))
- **Hover**: Shadow increases, border lighter

### Badges
- **Padding**: 4px 8px
- **Border Radius**: 9999px (full)
- **Font Size**: 12px
- **Font Weight**: 500
- **Status Colors**: 15% opacity background, saturated text

### Dividers
- **Border**: 1px solid `--linear-gray-400`
- **Margin**: 12px vertical
- **Color**: Extremely subtle

## 📐 Spacing System

Linear uses **4px base grid**:
| Variable | Size | Usage |
|----------|------|-------|
| `--linear-space-xs` | 4px | Micro spacing |
| `--linear-space-sm` | 8px | Small gaps |
| `--linear-space-md` | 12px | Normal spacing |
| `--linear-space-lg` | 16px | Padding |
| `--linear-space-xl` | 24px | Section spacing |
| `--linear-space-2xl` | 32px | Major sections |

## 🎬 Animations

### Timing Functions
- **Fast**: 100ms, cubic-bezier(0.4, 0, 0.2, 1)
- **Base**: 150ms, cubic-bezier(0.4, 0, 0.2, 1)
- **Slow**: 200ms, cubic-bezier(0.4, 0, 0.2, 1)

### Common Animations
- **Fade In**: 0 → 100% opacity
- **Slide In**: Y: 8px → 0px + opacity
- **Slide Left**: X: -12px → 0px + opacity

**Curve:** Cubic bezier for smooth deceleration

## 🏗️ Layout Structure

### Sidebar
```
- Fixed left panel
- Width: ~280px
- Background: --linear-gray-50
- Border right: 1px --linear-gray-400
- Never scrolls with content
```

### Header
```
- Fixed top
- Height: 48px
- Background: --linear-gray-50
- Border bottom: 1px --linear-gray-400
- Z-index: 100
```

### Main Content
```
- Flex-1 (fills remaining space)
- Padding: 16px
- Background: --linear-black
- Scrollable
```

## 💡 Implementation Examples

### Using CSS Variables

```tsx
// Pure black background
style={{ background: 'var(--linear-bg-primary)' }}

// Dark tertiary (cards)
style={{ background: 'var(--linear-bg-tertiary)' }}

// Subtle border
style={{ border: '1px solid var(--linear-border)' }}

// Premium shadow
style={{ boxShadow: 'var(--linear-shadow-md)' }}

// Smooth transition
style={{ transition: 'all var(--linear-transition-base)' }}

// Perfect text hierarchy
style={{ color: 'var(--linear-text-primary)' }}
```

### Button Variants

```tsx
// Primary Button
<button style={{
  background: 'var(--linear-primary)',
  color: 'white',
  padding: 'var(--linear-space-sm) var(--linear-space-md)',
  borderRadius: 'var(--linear-radius-md)',
  fontWeight: 500,
  transition: 'all var(--linear-transition-fast)',
}}>
  Click me
</button>

// Secondary Button (transparent)
<button style={{
  background: 'transparent',
  color: 'var(--linear-text-secondary)',
  border: '1px solid var(--linear-border)',
  padding: 'var(--linear-space-sm) var(--linear-space-md)',
  borderRadius: 'var(--linear-radius-md)',
  transition: 'all var(--linear-transition-fast)',
}}>
  Cancel
</button>
```

### Input with Focus

```tsx
<input
  style={{
    background: 'var(--linear-bg-tertiary)',
    border: '1px solid var(--linear-gray-400)',
    borderRadius: 'var(--linear-radius-md)',
    color: 'var(--linear-text-primary)',
    padding: 'var(--linear-space-sm) var(--linear-space-md)',
    fontSize: 'var(--linear-font-size-base)',
  }}
  onFocus={(e) => {
    e.target.style.borderColor = 'var(--linear-primary)';
    e.target.style.boxShadow = '0 0 0 2px rgba(0, 102, 255, 0.1)';
  }}
/>
```

## 🎨 Customization

Edit `src/styles/linear-theme.css` to customize:

```css
:root {
  /* Change primary color */
  --linear-primary: #0066FF;
  
  /* Adjust spacing */
  --linear-space-lg: 16px;
  
  /* Modify transitions */
  --linear-transition-base: 150ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

All components automatically use new values.

## 🌍 Browser Support

✅ Chrome/Edge v88+
✅ Firefox v87+
✅ Safari v14+
✅ Mobile (iOS 14+, Android 12+)

## 📱 Responsive Breaks

```css
Mobile: < 640px
Tablet: 640px - 1024px
Desktop: > 1024px
```

---

**DataSuite now matches Linear's clean, professional design exactly.** ✨
