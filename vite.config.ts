import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { writeFileSync, mkdirSync, readFileSync, rmSync } from 'fs'
import { join } from 'path'

// Plugin to move HTML files to correct locations
function moveHtmlFiles() {
  return {
    name: 'move-html-files',
    writeBundle() {
      const distDir = resolve(__dirname, 'dist')
      
      // Move popup HTML
      const popupSrc = join(distDir, 'src/popup/index.html')
      const popupDest = join(distDir, 'popup/index.html')
      mkdirSync(join(distDir, 'popup'), { recursive: true })
      writeFileSync(popupDest, readFileSync(popupSrc))
      
      // Move options HTML
      const optionsSrc = join(distDir, 'src/options/index.html')
      const optionsDest = join(distDir, 'options/index.html')
      mkdirSync(join(distDir, 'options'), { recursive: true })
      writeFileSync(optionsDest, readFileSync(optionsSrc))
      
      // Move tabs HTML
      const tabsSrc = join(distDir, 'src/tabs/index.html')
      const tabsDest = join(distDir, 'tabs/index.html')
      mkdirSync(join(distDir, 'tabs'), { recursive: true })
      writeFileSync(tabsDest, readFileSync(tabsSrc))
      
      // Remove src directory
      rmSync(join(distDir, 'src'), { recursive: true, force: true })
    }
  }
}

export default defineConfig({
  plugins: [
    react({
      // Enable React 18 features
      jsxRuntime: 'automatic',
    }),
    moveHtmlFiles()
  ],
  build: {
    outDir: 'dist',
    target: 'es2022',
    rollupOptions: {
      input: {
        'popup/index': resolve(__dirname, 'src/popup/index.html'),
        'options/index': resolve(__dirname, 'src/options/index.html'),
        'tabs/index': resolve(__dirname, 'src/tabs/index.html'),
        background: resolve(__dirname, 'src/background.ts'),
        content: resolve(__dirname, 'src/content.ts')
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom']
  }
})
