const prettier = require('prettier');
const { readFileSync } = require('fs');
const { resolve } = require('path');
const TEST_PATH = resolve(__dirname, './raw');

function test(filepath) {
    const code = readFileSync(filepath, 'utf8');
    const formatted = prettier.format(code, {
        parser: 'wxml-parse',
        plugins: ['./src/index']
    });
    const filename = filepath.split('/').pop();
    const expectedPath = resolve(__dirname, filename);
    const expectedContent = readFileSync(expectedPath, 'utf-8');
    if (formatted !== expectedContent) {
        console.error(filename + 'prettier format failed');
    }
}

function batchTest() {
    const files = require('glob').sync(resolve(TEST_PATH, './**/*.wxml'));
    files.forEach(file => {
        test(file);
    });
}

batchTest();
