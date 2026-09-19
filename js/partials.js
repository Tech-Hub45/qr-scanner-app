document.addEventListener('DOMContentLoaded', async () => {
    const partials = [
        { target: '#site-header', url: 'components/header.html' },
        { target: '#site-footer', url: 'components/footer.html' }
    ];

    for (const item of partials) {
        const target = document.querySelector(item.target);
        if (!target) continue;

        try {
            const response = await fetch(item.url, { cache: 'no-store' });
            if (!response.ok) throw new Error(`Failed to load ${item.url}: ${response.status}`);
            const html = await response.text();
            target.innerHTML = html;
        } catch (error) {
            console.warn(error);
            target.innerHTML = '<div class="partial-error">Unable to load section.</div>';
        }
    }

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
    }
});
