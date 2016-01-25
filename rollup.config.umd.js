import config from './rollup.config';

config.dest = 'dist/inline-variable.umd.js';
config.format = 'umd';
config.moduleName = 'inline';

export default config;
