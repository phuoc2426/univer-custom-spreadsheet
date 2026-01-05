import { defineConfig } from 'tsup';

export default defineConfig({
    entry: {
        index: 'src/index.ts',
    },
    format: ['cjs', 'esm'],
    dts: true,
    clean: true,
    splitting: false,
    sourcemap: true,
    minify: false,
    // Bundle all dependencies into the output
    noExternal: [
        '@univerjs/core',
        '@univerjs/design',
        '@univerjs/docs',
        '@univerjs/docs-ui',
        '@univerjs/engine-formula',
        '@univerjs/engine-render',
        '@univerjs/sheets',
        '@univerjs/sheets-formula',
        '@univerjs/sheets-ui',
        '@univerjs/ui',
        'rxjs',
    ],
    // Keep react as external (user provides it)
    external: ['react', 'react-dom'],
    esbuildOptions(options) {
        options.jsx = 'automatic';
    },
});
