import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import glsl from 'vite-plugin-glsl';

export default defineConfig({
    clearScreen: false,
    base: '/RAUG-AR-Cahet-Codron/',

    build: {
        sourcemap: true,
        outDir: 'dist',
        assetsDir: 'assets',
        minify: 'esbuild',
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            output: {
                manualChunks: (id) => {
                    if (id.includes('node_modules/three/')) {
                        if (id.includes('examples/jsm/')) {
                            return 'three.examples';
                        }
                        return 'three.core';
                    }
                }
            }
        }
    },

    resolve: {
        alias: {
            'three': 'three',
            'three/addons/': 'three/examples/jsm/',
            '@three/examples/': 'three/examples/jsm/'
        }
    },

    optimizeDeps: {
        include: [
            'three',
            'three/examples/jsm/controls/OrbitControls',
            'three/examples/jsm/loaders/GLTFLoader',
            'three/examples/jsm/loaders/DRACOLoader'
        ]
    },

    plugins: [
        viteStaticCopy({
            targets: [
                { src: 'node_modules/three/examples/jsm/libs/ammo.wasm.js', dest: 'jsm/libs/' },
                { src: 'node_modules/three/examples/jsm/libs/ammo.wasm.wasm', dest: 'jsm/libs/' },
                { src: 'node_modules/three/examples/jsm/libs/draco/gltf/draco_decoder.js', dest: 'jsm/libs/draco/gltf' },
                { src: 'node_modules/three/examples/jsm/libs/draco/gltf/draco_decoder.wasm', dest: 'jsm/libs/draco/gltf/' },
                { src: 'node_modules/three/examples/jsm/libs/draco/gltf/draco_encoder.js', dest: 'jsm/libs/draco/gltf/' },
                { src: 'node_modules/three/examples/jsm/libs/draco/gltf/draco_wasm_wrapper.js', dest: 'jsm/libs/draco/gltf/' }
            ],
            hook: 'buildEnd'
        }),
        glsl()
    ],

    server: {
        host: true,
        port: 3000
    }
})