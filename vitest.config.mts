import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    watch: false,
    coverage: {
      provider: 'v8',
      enabled: true,
      thresholds: {
        branches: 90,
        lines: 90
      },
      reportOnFailure: true,
    },
    reporters: ['junit'],
    outputFile: {
      junit: './build/junit-report.xml'
    }
  },
  resolve: {
    tsconfigPaths: true,
  }
})