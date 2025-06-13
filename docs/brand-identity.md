# Juice Coaching Platform Brand Identity

This document outlines the brand identity and design system for the Juice Coaching Platform. It serves as a reference for maintaining consistency across the application.

## Table of Contents
- [Colors](#colors)
- [Typography](#typography)
- [Spacing](#spacing)
- [Components](#components)
- [Layout](#layout)
- [Behavior](#behavior)

## Colors

### Primary Colors
- **Lime Green** (`#D2FF28`): The primary brand color, used for CTAs, highlights, and brand elements.
  - Usage: Primary buttons, accents, active states, and brand elements.
  - CSS Variable: `--primary`
  - Tailwind: `primary`

### Secondary Colors
- **White/Light Gray** (`#F5F5F5`): Used for backgrounds and secondary elements.
  - Usage: Secondary buttons, backgrounds, and non-primary elements.
  - CSS Variable: `--secondary`
  - Tailwind: `secondary`

### Neutral Colors
- **Black** (`#000000`): Used for text and high-contrast elements.
  - Usage: Primary text, headings, and high-contrast UI elements.
  - Tailwind: `text-black`
- **Dark Gray** (`#555555`): Used for secondary text and less prominent elements.
  - Usage: Secondary text, labels, and less prominent UI elements.
  - Tailwind: `text-darkgray`
- **Light Gray** (`#999999`): Used for tertiary text and subtle elements.
  - Usage: Tertiary text, placeholders, and subtle UI elements.
  - Tailwind: `text-lightgray`

### Status Colors
- **Success** (`#22C55E`): Indicates successful actions or positive status.
  - Usage: Success messages, completed states, and positive indicators.
  - Tailwind: `text-success`, `bg-success`
- **Warning** (`#F59E0B`): Indicates warnings or caution.
  - Usage: Warning messages, cautionary states, and attention indicators.
  - Tailwind: `text-warning`, `bg-warning`
- **Error** (`#EF4444`): Indicates errors or negative status.
  - Usage: Error messages, failed states, and negative indicators.
  - Tailwind: `text-error`, `bg-error`
- **Info** (`#3B82F6`): Indicates informational content.
  - Usage: Informational messages, neutral states, and informational indicators.
  - Tailwind: `text-info`, `bg-info`

### Color Usage Guidelines
1. **Primary Color (Lime Green)** should be used sparingly to highlight important actions or information.
2. **Black Text on White Background** should be used for primary content for maximum readability.
3. **Status Colors** should only be used to indicate the respective status and not for general UI elements.
4. **Maintain Contrast Ratios** of at least 4.5:1 for normal text and 3:1 for large text to ensure accessibility.

## Typography

### Fonts
- **Primary Font**: Sen (sans-serif)
  - Usage: Headings, buttons, and primary UI elements.
  - CSS: `font-family: var(--font-sen), sans-serif;`
  - Tailwind: `font-primary`
- **Secondary Font**: Inter (sans-serif)
  - Usage: Body text, labels, and secondary UI elements.
  - CSS: `font-family: var(--font-inter), sans-serif;`
  - Tailwind: `font-secondary`

### Font Sizes
- **Heading 1**: 32px, Bold (700)
  - Usage: Page titles and main headings.
  - CSS: `.h1, h1 { font-size: 32px; font-weight: 700; }`
- **Heading 2**: 24px, Bold (700)
  - Usage: Section headings and important subheadings.
  - CSS: `.h2, h2 { font-size: 24px; font-weight: 700; }`
- **Heading 3**: 18px, Semi-Bold (600)
  - Usage: Subsection headings and card titles.
  - CSS: `.h3, h3 { font-size: 18px; font-weight: 600; }`
- **Body Text**: 14px, Regular (400)
  - Usage: Main content text and general UI text.
  - CSS: `.body, p { font-size: 14px; }`
- **Small Text**: 12px, Regular (400)
  - Usage: Labels, captions, and secondary information.
  - CSS: `.text-small { font-size: 12px; }`

### Typography Usage Guidelines
1. **Maintain Hierarchy**: Use appropriate heading levels to establish content hierarchy.
2. **Consistent Line Heights**: Use 1.5 for body text and 1.2 for headings.
3. **Text Alignment**: Left-align text for better readability (except for specific UI elements like centered buttons).
4. **Font Weight**: Use bold (700) for emphasis and regular (400) for body text.

## Spacing

### Base Unit
The base unit for spacing is 4px. All spacing values should be multiples of this base unit.

### Margin and Padding
- **Extra Small**: 4px (`p-1`, `m-1`)
  - Usage: Minimal spacing between closely related elements.
- **Small**: 8px (`p-2`, `m-2`)
  - Usage: Spacing between related elements within a component.
- **Medium**: 16px (`p-4`, `m-4`)
  - Usage: Standard spacing between components or sections.
- **Large**: 24px (`p-6`, `m-6`)
  - Usage: Generous spacing between major sections.
- **Extra Large**: 32px (`p-8`, `m-8`)
  - Usage: Maximum spacing for significant separation.

### Layout Spacing
- **Container Padding**: 16px on mobile, 24px on tablet, 32px on desktop
  - Usage: Padding around main content containers.
  - Tailwind: `px-4 sm:px-6 md:px-8 lg:px-20`
- **Section Spacing**: 32px between major sections
  - Usage: Vertical spacing between major page sections.
  - Tailwind: `mb-8`
- **Component Spacing**: 16px between components
  - Usage: Vertical spacing between components within a section.
  - Tailwind: `mb-4`

### Spacing Usage Guidelines
1. **Consistent Spacing**: Use consistent spacing values throughout the application.
2. **Responsive Spacing**: Adjust spacing based on screen size for optimal layout.
3. **Breathing Room**: Ensure adequate spacing around elements for better readability and focus.
4. **Group Related Items**: Use smaller spacing for related items and larger spacing for unrelated items.

## Components

### Buttons
- **Primary Button**: Lime green background with black text
  - Usage: Primary actions and main CTAs.
  - Tailwind: `bg-primary text-primary-foreground`
  - Padding: 16px horizontal, 8px vertical (`px-4 py-2`)
  - Border Radius: 8px (rounded-md) or full (rounded-full)
- **Secondary Button**: Light gray background with black text
  - Usage: Secondary actions and alternative CTAs.
  - Tailwind: `bg-secondary text-secondary-foreground`
  - Padding: 16px horizontal, 8px vertical (`px-4 py-2`)
  - Border Radius: 8px (rounded-md)
- **Ghost Button**: Transparent background with text color
  - Usage: Tertiary actions and subtle CTAs.
  - Tailwind: `bg-transparent hover:bg-accent hover:text-accent-foreground`
  - Padding: 16px horizontal, 8px vertical (`px-4 py-2`)
  - Border Radius: 8px (rounded-md)
- **Destructive Button**: Red background with white text
  - Usage: Destructive actions like delete or remove.
  - Tailwind: `bg-error text-error-foreground`
  - Padding: 16px horizontal, 8px vertical (`px-4 py-2`)
  - Border Radius: 8px (rounded-md)

### Cards
- **Standard Card**: White background with light gray border
  - Usage: Content containers and information display.
  - Tailwind: `bg-white border border-gray-200 rounded-lg shadow-sm`
  - Padding: 24px (`p-6`)
  - Border Radius: 8px (rounded-lg)
- **Interactive Card**: White background with hover effect
  - Usage: Clickable cards and interactive elements.
  - Tailwind: `bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow`
  - Padding: 24px (`p-6`)
  - Border Radius: 8px (rounded-lg)

### Form Elements
- **Input Fields**: White background with gray border
  - Usage: Text input and form fields.
  - Tailwind: `bg-background border border-input rounded-md px-3 py-2`
  - Height: 40px (`h-10`)
  - Border Radius: 6px (rounded-md)
- **Checkboxes and Radio Buttons**: Custom styled with brand colors
  - Usage: Selection and toggle options.
  - See shadcn/ui components for implementation details.
- **Dropdowns and Select**: Custom styled with brand colors
  - Usage: Selection from multiple options.
  - See shadcn/ui components for implementation details.

### Component Usage Guidelines
1. **Consistent Styling**: Use consistent styling for similar components.
2. **Interactive States**: Implement hover, focus, and active states for interactive elements.
3. **Accessibility**: Ensure all components meet accessibility standards (contrast, focus indicators, etc.).
4. **Responsive Design**: Design components to work well across all screen sizes.

## Layout

### Grid System
- **Container Width**: Max width of 1280px for main content
  - Usage: Main content container.
  - Tailwind: `max-w-[1280px] mx-auto`
- **Column Layout**: 12-column grid system
  - Usage: Page layout and content organization.
  - Tailwind: Use flex or grid utilities as needed.
- **Breakpoints**:
  - Mobile: < 640px
  - Tablet: 640px - 1024px
  - Desktop: > 1024px

### Page Structure
- **Header**: Fixed height of 64px
  - Usage: Main navigation and branding.
  - Contains: Logo, navigation, user menu.
- **Main Content**: Flexible height with minimum viewport height
  - Usage: Primary page content.
  - Tailwind: `min-h-screen`
- **Footer**: Optional, used on public pages
  - Usage: Secondary navigation and legal information.

### Layout Usage Guidelines
1. **Responsive Design**: Design layouts to work well across all screen sizes.
2. **Consistent Structure**: Maintain consistent page structure across the application.
3. **White Space**: Use adequate white space to improve readability and focus.
4. **Content Priority**: Organize content based on importance and user flow.

## Behavior

### Interactions
- **Hover Effects**: Subtle background color change or shadow increase
  - Usage: Interactive elements like buttons, links, and cards.
  - Tailwind: `hover:bg-primary/90`, `hover:shadow-md`
- **Focus States**: Visible outline or ring for keyboard navigation
  - Usage: Interactive elements for accessibility.
  - Tailwind: `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`
- **Active States**: Slightly darker or more saturated colors
  - Usage: Currently active elements like selected tabs or buttons being pressed.
  - Tailwind: `active:bg-primary/80`

### Animations
- **Transitions**: Smooth transitions for state changes (300ms duration)
  - Usage: Hover effects, expanding/collapsing elements, and state changes.
  - Tailwind: `transition-colors duration-300`
- **Loading States**: Skeleton loaders or spinner animations
  - Usage: Content loading and asynchronous operations.
  - Component: `LoadingSpinner`
- **Micro-interactions**: Subtle animations for feedback (scale, fade, etc.)
  - Usage: User actions and system feedback.
  - Tailwind: `animate-fadeIn`, custom animations as needed.

### Feedback
- **Toast Notifications**: Temporary messages for user feedback
  - Usage: Success, error, warning, and info messages.
  - Component: `useToast` hook and Toast component.
- **Form Validation**: Inline validation with appropriate colors and icons
  - Usage: Form input validation and feedback.
  - Colors: Error (red), Success (green)
- **Empty States**: Friendly messages and illustrations for empty content
  - Usage: Empty lists, search results, and content areas.
  - Component: `EmptyState`

### Behavior Usage Guidelines
1. **Consistent Feedback**: Provide consistent feedback for similar actions.
2. **Performance**: Keep animations and transitions performant (avoid layout thrashing).
3. **Accessibility**: Ensure all interactions are accessible via keyboard and screen readers.
4. **Progressive Enhancement**: Design interactions that degrade gracefully when not supported.

## Implementation Notes

### CSS Variables
The design system is implemented using CSS variables for colors, spacing, and other properties. These variables are defined in `globals.css` and can be accessed throughout the application.

### Tailwind Configuration
The design system is implemented using Tailwind CSS with a custom configuration in `tailwind.config.js`. This configuration includes custom colors, spacing, and other properties.

### Component Library
The design system is implemented using shadcn/ui components with custom styling. These components are located in the `components/ui` directory.

### Utility Functions
The design system includes utility functions for common tasks like combining class names (`cn` function in `lib/utils.ts`).
