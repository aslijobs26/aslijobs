import {
  JOB_DESCRIPTION_ALLOWED_ATTRIBUTES,
  JOB_DESCRIPTION_ALLOWED_TAGS,
} from "./job-description-text";

/*
 * DOM-free job description sanitizer for server code. `isomorphic-dompurify`
 * needs jsdom, which cannot load in the Vercel server runtime.
 *
 * The output is rebuilt rather than filtered: only allowlisted tags with
 * allowlisted, re-escaped attributes are emitted, and every other `<`, `>` or
 * stray `&` becomes text. It shares the allowlist and the URL rule with
 * `sanitizeJobDescriptionHtml` (DOMPurify), which the browser keeps using.
 */

const ALLOWED_TAGS = new Set(JOB_DESCRIPTION_ALLOWED_TAGS);
const ALLOWED_ATTRIBUTES = new Set(JOB_DESCRIPTION_ALLOWED_ATTRIBUTES);
const VOID_TAGS = new Set(["br"]);
const HEADING_TAGS = new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);
const CLOSES_OPEN_PARAGRAPH = new Set(["p", "ul", "ol", ...HEADING_TAGS]);

/** The HTML parser reads the content of these as text, never as markup. */
const RAW_TEXT_TAGS = new Set([
  "script",
  "style",
  "textarea",
  "title",
  "xmp",
  "iframe",
  "noembed",
  "noframes",
  "noscript",
]);

/** DOMPurify's default FORBID_CONTENTS: removed together with their content. */
const DROPPED_CONTENT_TAGS = new Set([
  "annotation-xml",
  "audio",
  "colgroup",
  "desc",
  "foreignobject",
  "head",
  "math",
  "mi",
  "mn",
  "mo",
  "ms",
  "mtext",
  "svg",
  "template",
  "thead",
  "video",
]);

/** DOMPurify skips the URL check for these attributes. */
const URI_SAFE_ATTRIBUTES = new Set(["class"]);

/** DOMPurify's default IS_ALLOWED_URI and ATTR_WHITESPACE. */
const ALLOWED_URI =
  /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|matrix):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i;
const ATTR_WHITESPACE = /[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g;

const HTML_WHITESPACE = /[\t\n\f\r ]/;
const TAG_NAME_END = /[\t\n\f\r />]/;
const ATTRIBUTE_NAME_END = /[\t\n\f\r />=]/;
const UNQUOTED_VALUE_END = /[\t\n\f\r >]/;

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: "\u00a0",
  colon: ":",
  Tab: "\t",
  NewLine: "\n",
};

type Token =
  | { kind: "text"; end: number }
  | { kind: "skip"; end: number }
  | { kind: "start"; name: string; attributes: Map<string, string>; selfClosing: boolean; end: number }
  | { kind: "end"; name: string; end: number };

function escapeText(text: string): string {
  return text
    .replace(/&(?![a-z][a-z0-9]*;|#\d+;|#x[0-9a-f]+;)/gi, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Decodes references a browser would decode; null if an unknown one remains. */
function decodeAttributeValue(raw: string): string | null {
  let hasUnknownReference = false;
  const decoded = raw.replace(
    /&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]*);?/gi,
    (match, reference: string) => {
      if (reference.startsWith("#")) {
        const hex = reference[1] === "x" || reference[1] === "X";
        const code = Number.parseInt(reference.slice(hex ? 2 : 1), hex ? 16 : 10);
        return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : "\ufffd";
      }
      const character = NAMED_ENTITIES[reference];
      if (character !== undefined) {
        return character;
      }
      if (match.endsWith(";")) {
        hasUnknownReference = true;
      }
      return match;
    },
  );
  return hasUnknownReference ? null : decoded;
}

function serializeAttributes(attributes: Map<string, string>): string {
  let serialized = "";
  for (const [name, raw] of attributes) {
    if (!ALLOWED_ATTRIBUTES.has(name)) {
      continue;
    }
    const value = decodeAttributeValue(raw);
    if (value === null) {
      continue;
    }
    if (
      value &&
      !URI_SAFE_ATTRIBUTES.has(name) &&
      !ALLOWED_URI.test(value.replace(ATTR_WHITESPACE, ""))
    ) {
      continue;
    }
    serialized += ` ${name}="${escapeAttribute(value)}"`;
  }
  return serialized;
}

function readName(html: string, start: number): { name: string; end: number } {
  let end = start;
  while (end < html.length && !TAG_NAME_END.test(html[end])) {
    end += 1;
  }
  return { name: html.slice(start, end).toLowerCase(), end };
}

/** Attributes up to the closing `>`; null when the tag never closes. */
function readAttributes(
  html: string,
  start: number,
): { attributes: Map<string, string>; selfClosing: boolean; end: number } | null {
  const attributes = new Map<string, string>();
  let selfClosing = false;
  let position = start;

  while (position < html.length) {
    const character = html[position];
    if (character === ">") {
      return { attributes, selfClosing, end: position + 1 };
    }
    if (HTML_WHITESPACE.test(character)) {
      position += 1;
      continue;
    }
    if (character === "/") {
      selfClosing = html[position + 1] === ">";
      position += 1;
      continue;
    }

    let nameEnd = position + 1;
    while (nameEnd < html.length && !ATTRIBUTE_NAME_END.test(html[nameEnd])) {
      nameEnd += 1;
    }
    const name = html.slice(position, nameEnd).toLowerCase();
    position = nameEnd;
    while (position < html.length && HTML_WHITESPACE.test(html[position])) {
      position += 1;
    }

    let value = "";
    if (html[position] === "=") {
      position += 1;
      while (position < html.length && HTML_WHITESPACE.test(html[position])) {
        position += 1;
      }
      const quote = html[position];
      if (quote === '"' || quote === "'") {
        const close = html.indexOf(quote, position + 1);
        if (close === -1) {
          return null;
        }
        value = html.slice(position + 1, close);
        position = close + 1;
      } else {
        let valueEnd = position;
        while (valueEnd < html.length && !UNQUOTED_VALUE_END.test(html[valueEnd])) {
          valueEnd += 1;
        }
        value = html.slice(position, valueEnd);
        position = valueEnd;
      }
    }

    if (!attributes.has(name)) {
      attributes.set(name, value);
    }
  }
  return null;
}

/** Tokenizes the markup that starts with `<` at `start`. */
function readToken(html: string, start: number): Token {
  const next = html[start + 1] ?? "";

  if (html.startsWith("<!--", start)) {
    if (html.startsWith("<!-->", start)) {
      return { kind: "skip", end: start + 5 };
    }
    if (html.startsWith("<!--->", start)) {
      return { kind: "skip", end: start + 6 };
    }
    const close = html.indexOf("-->", start + 4);
    return { kind: "skip", end: close === -1 ? html.length : close + 3 };
  }
  if (next === "!" || next === "?") {
    const close = html.indexOf(">", start + 2);
    return { kind: "skip", end: close === -1 ? html.length : close + 1 };
  }
  if (next === "/") {
    const first = html[start + 2] ?? "";
    if (/[a-z]/i.test(first)) {
      const { name, end } = readName(html, start + 2);
      const rest = readAttributes(html, end);
      return rest
        ? { kind: "end", name, end: rest.end }
        : { kind: "skip", end: html.length };
    }
    if (!first) {
      return { kind: "text", end: start + 1 };
    }
    const close = html.indexOf(">", start + 2);
    return { kind: "skip", end: close === -1 ? html.length : close + 1 };
  }
  if (/[a-z]/i.test(next)) {
    const { name, end } = readName(html, start + 1);
    const rest = readAttributes(html, end);
    return rest
      ? { kind: "start", name, ...rest }
      : { kind: "skip", end: html.length };
  }
  return { kind: "text", end: start + 1 };
}

function skipRawText(html: string, from: number, name: string): number {
  const closing = new RegExp(`</${name}(?=[\\t\\n\\f\\r />]|$)`, "gi");
  closing.lastIndex = from;
  const match = closing.exec(html);
  if (!match) {
    return html.length;
  }
  const close = html.indexOf(">", match.index);
  return close === -1 ? html.length : close + 1;
}

export function sanitizeJobDescriptionHtmlAllowlist(html: string): string {
  if (!html.trim()) {
    return "";
  }

  const output: string[] = [];
  const open: string[] = [];
  let dropping: { name: string; depth: number } | null = null;

  const closeFrom = (index: number) => {
    while (open.length > index) {
      output.push(`</${open.pop()}>`);
    }
  };

  const closeImpliedElements = (name: string) => {
    if (CLOSES_OPEN_PARAGRAPH.has(name)) {
      const paragraph = open.lastIndexOf("p");
      if (paragraph !== -1) {
        closeFrom(paragraph);
      }
    }
    if (HEADING_TAGS.has(name) && HEADING_TAGS.has(open[open.length - 1])) {
      closeFrom(open.length - 1);
    }
    if (name === "li") {
      for (let index = open.length - 1; index >= 0; index -= 1) {
        if (open[index] === "li") {
          closeFrom(index);
          break;
        }
        if (open[index] === "ul" || open[index] === "ol" || HEADING_TAGS.has(open[index])) {
          break;
        }
      }
    }
  };

  let position = 0;
  while (position < html.length) {
    const tagStart = html.indexOf("<", position);
    const textEnd = tagStart === -1 ? html.length : tagStart;
    if (textEnd > position && !dropping) {
      output.push(escapeText(html.slice(position, textEnd)));
    }
    if (tagStart === -1) {
      break;
    }

    const token = readToken(html, tagStart);
    position = token.end;

    if (token.kind === "text") {
      if (!dropping) {
        output.push("&lt;");
      }
      continue;
    }
    if (token.kind === "skip") {
      continue;
    }

    if (token.kind === "end") {
      if (dropping) {
        if (token.name === dropping.name) {
          dropping.depth -= 1;
          if (dropping.depth === 0) {
            dropping = null;
          }
        }
        continue;
      }
      if (token.name === "br") {
        output.push("<br>");
        continue;
      }
      const index = ALLOWED_TAGS.has(token.name) ? open.lastIndexOf(token.name) : -1;
      if (index !== -1) {
        closeFrom(index);
      }
      continue;
    }

    if (dropping) {
      if (token.name === dropping.name && !token.selfClosing) {
        dropping.depth += 1;
      }
      continue;
    }
    if (token.name === "plaintext") {
      break;
    }
    if (RAW_TEXT_TAGS.has(token.name)) {
      position = skipRawText(html, position, token.name);
      continue;
    }
    if (DROPPED_CONTENT_TAGS.has(token.name)) {
      if (!token.selfClosing) {
        dropping = { name: token.name, depth: 1 };
      }
      continue;
    }
    if (!ALLOWED_TAGS.has(token.name)) {
      continue;
    }

    const attributes = serializeAttributes(token.attributes);
    if (VOID_TAGS.has(token.name)) {
      output.push(`<${token.name}${attributes}>`);
      continue;
    }
    closeImpliedElements(token.name);
    output.push(`<${token.name}${attributes}>`);
    open.push(token.name);
  }

  closeFrom(0);
  return output.join("").trim();
}
