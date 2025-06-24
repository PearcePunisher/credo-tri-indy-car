---
applyTo: '**'
---

Coding standards, domain knowledge, and preferences that AI should follow.

## Styling & Theming

- Always import and use the `useColorScheme` hook from `@/hooks/useColorScheme` when a component depends on color theming.
- All color values must come from the `Colors` object imported from `@/constants/Colors`.
- Do not hardcode hex codes, Tailwind `text-*` or `bg-*` color classes unless they are explicitly defined within `Colors`.
- **Always destructure the hook as:** `const { colors } = useColorScheme();`
- **Never** use `const colorScheme = useColorScheme()` and then index into `Colors[colorScheme]`.
- Reference all colors as `colors.primary`, `colors.background`, etc.
- Ensure your `useColorScheme` hook returns an object with a `colors` property. If it does not, update the hook to match this convention.
- If you need to use a color that is not present in `colors`, add it to the `Colors` object and update the hook accordingly.

**Correct usage example:**
```tsx
const { colors } = useColorScheme();
<Text style={{ color: colors.primary }} />
```

**Incorrect usage example:**
```tsx
const colorScheme = useColorScheme();
const colors = Colors[colorScheme];
<Text style={{ color: colors.primary }} />
```

## CSS & Styling Practices

- Minimize use of inline styles (e.g. `style={{ ... }}`) unless dynamically required.
- Avoid writing per-page styles (e.g. CSS Modules or scoped styles inside a single page/component).
- Prefer reusable utility classes (like Tailwind) or global styling conventions defined in the project.
- If a component needs unique styles, abstract them into a shared component or styling file.

## Code Style

- Use functional components and React hooks.
- Keep JSX clean and readable, breaking into smaller components as needed.
- Only import what you use; avoid unnecessary imports.
- Follow existing naming conventions, file structures, and import aliases.

## Other Project-Specific Practices

- Respect alias imports (e.g., `@/hooks`, `@/components`, etc.) — do not use relative imports like `../../hooks`.
- Default exports are discouraged; prefer named exports for components and hooks.
