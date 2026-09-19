(function () {
    function ensureAppCore() {
        window.LitescanAppCore = window.LitescanAppCore || {};

        window.LitescanAppCore.refreshIcons = function refreshIcons() {
            if (window.lucide) {
                window.lucide.createIcons();
            }
        };

        window.LitescanAppCore.showToast = function showToast(message, type = 'success') {
            const toast = document.getElementById('toast');
            const toastMessage = document.querySelector('.toast-message');
            if (!toast || !toastMessage) return;

            toastMessage.textContent = message;
            toast.className = 'toast show';

            if (type === 'error') {
                toast.style.borderColor = 'var(--danger)';
                toast.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.4), 0 0 15px var(--danger-glow)';
            } else if (type === 'info') {
                toast.style.borderColor = 'var(--accent)';
                toast.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.4), 0 0 15px var(--accent-glow)';
            } else {
                toast.style.borderColor = 'var(--accent)';
                toast.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.4), 0 0 15px var(--accent-glow)';
            }

            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        };

        window.LitescanAppCore.applySavedTheme = function applySavedTheme() {
            const body = document.body;
            const savedTheme = localStorage.getItem('theme') || 'dark';
            if (savedTheme === 'light') {
                body.classList.remove('dark-theme');
                body.classList.add('light-theme');
            } else {
                body.classList.remove('light-theme');
                body.classList.add('dark-theme');
            }
        };

        window.LitescanAppCore.toggleTheme = function toggleTheme() {
            const body = document.body;
            if (body.classList.contains('dark-theme')) {
                body.classList.remove('dark-theme');
                body.classList.add('light-theme');
                localStorage.setItem('theme', 'light');
            } else {
                body.classList.remove('light-theme');
                body.classList.add('dark-theme');
                localStorage.setItem('theme', 'dark');
            }
        };
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', ensureAppCore);
    } else {
        ensureAppCore();
    }
})();
