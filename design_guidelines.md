# Design Guidelines: Telegram Group Management Platform

## Design Approach
**Selected Approach**: Design System (Modern SaaS Dashboard)  
**Inspiration**: Linear, Vercel Dashboard, Stripe Dashboard  
**Rationale**: This utility-focused automation platform requires efficiency, clarity, and professional credibility. The design should emphasize data visibility, form usability, and operational status - typical of fintech and automation tools.

## Core Design Principles
1. **Clarity Over Decoration**: Clean, scannable layouts with strong information hierarchy
2. **Trust Through Professionalism**: Polished UI that conveys security and reliability (critical for crypto payments)
3. **Operational Efficiency**: Streamlined workflows for frequent tasks (recharging, creating groups)

---

## Typography System

**Font Family**: Inter (Google Fonts) for UI, JetBrains Mono for API keys/technical data

**Hierarchy**:
- **Hero/Page Titles**: text-4xl md:text-5xl, font-bold, leading-tight
- **Section Headers**: text-2xl md:text-3xl, font-semibold
- **Card/Panel Titles**: text-lg font-semibold
- **Body Text**: text-base, font-normal, leading-relaxed
- **Labels**: text-sm font-medium, uppercase tracking-wide
- **Captions/Metadata**: text-xs, opacity-70
- **Technical Data** (API keys, balances): font-mono, text-sm

---

## Layout System

**Spacing Primitives**: Use Tailwind units of **2, 4, 6, 8, 12, 16** (e.g., p-4, gap-6, mt-8)

**Container Strategy**:
- **Dashboard Layout**: Sidebar navigation (w-64) + main content area (flex-1)
- **Max Widths**: max-w-7xl for dashboard content, max-w-md for auth forms, max-w-2xl for settings forms
- **Grid Systems**: 
  - Stats cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-4
  - Form layouts: Single column on mobile, two-column (grid-cols-2) for related fields on desktop
  - Admin tables: Full-width responsive tables with horizontal scroll on mobile

**Page Structure**:
- Consistent top navigation bar (h-16) with logo, balance display, user menu
- Left sidebar for main navigation (fixed on desktop, collapsible on mobile)
- Main content with page header, breadcrumbs, and content sections

---

## Component Library

### Authentication Pages (Login/Register)
- Centered card layout (max-w-md mx-auto)
- Logo at top, welcome message
- Form fields with floating labels
- Social proof element: "Join 500+ users automating Telegram groups"
- Link to alternate action (Login ↔ Register)

### Dashboard Home
**Layout**: 4-column stats grid + recent activity section

**Stats Cards** (4 across desktop):
1. Current Balance (large, prominent)
2. Total Groups Created
3. Active Orders
4. Account Status

Each card: p-6, rounded borders, icon + label + large number + trend indicator

**Recent Activity Section**:
- Table showing recent group creations
- Columns: Date/Time, Groups Created, Cost, Status (badge)
- Action button: "Create New Groups"

### Recharge/Payment Page
**Two-Column Layout**:
- **Left Column**: Payment amount selection
  - Quick select buttons ($10, $25, $50, $100)
  - Custom amount input
  - Conversion display (e.g., "500 groups" calculated dynamically)
  
- **Right Column**: Payment summary card
  - Amount breakdown
  - Crypto wallet address with copy button
  - QR code for wallet address
  - Transaction status tracker

### Telegram Account Connection
**Step-by-Step Form** (wizard interface):
1. **Step 1**: API Credentials
   - API ID input (number)
   - API Hash input (text, monospace)
   - Help text with link to Telegram's my.telegram.org
   
2. **Step 2**: Phone Verification
   - Phone number input with country code selector
   - "Send OTP" button
   - OTP input field (6-digit, auto-focus)
   
3. **Step 3**: Two-Factor Authentication (conditional)
   - Password input
   - "Skip" option if not enabled

**Progress Indicator**: Horizontal stepper showing current step (1/3, 2/3, 3/3)

### Group Creation Interface
**Form Layout**:
- **Primary Input**: Number of groups to create (large, centered input with +/- buttons)
- **Cost Calculator**: Real-time display "X groups = $Y (Z balance remaining)"
- **Group Settings** (collapsible advanced section):
  - Group name pattern input (e.g., "Group {number}")
  - Privacy settings (Public/Private radio)
  - Auto-add members toggle
  
- **Confirmation Section**: 
  - Summary of order
  - Large "Create Groups" primary button
  - Warning if insufficient balance

**Progress Tracking**:
- After submission: Progress bar showing groups being created
- Live updates: "Creating group 23/100..."
- Success message with summary

### Admin Panel
**Navigation Tabs**: Users | Payments | System Settings | Analytics

**Users Table**:
- Columns: Username, Email, Balance, Groups Created, Registration Date, Status, Actions
- Search/filter bar at top
- Bulk actions dropdown
- Pagination at bottom

**Payments Management**:
- Add payment method modal/form
- List of accepted crypto currencies (editable)
- Wallet addresses management
- Transaction history table

**System Settings**:
- Pricing configuration ($ per 100 groups)
- Feature toggles
- API rate limits
- Maintenance mode toggle

---

## Navigation Components

**Top Navigation Bar**:
- Left: Logo + app name
- Center: Global search (icon that expands)
- Right: Balance display (chip component), notification bell, user avatar/dropdown

**Sidebar Navigation**:
- Dashboard (home icon)
- Create Groups (plus icon)
- My Orders (list icon)
- Recharge Balance (wallet icon)
- Account Settings (gear icon)
- Divider
- Admin Panel (lock icon, only for admins)
- Logout (bottom-aligned)

Active state: Left border accent + background highlight

---

## Form Elements

**Input Fields**:
- Consistent height (h-12)
- Rounded corners (rounded-lg)
- Border states: default, focus (ring effect), error (red border)
- Labels above inputs (mb-2)
- Helper text below (text-sm, muted)
- Error messages (text-sm, red, with error icon)

**Buttons**:
- **Primary**: Large touch target (h-12), full rounded (rounded-lg), font-semibold
- **Secondary**: Border version of primary
- **Danger**: For destructive actions
- **Ghost**: Icon-only or text-only for tertiary actions
- Loading state: Spinner + disabled appearance

**Status Badges**:
- Success: Green background
- Pending: Yellow/Orange background
- Error: Red background
- Info: Blue background
- Sizes: text-xs px-3 py-1 rounded-full

---

## Data Display

**Tables**:
- Alternating row backgrounds for readability
- Sticky header on scroll
- Right-aligned numerical columns
- Action column (far right) with icon buttons
- Empty state: Illustration + message + CTA button

**Cards**:
- Consistent padding (p-6)
- Subtle border/shadow
- Header section with title + action
- Content section
- Footer section (optional, for metadata)

---

## Animations
**Minimal Motion** (performance-focused):
- Page transitions: Simple fade (150ms)
- Dropdown/modal: Slide + fade (200ms)
- Button clicks: Scale down (95%) on active
- Loading states: Spinner or skeleton screens
- Toast notifications: Slide in from top-right

**No scroll animations** or parallax effects - keep it performant and professional.

---

## Images

**Hero Image**: No traditional hero image. This is a dashboard application.

**Supporting Images**:
1. **Empty States**: Custom illustrations for "No groups created yet," "No payment methods added"
2. **Auth Pages**: Abstract geometric background (subtle, low opacity)
3. **QR Codes**: Dynamically generated for crypto wallet addresses
4. **Avatar Placeholders**: Use user initials or icon for profile images

**Icon Usage**: Heroicons (via CDN) for all UI icons - consistent stroke width (2px)

---

## Responsive Behavior

**Breakpoints**:
- Mobile (< 768px): Stack all columns, hide sidebar (hamburger menu), simplify tables to cards
- Tablet (768px - 1024px): 2-column layouts, persistent sidebar
- Desktop (> 1024px): Full multi-column layouts, expanded sidebar

**Mobile-Specific**:
- Bottom navigation bar alternative to sidebar
- Drawer-style sidebar overlay
- Simplified data tables (show only critical columns, tap for details)
- Larger touch targets (minimum 44px)

---

This design system creates a professional, trustworthy automation platform that prioritizes usability and operational clarity - essential for a fintech/crypto service handling user funds and automation tasks.