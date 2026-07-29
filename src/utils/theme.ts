export const colors = {
  primary: "#1DB954",
  secondary: "#1ed760",
  background: "#121212",
  surface: "#282828",
  surfaceVariant: "#333333",
  onSurface: "#ffffff",
  onSurfaceVariant: "#b3b3b3",
  error: "#cf6679",
  onError: "#000000",
  outline: "#404040",
} as const;

export const theme = {
  colors,
  roundness: 12,
} as const;

export const boxShadows = {
  small: {
    boxShadowColor: "#000",
    boxShadowOffset: { width: 0, height: 2 },
    boxShadowOpacity: 0.25,
    boxShadowRadius: 4,
    elevation: 4,
  },
  medium: {
    boxShadowColor: "#000",
    boxShadowOffset: { width: 0, height: 4 },
    boxShadowOpacity: 0.3,
    boxShadowRadius: 8,
    elevation: 8,
  },
  large: {
    boxShadowColor: "#000",
    boxShadowOffset: { width: 0, height: 8 },
    boxShadowOpacity: 0.4,
    boxShadowRadius: 16,
    elevation: 12,
  },
} as const;
