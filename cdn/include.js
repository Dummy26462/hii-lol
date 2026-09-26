(function () {
    async function loadComponent(selector, defaultPath) {
        const elements = document.querySelectorAll(selector);
        if (!elements.length) return;

        try {
            const res = await fetch(defaultPath);
            if (!res.ok) {
                console.error(`Failed to load ${defaultPath}: ${res.statusText}`);
                return;
            }
            const html = await res.text();
            elements.forEach(el => {
                el.outerHTML = html;
            });
        } catch (err) {
            console.error(`Error loading ${defaultPath}:`, err);
        }
    }

    async function loadCustomIncludes() {
        const elements = document.querySelectorAll('[data-include]');
        for (const el of elements) {
            let file = el.getAttribute('data-include');
            if (!file.includes('.')) {
                file = `/subpages/${file}.html`;
            } else if (!file.startsWith('/') && !file.startsWith('http')) {
                file = `/${file}`;
            }

            try {
                const res = await fetch(file);
                if (res.ok) {
                    const html = await res.text();
                    el.outerHTML = html;
                } else {
                    console.error(`Failed to load ${file}: ${res.statusText}`);
                }
            } catch (err) {
                console.error(`Error loading ${file}:`, err);
            }
        }
    }

    function layoutMainContent() {
        const containers = document.querySelectorAll('.main-content');
        containers.forEach(container => {
            const gap = 10;
            const containerWidth = 900;
            container.style.position = 'relative';
            container.style.width = containerWidth + 'px';

            const boxes = Array.from(container.children).filter(el => el.classList.contains('box') || el.id.startsWith('box'));
            if (!boxes.length) return;

            const yMap = new Array(containerWidth).fill(0);

            boxes.forEach(box => {
                box.style.position = 'absolute';
                const width = box.offsetWidth;
                const height = box.offsetHeight;

                let bestX = 0;
                let minTop = Infinity;

                for (let x = 0; x <= containerWidth - width; x++) {
                    let maxAtX = 0;
                    for (let i = x; i < x + width; i++) {
                        if (yMap[i] > maxAtX) {
                            maxAtX = yMap[i];
                        }
                    }
                    if (maxAtX < minTop) {
                        minTop = maxAtX;
                        bestX = x;
                    }
                }

                if (bestX + width + gap >= containerWidth && bestX + width <= containerWidth) {
                    bestX = containerWidth - width;
                }

                box.style.left = bestX + 'px';
                box.style.top = minTop + 'px';

                const newY = minTop + height + gap;
                const rightBound = Math.min(containerWidth, bestX + width + gap);
                for (let i = bestX; i < rightBound; i++) {
                    yMap[i] = newY;
                }
            });

            const maxHeight = Math.max(...yMap);
            container.style.height = Math.max(0, maxHeight - gap) + 'px';
        });
    }

    async function init() {
        await loadComponent('#topbar, #topbar-placeholder, #header-placeholder, site-topbar, topbar-component', '/subpages/topbar.html');
        await loadComponent('#footer, #footer-placeholder, site-footer, footer-component', '/subpages/footer.html');
        await loadCustomIncludes();
        layoutMainContent();
    }

    window.layoutMainContent = layoutMainContent;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    window.addEventListener('load', layoutMainContent);
    window.addEventListener('resize', layoutMainContent);
})();
