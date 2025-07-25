---
applyTo: '**'
---

Coding standards, domain knowledge, and preferences that AI should follow.

## Styling & Theming

- **Always** import and use the `useColorScheme` hook from `@/hooks/useColorScheme` when a component depends on color theming.
- All color values must come from the `Colors` object imported from `@/constants/Colors`.
- Reference all colors as `colors.primary`, `colors.background`, etc.
- Do not hardcode hex codes, Tailwind `text-*` or `bg-*` color classes unless they are explicitly defined within `Colors`.
- The correct pattern for color usage is:
  - Call `const { colorScheme } = useColorScheme();`
  - Get colors with `const colors = Colors[colorScheme];`
  - Use `colors` in your styles, e.g. `<Text style={{ color: colors.primary }} />`
- If you need to use a color that is not present in `colors`, add it to the `Colors` object and update the hook accordingly.
- **Use the `/app/track.tsx` page as the reference implementation for correct color and style usage.**  
  - Example:  
    ```tsx
    import { useColorScheme } from '@/hooks/useColorScheme';
    import { Colors } from '@/constants/Colors';

    const { colorScheme } = useColorScheme();
    const colors = Colors[colorScheme];
    <Text style={{ color: colors.primary }} />
    <SafeAreaView style={{ backgroundColor: colors.background }} />
    ```
  - All color usage in styles (including StyleSheet and inline) must reference the `colors` object as shown above and in the track page.

**Correct usage example:**
```tsx
const { colorScheme } = useColorScheme();
const colors = Colors[colorScheme];
<Text style={{ color: colors.primary }} />
```

**Incorrect usage example:**
```tsx
const { colors } = useColorScheme();
<Text style={{ color: colors.primary }} />
```

## CSS & Styling Practices

- Minimize use of inline styles (e.g. `style={{ ... }}`) unless dynamically required.
- Avoid writing per-page styles (e.g. CSS Modules or scoped styles inside a single page/component).
- Prefer reusable utility classes (like Tailwind) or global styling conventions defined in the project.
- If a component needs unique styles, abstract them into a shared component or styling file.
- **Reference `/app/track.tsx` for best practices on combining StyleSheet and dynamic color usage.**

## Code Style

- Use functional components and React hooks.
- Keep JSX clean and readable, breaking into smaller components as needed.
- Only import what you use; avoid unnecessary imports.
- Follow existing naming conventions, file structures, and import aliases.

## Other Project-Specific Practices

- Respect alias imports (e.g., `@/hooks`, `@/components`, etc.) — do not use relative imports like `../../hooks`.
- Default exports are discouraged; prefer named exports for components
