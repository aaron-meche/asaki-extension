(function () {
	const globalWindow = window;
	if (globalWindow.__asakiLoaded) {
		return;
	}

	globalWindow.__asakiLoaded = true;

	let highlightedSpans = [];

	chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
		if (message.type === 'GET_SELECTION') {
			sendResponse({
				text: window.getSelection()?.toString().trim() ?? '',
				url: location.href,
				title: document.title,
				pageText: getPageContext(),
			});
			return true;
		}

		if (message.type === 'HIGHLIGHT_SELECTION') {
			highlightCurrentSelection();
			return false;
		}

		if (message.type === 'CLEAR_HIGHLIGHT') {
			clearHighlight();
			return false;
		}

		return false;
	});

	function getPageContext() {
		const selection = window.getSelection();
		const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
		const anchorNode = range?.commonAncestorContainer ?? document.body;
		const readableElement = findReadableContainer(anchorNode);
		const rawText = readableElement?.textContent ?? document.body?.innerText ?? '';

		return rawText
			.replace(/\s+/g, ' ')
			.trim()
			.slice(0, 6000);
	}

	function findReadableContainer(node) {
		const element = node.nodeType === Node.ELEMENT_NODE
			? node
			: node.parentElement;

		if (!element) {
			return document.body;
		}

		return element.closest('article, main, section, p, li, blockquote, td, pre, code')
			?? element.closest('body')
			?? document.body;
	}

	function highlightCurrentSelection() {
		clearHighlight();

		const selection = window.getSelection();
		if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
			return;
		}

		const range = selection.getRangeAt(0);

		try {
			const span = document.createElement('span');
			span.className = 'asaki-hl';
			range.surroundContents(span);
			highlightedSpans = [span];
		} catch {
			// Some selections span multiple nodes in a way surroundContents cannot wrap.
		}
	}

	function clearHighlight() {
		for (const span of highlightedSpans) {
			const parent = span.parentNode;
			if (!parent) {
				continue;
			}

			while (span.firstChild) {
				parent.insertBefore(span.firstChild, span);
			}

			parent.removeChild(span);
			parent.normalize();
		}

		highlightedSpans = [];
	}
})();
