# SafeDetect Dashboard - Component Library Documentation

## Overview

This document describes the comprehensive component library and design system for the SafeDetect dashboard application. The system follows a modern, accessible, and responsive design approach.

---

## Table of Contents

1. [Design System](#design-system)
2. [UI Components](#ui-components)
3. [Specialized Components](#specialized-components)
4. [Usage Guidelines](#usage-guidelines)
5. [Accessibility](#accessibility)
6. [Performance](#performance)

---

## Design System

### Design Tokens

All design decisions are centralized in CSS custom properties (variables) for consistency and maintainability.

**Location:** `src/styles/variables.css`

### Token Categories

#### Colors
- **Primary Colors:** `--color-primary`, `--color-primary-dark`, `--color-primary-light`
- **Status Colors:** `--color-success`, `--color-danger`, `--color-warning`, `--color-info`
- **Object Types:** `--color-object-car`, `--color-object-motorcycle`, `--color-object-person`
- **Backgrounds:** `--color-bg-primary`, `--color-bg-secondary`, `--color-bg-tertiary`
- **Text:** `--color-text-primary`, `--color-text-secondary`, `--color-text-tertiary`, `--color-text-muted`
- **Borders:** `--color-border`, `--color-border-light`, `--color-border-dark`

#### Spacing
- Uses 8px base grid system
- `--spacing-xs` (4px) through `--spacing-3xl` (64px)
- Examples: `--spacing-sm` (8px), `--spacing-md` (16px), `--spacing-lg` (24px)

#### Typography
- **Families:** `--font-family-primary`, `--font-family-mono`, `--font-family-display`
- **Sizes:** `--font-size-xs` (12px) through `--font-size-4xl` (40px)
- **Weights:** `--font-weight-light`, `--font-weight-normal`, `--font-weight-semibold`, `--font-weight-bold`
- **Line Heights:** `--line-height-tight`, `--line-height-normal`, `--line-height-relaxed`

#### Shadows
- **Standard:** `--shadow-xs`, `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-xl`, `--shadow-2xl`
- **Glow Effects:** `--shadow-glow-primary`, `--shadow-glow-success`, `--shadow-glow-danger`, `--shadow-glow-warning`

#### Border Radius
- Scalable: `--radius-xs` (4px) through `--radius-full` (9999px)
- Recommended: `--radius-sm` for small elements, `--radius-lg` for cards and containers

#### Animations
- **Durations:** `--duration-fast` (100ms) through `--duration-slowest` (1000ms)
- **Easing:** `--ease-linear`, `--ease-in`, `--ease-out`, `--ease-in-out`, `--ease-spring`
- **Transitions:** `--transition-base`, `--transition-colors`, `--transition-transform`

---

## UI Components

### Button

**File:** `src/components/ui/Button.js`

Basic interactive button with multiple variants and states.

#### Props
- `variant`: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' (default: 'primary')
- `size`: 'sm' | 'md' | 'lg' (default: 'md')
- `disabled`: boolean (default: false)
- `loading`: boolean (default: false)
- `icon`: ReactNode
- `iconOnly`: boolean (default: false)
- `onClick`: function
- `children`: ReactNode

#### Examples
```jsx
<Button variant="primary" size="md" onClick={handleClick}>
  Click Me
</Button>

<Button icon="🔄" iconOnly variant="ghost" />

<Button loading variant="success">Save Changes</Button>
```

---

### Card

**File:** `src/components/ui/Card.js`

Container component for grouping related content.

#### Props
- `variant`: 'elevated' | 'outlined' | 'filled' (default: 'elevated')
- `hoverable`: boolean (default: true)
- `header`: ReactNode
- `footer`: ReactNode
- `onClick`: function
- `children`: ReactNode

#### Examples
```jsx
<Card variant="elevated" header="Settings">
  <p>Configure your preferences here</p>
</Card>

<Card
  header="Detection"
  footer={<Button>Details</Button>}
  onClick={handleCardClick}
>
  Car detected at 95% confidence
</Card>
```

---

### StatusIndicator

**File:** `src/components/ui/StatusIndicator.js`

Visual status display with animated indicator.

#### Props
- `status`: 'connected' | 'disconnected' | 'loading' | 'error' | 'success' | 'warning' | 'danger'
- `size`: 'sm' | 'md' | 'lg' (default: 'md')
- `animated`: boolean (default: true)
- `label`: string

#### Examples
```jsx
<StatusIndicator status="connected" label="Connected" animated />
<StatusIndicator status="disconnected" size="sm" />
```

---

### Badge

**File:** `src/components/ui/Badge.js`

Small label for classifications and tags.

#### Props
- `variant`: 'default' | 'primary' | 'success' | 'danger' | 'warning' | 'info'
- `size`: 'sm' | 'md' | 'lg' (default: 'md')
- `icon`: ReactNode
- `children`: ReactNode

#### Examples
```jsx
<Badge variant="success">Active</Badge>
<Badge variant="car" icon="🚗">Car</Badge>
<Badge variant="danger" size="lg">Critical</Badge>
```

---

### StatWidget

**File:** `src/components/ui/StatWidget.js`

Display metrics with optional trend indicators.

#### Props
- `value`: string | number
- `label`: string
- `icon`: string | ReactNode
- `trend`: 'up' | 'down' | 'stable'
- `trendPercent`: number
- `color`: 'primary' | 'success' | 'danger' | 'warning' | 'info'

#### Examples
```jsx
<StatWidget
  value={42}
  label="Objects Detected"
  icon="🎯"
  trend="up"
  trendPercent={15}
  color="primary"
/>
```

---

### Alert

**File:** `src/components/ui/Alert.js`

Prominent notification for critical events.

#### Props
- `type`: 'danger' | 'warning' | 'success' | 'info' (default: 'warning')
- `title`: string
- `icon`: ReactNode
- `visible`: boolean (default: true)
- `children`: ReactNode

#### Examples
```jsx
<Alert type="danger" title="Blind Spot Alert!" icon="🚨">
  Obstacle detected in blind spot zone
</Alert>
```

---

### Modal

**File:** `src/components/ui/Modal.js`

Accessible dialog component with keyboard support.

#### Props
- `isOpen`: boolean
- `onClose`: function
- `title`: string
- `footer`: ReactNode
- `size`: 'sm' | 'md' | 'lg' (default: 'md')
- `children`: ReactNode

#### Features
- Closes on Escape key
- Prevents body scroll when open
- Focus trap (should be added)
- Prevents outside click propagation

#### Examples
```jsx
<Modal
  isOpen={isModalOpen}
  onClose={handleClose}
  title="Confirm Action"
  footer={<Button onClick={handleConfirm}>Confirm</Button>}
>
  Are you sure you want to proceed?
</Modal>
```

---

## Specialized Components

### Header

**File:** `src/components/Header/Header.js`

Main dashboard header with navigation and controls.

#### Props
- `isConnected`: boolean
- `serverIP`: string
- `onReconnect`: function
- `onSettings`: function
- `cameraView`: string
- `onCameraChange`: function

---

### StatusDashboard

**File:** `src/components/StatusDashboard/StatusDashboard.js`

Display real-time system metrics.

#### Props
- `objectCount`: number
- `fps`: number
- `alertActive`: boolean
- `connectionStatus`: string

---

### DetectionPanel

**File:** `src/components/DetectionPanel/DetectionPanel.js`

List of detections with filtering capabilities.

#### Props
- `detections`: Array<DetectionObject>

#### Features
- Tabbed interface (All, Blind Spot, Cars, People, Motorcycles)
- Dynamic filtering
- Empty state handling
- Virtual scrolling ready

---

### DetectionCard

**File:** `src/components/DetectionPanel/DetectionCard.js`

Individual detection display with details.

#### Props
- `detection`: DetectionObject
- `index`: number

---

### SettingsModal

**File:** `src/components/Settings/SettingsModal.js`

Configuration dialog for server connection.

#### Props
- `isOpen`: boolean
- `onClose`: function
- `currentIP`: string
- `onSave`: function

#### Features
- IP validation
- Error handling and display
- Helpful hints and examples
- Enter key submission

---

## Usage Guidelines

### Styling with Design Tokens

Always use design tokens instead of hardcoded values:

```jsx
// Good
<div style={{ padding: 'var(--spacing-lg)', color: 'var(--color-text-primary)' }}>
  Content
</div>

// Good - using CSS
.my-element {
  padding: var(--spacing-lg);
  color: var(--color-text-primary);
  border-radius: var(--radius-md);
}

// Avoid
<div style={{ padding: '24px', color: '#ffffff', borderRadius: '12px' }}>
  Content
</div>
```

### Component Composition

Build complex UIs by composing small, focused components:

```jsx
// Good
<Card header={<h3>Detection {index}</h3>}>
  <DetectionCard detection={detection} />
</Card>

// Less ideal
<div className="card">
  <div className="card-header">{detection object}</div>
  {/* Manual structure recreation */}
</div>
```

### Responsive Design

Use CSS media queries with design tokens for responsive behavior:

```css
@media (max-width: 768px) {
  .component {
    padding: var(--spacing-md);
  }
}
```

### Accessibility

- Always provide `aria-label` or label text for icon-only buttons
- Use semantic HTML elements (`button`, `a`, `main`, `nav`)
- Include `aria-describedby` for error messages
- Ensure color is not the only indicator of status
- Test with keyboard navigation

---

## Accessibility

### Keyboard Navigation

All interactive elements are keyboard accessible:
- Buttons: Enter or Space
- Modals: Escape to close
- Tabs: Tab to navigate, Arrow keys within
- Links: Enter to activate

### Screen Reader Support

Components include proper ARIA attributes:
- `aria-label` for icon-only elements
- `aria-describedby` for error messages
- `aria-live` for dynamic updates
- `role` attributes for semantic meaning

### Color Contrast

All text meets WCAG AA standards (4.5:1 for normal text, 3:1 for large text):
- Primary text on dark: 21:1
- Secondary text on dark: ~10:1
- Status colors: minimum 4.5:1

### Reduced Motion

Respects `prefers-reduced-motion` preference for animations.

---

## Performance

### Best Practices

1. **Memoization:** Use `React.memo` for expensive components
2. **Lazy Loading:** Code split large features
3. **Virtual Scrolling:** Implement for large detection lists
4. **Image Optimization:** Compress and optimize assets
5. **Bundle Size:** Monitor component imports

### Optimization Examples

```jsx
// Memoize expensive components
export default React.memo(DetectionCard, (prev, next) => {
  return prev.detection.timestamp === next.detection.timestamp;
});

// Lazy load modals
const SettingsModal = React.lazy(() => import('./SettingsModal'));
```

---

## File Structure

```
src/
├── components/
│   ├── ui/
│   │   ├── Button.js & Button.css
│   │   ├── Card.js & Card.css
│   │   ├── StatusIndicator.js & StatusIndicator.css
│   │   ├── Badge.js & Badge.css
│   │   ├── StatWidget.js & StatWidget.css
│   │   ├── Alert.js & Alert.css
│   │   └── Modal.js & Modal.css
│   ├── Header/
│   │   ├── Header.js
│   │   └── Header.css
│   ├── StatusDashboard/
│   │   ├── StatusDashboard.js
│   │   └── StatusDashboard.css
│   ├── DetectionPanel/
│   │   ├── DetectionPanel.js
│   │   ├── DetectionCard.js
│   │   └── DetectionPanel.css & DetectionCard.css
│   ├── Settings/
│   │   ├── SettingsModal.js
│   │   └── SettingsModal.css
│   ├── Truck3D.js
│   └── DetectionOverlay.js
├── styles/
│   ├── variables.css (Design tokens)
│   ├── animations.css (Keyframe animations)
│   ├── responsive.css (Responsive utilities)
│   └── accessibility.css (Accessibility features)
├── App.js
└── App.css
```

---

## Migration Notes

### From Old to New

The dashboard has been refactored from inline styles and monolithic components to a modern, component-based architecture:

- **Old:** Hardcoded styles and colors
- **New:** Centralized design tokens with CSS variables

- **Old:** Large, complex component files
- **New:** Small, focused, reusable components

- **Old:** Inline settings panel
- **New:** Accessible modal dialog

- **Old:** Basic inline detection list
- **New:** Tabbed, filterable detection panel

---

## Future Enhancements

1. **Storybook Integration:** Component documentation and testing
2. **Theme Switching:** Light mode support
3. **Internationalization:** Multi-language support
4. **Animation Library:** Framer Motion for advanced animations
5. **State Management:** Context API or Redux for complex state
6. **Testing:** Unit and integration test suite
7. **Analytics:** User interaction tracking
8. **Dark Mode Toggle:** User preference persistence

---

## Support & Contribution

For questions or improvements to this component library, please refer to the main project README or contact the development team.

Last Updated: 2026-03-02
