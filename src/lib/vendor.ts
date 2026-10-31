import path from 'node:path';

// src/lib and dist/lib are both two levels below the package root, so this
// resolves the same when running from source and from the build.
const vendorDir = path.resolve(import.meta.dirname, '../../vendor');

/** Absolute path to a file in the bundled `vendor/` directory. */
export function vendorPath(...segments: string[]): string {
  return path.join(vendorDir, ...segments);
}
