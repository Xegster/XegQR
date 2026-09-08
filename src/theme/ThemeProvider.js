import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * ThemeProvider — the single source of truth for colour in XegQR.
 *
 * Deliberately mirrors the NetXegManager / PoGoManager theme model so the three
 * apps stay interchangeable: a React context exposing `{ theme, colors, isDark,
 * tokens, setTheme, setColors }`, consumed everywhere via `useTheme()`.
 *
 * `theme` is 'Night' | 'Day'. `tokens` is the flat object components actually
 * read — surface/text/border roles derived from `isDark`, spread over the three
 * user-facing accent colours so `tokens.PrimaryColor` and `tokens.background`
 * are reachable the same way.
 *
 * Accent colours are already plumbed through even though the app currently only
 * ships a light/dark toggle — that keeps a future "pick your own accent" screen
 * from needing any restructuring here or in consuming components.
 */

const ThemeContext = createContext(null);

export const DEFAULT_COLORS = {
  PrimaryColor: '#6d5efc',
  SecondaryColor: '#a855f7',
  TertiaryColor: '#22d3ee',
};

export function ThemeProvider({ children, initialTheme = 'Night', initialColors = {} }) {
  const [theme, setThemeState] = useState(initialTheme);
  const [colors, setColorsState] = useState({
    PrimaryColor: initialColors.PrimaryColor || DEFAULT_COLORS.PrimaryColor,
    SecondaryColor: initialColors.SecondaryColor || DEFAULT_COLORS.SecondaryColor,
    TertiaryColor: initialColors.TertiaryColor || DEFAULT_COLORS.TertiaryColor,
  });

  // initialTheme/initialColors only seed state above — without these effects a
  // theme restored asynchronously from AsyncStorage (which re-renders this
  // provider with new props) would never reach the UI, since useState ignores
  // prop changes after mount.
  useEffect(() => {
    setThemeState(initialTheme);
  }, [initialTheme]);

  useEffect(() => {
    setColorsState({
      PrimaryColor: initialColors.PrimaryColor || DEFAULT_COLORS.PrimaryColor,
      SecondaryColor: initialColors.SecondaryColor || DEFAULT_COLORS.SecondaryColor,
      TertiaryColor: initialColors.TertiaryColor || DEFAULT_COLORS.TertiaryColor,
    });
  }, [initialColors.PrimaryColor, initialColors.SecondaryColor, initialColors.TertiaryColor]);

  const isDark = theme === 'Night';

  const tokens = {
    background: isDark ? '#0d0d10' : '#f4f4f7',
    surface: isDark ? '#17171c' : '#ffffff',
    surfaceAlt: isDark ? '#212129' : '#ebebf0',
    text: isDark ? '#f5f5f7' : '#121216',
    textMuted: isDark ? '#a0a0ad' : '#61616e',
    border: isDark ? '#2c2c36' : '#dcdce4',
    danger: '#e5484d',
    success: '#30a46c',
    warning: '#f5a524',
    ...colors,
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        colors,
        isDark,
        tokens,
        setTheme: setThemeState,
        toggleTheme: () => setThemeState((t) => (t === 'Night' ? 'Day' : 'Night')),
        setColors: (c) => setColorsState((prev) => ({ ...prev, ...c })),
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
