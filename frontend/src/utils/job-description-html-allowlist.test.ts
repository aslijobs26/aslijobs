import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import DOMPurifyWithJsdom from "isomorphic-dompurify";
import { sanitizeJobDescriptionHtml } from "./job-description-html";
import { sanitizeJobDescriptionHtmlAllowlist as sanitize } from "./job-description-html-allowlist";
import {
  JOB_DESCRIPTION_ALLOWED_ATTRIBUTES,
  JOB_DESCRIPTION_ALLOWED_TAGS,
} from "./job-description-text";

/** What browsers render: DOMPurify on a real DOM with the job description config. */
function domPurify(html: string): string {
  return DOMPurifyWithJsdom.sanitize(html, {
    ALLOWED_TAGS: JOB_DESCRIPTION_ALLOWED_TAGS,
    ALLOWED_ATTR: JOB_DESCRIPTION_ALLOWED_ATTRIBUTES,
    ALLOW_DATA_ATTR: false,
  }).trim();
}

/** Every tag in the output is allowlisted and carries only allowlisted attributes. */
function assertOnlyAllowedMarkup(html: string) {
  const tag = /<\/?([a-z0-9]+)((?:\s[a-z]+="[^"<>]*")*)>/g;
  for (const [, name, attributes] of html.matchAll(tag)) {
    assert.ok(JOB_DESCRIPTION_ALLOWED_TAGS.includes(name), `tag <${name}> in ${html}`);
    for (const [, attribute] of attributes.matchAll(/\s([a-z]+)="/g)) {
      assert.ok(
        JOB_DESCRIPTION_ALLOWED_ATTRIBUTES.includes(attribute),
        `attribute ${attribute} in ${html}`,
      );
    }
  }
  assert.ok(!/[<>]/.test(html.replace(tag, "")), `unescaped markup in ${html}`);
}

describe("DOM-free job description sanitizer: script tags", () => {
  const cases: Array<[string, string]> = [
    [`<p>Hi</p><script>alert(1)</script><p>Bye</p>`, "<p>Hi</p><p>Bye</p>"],
    [`<p>Hi<SCRIPT src="https://evil.example/x.js"></SCRIPT></p>`, "<p>Hi</p>"],
    [`<p>Hi</p><script>document.write("</p><b>x</b>")</script>`, "<p>Hi</p>"],
    [`<p>Hi</p><script>alert(1)`, "<p>Hi</p>"],
    [`<p>a</p><style>p{color:red}</style><p>b</p>`, "<p>a</p><p>b</p>"],
    [`<p>a</p><iframe src="https://evil.example"></iframe>`, "<p>a</p>"],
    [`<p>a</p><svg><script>alert(1)</script><text>b</text></svg>`, "<p>a</p>"],
    [`<p>a</p><template><script>alert(1)</script></template>`, "<p>a</p>"],
    [`<p>a</p><noscript><p>b</p></noscript>`, "<p>a</p>"],
    [`<scr<script>ipt>alert(1)</script>`, "ipt&gt;alert(1)"],
    [`<p>x</p></script><script>alert("xss")</script>`, "<p>x</p>"],
  ];

  for (const [input, expected] of cases) {
    it(`drops ${JSON.stringify(input)}`, () => {
      const output = sanitize(input);
      assert.equal(output, expected);
      assert.ok(!/<script/i.test(output));
      assertOnlyAllowedMarkup(output);
    });
  }

  it("matches DOMPurify on nested script tricks", () => {
    const input = `<scr<script>ipt>alert(1)</script>`;
    assert.equal(sanitize(input), domPurify(input));
  });
});

describe("DOM-free job description sanitizer: event handler attributes", () => {
  const cases: Array<[string, string]> = [
    [`<p onclick="alert(1)">Apply</p>`, "<p>Apply</p>"],
    [`<P ONMOUSEOVER=alert(1) class="lead">Apply</P>`, `<p class="lead">Apply</p>`],
    [`<a href="https://aslijobs.com" onfocus='alert(1)' autofocus>Go</a>`, `<a href="https://aslijobs.com">Go</a>`],
    [`<img src=x onerror=alert(1)>Text`, "Text"],
    [`<body onload="alert(1)"><p>Hi</p></body>`, "<p>Hi</p>"],
    [`<strong/onclick="alert(1)">Bold</strong>`, "<strong>Bold</strong>"],
    [`<p style="background:url(javascript:alert(1))" data-x="1" id="a">Hi</p>`, "<p>Hi</p>"],
  ];

  for (const [input, expected] of cases) {
    it(`strips ${JSON.stringify(input)}`, () => {
      const output = sanitize(input);
      assert.equal(output, expected);
      assert.ok(!/\son[a-z]+=|style=|<img|<body/i.test(output));
      assertOnlyAllowedMarkup(output);
    });
  }
});

describe("DOM-free job description sanitizer: unsafe URLs", () => {
  const unsafe = [
    "javascript:alert(1)",
    "JaVaScRiPt:alert(1)",
    " javascript:alert(1)",
    "java\tscript:alert(1)",
    "java&#115;cript:alert(1)",
    "&#x6A;avascript:alert(1)",
    "&#106avascript:alert(1)",
    "javascript&colon;alert(1)",
    "vbscript:msgbox(1)",
    "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==",
  ];

  for (const href of unsafe) {
    it(`removes href=${JSON.stringify(href)} like DOMPurify`, () => {
      const input = `<p><a href="${href}" target="_blank">Apply</a></p>`;
      assert.equal(sanitize(input), `<p><a target="_blank">Apply</a></p>`);
      assert.equal(domPurify(input), `<p><a target="_blank">Apply</a></p>`);
    });
  }

  it("removes hrefs with character references it cannot decode", () => {
    assert.equal(
      sanitize(`<a href="javascript&unknown;:alert(1)">Apply</a>`),
      "<a>Apply</a>",
    );
  });

  it("keeps safe links and escapes their attribute values", () => {
    assert.equal(
      sanitize(`<a href="https://aslijobs.com/jobs?a=1&amp;b=2" rel="noopener noreferrer" target="_blank">Jobs</a>`),
      `<a href="https://aslijobs.com/jobs?a=1&amp;b=2" rel="noopener noreferrer" target="_blank">Jobs</a>`,
    );
    assert.equal(sanitize(`<a href="mailto:hr@example.com">Mail</a>`), `<a href="mailto:hr@example.com">Mail</a>`);
    assert.equal(sanitize(`<a href="tel:+919999999999">Call</a>`), `<a href="tel:+919999999999">Call</a>`);
    assert.equal(sanitize(`<a href="/jobs">Jobs</a>`), `<a href="/jobs">Jobs</a>`);
    assert.equal(
      sanitize(`<a href='https://x.example/"><script>alert(1)</script>'>x</a>`),
      `<a href="https://x.example/&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;">x</a>`,
    );
  });
});

describe("DOM-free job description sanitizer: allowed formatting", () => {
  it("keeps every allowlisted formatting tag", () => {
    const html =
      "<h1>A</h1><h2>B</h2><h3>C</h3><h4>D</h4><h5>E</h5><h6>F</h6>" +
      "<p><strong>s</strong><b>b</b><em>e</em><i>i</i><u>u</u><br>next</p>" +
      "<ul><li>one</li></ul><ol><li>two</li></ol>";
    assert.equal(sanitize(html), html);
    assert.equal(domPurify(html), html);
  });

  it("removes other tags but keeps their text", () => {
    assert.equal(
      sanitize(`<div><span>Night shift</span> <table><tr><td>₹15,000</td></tr></table></div>`),
      "Night shift ₹15,000",
    );
  });

  it("closes unclosed tags and escapes stray markup characters", () => {
    assert.equal(sanitize("<p><strong>Bold"), "<p><strong>Bold</strong></p>");
    assert.equal(sanitize("<p>Age 18 < 35 & salary > 10k</p>"), "<p>Age 18 &lt; 35 &amp; salary &gt; 10k</p>");
    assert.equal(sanitize("<p>a</p><!-- note --><!DOCTYPE html><p>b</p>"), "<p>a</p><p>b</p>");
    assert.equal(sanitize("<p>a</p></div></p>"), "<p>a</p>");
    assert.equal(sanitize("<p>a<p>b"), "<p>a</p><p>b</p>");
    assert.equal(sanitize("<ul><li>a<li>b</ul>"), "<ul><li>a</li><li>b</li></ul>");
    assert.equal(sanitize(`<p>a</p><p class="x`), "<p>a</p>");
  });

  it("returns empty output for empty input", () => {
    assert.equal(sanitize(""), "");
    assert.equal(sanitize("   "), "");
  });
});

describe("DOM-free job description sanitizer: normal job descriptions", () => {
  const descriptions = [
    "<p><strong>Job Title: Accounts Executive</strong><br><strong>Experience: 1–3 years</strong><br><strong>Company:PADMALA &amp; ASSOCIATES</strong></p><p><strong>About the Role</strong></p><p>We are looking for an Accounts Executive to handle day-to-day accounting.</p><ul><li><p>Prepare GST returns.</p></li><li><p>Support audits.</p></li></ul>",
    "<h2>வேலை விவரம்</h2><p>அனுபவம்: 2 ஆண்டுகள்</p><ul><li>அழைப்புகளை மேற்கொள்ளுங்கள்.</li><li>பின்தொடரவும்.</li></ul>",
    "<p><br>We are looking for a Delivery Boy.</p><ol><li><p>Pick up orders.</p></li></ol><p></p>",
    `<p>Apply at <a href="https://www.aslijobs.com/jobs" target="_blank" rel="noopener noreferrer">AsliJobs</a>.</p>`,
    "<h3>Salary</h3><p>₹12,000&nbsp;–&nbsp;₹18,000 per month</p>",
  ];

  for (const description of descriptions) {
    it(`matches the DOMPurify output browsers render: ${description.slice(0, 40)}…`, () => {
      assert.equal(sanitize(description), domPurify(description));
    });
  }

  it("server rendering (no DOM) sanitizes with the allowlist instead of returning raw HTML", () => {
    assert.equal(
      sanitizeJobDescriptionHtml(`<p onclick="x()">Hi</p><script>alert(1)</script><a href="javascript:x()">a</a>`),
      "<p>Hi</p><a>a</a>",
    );
    assert.equal(sanitizeJobDescriptionHtml(descriptions[0]), domPurify(descriptions[0]));
  });
});

describe("job detail page server bundle", () => {
  const SRC = path.resolve("src");
  const IMPORT = /(?:^|\n)\s*(?:import|export)\s+(?!type\b)(?:[^;'"]*?\sfrom\s+)?["']([^"']+)["']/g;

  function resolveLocal(from: string, specifier: string): string | null {
    const base = specifier.startsWith("@/")
      ? path.join(SRC, specifier.slice(2))
      : path.resolve(path.dirname(from), specifier);
    const candidates = [base, `${base}.ts`, `${base}.tsx`, path.join(base, "index.ts"), path.join(base, "index.tsx")];
    return candidates.find((file) => existsSync(file) && statSync(file).isFile()) ?? null;
  }

  it("never loads jsdom, including client components rendered on the server", () => {
    const entry = path.join(SRC, "app", "(site)", "jobs", "[jobId]", "page.tsx");
    const visited = new Set<string>();
    const packages = new Set<string>();
    const queue = [entry];

    while (queue.length > 0) {
      const file = queue.pop() as string;
      if (visited.has(file)) {
        continue;
      }
      visited.add(file);
      const source = readFileSync(file, "utf8");
      for (const [, specifier] of source.matchAll(IMPORT)) {
        if (specifier.startsWith("@/") || specifier.startsWith(".")) {
          const resolved = resolveLocal(file, specifier);
          if (resolved) {
            queue.push(resolved);
          }
        } else {
          packages.add(specifier);
        }
      }
    }

    assert.ok(visited.has(path.join(SRC, "utils", "seo", "job-posting-json-ld.ts")));
    assert.ok(visited.has(path.join(SRC, "components", "ui", "JobDescriptionContent.tsx")));
    for (const forbidden of ["isomorphic-dompurify", "jsdom"]) {
      assert.ok(!packages.has(forbidden), `${forbidden} is in the job page server bundle`);
    }
  });
});
