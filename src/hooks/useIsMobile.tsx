// Custom hook to detect mobile screens
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 899px)");

    const handleChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    }

    // Set initial value
    setIsMobile(mediaQuery.matches);

    // Listen for changes
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    }
  }, [])

  return isMobile;
}

export default useIsMobile;