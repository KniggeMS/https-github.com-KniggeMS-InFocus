# Technical Context: Mobile Polishing & UI

## 🧪 Testing Strategy (Playwright)

### Authentication Bypass
Standard Supabase Authentication requires email confirmation, which blocks automated tests.
We implemented a **Test Mode Backdoor** in `contexts/AuthContext.tsx`.

- **Mechanism:** `AuthContext` checks for `localStorage.getItem('TEST_MODE_USER')`.
- **Usage:** In Playwright tests (`test.beforeEach`), inject a JSON user object into this key before reloading the page.
- **Security:** Purely client-side override; does not grant actual backend access (RLS still protects data), but sufficient for UI testing.

### Selectors
- **Mobile Navigation:** Is a `div` (not `nav`) with class `.fixed.bottom-4`.
- **Glass Panels:** There are multiple `.glass-panel` elements (Nav, BottomSheets). Use `.filter({ hasText: ... })` or specific hierarchy locators to distinguish.

---

## 🎨 Theme System (Design Lab)

### CSS Variables
Theming relies on CSS variables defined in `index.css`.
- **Implementation:** `ThemeContext` applies classes (`theme-dark`, `theme-light`, `theme-glass`) to the `<html>` root element.
- **Tailwind Integration:** `tailwind.config.js` **must** use these variables (e.g., `bg-[var(--bg-main)]`) instead of hardcoded hex values for themes to work effectively.
- **Current Status:** Basic variable structure exists. Full migration of hardcoded colors in components to semantic Tailwind classes (e.g., `bg-card` instead of `bg-[#151a23]`) is pending.

### Z-Index Management
- **Modals:** Design Lab Modal uses `z-[120]` to stay above everything.
- **Close Button:** Requires `z-50` relative to the modal container to sit above decorative blur effects.

---

## 📱 Mobile Layout Specifics

- **Navigation:**
  - **Desktop:** Sidebar (`aside`)
  - **Mobile:** Bottom Navigation Bar (`MobileNav.tsx`) + Bottom Sheet (`BottomSheet.tsx`) for lists.
- **AI Recommendation:**
  - **Desktop:** Embedded in Sidebar.
  - **Mobile:** Floating Action Button (FAB) at bottom-left.
  - **Duplicate Prevention:** `AiRecommendationButton.tsx` accepts a `mobileFabOnly` prop to control rendering context.
