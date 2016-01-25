var isWindows = process.platform === 'win32';
export const resolve = isWindows ? win32_resolve : posix_resolve;
export const join = isWindows ? win32_join : posix_join;
