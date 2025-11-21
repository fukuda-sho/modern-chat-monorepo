# [ADR-004] UI Library (shadcn/ui)

## Status
Accepted

## Context
We need a UI component library to build a professional, accessible, and responsive interface quickly. We want to avoid "fighting the framework" when customization is needed.

### Alternatives Considered
- **Material UI (MUI):** Comprehensive but heavy bundle size and distinct "Google" look. Hard to customize deeply without overriding complex styles.
- **Chakra UI:** Good developer experience but relies on runtime CSS-in-JS, which can have performance costs in React Server Components (RSC).
- **Tailwind CSS (Raw):** Maximum flexibility but requires building every component (Modals, Dropdowns) from scratch, slowing down development.

## Decision
We have decided to use **shadcn/ui**.

shadcn/ui is not a component library in the traditional sense (npm install) but a collection of re-usable components built with **Radix UI** (for accessibility/logic) and **Tailwind CSS** (for styling) that we copy and paste into our project.

## Consequences

- **Good:**
    - **Ownership:** The code lives in our project. We have full control to modify any component's logic or style.
    - **Performance:** Uses Tailwind (utility classes) and Radix (headless), resulting in zero runtime CSS overhead and minimal bundle size.
    - **Accessibility:** Radix UI primitives ensure WAI-ARIA compliance out of the box.
    - **Modern Aesthetic:** Provides a clean, modern default design that is easy to theme.

- **Bad:**
    - **Maintenance:** Since we own the code, we are responsible for updating the components if the upstream source changes (though this is rare for base primitives).
    - **Setup:** Requires slightly more initial setup (installing dependencies for each component) compared to a monolithic library like MUI.
