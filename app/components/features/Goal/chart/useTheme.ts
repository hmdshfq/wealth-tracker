import { useEffect, useState } from 'react';

export function useTheme() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const checkTheme = () => {
      const htmlElement = document.documentElement;
      const dataTheme = htmlElement.getAttribute('data-theme');
      setTheme(dataTheme === 'light' ? 'light' : 'dark');
    };

    checkTheme();

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          checkTheme();
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });

    return () => observer.disconnect();
  }, []);

  return theme;
}
