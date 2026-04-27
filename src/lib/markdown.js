import { marked } from 'marked';

marked.setOptions({
    breaks: true,
    gfm: true,
});

const HTML_ESCAPES = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
};

export function renderMarkdown(text) {
    return marked.parse(escapeHtml(text), { async: false });
}

export function stripMarkdown(text) {
    return text
        .replace(/```[\s\S]*?```/g, '')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/#{1,6}\s+/g, '')
        .replace(/>\s?/g, '')
        .replace(/[*_~]/g, '')
        .replace(/^\s*[-+]\s+/gm, '')
        .replace(/^\s*\d+\.\s+/gm, '')
        .trim();
}

function escapeHtml(text) {
    return text.replace(/[&<>"']/g, char => HTML_ESCAPES[char] ?? char);
}
