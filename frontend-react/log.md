// ===========================
// Color System
// ===========================

// ─── Grays (Neutrals) ───
$gray-50:  #f9fafb;
$gray-100: #f3f4f6;
$gray-200: #e5e7eb;
$gray-300: #d1d5db;
$gray-400: #9ca3af;
$gray-500: #6b7280;
$gray-600: #4b5563;
$gray-700: #374151;
$gray-800: #1f2937;
$gray-900: #111827;
$gray-950: #030712;

// ─── Brand: Emerald ───
$emerald-50:  #ecfdf5;
$emerald-100: #d1fae5;
$emerald-200: #a7f3d0;
$emerald-300: #6ee7b7;
$emerald-400: #34d399;
$emerald-500: #10b981;  // Primary
$emerald-600: #059669;
$emerald-700: #047857;
$emerald-800: #065f46;
$emerald-900: #064e3b;
$emerald-950: #022c22;

// ─── Secondary: Indigo ───
$indigo-50:  #eef2ff;
$indigo-100: #e0e7ff;
$indigo-400: #818cf8;
$indigo-500: #6366f1;
$indigo-600: #4f46e5;
$indigo-700: #4338ca;

// ─── Accent: Amber ───
$amber-50:  #fffbeb;
$amber-100: #fef3c7;
$amber-400: #fbbf24;
$amber-500: #f59e0b;
$amber-600: #d97706;

// ─── Semantic ───
$success: #22c55e;
$success-light: #4ade80;
$success-bg: rgba(34, 197, 94, 0.1);

$warning: #f59e0b;
$warning-light: #fbbf24;
$warning-bg: rgba(245, 158, 11, 0.1);

$error: #ef4444;
$error-light: #f87171;
$error-bg: rgba(239, 68, 68, 0.1);

$info: #3b82f6;
$info-light: #60a5fa;
$info-bg: rgba(59, 130, 246, 0.1);

// ─── CSS Variables (theme-aware) ───
:root {
  // Brand
  --brand: #{$emerald-500};
  --brand-dark: #{$emerald-600};
  --brand-darker: #{$emerald-700};
  --brand-light: #{$emerald-400};
  --brand-bg: #{$emerald-50};
  --brand-bg-medium: #{$emerald-100};

  // Secondary
  --secondary: #{$indigo-500};
  --secondary-dark: #{$indigo-600};

  // Semantic
  --success: #{$success};
  --warning: #{$warning};
  --error: #{$error};
  --info: #{$info};

  // Backgrounds
  --bg-base: #{$gray-50};
  --bg-card: #ffffff;
  --bg-subtle: #{$gray-100};
  --bg-subtle-hover: #{$gray-200};

  // Text
  --text-primary: #{$gray-900};
  --text-secondary: #{$gray-700};
  --text-muted: #{$gray-500};
  --text-faint: #{$gray-400};
  --text-inverse: #ffffff;

  // Borders
  --border-default: #{$gray-200};
  --border-strong: #{$gray-300};
  --border-focus: #{$emerald-500};
}

// Dark theme
body.dark {
  --brand: #{$emerald-400};
  --brand-dark: #{$emerald-500};
  --brand-darker: #{$emerald-600};
  --brand-light: #{$emerald-300};
  --brand-bg: rgba(52, 211, 153, 0.1);
  --brand-bg-medium: rgba(52, 211, 153, 0.15);

  --secondary: #{$indigo-400};
  --secondary-dark: #{$indigo-500};

  --success: #{$success-light};
  --warning: #{$warning-light};
  --error: #{$error-light};
  --info: #{$info-light};

  --bg-base: #{$gray-950};
  --bg-card: #{$gray-900};
  --bg-subtle: #{$gray-800};
  --bg-subtle-hover: #{$gray-700};

  --text-primary: #{$gray-50};
  --text-secondary: #{$gray-200};
  --text-muted: #{$gray-400};
  --text-faint: #{$gray-500};
  --text-inverse: #{$gray-900};

  --border-default: #{$gray-800};
  --border-strong: #{$gray-700};
  --border-focus: #{$emerald-400};
}
@use 'variables' as *;

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html,
body,
#root {
  direction: rtl;
  text-align: right;
  min-height: 100vh;
  width: 100%;
}

body {
  margin: 0;
  font-family: $font-arabic;
  font-size: 1rem;
  line-height: 1.5;
  background: var(--bg-base);
  color: var(--text-primary);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  transition: background-color 0.2s ease, color 0.2s ease;
}
body.dark {
  background-color: $bg-page-dark;
  color: $text-display-dark;
}

a {
  text-decoration: none;
  color: inherit;
}

button {
  font-family: inherit;
}
@mixin flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

@mixin dark-mode {
  :global(body.dark) & {
    @content;
  }
}

@mixin card-base {
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
  transition: all var(--transition);
}
// ===========================
// Elevation System
// ===========================

$shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
$shadow-sm:
  0 1px 3px 0 rgba(0, 0, 0, 0.05),
  0 1px 2px -1px rgba(0, 0, 0, 0.05);
$shadow-md:
  0 4px 6px -1px rgba(0, 0, 0, 0.05),
  0 2px 4px -2px rgba(0, 0, 0, 0.05);
$shadow-lg:
  0 10px 15px -3px rgba(0, 0, 0, 0.08),
  0 4px 6px -4px rgba(0, 0, 0, 0.05);
$shadow-xl:
  0 20px 25px -5px rgba(0, 0, 0, 0.1),
  0 8px 10px -6px rgba(0, 0, 0, 0.05);
$shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.15);

// Brand glow (for primary buttons)
$shadow-brand: 0 4px 14px -2px rgba(16, 185, 129, 0.3);
$shadow-brand-hover: 0 6px 20px -2px rgba(16, 185, 129, 0.4);

// Dark theme shadows (deeper)
$shadow-dark-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.3);
$shadow-dark-md:
  0 4px 6px -1px rgba(0, 0, 0, 0.3),
  0 2px 4px -2px rgba(0, 0, 0, 0.3);
$shadow-dark-lg:
  0 10px 15px -3px rgba(0, 0, 0, 0.4),
  0 4px 6px -4px rgba(0, 0, 0, 0.3);

// Utility classes
.elevation-0 { box-shadow: none; }
.elevation-1 { box-shadow: $shadow-sm; }
.elevation-2 { box-shadow: $shadow-md; }
.elevation-3 { box-shadow: $shadow-lg; }
.elevation-4 { box-shadow: $shadow-xl; }

body.dark {
  .elevation-1 { box-shadow: $shadow-dark-sm; }
  .elevation-2 { box-shadow: $shadow-dark-md; }
  .elevation-3 { box-shadow: $shadow-dark-lg; }
  .elevation-4 { box-shadow: $shadow-dark-lg; }
}
// ===========================
// Typography System
// ===========================

// Font Families
$font-arabic: 'IBM Plex Sans Arabic', system-ui, -apple-system, sans-serif;
$font-heading: 'Rubik', 'IBM Plex Sans Arabic', system-ui, sans-serif;
$font-mono: 'SF Mono', 'Monaco', 'Consolas', monospace;

// Font Sizes (rem-based, fluid)
$text-xs: 0.75rem;    // 12px
$text-sm: 0.875rem;   // 14px
$text-base: 1rem;     // 16px
$text-lg: 1.125rem;   // 18px
$text-xl: 1.25rem;    // 20px
$text-2xl: 1.5rem;    // 24px
$text-3xl: 1.875rem;  // 30px
$text-4xl: 2.25rem;   // 36px
$text-5xl: 3rem;      // 48px

// Font Weights
$weight-regular: 400;
$weight-medium: 500;
$weight-semibold: 600;
$weight-bold: 700;
$weight-extrabold: 800;

// Line Heights
$leading-tight: 1.2;
$leading-snug: 1.35;
$leading-normal: 1.5;
$leading-relaxed: 1.65;

// Letter Spacing
$tracking-tighter: -0.04em;
$tracking-tight: -0.02em;
$tracking-normal: 0;
$tracking-wide: 0.02em;

// ===========================
// Global Typography Rules
// ===========================
html {
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

body {
  font-family: $font-arabic;
  font-size: $text-base;
  line-height: $leading-normal;
  font-weight: $weight-regular;
  letter-spacing: $tracking-normal;
}

// Headings
h1, h2, h3, h4, h5, h6 {
  font-family: $font-heading;
  font-weight: $weight-bold;
  line-height: $leading-tight;
  letter-spacing: $tracking-tight;
  margin: 0;
}

h1 { font-size: $text-4xl; font-weight: $weight-extrabold; }
h2 { font-size: $text-3xl; font-weight: $weight-extrabold; }
h3 { font-size: $text-2xl; font-weight: $weight-bold; }
h4 { font-size: $text-xl; font-weight: $weight-bold; }
h5 { font-size: $text-lg; font-weight: $weight-semibold; }
h6 { font-size: $text-base; font-weight: $weight-semibold; }

// Body text
p {
  margin: 0;
  line-height: $leading-relaxed;
}

// Interactive
button, input, select, textarea {
  font-family: inherit;
  font-size: inherit;
}

// Code
code, pre {
  font-family: $font-mono;
  font-size: 0.9em;
}

// Numbers (tabular for alignment)
.tabular-nums {
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum';
}

// Utility classes
.text-xs { font-size: $text-xs; }
.text-sm { font-size: $text-sm; }
.text-base { font-size: $text-base; }
.text-lg { font-size: $text-lg; }
.text-xl { font-size: $text-xl; }
.text-2xl { font-size: $text-2xl; }
.text-3xl { font-size: $text-3xl; }

.font-medium { font-weight: $weight-medium; }
.font-semibold { font-weight: $weight-semibold; }
.font-bold { font-weight: $weight-bold; }
.font-extrabold { font-weight: $weight-extrabold; }
@use './colors' as c;
@use './typography' as t;
@use './shadows' as s;

// Old variables (mapped to new)
$font-main: t.$font-arabic;
$text-light: c.$emerald-500;
$text-dark: c.$emerald-400;
$text-display-light: c.$gray-900;
$text-display-dark: c.$gray-50;
$bg-display-light: c.$gray-50;
$bg-display-dark: c.$gray-900;
$bg-btn-light: c.$gray-100;
$bg-btn-dark: c.$gray-800;
$bg-btn-hover-light: c.$gray-200;
$bg-btn-hover-dark: c.$gray-700;
$border-light: c.$gray-200;
$border-dark: c.$gray-800;
$transition: 0.2s ease;
$border-radius: 10px;
$gap: 1rem;
$padding: 1rem;
@use './colors';
@use './typography';
@use './shadows';
@use './variables';
@use './mixins';
@use './global';
