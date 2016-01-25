export const resolve = (process.platform === 'win32') ? win32_resolve : posix_resolve;
export const join = (process.platform === 'win32') ? win32_join : posix_join;
