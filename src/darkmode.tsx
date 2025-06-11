import { useEffect, useState } from "react";

const useDarkModeState = (): [
  boolean,
  React.Dispatch<React.SetStateAction<boolean>>,
] => {
  const [darkMode, setDarkMode] = useState(false);

  // Detect system dark mode preference and listen for changes
  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia(
      "(prefers-color-scheme: dark)",
    );
    // Set initial dark mode state based on system setting
    setDarkMode(darkModeMediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setDarkMode(event.matches);
    };

    darkModeMediaQuery.addEventListener("change", handleChange);
    return () => darkModeMediaQuery.removeEventListener("change", handleChange);
  }, []);

  return [darkMode, setDarkMode];
};

export default useDarkModeState;
