/**
 * Next.js streams metadata inside <div hidden> and the HTML parser places that
 * div before every other <body> child. Google Tag Manager verification requires
 * the noscript iframe to be the first thing inside <body>, so this removes the
 * wrapper and renders metadata the same way Next already does for limited bots.
 *
 * Next 16.2.10 inlines this in node_modules. Re-apply after every install.
 */
import fs from "node:fs";
import path from "node:path";

const MARKER = "AsliJobs: metadata without the hidden body div";

const files = [
  "node_modules/next/dist/lib/metadata/metadata.js",
  "node_modules/next/dist/esm/lib/metadata/metadata.js",
];

const replacements = [
  {
    from: `function MetadataWrapper() {
        // TODO: We shouldn't change what we render based on whether we are streaming or not.
        // If we aren't streaming we should just block the response until we have resolved the
        // metadata.
        if (!serveStreamingMetadata) {
            return /*#__PURE__*/ (0, _jsxruntime.jsx)(_boundarycomponents.MetadataBoundary, {
                children: /*#__PURE__*/ (0, _jsxruntime.jsx)(Metadata, {})
            });
        }
        return /*#__PURE__*/ (0, _jsxruntime.jsx)("div", {
            hidden: true,
            children: /*#__PURE__*/ (0, _jsxruntime.jsx)(_boundarycomponents.MetadataBoundary, {
                children: /*#__PURE__*/ (0, _jsxruntime.jsx)(_react.Suspense, {
                    name: "Next.Metadata",
                    children: /*#__PURE__*/ (0, _jsxruntime.jsx)(Metadata, {})
                })
            })
        });
    }`,
    to: `function MetadataWrapper() {
        // ${MARKER}
        return /*#__PURE__*/ (0, _jsxruntime.jsx)(_boundarycomponents.MetadataBoundary, {
            children: /*#__PURE__*/ (0, _jsxruntime.jsx)(Metadata, {})
        });
    }`,
  },
  {
    from: `function MetadataWrapper() {
        // TODO: We shouldn't change what we render based on whether we are streaming or not.
        // If we aren't streaming we should just block the response until we have resolved the
        // metadata.
        if (!serveStreamingMetadata) {
            return /*#__PURE__*/ _jsx(MetadataBoundary, {
                children: /*#__PURE__*/ _jsx(Metadata, {})
            });
        }
        return /*#__PURE__*/ _jsx("div", {
            hidden: true,
            children: /*#__PURE__*/ _jsx(MetadataBoundary, {
                children: /*#__PURE__*/ _jsx(Suspense, {
                    name: "Next.Metadata",
                    children: /*#__PURE__*/ _jsx(Metadata, {})
                })
            })
        });
    }`,
    to: `function MetadataWrapper() {
        // ${MARKER}
        return /*#__PURE__*/ _jsx(MetadataBoundary, {
            children: /*#__PURE__*/ _jsx(Metadata, {})
        });
    }`,
  },
];

const root = process.cwd();
let patched = 0;

for (const relativePath of files) {
  const filePath = path.join(root, relativePath);
  if (!fs.existsSync(filePath)) {
    console.error(`Missing ${relativePath}. Install frontend dependencies first.`);
    process.exit(1);
  }

  const source = fs.readFileSync(filePath, "utf8");
  if (source.includes(MARKER)) {
    patched += 1;
    continue;
  }

  const match = replacements.find((entry) => source.includes(entry.from));
  if (!match) {
    console.error(
      `Could not patch ${relativePath}. The Next.js metadata wrapper changed.`,
    );
    process.exit(1);
  }

  fs.writeFileSync(filePath, source.replace(match.from, match.to));
  patched += 1;
  console.log(`Patched ${relativePath}`);
}

if (patched !== files.length) {
  console.error("Streaming metadata patch did not cover every Next.js build.");
  process.exit(1);
}
