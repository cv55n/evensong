import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        exclude: [
            '**/node_modules',
            '**/dist',
            '.idea',
            '.git',
            '.cache'
        ],

        passWithNoTests: true,

        typecheck: {
            enabled: true,

            tsconfig: './tsconfig.test.json'
        },

        coverage: {
            enabled: true,

            reporter: ['text', 'lcov', 'cobertura'],

            provider: 'v8',

            include: ['src'],

            exclude: [
                // todos os arquivos ts que contém apenas types
                '**/*.{interface,type,d}.ts',

                // todos os arquivos index que devem conter exports
                '**/index.{js,ts}',

                // todos os arquivos de exportações
                '**/exports/*.{js,ts}'
            ]
        }
    }
});