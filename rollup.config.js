import babel from 'rollup-plugin-babel';

export default {
  entry: 'index.js',
  plugins: [babel({
    babelrc: false,
    presets: ['es2015-rollup'],
    plugins: ['syntax-flow', 'transform-flow-strip-types']
  })]
};
