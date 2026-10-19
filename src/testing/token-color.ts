/** Takes the name of a color token (`--color-ink`); returns the color it resolves to in the page, as the browser writes a computed color (`rgb(43, 43, 43)`), so a test can compare it with the computed `fill`, `stroke` or `color` of an element. */
export function tokenColor(token: string): string {
  const probe = document.body.appendChild(document.createElement('div'));
  probe.style.color = `var(${token})`;
  const { color } = getComputedStyle(probe);
  probe.remove();
  return color;
}
