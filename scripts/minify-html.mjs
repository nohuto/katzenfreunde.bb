import { parse, serialize } from "parse5";

const blockElements = new Set([
  "address", "article", "aside", "blockquote", "body", "details", "dialog", "div", "dl",
  "fieldset", "figcaption", "figure", "footer", "form", "h1", "h2", "h3", "h4", "h5",
  "h6", "head", "header", "hgroup", "hr", "html", "li", "main", "menu", "nav", "ol",
  "p", "section", "table", "tbody", "td", "tfoot", "th", "thead", "tr", "ul"
]);
const preserveWhitespace = new Set(["pre", "script", "style", "textarea"]);
const booleanAttributes =
  / (allowfullscreen|async|autofocus|autoplay|checked|controls|default|defer|disabled|formnovalidate|hidden|inert|loop|multiple|muted|nomodule|novalidate|open|playsinline|readonly|required|reversed|selected)=""/g;

const isBoundary = node =>
  !node || node.nodeName === "#documentType" || blockElements.has(node.tagName);

function compact(node, preserve = false) {
  if (!node.childNodes) return;

  const keepWhitespace = preserve || preserveWhitespace.has(node.tagName);
  node.childNodes = node.childNodes.filter(child => child.nodeName !== "#comment");
  for (const child of node.childNodes) compact(child, keepWhitespace);
  if (keepWhitespace) return;

  node.childNodes.forEach((child, index, children) => {
    if (child.nodeName !== "#text") return;
    let value = child.value.replace(/\s+/g, " ");
    if (isBoundary(children[index - 1])) value = value.trimStart();
    if (isBoundary(children[index + 1])) value = value.trimEnd();
    child.value = value;
  });
  node.childNodes = node.childNodes.filter(
    child => child.nodeName !== "#text" || child.value
  );
}

export function minifyHtml(source) {
  const document = parse(source);
  compact(document);
  return serialize(document).replace(booleanAttributes, " $1").trim();
}
