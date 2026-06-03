import "@testing-library/jest-dom/vitest";

// Provide a working localStorage implementation for jsdom environments
// where --localstorage-file is passed without a valid path.
const buildLocalStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, val: string) => { store[key] = String(val); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    key: (n: number) => Object.keys(store)[n] ?? null,
    get length() { return Object.keys(store).length; },
  };
};

Object.defineProperty(window, "localStorage", {
  value: buildLocalStorageMock(),
  writable: true,
});
