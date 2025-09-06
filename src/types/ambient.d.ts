declare module 'uuid' {
  export function v4(): string;
}

declare module 'jest-axe' {
  export const axe: (container: Element | Document, options?: any) => Promise<any>;
}
