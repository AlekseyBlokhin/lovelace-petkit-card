import esbuild from 'esbuild';

const watch = process.argv.includes('--watch');

const options = {
  entryPoints: ['src/index.js'],
  bundle: true,
  format: 'esm',
  target: ['es2020'],
  outfile: 'dist/petkit-puramax-card.js',
  minify: true,
  sourcemap: true,
};

if (watch) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
  console.log('esbuild watching for changes...');
} else {
  await esbuild.build(options);
  console.log(`Built ${options.outfile}`);
}
