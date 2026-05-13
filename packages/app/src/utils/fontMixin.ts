/**
 * Replaces theme.fontMixin from react-jss theme.
 * Produces the same CSS properties as the original @getstation/theme fontMixin.
 */
export const fontMixin = (size: number, weight: string | number = 'normal'): React.CSSProperties => ({
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
  fontSize: size,
  fontWeight: typeof weight === 'number' ? weight : weight,
});