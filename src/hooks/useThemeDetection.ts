import { useState, useEffect } from 'react';

export const useThemeDetection = () => {
  const [isLightTheme, setIsLightTheme] = useState(false);

  useEffect(() => {
    const checkTheme = () => {
      const root = document.documentElement;
      const hasLightClass = root.classList.contains('theme-light');
      const hasDarkClass = root.classList.contains('theme-dark');
      
      // If system theme, check the actual computed theme
      if (!hasLightClass && !hasDarkClass) {
        // Fallback to checking system preference
        const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        setIsLightTheme(!isDark);
      } else {
        setIsLightTheme(hasLightClass);
      }
    };

    // Initial check
    checkTheme();

    // Create observer to watch for theme class changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          checkTheme();
        }
      });
    });

    // Observe changes to the document element's class
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    // Also listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = () => checkTheme();
    mediaQuery.addEventListener('change', handleSystemThemeChange);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, []);

  return { isLightTheme };
};