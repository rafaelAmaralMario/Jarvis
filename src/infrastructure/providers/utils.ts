export function trimUrl(value: string) {
  return value.replace(/\/+$/, '');
}

export function delay(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}
