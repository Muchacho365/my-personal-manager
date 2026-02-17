import { marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";

// Configure marked with syntax highlighting
marked.use(
    markedHighlight({
        langPrefix: "hljs language-",
        highlight(code, lang) {
            const language = hljs.getLanguage(lang) ? lang : "plaintext";
            return hljs.highlight(code, { language }).value;
        },
    })
);

// Configure renderer to open links in new browser window
const renderer = new marked.Renderer();
const linkRenderer = renderer.link;
renderer.link = (href, title, text) => {
    const html = linkRenderer.call(renderer, href, title, text);
    return html.replace(
        /^<a /,
        '<a target="_blank" rel="noopener noreferrer" '
    );
};

// marked.use({ renderer }); // Causing error in v11

export const renderMarkdown = (text) => {
    if (!text) return "";
    return marked.parse(text, { renderer });
};
