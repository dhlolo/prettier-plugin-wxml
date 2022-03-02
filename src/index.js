const parser = require('@wxml/parser');
const printer = require('./printer');

const languages = [
  {
    extensions: ['.wxml'],
    name: 'WXML',
    parsers: ['wxml-parse']
  }
]

const parsers = {
  'wxml-parse': {
    parse: text => parser.parse(text),
    astFormat: 'wxml-ast',
  }
}

const printers = {
  'wxml-ast': printer
}

module.exports = {
  languages,
  parsers,
  printers,
  defaultOptions: {
    printWidth: 120,
    tabWidth: 4
  }
}
