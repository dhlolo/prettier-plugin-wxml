const prettier = require('prettier');
const { writeFileSync, readFileSync } = require('fs');
const { resolve } = require('path');
const TEST_PATH = resolve(__dirname, './raw');

function test(filepath) {
    const code = readFileSync(filepath, 'utf8');
    const result = prettier.format(code, {
        parser: 'wxml-parse',
        plugins: ['./src/index']
    });
    const filename = filepath.split('/').pop();
    const outputPath = resolve(__dirname, filename);
    writeFileSync(outputPath, result);
}

function batchTest() {
    const files = require('glob').sync(resolve(TEST_PATH, './**/*.wxml'));
    files.forEach(file => {
        test(file);
    });
}

batchTest();
