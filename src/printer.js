const { group, indent, softline, hardline, concat } =
  require("prettier").doc.builders;
const { printDocToString } = require("prettier").doc.printer;
const SPACE = " ";
const TABS = "\t";
const EOL = "\n";
const EOL_WINDOWS = "\r\n";
const EQUALS = "=";
const OPEN = "<";
const CLOSE = ">";
const SLASH_CLOSE = "/>";
const SLASH_OPEN = "</";
const DOUBLE_LEFT_CURLY = "{{";
const DOUBLE_RIGHT_CURLY = "}}";

const JS_OPTIONS = {
  semi: false,
  singleQuote: true,
  __embeddedInHtml: true,
};

const embed = (path, print, textToDoc, options) => {
  const node = path.getValue();
  const textToDocOptions = {
    ...options,
    ...JS_OPTIONS,
  };
  const docToTextOptions = {
    printWidth: options.printWidth || 120,
    tabWidth: options.tabWidth || 4,
  };
  if (node.type === "WXInterpolation") {
    // TIPS: 这里js表达式的格式化会换行，需要去掉res末尾的换行符
    const res = textToDoc(node.value, {
      ...textToDocOptions,
      parser: "babel",
    });
    const { formatted } = printDocToString(res, docToTextOptions);
    return concat([
      DOUBLE_LEFT_CURLY,
      formatted.substring(0, formatted.length - 1),
      DOUBLE_RIGHT_CURLY,
    ]);
  }
  if (node.type === "WXAttributeValInterpolation") {
    const res = textToDoc(node.value, {
      ...textToDocOptions,
      parser: "babel",
    });
    const { formatted } = printDocToString(res, docToTextOptions);
    return concat([
      DOUBLE_LEFT_CURLY,
      formatted.substring(0, formatted.length - 1),
      DOUBLE_RIGHT_CURLY,
    ]);
  }
  return false;
};

function print(path, options, print) {
  const printWidth = options.printWidth || 120;
  const docToTextOptions = {
    printWidth,
    tabWidth: options.tabWidth || 4,
  };
  const node = path.getValue();
  if (Array.isArray(node)) {
    return concat(path.map(print));
  }

  switch (node.type) {
    case "Program":
      return concat(path.map(print, "body"));
    case "WXElement":
      const parts = [OPEN, node.name];
      // TIPS: 这里对attributes过多的情况，先计算出单行的长度，然后再判断是否需要换行
      let attributes = concat(path.map(print, "startTag", "attributes"));
      const { formatted: inlineAttribsStr } = printDocToString(
        attributes,
        docToTextOptions
      );

      // FIXME: 这里start并不是预格式化后的行列，而是之前的位置
      const presumedLoc = 20;
      // TIPS: 是否需要属性换行
      const needAttributeCollapsed =
        presumedLoc + inlineAttribsStr.length > printWidth;
      if (needAttributeCollapsed) {
        attributes = indent(
          concat(
            path.map(
              (...args) => {
                const res = print(...args);
                const { formatted: spaceAttrib } = printDocToString(
                  res,
                  docToTextOptions
                );
                return group(concat([hardline, spaceAttrib.slice(1)]));
              },
              "startTag",
              "attributes"
            )
          )
        );
      }
      if (!node.endTag) {
        return group(
          concat([hardline, ...parts, attributes, SPACE, SLASH_CLOSE])
        );
      }
      const onlyHasTextChildren =
        node.children.findIndex((child) => {
          return child.type === "WXInterpolation" || child.type === "WXElement";
        }) === -1;
      return group(
        concat([
          hardline,
          ...parts,
          attributes,
          CLOSE,

          indent(
            concat([
              ...path.map((...args) => {
                const childPath = args[0];
                const childNode = childPath.getValue();
                if (!onlyHasTextChildren && childNode.type === "WXText") {
                  const text = print(...args);
                  if (text) {
                    return group(concat([hardline, text]));
                  }
                }
                if (childNode.type === "WXInterpolation") {
                  return group(concat([hardline, print(...args)]));
                }
                return print(...args);
              }, "children"),
            ])
          ),
          // TIPS: 当只有一个children且为string，或者无children时，不需要换行
          concat([
            onlyHasTextChildren || !node.children.length ? "" : hardline,
            SLASH_OPEN,
            node.name,
            CLOSE,
          ]),
        ])
      );
    case "WXAttribute":
      if (!node.value) {
        return group(concat([SPACE, node.key]));
      }
      const attributeValue = path.call(print, "value");
      if (attributeValue.type === "concat") {
        return group(concat([SPACE, node.key, ...attributeValue]));
      }
      return group(concat([SPACE, node.key, attributeValue]));
    case "WXAttributeValue":
      const { value, quote } = node;
      if (typeof value === "string") {
        return group(concat([EQUALS, quote, value, quote]));
      }
      if (Array.isArray(value)) {
        return group(
          concat([EQUALS, quote, ...path.map(print, "value"), quote])
        );
      }
      return "";
    case "WXAttributeValInterpolation":
      return group(concat([DOUBLE_LEFT_CURLY, node.value, DOUBLE_RIGHT_CURLY]));
    case "WXText":
      let text = node.value;
      if (text === EOL || text === EOL_WINDOWS || text === TABS) {
        return "";
      }
      while (
        text.endsWith(EOL) ||
        text.endsWith(EOL_WINDOWS) ||
        text.endsWith(TABS) ||
        (text.endsWith(SPACE) &&
          (text.includes(EOL) || text.includes(EOL_WINDOWS)))
      ) {
        text = text.substring(0, text.length - 1);
      }
      return text;
    case "WXScript":
      const wxsAttributes = concat(path.map(print, "startTag", "attributes"));
      if (!node.endTag) {
        return group(concat([hardline, "<wxs", wxsAttributes, SLASH_CLOSE]));
      }

      // TODO: 格式化script内容
      const wxsContent = node.value;
      return group(
        concat([hardline, "<wxs", wxsAttributes, CLOSE, wxsContent, "</wxs>"])
      );
    case "WXInterpolation":
      return group(concat([DOUBLE_LEFT_CURLY, node.value, DOUBLE_RIGHT_CURLY]));
    case "WXComment":
      return group(concat([softline, "<!--", node.value, "-->"]));
  }
  throw new Error(`Unknown node type: ${node.type}`);
}

const printer = {
  embed,
  print,
};

module.exports = printer;
