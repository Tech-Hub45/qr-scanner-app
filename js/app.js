document.addEventListener('DOMContentLoaded', () => {
    // State management
    const appState = {
        html5QrCode: null,
        activeCameraId: null,
        isScanning: false,
        cameras: [],
        history: [],
        currentResult: null,
        generatedQrCanvas: null,
        cameraTrack: null, // to control zoom
        settings: {
            autoCopy: true,
            country: 'auto'
        }
    };

    // Load elements
    const elements = {
        body: document.body,
        themeToggle: document.getElementById('themeToggle'),
        tabButtons: document.querySelectorAll('.tab-btn'),
        tabPanes: document.querySelectorAll('.tab-pane'),
        historyBadge: document.getElementById('historyBadge'),
        
        // Header More Dropdown
        moreMenuBtn: document.getElementById('moreMenuBtn'),
        moreDropdown: document.getElementById('moreDropdown'),
        openSettingsBtn: document.getElementById('openSettingsBtn'),
        openAboutBtn: document.getElementById('openAboutBtn'),

        // Modals
        settingsModal: document.getElementById('settingsModal'),
        aboutModal: document.getElementById('aboutModal'),
        closeModalBtns: document.querySelectorAll('.closeModalBtn'),

        // Settings inputs
        settingAutoCopy: document.getElementById('settingAutoCopy'),
        settingCountry: document.getElementById('settingCountry'),

        // Camera scan
        cameraSelect: document.getElementById('cameraSelect'),
        startScanBtn: document.getElementById('startScanBtn'),
        stopScanBtn: document.getElementById('stopScanBtn'),
        scannerWrapper: document.querySelector('.scanner-wrapper'),
        scannerPlaceholder: document.querySelector('.scanner-placeholder'),
        zoomControlWrapper: document.getElementById('zoomControlWrapper'),
        scannerZoom: document.getElementById('scannerZoom'),
        zoomValDisplay: document.getElementById('zoomValDisplay'),
        
        // File scan
        dropZone: document.getElementById('dropZone'),
        qrFileInput: document.getElementById('qrFileInput'),
        filePreview: document.getElementById('filePreview'),
        removeFileBtn: document.getElementById('removeFileBtn'),
        filePreviewContainer: document.querySelector('.file-preview-container'),
        dropZonePrompt: document.querySelector('.drop-zone-prompt'),
        fileActionContainer: document.getElementById('fileActionContainer'),
        scanFileBtn: document.getElementById('scanFileBtn'),

        // Generate QR
        typeButtons: document.querySelectorAll('.type-btn'),
        fieldGroups: document.querySelectorAll('.field-group'),
        passwordToggleBtn: document.querySelector('.toggle-password-btn'),
        wifiPasswordInput: document.getElementById('wifiPassword'),
        accordionHeader: document.querySelector('.accordion-header'),
        customizationAccordion: document.querySelector('.customization-accordion'),
        generateBtn: document.getElementById('generateBtn'),
        genQrOutput: document.getElementById('genQrOutput'),
        qrGenActions: document.querySelector('.qr-gen-actions'),
        downloadQrBtn: document.getElementById('downloadQrBtn'),
        shareQrBtn: document.getElementById('shareQrBtn'),
        qrColorDark: document.getElementById('qrColorDark'),
        qrColorLight: document.getElementById('qrColorLight'),

        // Inputs for Generate
        genText: document.getElementById('genText'),
        genUrl: document.getElementById('genUrl'),
        wifiSsid: document.getElementById('wifiSsid'),
        wifiSecurity: document.getElementById('wifiSecurity'),
        wifiHidden: document.getElementById('wifiHidden'),
        contactFirstName: document.getElementById('contactFirstName'),
        contactLastName: document.getElementById('contactLastName'),
        contactPhone: document.getElementById('contactPhone'),
        contactEmail: document.getElementById('contactEmail'),
        contactOrg: document.getElementById('contactOrg'),
        contactUrl: document.getElementById('contactUrl'),
        
        // New Inputs for V2
        genEmailRecipient: document.getElementById('genEmailRecipient'),
        genEmailSubject: document.getElementById('genEmailSubject'),
        genEmailBody: document.getElementById('genEmailBody'),
        genSmsPhone: document.getElementById('genSmsPhone'),
        genSmsMessage: document.getElementById('genSmsMessage'),
        genGeoLat: document.getElementById('genGeoLat'),
        genGeoLon: document.getElementById('genGeoLon'),
        getCurrentGeoBtn: document.getElementById('getCurrentGeoBtn'),
        eventSummary: document.getElementById('eventSummary'),
        eventStart: document.getElementById('eventStart'),
        eventEnd: document.getElementById('eventEnd'),
        eventLocation: document.getElementById('eventLocation'),
        eventDesc: document.getElementById('eventDesc'),
        barcodeFormat: document.getElementById('barcodeFormat'),
        barcodeValue: document.getElementById('barcodeValue'),

        // History
        historyList: document.getElementById('historyList'),
        clearHistoryBtn: document.getElementById('clearHistoryBtn'),

        // Results Pane
        scanResultSection: document.getElementById('scanResultSection'),
        resultIcon: document.getElementById('resultIcon'),
        resultTypeName: document.getElementById('resultTypeName'),
        closeResultBtn: document.getElementById('closeResultBtn'),
        parsedResultDetails: document.getElementById('parsedResultDetails'),
        rawResultText: document.getElementById('rawResultText'),
        copyRawBtn: document.getElementById('copyRawBtn'),
        dynamicActions: document.getElementById('dynamicActions'),
        rawToggle: document.querySelector('.raw-toggle'),
        rawDataCollapsible: document.querySelector('.raw-data-collapsible'),

        // Toast
        toast: document.getElementById('toast'),
        toastMessage: document.querySelector('.toast-message')
    };

    // Initialize UI library icons (Lucide)
    function refreshIcons() {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }
    refreshIcons();

    // Helper: Play camera scan beep
    function playBeep() {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
            
            gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
            
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 0.15);
        } catch (err) {
            console.warn("Audio Context failed: ", err);
        }
    }

    // Helper: Show custom toast message
    function showToast(message, type = 'success') {
        elements.toastMessage.textContent = message;
        elements.toast.className = `toast show`;
        if (type === 'error') {
            elements.toast.style.borderColor = 'var(--danger)';
            elements.toast.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.4), 0 0 15px var(--danger-glow)';
        } else if (type === 'info') {
            elements.toast.style.borderColor = 'var(--accent)';
            elements.toast.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.4), 0 0 15px var(--accent-glow)';
        } else {
            elements.toast.style.borderColor = 'var(--accent)';
            elements.toast.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.4), 0 0 15px var(--accent-glow)';
        }

        setTimeout(() => {
            elements.toast.classList.remove('show');
        }, 3000);
    }

    /* SETTINGS MANAGEMENT */
    function loadSettings() {
        const stored = localStorage.getItem('litescan_settings');
        if (stored) {
            try {
                appState.settings = { ...appState.settings, ...JSON.parse(stored) };
            } catch (e) {}
        }
        // Apply settings UI
        elements.settingAutoCopy.checked = appState.settings.autoCopy;
        elements.settingCountry.value = appState.settings.country;
    }

    function saveSettings() {
        appState.settings.autoCopy = elements.settingAutoCopy.checked;
        appState.settings.country = elements.settingCountry.value;
        localStorage.setItem('litescan_settings', JSON.stringify(appState.settings));
    }

    elements.settingAutoCopy.addEventListener('change', saveSettings);
    elements.settingCountry.addEventListener('change', saveSettings);
    loadSettings();

    /* THEME MANAGER */
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
        elements.body.classList.remove('dark-theme');
        elements.body.classList.add('light-theme');
    }
    
    elements.themeToggle.addEventListener('click', () => {
        if (elements.body.classList.contains('dark-theme')) {
            elements.body.classList.remove('dark-theme');
            elements.body.classList.add('light-theme');
            localStorage.setItem('theme', 'light');
            showToast("Switched to light theme", "info");
        } else {
            elements.body.classList.remove('light-theme');
            elements.body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
            showToast("Switched to dark theme", "info");
        }
        if (appState.generatedQrCanvas) {
            generateCode(true); // silent rebuild
        }
    });

    /* MORE DROPDOWN MENU */
    elements.moreMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        elements.moreDropdown.classList.toggle('show');
    });

    document.addEventListener('click', () => {
        elements.moreDropdown.classList.remove('show');
    });

    /* MODALS SYSTEM */
    elements.openSettingsBtn.addEventListener('click', () => {
        elements.settingsModal.style.display = 'flex';
        elements.moreDropdown.classList.remove('show');
    });

    elements.openAboutBtn.addEventListener('click', () => {
        elements.aboutModal.style.display = 'flex';
        elements.moreDropdown.classList.remove('show');
    });

    elements.closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.settingsModal.style.display = 'none';
            elements.aboutModal.style.display = 'none';
        });
    });

    // Close on overlay click
    [elements.settingsModal, elements.aboutModal].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });

    /* TAB SYSTEM */
    elements.tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            elements.tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            elements.tabPanes.forEach(pane => {
                pane.classList.remove('active');
                if (pane.id === targetTab) {
                    pane.classList.add('active');
                }
            });

            if (targetTab !== 'camera-scan') {
                stopScanner();
            }
            closeResultPane();
        });
    });

    /* ACCORDIONS / COLLAPSIBLES */
    elements.accordionHeader.addEventListener('click', () => {
        elements.customizationAccordion.classList.toggle('open');
        const headerIcon = elements.accordionHeader.querySelector('i');
        if (elements.customizationAccordion.classList.contains('open')) {
            headerIcon.setAttribute('data-lucide', 'chevron-down');
        } else {
            headerIcon.setAttribute('data-lucide', 'chevron-right');
        }
        refreshIcons();
    });

    elements.rawToggle.addEventListener('click', () => {
        const isOpen = elements.rawDataCollapsible.classList.toggle('open');
        const contentBox = elements.rawToggle.nextElementSibling;
        const icon = elements.rawToggle.querySelector('i');
        
        if (isOpen) {
            contentBox.style.display = 'block';
            icon.setAttribute('data-lucide', 'chevron-down');
        } else {
            contentBox.style.display = 'none';
            icon.setAttribute('data-lucide', 'chevron-right');
        }
        refreshIcons();
    });

    /* GEOLOCATION COORDS FETCH */
    elements.getCurrentGeoBtn.addEventListener('click', () => {
        if (!navigator.geolocation) {
            showToast("Geolocation is not supported by this browser", "error");
            return;
        }

        elements.getCurrentGeoBtn.disabled = true;
        elements.getCurrentGeoBtn.innerHTML = `<i data-lucide="loader" class="rotating"></i> Retrieving location...`;
        refreshIcons();

        navigator.geolocation.getCurrentPosition(
            (position) => {
                elements.genGeoLat.value = position.coords.latitude.toFixed(6);
                elements.genGeoLon.value = position.coords.longitude.toFixed(6);
                elements.getCurrentGeoBtn.disabled = false;
                elements.getCurrentGeoBtn.innerHTML = `<i data-lucide="crosshair"></i> Use My Current Location`;
                refreshIcons();
                showToast("Location captured successfully");
            },
            (error) => {
                console.error('Geo location error:', error);

                let message = 'Location access failed. Please type coordinates manually.';
                if (error.code === 1) {
                    message = 'Location permission was denied. Please allow access or enter coordinates manually.';
                } else if (error.code === 2) {
                    message = 'Location is unavailable right now. Please try again or enter coordinates manually.';
                } else if (error.code === 3) {
                    message = 'Location request timed out. Please retry or enter coordinates manually.';
                }

                showToast(message, "error");
                elements.getCurrentGeoBtn.disabled = false;
                elements.getCurrentGeoBtn.innerHTML = `<i data-lucide="crosshair"></i> Use My Current Location`;
                refreshIcons();
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
        );
    });

    /* ADVANCED PARSER ENGINE */
    function parseQRCode(text) {
        if (!text) return null;

        // 1. WiFi check
        if (text.startsWith('WIFI:')) {
            const ssidMatch = text.match(/S:([^;]+)/);
            const typeMatch = text.match(/T:([^;]+)/);
            const passMatch = text.match(/P:([^;]+)/);
            const hiddenMatch = text.match(/H:([^;]+)/);

            return {
                type: 'wifi',
                title: ssidMatch ? ssidMatch[1] : 'Unknown WiFi',
                details: {
                    ssid: ssidMatch ? ssidMatch[1] : '',
                    security: typeMatch ? typeMatch[1] : 'WPA',
                    password: passMatch ? passMatch[1] : '',
                    hidden: hiddenMatch ? (hiddenMatch[1] === 'true') : false
                },
                raw: text
            };
        }

        // 2. vCard check
        if (text.toUpperCase().includes('BEGIN:VCARD')) {
            const fnMatch = text.match(/FN:([^\r\n]+)/i);
            const nameMatch = text.match(/N:([^\r\n]+)/i);
            const telMatch = text.match(/TEL(?:;[^:]*)?:([^\r\n]+)/i);
            const emailMatch = text.match(/EMAIL(?:;[^:]*)?:([^\r\n]+)/i);
            const orgMatch = text.match(/ORG:([^\r\n]+)/i);
            const urlMatch = text.match(/URL(?:;[^:]*)?:([^\r\n]+)/i);

            let fullName = '';
            if (fnMatch) {
                fullName = fnMatch[1];
            } else if (nameMatch) {
                fullName = nameMatch[1].replace(/;/g, ' ').trim();
            } else {
                fullName = 'Unnamed Contact';
            }

            return {
                type: 'vcard',
                title: fullName,
                details: {
                    name: fullName,
                    tel: telMatch ? telMatch[1] : '',
                    email: emailMatch ? emailMatch[1] : '',
                    org: orgMatch ? orgMatch[1] : '',
                    url: urlMatch ? urlMatch[1] : ''
                },
                raw: text
            };
        }

        // 3. iCalendar Event check
        if (text.toUpperCase().includes('BEGIN:VEVENT') || text.toUpperCase().includes('BEGIN:VCALENDAR')) {
            const summaryMatch = text.match(/SUMMARY:([^\r\n]+)/i);
            const startMatch = text.match(/DTSTART:([^\r\n]+)/i);
            const endMatch = text.match(/DTEND:([^\r\n]+)/i);
            const locMatch = text.match(/LOCATION:([^\r\n]+)/i);
            const descMatch = text.match(/DESCRIPTION:([^\r\n]+)/i);

            return {
                type: 'event',
                title: summaryMatch ? summaryMatch[1] : 'Scheduled Event',
                details: {
                    summary: summaryMatch ? summaryMatch[1] : 'Untitled Event',
                    start: startMatch ? formatICalDate(startMatch[1]) : '',
                    end: endMatch ? formatICalDate(endMatch[1]) : '',
                    location: locMatch ? locMatch[1] : '',
                    description: descMatch ? descMatch[1] : ''
                },
                raw: text
            };
        }

        // 4. Geo check
        if (text.toLowerCase().startsWith('geo:')) {
            // geo:lat,lon or geo:lat,lon?q=name
            const coords = text.substring(4).split('?')[0].split(',');
            const lat = coords[0];
            const lon = coords[1];
            return {
                type: 'location',
                title: `${lat}, ${lon}`,
                details: { lat, lon },
                raw: text
            };
        }

        // 5. Mailto check
        if (text.toLowerCase().startsWith('mailto:')) {
            const email = text.substring(7).split('?')[0];
            const subjectMatch = text.match(/subject=([^&]+)/i);
            const bodyMatch = text.match(/body=([^&]+)/i);
            
            return {
                type: 'email',
                title: email,
                details: {
                    email: email,
                    subject: subjectMatch ? decodeURIComponent(subjectMatch[1]) : '',
                    body: bodyMatch ? decodeURIComponent(bodyMatch[1]) : ''
                },
                raw: text
            };
        }

        // 6. SMS check
        if (text.toLowerCase().startsWith('smsto:') || text.toLowerCase().startsWith('sms:')) {
            const separatorIndex = text.indexOf(':');
            const parts = text.substring(separatorIndex + 1).split(':');
            const phone = parts[0];
            const message = parts[1] || '';

            return {
                type: 'sms',
                title: phone,
                details: {
                    phone: phone,
                    message: decodeURIComponent(message)
                },
                raw: text
            };
        }

        // 7. Telephone link check
        if (text.toLowerCase().startsWith('tel:')) {
            const phone = text.substring(4);
            return {
                type: 'tel',
                title: phone,
                details: { phone },
                raw: text
            };
        }

        // 8. URL check
        const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i;
        if (text.toLowerCase().startsWith('http://') || text.toLowerCase().startsWith('https://') || urlPattern.test(text)) {
            let fullUrl = text;
            if (!text.toLowerCase().startsWith('http://') && !text.toLowerCase().startsWith('https://')) {
                fullUrl = 'https://' + text;
            }
            return {
                type: 'url',
                title: text,
                details: { url: fullUrl },
                raw: text
            };
        }

        // 9. Barcode scan fallback
        // Check if alphanumeric string represents a standard barcode format
        const numericPattern = /^\d+$/;
        if (numericPattern.test(text) && (text.length === 8 || text.length === 12 || text.length === 13 || text.length === 14)) {
            return {
                type: 'barcode',
                title: `Barcode: ${text}`,
                details: {
                    value: text,
                    format: text.length === 13 ? 'EAN-13' : (text.length === 8 ? 'EAN-8' : 'UPC/GTIN')
                },
                raw: text
            };
        }

        // 10. Fallback Plain Text
        return {
            type: 'text',
            title: text.length > 30 ? text.substring(0, 30) + '...' : text,
            details: { text },
            raw: text
        };
    }

    // Helper: Parse Event Date Strings into human readable
    function formatICalDate(str) {
        // Formats: 20260614T200000Z or 20260614T200000 or 20260614
        if (!str) return '';
        const year = str.substring(0, 4);
        const month = str.substring(4, 6);
        const day = str.substring(6, 8);
        
        let display = `${year}-${month}-${day}`;
        if (str.includes('T')) {
            const hour = str.substring(9, 11);
            const min = str.substring(11, 13);
            display += ` ${hour}:${min}`;
        }
        return display;
    }

    // Render detailed result card
    function renderParsedDetails(parsed) {
        let html = '';
        const actions = [];
        
        switch (parsed.type) {
            case 'wifi':
                html = `
                    <div class="parsed-card">
                        <h4><i data-lucide="wifi"></i> WiFi Connection</h4>
                        <div class="detail-row">
                            <span class="detail-label">Network Name (SSID)</span>
                            <span class="detail-value">${escapeHtml(parsed.details.ssid)}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Security Type</span>
                            <span class="detail-value">${escapeHtml(parsed.details.security)}</span>
                        </div>
                        ${parsed.details.password ? `
                        <div class="detail-row">
                            <span class="detail-label">Password</span>
                            <span class="detail-value password-container">
                                <span class="obscured-pass">••••••••</span>
                                <span class="revealed-pass" style="display: none;">${escapeHtml(parsed.details.password)}</span>
                                <button class="icon-btn btn-sm inline-btn" id="toggleResultPass" style="margin-left: 8px;">
                                    <i data-lucide="eye" style="width:12px;height:12px"></i>
                                </button>
                            </span>
                        </div>
                        ` : ''}
                    </div>
                `;
                
                if (parsed.details.password) {
                    actions.push({
                        label: 'Copy Password',
                        icon: 'copy',
                        class: 'primary-btn',
                        onClick: () => {
                            navigator.clipboard.writeText(parsed.details.password);
                            showToast('Password copied to clipboard!');
                        }
                    });
                }
                break;

            case 'vcard':
                html = `
                    <div class="parsed-card">
                        <h4><i data-lucide="user"></i> Contact Card</h4>
                        <div class="detail-row">
                            <span class="detail-label">Full Name</span>
                            <span class="detail-value">${escapeHtml(parsed.details.name)}</span>
                        </div>
                        ${parsed.details.tel ? `
                        <div class="detail-row">
                            <span class="detail-label">Phone</span>
                            <span class="detail-value">${escapeHtml(parsed.details.tel)}</span>
                        </div>
                        ` : ''}
                        ${parsed.details.email ? `
                        <div class="detail-row">
                            <span class="detail-label">Email</span>
                            <span class="detail-value">${escapeHtml(parsed.details.email)}</span>
                        </div>
                        ` : ''}
                        ${parsed.details.org ? `
                        <div class="detail-row">
                            <span class="detail-label">Company</span>
                            <span class="detail-value">${escapeHtml(parsed.details.org)}</span>
                        </div>
                        ` : ''}
                        ${parsed.details.url ? `
                        <div class="detail-row">
                            <span class="detail-label">Website</span>
                            <span class="detail-value">${escapeHtml(parsed.details.url)}</span>
                        </div>
                        ` : ''}
                    </div>
                `;

                actions.push({
                    label: 'Export vCard',
                    icon: 'download',
                    class: 'primary-btn',
                    onClick: () => {
                        const blob = new Blob([parsed.raw], { type: 'text/vcard' });
                        const link = document.createElement('a');
                        link.href = URL.createObjectURL(blob);
                        link.download = `${parsed.details.name.replace(/\s+/g, '_') || 'contact'}.vcf`;
                        link.click();
                        showToast('vCard exported');
                    }
                });

                if (parsed.details.tel) {
                    actions.push({
                        label: 'Call',
                        icon: 'phone',
                        class: 'secondary-btn',
                        onClick: () => { window.location.href = `tel:${parsed.details.tel}`; }
                    });
                }
                break;

            case 'event':
                html = `
                    <div class="parsed-card">
                        <h4><i data-lucide="calendar"></i> Calendar Event</h4>
                        <div class="detail-row">
                            <span class="detail-label">Event Title</span>
                            <span class="detail-value">${escapeHtml(parsed.details.summary)}</span>
                        </div>
                        ${parsed.details.start ? `
                        <div class="detail-row">
                            <span class="detail-label">Start Time</span>
                            <span class="detail-value">${escapeHtml(parsed.details.start)}</span>
                        </div>
                        ` : ''}
                        ${parsed.details.end ? `
                        <div class="detail-row">
                            <span class="detail-label">End Time</span>
                            <span class="detail-value">${escapeHtml(parsed.details.end)}</span>
                        </div>
                        ` : ''}
                        ${parsed.details.location ? `
                        <div class="detail-row">
                            <span class="detail-label">Location</span>
                            <span class="detail-value">${escapeHtml(parsed.details.location)}</span>
                        </div>
                        ` : ''}
                        ${parsed.details.description ? `
                        <div class="detail-row" style="flex-direction: column; align-items: flex-start;">
                            <span class="detail-label">Description</span>
                            <span class="detail-value" style="font-weight: normal; margin-top: 4px;">${escapeHtml(parsed.details.description)}</span>
                        </div>
                        ` : ''}
                    </div>
                `;

                actions.push({
                    label: 'Export iCal (.ics)',
                    icon: 'calendar-plus',
                    class: 'primary-btn',
                    onClick: () => {
                        const blob = new Blob([parsed.raw], { type: 'text/calendar' });
                        const link = document.createElement('a');
                        link.href = URL.createObjectURL(blob);
                        link.download = `${parsed.details.summary.replace(/\s+/g, '_') || 'event'}.ics`;
                        link.click();
                        showToast('iCalendar event downloaded');
                    }
                });
                break;

            case 'location':
                html = `
                    <div class="parsed-card">
                        <h4><i data-lucide="map-pin"></i> Geographic Location</h4>
                        <div class="detail-row">
                            <span class="detail-label">Latitude</span>
                            <span class="detail-value">${parsed.details.lat}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Longitude</span>
                            <span class="detail-value">${parsed.details.lon}</span>
                        </div>
                    </div>
                `;

                actions.push({
                    label: 'View on Maps',
                    icon: 'map',
                    class: 'primary-btn',
                    onClick: () => {
                        window.open(`https://www.google.com/maps/search/?api=1&query=${parsed.details.lat},${parsed.details.lon}`, '_blank');
                    }
                });
                break;

            case 'url':
                html = `
                    <div class="parsed-card">
                        <h4><i data-lucide="link"></i> Web Link</h4>
                        <a href="${escapeHtml(parsed.details.url)}" target="_blank" rel="noopener noreferrer" class="web-preview-link">
                            ${escapeHtml(parsed.details.url)}
                            <i data-lucide="external-link" style="width: 14px; height: 14px; margin-left: 4px;"></i>
                        </a>
                    </div>
                `;
                
                actions.push({
                    label: 'Open URL',
                    icon: 'external-link',
                    class: 'primary-btn',
                    onClick: () => { window.open(parsed.details.url, '_blank'); }
                });
                break;

            case 'email':
                html = `
                    <div class="parsed-card">
                        <h4><i data-lucide="mail"></i> Email Draft</h4>
                        <div class="detail-row">
                            <span class="detail-label">Recipient</span>
                            <span class="detail-value">${escapeHtml(parsed.details.email)}</span>
                        </div>
                        ${parsed.details.subject ? `
                        <div class="detail-row">
                            <span class="detail-label">Subject</span>
                            <span class="detail-value">${escapeHtml(parsed.details.subject)}</span>
                        </div>
                        ` : ''}
                        ${parsed.details.body ? `
                        <div class="detail-row" style="flex-direction: column; align-items: flex-start;">
                            <span class="detail-label">Message</span>
                            <span class="detail-value" style="font-weight: normal; margin-top: 4px;">${escapeHtml(parsed.details.body)}</span>
                        </div>
                        ` : ''}
                    </div>
                `;

                actions.push({
                    label: 'Send Email',
                    icon: 'send',
                    class: 'primary-btn',
                    onClick: () => {
                        window.location.href = `mailto:${parsed.details.email}?subject=${encodeURIComponent(parsed.details.subject)}&body=${encodeURIComponent(parsed.details.body)}`;
                    }
                });
                break;

            case 'sms':
                html = `
                    <div class="parsed-card">
                        <h4><i data-lucide="message-square"></i> SMS Draft</h4>
                        <div class="detail-row">
                            <span class="detail-label">To Phone Number</span>
                            <span class="detail-value">${escapeHtml(parsed.details.phone)}</span>
                        </div>
                        ${parsed.details.message ? `
                        <div class="detail-row" style="flex-direction: column; align-items: flex-start;">
                            <span class="detail-label">Message</span>
                            <span class="detail-value" style="font-weight: normal; margin-top: 4px;">${escapeHtml(parsed.details.message)}</span>
                        </div>
                        ` : ''}
                    </div>
                `;

                actions.push({
                    label: 'Send SMS',
                    icon: 'send',
                    class: 'primary-btn',
                    onClick: () => {
                        window.location.href = `sms:${parsed.details.phone}?body=${encodeURIComponent(parsed.details.message)}`;
                    }
                });
                break;

            case 'tel':
                html = `
                    <div class="parsed-card">
                        <h4><i data-lucide="phone"></i> Phone Number</h4>
                        <div class="detail-row">
                            <span class="detail-label">Phone Number</span>
                            <span class="detail-value">${escapeHtml(parsed.details.phone)}</span>
                        </div>
                    </div>
                `;

                actions.push({
                    label: 'Dial Phone',
                    icon: 'phone-call',
                    class: 'primary-btn',
                    onClick: () => { window.location.href = `tel:${parsed.details.phone}`; }
                });
                break;

            case 'barcode':
                html = `
                    <div class="parsed-card">
                        <h4><i data-lucide="barcode"></i> Scanned Barcode Product</h4>
                        <div class="detail-row">
                            <span class="detail-label">Format Type</span>
                            <span class="detail-value">${escapeHtml(parsed.details.format)}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Barcode Value</span>
                            <span class="detail-value">${escapeHtml(parsed.details.value)}</span>
                        </div>
                    </div>
                `;

                actions.push({
                    label: 'Search Product',
                    icon: 'search',
                    class: 'primary-btn',
                    onClick: () => {
                        const countryCode = appState.settings.country === 'auto' ? '' : `&gl=${appState.settings.country.toLowerCase()}`;
                        window.open(`https://www.google.com/search?tbm=shop&q=${encodeURIComponent(parsed.details.value)}${countryCode}`, '_blank');
                    }
                });
                break;

            default:
                html = `
                    <div class="parsed-card">
                        <h4><i data-lucide="align-left"></i> Plain Text Content</h4>
                        <p style="white-space: pre-wrap; word-break: break-word;">${escapeHtml(parsed.details.text)}</p>
                    </div>
                `;
                break;
        }

        elements.parsedResultDetails.innerHTML = html;
        elements.rawResultText.textContent = parsed.raw;

        // Render Action Buttons
        elements.dynamicActions.innerHTML = '';
        actions.forEach(act => {
            const btn = document.createElement('button');
            btn.className = `${act.class} flex-1`;
            btn.innerHTML = `<i data-lucide="${act.icon}"></i> ${act.label}`;
            btn.addEventListener('click', act.onClick);
            elements.dynamicActions.appendChild(btn);
        });

        // Set top badge type
        elements.resultTypeName.textContent = parsed.type.toUpperCase();
        
        let typeIcon = 'info';
        if (parsed.type === 'wifi') typeIcon = 'wifi';
        else if (parsed.type === 'vcard') typeIcon = 'user';
        else if (parsed.type === 'event') typeIcon = 'calendar';
        else if (parsed.type === 'location') typeIcon = 'map-pin';
        else if (parsed.type === 'url') typeIcon = 'link';
        else if (parsed.type === 'email') typeIcon = 'mail';
        else if (parsed.type === 'sms') typeIcon = 'message-square';
        else if (parsed.type === 'tel') typeIcon = 'phone';
        else if (parsed.type === 'barcode') typeIcon = 'barcode';
        else if (parsed.type === 'text') typeIcon = 'align-left';
        
        elements.resultIcon.setAttribute('data-lucide', typeIcon);
        refreshIcons();

        // Wire result-specific toggles
        const toggleResultPassBtn = document.getElementById('toggleResultPass');
        if (toggleResultPassBtn) {
            toggleResultPassBtn.addEventListener('click', () => {
                const obscured = toggleResultPassBtn.parentElement.querySelector('.obscured-pass');
                const revealed = toggleResultPassBtn.parentElement.querySelector('.revealed-pass');
                const icon = toggleResultPassBtn.querySelector('i');

                if (obscured.style.display !== 'none') {
                    obscured.style.display = 'none';
                    revealed.style.display = 'inline';
                    icon.setAttribute('data-lucide', 'eye-off');
                } else {
                    obscured.style.display = 'inline';
                    revealed.style.display = 'none';
                    icon.setAttribute('data-lucide', 'eye');
                }
                refreshIcons();
            });
        }
    }

    function showResultPane(rawText) {
        const parsed = parseQRCode(rawText);
        appState.currentResult = parsed;
        
        renderParsedDetails(parsed);
        elements.scanResultSection.style.display = 'block';
        elements.scanResultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Auto copy setting check
        if (appState.settings.autoCopy) {
            navigator.clipboard.writeText(rawText).then(() => {
                showToast("Copied result to clipboard!");
            }).catch(e => {
                console.warn("Clipboard auto-copy block:", e);
            });
        }
    }

    function closeResultPane() {
        elements.scanResultSection.style.display = 'none';
        appState.currentResult = null;
    }

    elements.closeResultBtn.addEventListener('click', closeResultPane);

    elements.copyRawBtn.addEventListener('click', () => {
        if (appState.currentResult) {
            navigator.clipboard.writeText(appState.currentResult.raw);
            showToast('Raw content copied!');
        }
    });

    /* CAMERA SCANNING CODE */
    function getCameras() {
        if (typeof Html5Qrcode === 'undefined') return;

        Html5Qrcode.getCameras().then(devices => {
            if (devices && devices.length) {
                appState.cameras = devices;
                elements.cameraSelect.innerHTML = '';
                
                let defaultIndex = 0;
                devices.forEach((device, index) => {
                    const option = document.createElement('option');
                    option.value = device.id;
                    const label = device.label || `Camera ${index + 1}`;
                    option.textContent = label;
                    elements.cameraSelect.appendChild(option);

                    const lowerLabel = label.toLowerCase();
                    if (lowerLabel.includes('back') || lowerLabel.includes('rear') || lowerLabel.includes('environment')) {
                        defaultIndex = index;
                    }
                });

                elements.cameraSelect.selectedIndex = defaultIndex;
                appState.activeCameraId = devices[defaultIndex].id;
            } else {
                elements.cameraSelect.innerHTML = '<option value="">No cameras detected</option>';
            }
        }).catch(err => {
            console.error(err);
            elements.cameraSelect.innerHTML = '<option value="">Permission Denied / No Camera</option>';
        });
    }

    setTimeout(getCameras, 1000);

    elements.cameraSelect.addEventListener('change', (e) => {
        appState.activeCameraId = e.target.value;
    });

    function startScanner() {
        if (!appState.activeCameraId) {
            showToast('Please select a camera first', 'error');
            return;
        }
        
        if (appState.isScanning) return;
        closeResultPane();

        appState.html5QrCode = new Html5Qrcode("reader");

        elements.scannerWrapper.classList.add('scanning');
        elements.scannerPlaceholder.style.display = 'none';
        elements.startScanBtn.disabled = true;
        elements.stopScanBtn.disabled = false;
        appState.isScanning = true;

        const config = {
            fps: 15,
            qrbox: (width, height) => {
                const minSide = Math.min(width, height);
                return {
                    width: Math.floor(minSide * 0.75),
                    height: Math.floor(minSide * 0.75)
                };
            }
        };

        appState.html5QrCode.start(
            appState.activeCameraId,
            config,
            (decodedText) => {
                playBeep();
                stopScanner();
                showResultPane(decodedText);
                addToHistory(decodedText, 'scanned');
                showToast('Code Scanned Successfully!');
            },
            (errorMessage) => {}
        ).then(() => {
            // Check Zoom support in video tracks
            try {
                const videoTrack = appState.html5QrCode.getRunningTrack();
                if (videoTrack) {
                    appState.cameraTrack = videoTrack;
                    const capabilities = videoTrack.getCapabilities();
                    if (capabilities.zoom) {
                        elements.zoomControlWrapper.style.display = 'flex';
                        elements.scannerZoom.min = capabilities.zoom.min || 1;
                        elements.scannerZoom.max = capabilities.zoom.max || 5;
                        elements.scannerZoom.step = capabilities.zoom.step || 0.1;
                        elements.scannerZoom.value = capabilities.zoom.min || 1;
                        elements.zoomValDisplay.textContent = `${Number(elements.scannerZoom.value).toFixed(1)}x`;
                    } else {
                        elements.zoomControlWrapper.style.display = 'none';
                    }
                }
            } catch (e) {
                elements.zoomControlWrapper.style.display = 'none';
            }
        }).catch(err => {
            showToast(`Camera Error: ${err}`, 'error');
            stopScanner();
        });
    }

    // Zoom slider change handler
    elements.scannerZoom.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        elements.zoomValDisplay.textContent = `${value.toFixed(1)}x`;
        if (appState.cameraTrack) {
            appState.cameraTrack.applyConstraints({
                advanced: [{ zoom: value }]
            }).catch(err => {
                console.error("Zoom constraint failed:", err);
            });
        }
    });

    function stopScanner() {
        if (!appState.isScanning) return;

        elements.scannerWrapper.classList.remove('scanning');
        elements.scannerPlaceholder.style.display = 'flex';
        elements.startScanBtn.disabled = false;
        elements.stopScanBtn.disabled = true;
        elements.zoomControlWrapper.style.display = 'none';
        appState.isScanning = false;
        appState.cameraTrack = null;

        if (appState.html5QrCode) {
            appState.html5QrCode.stop().then(() => {
                appState.html5QrCode.clear();
                appState.html5QrCode = null;
            }).catch(err => {
                console.error(err);
            });
        }
    }

    elements.startScanBtn.addEventListener('click', startScanner);
    elements.stopScanBtn.addEventListener('click', stopScanner);

    /* FILE SCANNING CODE */
    elements.dropZone.addEventListener('click', () => {
        elements.qrFileInput.click();
    });

    elements.qrFileInput.addEventListener('change', handleFileSelect);

    ['dragenter', 'dragover'].forEach(eventName => {
        elements.dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            elements.dropZone.classList.add('drag-over');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        elements.dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            elements.dropZone.classList.remove('drag-over');
        }, false);
    });

    elements.dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length) {
            elements.qrFileInput.files = files;
            handleFileSelect();
        }
    });

    function handleFileSelect() {
        const file = elements.qrFileInput.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            showToast("File size exceeds 5MB limit", "error");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            elements.filePreview.src = e.target.result;
            elements.dropZonePrompt.style.display = 'none';
            elements.filePreviewContainer.style.display = 'block';
            elements.fileActionContainer.style.display = 'block';
            closeResultPane();
        };
        reader.readAsDataURL(file);
    }

    elements.removeFileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        resetFileUploader();
    });

    function resetFileUploader() {
        elements.qrFileInput.value = '';
        elements.filePreview.src = '';
        elements.filePreviewContainer.style.display = 'none';
        elements.dropZonePrompt.style.display = 'block';
        elements.fileActionContainer.style.display = 'none';
        closeResultPane();
    }

    function preprocessImageForQR(file, type) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    const maxDim = 800;
                    let w = img.width;
                    let h = img.height;
                    if (w > maxDim || h > maxDim) {
                        if (w > h) {
                            h = Math.round((h * maxDim) / w);
                            w = maxDim;
                        } else {
                            w = Math.round((w * maxDim) / h);
                            h = maxDim;
                        }
                    }
                    
                    canvas.width = w;
                    canvas.height = h;
                    ctx.drawImage(img, 0, 0, w, h);
                    
                    const imgData = ctx.getImageData(0, 0, w, h);
                    const data = imgData.data;
                    
                    if (type === 'contrast') {
                        const factor = (259 * (150 + 255)) / (255 * (259 - 150));
                        for (let i = 0; i < data.length; i += 4) {
                            data[i] = factor * (data[i] - 128) + 128;
                            data[i+1] = factor * (data[i+1] - 128) + 128;
                            data[i+2] = factor * (data[i+2] - 128) + 128;
                        }
                        ctx.putImageData(imgData, 0, 0);
                    } else if (type === 'threshold') {
                        for (let i = 0; i < data.length; i += 4) {
                            const gray = data[i] * 0.299 + data[i+1] * 0.587 + data[i+2] * 0.114;
                            const val = gray > 127 ? 255 : 0;
                            data[i] = val;
                            data[i+1] = val;
                            data[i+2] = val;
                        }
                        ctx.putImageData(imgData, 0, 0);
                    }
                    
                    canvas.toBlob((blob) => {
                        if (blob) {
                            const preprocessedFile = new File([blob], file.name, { type: 'image/png' });
                            resolve(preprocessedFile);
                        } else {
                            reject(new Error("Blob conversion failed"));
                        }
                    }, 'image/png');
                };
                img.onerror = () => reject(new Error("Image load failed"));
                img.src = e.target.result;
            };
            reader.onerror = () => reject(new Error("File read failed"));
            reader.readAsDataURL(file);
        });
    }

    elements.scanFileBtn.addEventListener('click', async () => {
        const file = elements.qrFileInput.files[0];
        if (!file) return;

        if (typeof Html5Qrcode === 'undefined') {
            showToast('Scanner library loading. Try again.', 'error');
            return;
        }

        elements.scanFileBtn.disabled = true;
        elements.scanFileBtn.innerHTML = `<i data-lucide="loader" class="rotating"></i> Analyzing QR Code...`;
        refreshIcons();

        // Create a temporary isolated element to perform file scanning and prevent conflicts with the live scanner
        const tempId = "temp-qr-reader-" + Date.now();
        const tempDiv = document.createElement("div");
        tempDiv.id = tempId;
        tempDiv.style.display = "none";
        document.body.appendChild(tempDiv);

        const localScanner = new Html5Qrcode(tempId);

        try {
            console.log("Scan attempt 1 (original)...");
            const decodedText = await localScanner.scanFile(file, false);
            playBeep();
            showResultPane(decodedText);
            addToHistory(decodedText, 'scanned');
            showToast('Code parsed successfully!');
        } catch (err) {
            console.warn("Scan attempt 1 failed. Trying resize preprocessing...");
            try {
                const resizedFile = await preprocessImageForQR(file, 'resize');
                const decodedText = await localScanner.scanFile(resizedFile, false);
                playBeep();
                showResultPane(decodedText);
                addToHistory(decodedText, 'scanned');
                showToast('Code parsed successfully after resizing!');
            } catch (err2) {
                console.warn("Scan attempt 2 failed. Trying contrast boost preprocessing...");
                try {
                    const contrastFile = await preprocessImageForQR(file, 'contrast');
                    const decodedText = await localScanner.scanFile(contrastFile, false);
                    playBeep();
                    showResultPane(decodedText);
                    addToHistory(decodedText, 'scanned');
                    showToast('Code parsed successfully after contrast boost!');
                } catch (err3) {
                    console.warn("Scan attempt 3 failed. Trying binary threshold preprocessing...");
                    try {
                        const thresholdFile = await preprocessImageForQR(file, 'threshold');
                        const decodedText = await localScanner.scanFile(thresholdFile, false);
                        playBeep();
                        showResultPane(decodedText);
                        addToHistory(decodedText, 'scanned');
                        showToast('Code parsed successfully after thresholding!');
                    } catch (err4) {
                        console.error("All QR scanning attempts failed.");
                        showToast("Failed to recognize any QR/barcodes in this image. Make sure it is clear and well-lit.", "error");
                    }
                }
            }
        } finally {
            elements.scanFileBtn.disabled = false;
            elements.scanFileBtn.innerHTML = `<i data-lucide="scan"></i> Analyze Image`;
            refreshIcons();
            try {
                localScanner.clear();
            } catch (e) {}
            document.body.removeChild(tempDiv);
        }
    });

    /* GENERATOR CODE */
    // Password visibility toggle
    elements.passwordToggleBtn.addEventListener('click', () => {
        const type = elements.wifiPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        elements.wifiPasswordInput.setAttribute('type', type);
        
        const icon = elements.passwordToggleBtn.querySelector('i');
        if (type === 'password') {
            icon.setAttribute('data-lucide', 'eye');
        } else {
            icon.setAttribute('data-lucide', 'eye-off');
        }
        refreshIcons();
    });

    // Handle Type Selection tabs
    elements.typeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetType = btn.getAttribute('data-type');
            elements.typeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            elements.fieldGroups.forEach(grp => {
                grp.classList.remove('active');
                if (grp.getAttribute('data-fields') === targetType) {
                    grp.classList.add('active');
                }
            });
        });
    });

    // Code Generator
    function generateCode(silent = false) {
        const activeTypeBtn = document.querySelector('.type-btn.active');
        const type = activeTypeBtn.getAttribute('data-type');
        let rawContent = '';

        const darkColor = elements.qrColorDark.value;
        const lightColor = elements.qrColorLight.value;

        // Build container
        elements.genQrOutput.innerHTML = '';
        const canvas = document.createElement('canvas');
        elements.genQrOutput.appendChild(canvas);
        appState.generatedQrCanvas = canvas;

        if (type === 'barcode') {
            const format = elements.barcodeFormat.value;
            const value = elements.barcodeValue.value.trim();

            if (!value && !silent) {
                showToast('Please specify barcode digits/characters', 'error');
                return;
            }

            try {
                // Generate 1D barcode
                JsBarcode(canvas, value || "123456", {
                    format: format,
                    lineColor: darkColor,
                    background: lightColor,
                    displayValue: true,
                    width: 2.2,
                    height: 90,
                    margin: 10
                });
                
                elements.qrGenActions.style.display = 'flex';
                if (!silent) {
                    addToHistory(value, 'generated');
                    showToast('Barcode Generated!');
                }
            } catch (err) {
                console.error(err);
                if (!silent) showToast("Invalid character format for selected barcode standard", "error");
                elements.genQrOutput.innerHTML = `
                    <div class="empty-state">
                        <i data-lucide="alert-triangle" class="empty-icon text-danger"></i>
                        <p class="text-danger">Invalid characters for format ${format}</p>
                    </div>
                `;
                refreshIcons();
                elements.qrGenActions.style.display = 'none';
            }
            return;
        }

        // QR Code generation branches
        switch (type) {
            case 'text':
                rawContent = elements.genText.value.trim();
                if (!rawContent && !silent) {
                    showToast('Please type a text message', 'error');
                    return;
                }
                break;
            case 'url':
                rawContent = elements.genUrl.value.trim();
                if ((!rawContent || rawContent === 'https://' || rawContent === 'http://') && !silent) {
                    showToast('Please specify website link', 'error');
                    return;
                }
                break;
            case 'wifi':
                const ssid = elements.wifiSsid.value.trim();
                const pass = elements.wifiPasswordInput.value;
                const security = elements.wifiSecurity.value;
                const isHidden = elements.wifiHidden.checked;

                if (!ssid && !silent) {
                    showToast('Network SSID is required', 'error');
                    return;
                }
                rawContent = `WIFI:S:${escapeWifiField(ssid)};T:${security};P:${escapeWifiField(pass)};${isHidden ? 'H:true;' : ''};`;
                break;
            case 'vcard':
                const fn = elements.contactFirstName.value.trim();
                const ln = elements.contactLastName.value.trim();
                const phone = elements.contactPhone.value.trim();
                const email = elements.contactEmail.value.trim();
                const org = elements.contactOrg.value.trim();
                const url = elements.contactUrl.value.trim();

                if (!fn && !ln && !silent) {
                    showToast('Contact name is required', 'error');
                    return;
                }
                rawContent = `BEGIN:VCARD\nVERSION:3.0\nN:${ln};${fn};;;\nFN:${fn} ${ln}\nTEL;TYPE=CELL:${phone}\nEMAIL;TYPE=PREF,INTERNET:${email}\nORG:${org}\nURL:${url}\nEND:VCARD`;
                break;
                
            case 'email':
                const emRecipient = elements.genEmailRecipient.value.trim();
                const emSubject = elements.genEmailSubject.value.trim();
                const emBody = elements.genEmailBody.value.trim();

                if (!emRecipient && !silent) {
                    showToast('Recipient email address is required', 'error');
                    return;
                }
                rawContent = `mailto:${emRecipient}?subject=${encodeURIComponent(emSubject)}&body=${encodeURIComponent(emBody)}`;
                break;

            case 'sms':
                const smsPhone = elements.genSmsPhone.value.trim();
                const smsMsg = elements.genSmsMessage.value;

                if (!smsPhone && !silent) {
                    showToast('Recipient phone number is required', 'error');
                    return;
                }
                rawContent = `SMSTO:${smsPhone}:${smsMsg}`;
                break;

            case 'location':
                const lat = elements.genGeoLat.value.trim();
                const lon = elements.genGeoLon.value.trim();

                if ((!lat || !lon) && !silent) {
                    showToast('Latitude and Longitude are required', 'error');
                    return;
                }
                rawContent = `geo:${lat},${lon}`;
                break;

            case 'event':
                const evTitle = elements.eventSummary.value.trim();
                const evStart = elements.eventStart.value;
                const evEnd = elements.eventEnd.value;
                const evLoc = elements.eventLocation.value.trim();
                const evDesc = elements.eventDesc.value.trim();

                if (!evTitle && !silent) {
                    showToast('Event title is required', 'error');
                    return;
                }

                // Format Event Date string to iCal: YYYYMMDDTHHMMSSZ
                const convertToICal = (dtStr) => {
                    if (!dtStr) return '';
                    const date = new Date(dtStr);
                    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
                };

                rawContent = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${evTitle}\nDTSTART:${convertToICal(evStart)}\nDTEND:${convertToICal(evEnd)}\nLOCATION:${evLoc}\nDESCRIPTION:${evDesc}\nEND:VEVENT\nEND:VCALENDAR`;
                break;
        }

        if (typeof QRCode === 'undefined') {
            showToast('QR Library loading...', 'error');
            return;
        }

        QRCode.toCanvas(canvas, rawContent || "Litescan", {
            width: 256,
            margin: 2,
            color: {
                dark: darkColor,
                light: lightColor
            }
        }, function (error) {
            if (error) {
                console.error(error);
                if (!silent) showToast("Generation failed", "error");
            } else {
                elements.qrGenActions.style.display = 'flex';
                if (!silent) {
                    addToHistory(rawContent, 'generated');
                    showToast('QR Code Generated!');
                }
            }
        });
    }

    elements.generateBtn.addEventListener('click', () => generateCode(false));

    elements.downloadQrBtn.addEventListener('click', () => {
        if (!appState.generatedQrCanvas) return;
        const link = document.createElement('a');
        link.download = 'code-aura.png';
        link.href = appState.generatedQrCanvas.toDataURL('image/png');
        link.click();
        showToast('Image downloaded!');
    });

    elements.shareQrBtn.addEventListener('click', () => {
        if (!appState.generatedQrCanvas) return;
        try {
            appState.generatedQrCanvas.toBlob(blob => {
                const item = new ClipboardItem({ "image/png": blob });
                navigator.clipboard.write([item]).then(() => {
                    showToast('Image copied to clipboard!');
                }).catch(err => {
                    console.error(err);
                    showToast('Clipboard API not supported on this browser', 'error');
                });
            });
        } catch (err) {
            console.error(err);
            showToast('Unable to export image', 'error');
        }
    });

    // Colors input watcher
    [elements.qrColorDark, elements.qrColorLight].forEach(input => {
        input.addEventListener('input', () => {
            if (appState.generatedQrCanvas) {
                generateCode(true); // update silently
            }
        });
    });

    /* HISTORY LOGGING SYSTEM */
    function loadHistory() {
        const storage = localStorage.getItem('litescan_history');
        if (storage) {
            try { appState.history = JSON.parse(storage); } catch (e) { appState.history = []; }
        } else {
            appState.history = [];
        }
        renderHistory();
    }

    function saveHistory() {
        localStorage.setItem('litescan_history', JSON.stringify(appState.history));
        renderHistory();
    }

    function addToHistory(rawText, mode = 'scanned') {
        const parsed = parseQRCode(rawText);
        const item = {
            id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
            raw: rawText,
            mode: mode,
            type: parsed.type,
            title: parsed.title,
            timestamp: new Date().toISOString()
        };

        appState.history.unshift(item);
        if (appState.history.length > 100) appState.history.pop();
        saveHistory();
    }

    function deleteHistoryItem(id) {
        appState.history = appState.history.filter(item => item.id !== id);
        saveHistory();
        showToast('History item deleted');
    }

    function renderHistory() {
        const badgeCount = appState.history.length;
        if (badgeCount > 0) {
            elements.historyBadge.textContent = badgeCount;
            elements.historyBadge.style.display = 'inline-block';
            elements.clearHistoryBtn.style.display = 'inline-flex';
        } else {
            elements.historyBadge.style.display = 'none';
            elements.clearHistoryBtn.style.display = 'none';
        }

        elements.historyList.innerHTML = '';
        if (appState.history.length === 0) {
            elements.historyList.innerHTML = `
                <div class="empty-state">
                    <i data-lucide="folder-open" class="empty-icon"></i>
                    <p>No scans or generated codes yet</p>
                </div>
            `;
            refreshIcons();
            return;
        }

        appState.history.forEach(item => {
            const date = new Date(item.timestamp);
            const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            let typeIcon = 'info';
            if (item.type === 'wifi') typeIcon = 'wifi';
            else if (item.type === 'vcard') typeIcon = 'user';
            else if (item.type === 'event') typeIcon = 'calendar';
            else if (item.type === 'location') typeIcon = 'map-pin';
            else if (item.type === 'url') typeIcon = 'link';
            else if (item.type === 'email') typeIcon = 'mail';
            else if (item.type === 'sms') typeIcon = 'message-square';
            else if (item.type === 'tel') typeIcon = 'phone';
            else if (item.type === 'barcode') typeIcon = 'barcode';
            else if (item.type === 'text') typeIcon = 'align-left';

            const itemEl = document.createElement('div');
            itemEl.className = `history-item ${item.mode}`;
            itemEl.innerHTML = `
                <div class="history-item-left">
                    <div class="history-item-icon" title="${item.mode === 'scanned' ? 'Scanned' : 'Generated'}">
                        <i data-lucide="${typeIcon}"></i>
                    </div>
                    <div class="history-item-details">
                        <h4 class="history-item-title">${escapeHtml(item.title)}</h4>
                        <p class="history-item-subtitle">${escapeHtml(item.mode.toUpperCase())} • ${dateStr}</p>
                    </div>
                </div>
                <div class="history-item-actions">
                    <button class="icon-btn view-history-btn" title="View details">
                        <i data-lucide="eye"></i>
                    </button>
                    <button class="icon-btn copy-history-btn" title="Copy raw text">
                        <i data-lucide="copy"></i>
                    </button>
                    <button class="icon-btn delete-history-btn" title="Delete item">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            `;

            itemEl.querySelector('.view-history-btn').addEventListener('click', () => {
                showResultPane(item.raw);
            });
            itemEl.querySelector('.copy-history-btn').addEventListener('click', () => {
                navigator.clipboard.writeText(item.raw);
                showToast('Content copied!');
            });
            itemEl.querySelector('.delete-history-btn').addEventListener('click', () => {
                deleteHistoryItem(item.id);
            });

            elements.historyList.appendChild(itemEl);
        });

        refreshIcons();
    }

    elements.clearHistoryBtn.addEventListener('click', () => {
        if (confirm("Are you sure you want to clear your scanning history?")) {
            appState.history = [];
            saveHistory();
            showToast('History cleared');
        }
    });

    loadHistory();

    // Backup window load listener for icon rendering
    window.addEventListener('load', refreshIcons);

    /* UTILITY HELPERS */
    function escapeHtml(text) {
        if (!text) return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    }

    function escapeWifiField(str) {
        if (!str) return '';
        return str.replace(/\\/g, '\\\\')
                  .replace(/;/g, '\\;')
                  .replace(/:/g, '\\:')
                  .replace(/,/g, '\\,');
    }

    /* ══════════════ PRO TOOLS MENU LOGIC & WORKSPACES ══════════════ */
    const toolModal = document.getElementById('toolModal');
    const toolModalTitle = document.getElementById('toolModalTitle');
    const toolModalIcon = document.getElementById('toolModalIcon');
    const toolModalBody = document.getElementById('toolModalBody');
    const closeToolModalBtn = document.getElementById('closeToolModal');

    let docScannerStream = null;

    function stopDocScannerCamera() {
        if (docScannerStream) {
            docScannerStream.getTracks().forEach(track => track.stop());
            docScannerStream = null;
        }
    }

    // Close tool modal
    if (closeToolModalBtn) {
        closeToolModalBtn.addEventListener('click', () => {
            stopDocScannerCamera();
            toolModal.style.display = 'none';
            toolModalBody.innerHTML = ''; // Clear contents
        });
    }

    // Close modal on background click
    window.addEventListener('click', (e) => {
        if (e.target === toolModal) {
            stopDocScannerCamera();
            toolModal.style.display = 'none';
            toolModalBody.innerHTML = '';
        }
    });

    const toolCards = document.querySelectorAll('.tool-card');
    toolCards.forEach(card => {
        card.addEventListener('click', () => {
            const toolId = card.getAttribute('data-tool');
            if (toolId === 'barcode-scanner') return; // Redirects to scan tab

            const title = card.querySelector('h3').textContent;
            const iconHTML = card.querySelector('.tool-icon-wrapper').innerHTML;
            const themeClass = card.getAttribute('data-theme') || 'scan-theme';

            openToolWorkspace(toolId, title, iconHTML, themeClass);
        });
    });

    const barcodeToolLink = document.getElementById('barcodeToolLink');
    if (barcodeToolLink) {
        barcodeToolLink.addEventListener('click', () => {
            // Switch to camera-scan tab
            const cameraTabBtn = document.querySelector('.tab-btn[data-tab="camera-scan"]');
            if (cameraTabBtn) {
                cameraTabBtn.click();
                showToast("Barcode Scanner launched", "success");
            }
        });
    }

    // Dynamically set up workspaces for each tool type
    function openToolWorkspace(toolId, title, iconHTML, themeClass) {
        toolModalTitle.textContent = title;
        toolModalIcon.className = `tool-modal-icon ${themeClass}`;
        toolModalIcon.innerHTML = iconHTML;
        toolModalBody.innerHTML = ''; // Reset

        // Render tool UI
        switch (toolId) {
            case 'esignature':
                renderEsignatureUI();
                break;
            case 'image-resizer':
                renderImageResizerUI();
                break;
            case 'image-to-pdf':
                renderImageToPdfUI();
                break;
            case 'pdf-to-jpg':
                renderPdfToJpgUI();
                break;
            case 'pdf-merger':
                renderPdfMergerUI();
                break;
            case 'pdf-splitter':
                renderPdfSplitterUI();
                break;
            case 'pdf-compressor':
                renderPdfCompressorUI();
                break;
            case 'doc-scanner':
                renderDocScannerUI();
                break;
            case 'pdf-to-word':
            case 'word-to-pdf':
            case 'ppt-to-pdf':
                renderOfficeConverterUI(toolId, title);
                break;
            case 'ocr-tool':
                renderOcrToolUI();
                break;
            case 'word-counter':
                renderWordCounterUI();
                break;
            case 'image-compressor':
                renderImageCompressorUI();
                break;
            case 'image-watermark':
                renderImageWatermarkUI();
                break;
            case 'image-format-converter':
                renderImageFormatConverterUI();
                break;
            default:
                toolModalBody.innerHTML = `<p class="text-danger">Tool ${toolId} under construction.</p>`;
        }

        toolModal.style.display = 'flex';
        refreshIcons();
    }

    // Helper: Create a standard file upload zone
    function createFileZone(acceptTypes, multiple = false) {
        const id = 'tool-file-input-' + Math.floor(Math.random() * 1000);
        const html = `
            <div class="tool-upload-zone" id="tool-upload-zone">
                <i data-lucide="upload-cloud" class="tool-upload-icon"></i>
                <div class="tool-upload-text">
                    <h4>Drag & drop file${multiple ? 's' : ''} here</h4>
                    <p>or click to browse your device (${acceptTypes})</p>
                </div>
                <input type="file" id="${id}" accept="${acceptTypes}" style="display:none;" ${multiple ? 'multiple' : ''}>
            </div>
            <div class="tool-file-list" id="tool-file-list"></div>
        `;
        return { html, inputId: id };
    }

    // Helper: Wire up drag and drop behaviors
    function setupDragAndDrop(zoneId, inputId, onFilesSelected) {
        const zone = document.getElementById(zoneId);
        const input = document.getElementById(inputId);

        if (!zone || !input) return;

        zone.addEventListener('click', () => input.click());
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.classList.add('dragover');
        });
        zone.addEventListener('dragleave', () => {
            zone.classList.remove('dragover');
        });
        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) {
                onFilesSelected(e.dataTransfer.files);
            }
        });
        input.addEventListener('change', () => {
            if (input.files.length > 0) {
                onFilesSelected(input.files);
            }
        });
    }

    // Helper: Update Progress Bar
    function updateToolProgress(containerId, progressPercent, text = 'Processing...') {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.style.display = 'flex';
        container.querySelector('.tool-progress-text').textContent = text;
        container.querySelector('.tool-progress-fill').style.width = `${progressPercent}%`;
        container.querySelector('.tool-progress-percent').textContent = `${Math.round(progressPercent)}%`;
    }

    /* ✍️ E-SIGNATURE TOOL */
    function renderEsignatureUI() {
        toolModalBody.innerHTML = `
            <p class="text-secondary">Draw your digital signature inside the field below. Use your mouse or finger (for touch devices).</p>
            <div class="signature-canvas-container">
                <div class="signature-canvas-placeholder" id="sigPlaceholder">
                    <i data-lucide="pen-tool"></i>
                    <span>Sign Here</span>
                </div>
                <canvas class="signature-canvas" id="signatureCanvas"></canvas>
            </div>
            <div class="tool-action-btn-row">
                <button class="secondary-btn btn" id="clearSigBtn"><i data-lucide="trash-2"></i> Clear</button>
                <button class="primary-btn btn" id="downloadSigBtn"><i data-lucide="download"></i> Download PNG</button>
            </div>
        `;

        const canvas = document.getElementById('signatureCanvas');
        const clearBtn = document.getElementById('clearSigBtn');
        const downloadBtn = document.getElementById('downloadSigBtn');
        const placeholder = document.getElementById('sigPlaceholder');

        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let isDrawing = false;

        // Fit canvas to container size
        function resizeCanvas() {
            const rect = canvas.parentElement.getBoundingClientRect();
            canvas.width = rect.width * window.devicePixelRatio;
            canvas.height = rect.height * window.devicePixelRatio;
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
        }

        setTimeout(resizeCanvas, 50);

        // Drawing events
        function getPos(e) {
            const rect = canvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return {
                x: clientX - rect.left,
                y: clientY - rect.top
            };
        }

        function startDrawing(e) {
            isDrawing = true;
            placeholder.style.display = 'none';
            const pos = getPos(e);
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
            e.preventDefault();
        }

        function draw(e) {
            if (!isDrawing) return;
            const pos = getPos(e);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
            e.preventDefault();
        }

        function stopDrawing() {
            isDrawing = false;
        }

        canvas.addEventListener('mousedown', startDrawing);
        canvas.addEventListener('mousemove', draw);
        window.addEventListener('mouseup', stopDrawing);

        canvas.addEventListener('touchstart', startDrawing);
        canvas.addEventListener('touchmove', draw);
        window.addEventListener('touchend', stopDrawing);

        clearBtn.addEventListener('click', () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            placeholder.style.display = 'flex';
        });

        downloadBtn.addEventListener('click', () => {
            // Trim whitespace from signature
            const trimmedCanvas = document.createElement('canvas');
            const trimmedCtx = trimmedCanvas.getContext('2d');
            trimmedCanvas.width = canvas.width;
            trimmedCanvas.height = canvas.height;
            trimmedCtx.drawImage(canvas, 0, 0);

            const link = document.createElement('a');
            link.download = 'signature.png';
            link.href = trimmedCanvas.toDataURL('image/png');
            link.click();
            showToast('Signature downloaded as PNG');
        });
    }

    /* 🖼️ IMAGE RESIZER TOOL */
    function renderImageResizerUI() {
        const fileZone = createFileZone('image/*');
        toolModalBody.innerHTML = `
            <p class="text-secondary">Upload an image, configure your desired dimensions, and download the resized version.</p>
            ${fileZone.html}
            <div class="image-resizer-layout" style="display:none;" id="resizer-workspace">
                <div class="resizer-settings">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="resize-width">Width (px)</label>
                            <input type="number" id="resize-width" min="1" value="800">
                        </div>
                        <div class="form-group">
                            <label for="resize-height">Height (px)</label>
                            <input type="number" id="resize-height" min="1" value="600">
                        </div>
                    </div>
                    <div class="form-group" style="flex-direction:row; align-items:center; gap:0.5rem;">
                        <input type="checkbox" id="resize-aspect" checked style="width:auto;">
                        <label for="resize-aspect" style="margin-bottom:0;">Lock Aspect Ratio</label>
                    </div>
                    <button class="primary-btn w-full margin-top" id="resizeBtn"><i data-lucide="scaling"></i> Resize &amp; Download</button>
                </div>
                <div class="resizer-preview-container">
                    <img class="resizer-preview-img" id="resizer-preview" src="">
                </div>
            </div>
        `;

        let originalImg = null;
        let aspectRatio = 1;

        setupDragAndDrop('tool-upload-zone', fileZone.inputId, (files) => {
            const file = files[0];
            if (!file.type.startsWith('image/')) {
                showToast('Please select a valid image file', 'error');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    originalImg = img;
                    aspectRatio = img.width / img.height;
                    
                    document.getElementById('resize-width').value = img.width;
                    document.getElementById('resize-height').value = img.height;
                    document.getElementById('resizer-preview').src = e.target.result;
                    document.getElementById('resizer-workspace').style.display = 'grid';
                    document.getElementById('tool-upload-zone').style.display = 'none';
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });

        // Handle aspect ratio lock link
        const widthInput = document.getElementById('resize-width');
        const heightInput = document.getElementById('resize-height');
        const aspectCheck = document.getElementById('resize-aspect');

        if (widthInput && heightInput) {
            widthInput.addEventListener('input', () => {
                if (aspectCheck.checked && originalImg) {
                    heightInput.value = Math.round(widthInput.value / aspectRatio);
                }
            });
            heightInput.addEventListener('input', () => {
                if (aspectCheck.checked && originalImg) {
                    widthInput.value = Math.round(heightInput.value * aspectRatio);
                }
            });
        }

        const resizeBtn = document.getElementById('resizeBtn');
        if (resizeBtn) {
            resizeBtn.addEventListener('click', () => {
                if (!originalImg) return;
                const targetW = parseInt(widthInput.value) || originalImg.width;
                const targetH = parseInt(heightInput.value) || originalImg.height;

                const outCanvas = document.createElement('canvas');
                outCanvas.width = targetW;
                outCanvas.height = targetH;
                const outCtx = outCanvas.getContext('2d');
                outCtx.drawImage(originalImg, 0, 0, targetW, targetH);

                const link = document.createElement('a');
                link.download = 'resized-image.png';
                link.href = outCanvas.toDataURL('image/png');
                link.click();
                showToast('Resized image downloaded successfully!');
            });
        }
    }


    /* 🖼️ IMAGE TO PDF */
    function renderImageToPdfUI() {
        const fileZone = createFileZone('image/*', true);
        toolModalBody.innerHTML = `
            <p class="text-secondary">Select multiple images to combine into a single multi-page PDF document.</p>
            ${fileZone.html}
            <div class="tool-progress-container" id="img-pdf-progress" style="display:none;">
                <div class="tool-progress-header">
                    <span class="tool-progress-text">Generating document pages...</span>
                    <span class="tool-progress-percent">0%</span>
                </div>
                <div class="tool-progress-bar">
                    <div class="tool-progress-fill"></div>
                </div>
            </div>
            <button class="primary-btn w-full margin-top" id="generatePdfBtn" style="display:none;"><i data-lucide="file-plus-2"></i> Compile Images to PDF</button>
        `;

        let selectedFiles = [];

        setupDragAndDrop('tool-upload-zone', fileZone.inputId, (files) => {
            selectedFiles = Array.from(files);
            const listEl = document.getElementById('tool-file-list');
            listEl.innerHTML = '';
            
            selectedFiles.forEach(file => {
                listEl.innerHTML += `
                    <div class="tool-file-item">
                        <div class="tool-file-info">
                            <i data-lucide="image"></i>
                            <span class="tool-file-name">${file.name}</span>
                            <span class="tool-file-size">(${Math.round(file.size / 1024)} KB)</span>
                        </div>
                    </div>
                `;
            });
            refreshIcons();
            document.getElementById('generatePdfBtn').style.display = 'block';
        });

        const compileBtn = document.getElementById('generatePdfBtn');
        if (compileBtn) {
            compileBtn.addEventListener('click', async () => {
                if (selectedFiles.length === 0) return;
                compileBtn.style.display = 'none';
                document.getElementById('img-pdf-progress').style.display = 'flex';

                try {
                    const { jsPDF } = window.jspdf;
                    const doc = new jsPDF();

                    for (let i = 0; i < selectedFiles.length; i++) {
                        const progress = (i / selectedFiles.length) * 100;
                        updateToolProgress('img-pdf-progress', progress, `Rendering Page ${i + 1}...`);
                        
                        const imgInfo = await new Promise((resolve, reject) => {
                            const img = new Image();
                            img.onload = () => resolve({ src: img.src, w: img.width, h: img.height });
                            img.onerror = (err) => reject(err);
                            const reader = new FileReader();
                            reader.onload = (e) => { img.src = e.target.result; };
                            reader.readAsDataURL(selectedFiles[i]);
                        });

                        if (i > 0) doc.addPage();
                        
                        // Scale photo to page size preserving aspect ratio
                        const pageWidth = doc.internal.pageSize.getWidth();
                        const pageHeight = doc.internal.pageSize.getHeight();
                        
                        const margin = 10;
                        const maxW = pageWidth - (margin * 2);
                        const maxH = pageHeight - (margin * 2);
                        
                        let imgW = imgInfo.w;
                        let imgH = imgInfo.h;
                        const imgRatio = imgW / imgH;
                        const pageRatio = maxW / maxH;
                        
                        if (imgRatio > pageRatio) {
                            // Width limited
                            imgW = maxW;
                            imgH = maxW / imgRatio;
                        } else {
                            // Height limited
                            imgH = maxH;
                            imgW = maxH * imgRatio;
                        }
                        
                        // Center image on the page
                        const x = margin + (maxW - imgW) / 2;
                        const y = margin + (maxH - imgH) / 2;
                        
                        doc.addImage(imgInfo.src, 'JPEG', x, y, imgW, imgH);
                    }

                    updateToolProgress('img-pdf-progress', 100, 'PDF Rendered!');
                    setTimeout(() => {
                        doc.save('images-album.pdf');
                        showToast('PDF downloaded successfully!');
                        toolModal.style.display = 'none';
                    }, 500);

                } catch (err) {
                    console.error(err);
                    showToast('Failed to compile PDF document', 'error');
                }
            });
        }
    }

    /* 📄 PDF TO JPG */
    function renderPdfToJpgUI() {
        const fileZone = createFileZone('application/pdf');
        toolModalBody.innerHTML = `
            <p class="text-secondary">Upload a PDF and export each page as a JPG image.</p>
            ${fileZone.html}
            <div class="tool-progress-container" id="pdf-jpg-progress" style="display:none;">
                <div class="tool-progress-header">
                    <span class="tool-progress-text">Loading PDF pages...</span>
                    <span class="tool-progress-percent">0%</span>
                </div>
                <div class="tool-progress-bar">
                    <div class="tool-progress-fill"></div>
                </div>
            </div>
            <div id="pdf-jpg-pages-container" class="resizer-preview-container" style="display:none; flex-direction:column; gap:1rem; overflow-y:auto;"></div>
        `;

        setupDragAndDrop('tool-upload-zone', fileZone.inputId, async (files) => {
            const file = files[0];
            if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
                showToast('Please upload a valid PDF document', 'error');
                return;
            }

            document.getElementById('tool-upload-zone').style.display = 'none';
            document.getElementById('pdf-jpg-progress').style.display = 'flex';

            try {
                const reader = new FileReader();
                reader.onload = async function() {
                    const typedarray = new Uint8Array(this.result);
                    const pdfjsLib = window['pdfjs-dist/build/pdf'];
                    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

                    const pdf = await pdfjsLib.getDocument(typedarray).promise;
                    const previewContainer = document.getElementById('pdf-jpg-pages-container');
                    previewContainer.innerHTML = '';

                    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                        updateToolProgress('pdf-jpg-progress', (pageNum / pdf.numPages) * 100, `Rendering Page ${pageNum} of ${pdf.numPages}...`);
                        const page = await pdf.getPage(pageNum);
                        const viewport = page.getViewport({ scale: 1.5 });
                        const canvas = document.createElement('canvas');
                        const context = canvas.getContext('2d');
                        canvas.height = viewport.height;
                        canvas.width = viewport.width;

                        await page.render({ canvasContext: context, viewport: viewport }).promise;

                        const imgUrl = canvas.toDataURL('image/jpeg');
                        
                        const pageItem = document.createElement('div');
                        pageItem.style.width = '100%';
                        pageItem.style.display = 'flex';
                        pageItem.style.flexDirection = 'column';
                        pageItem.style.alignItems = 'center';
                        pageItem.style.gap = '0.5rem';
                        pageItem.innerHTML = `
                            <img src="${imgUrl}" class="resizer-preview-img" style="max-height: 200px;">
                            <button class="secondary-btn btn btn-sm download-page-btn" data-page="${pageNum}">
                                <i data-lucide="download"></i> Download Page ${pageNum}
                            </button>
                        `;
                        previewContainer.appendChild(pageItem);
                    }

                    refreshIcons();
                    document.getElementById('pdf-jpg-progress').style.display = 'none';
                    previewContainer.style.display = 'flex';

                    // Bind download individual pages
                    previewContainer.querySelectorAll('.download-page-btn').forEach(btn => {
                        btn.addEventListener('click', () => {
                            const img = btn.previousElementSibling;
                            const link = document.createElement('a');
                            link.download = `pdf-page-${btn.getAttribute('data-page')}.jpg`;
                            link.href = img.src;
                            link.click();
                        });
                    });
                };
                reader.readAsArrayBuffer(file);
            } catch (err) {
                console.error(err);
                showToast('Failed to parse PDF file', 'error');
            }
        });
    }

    /* 📄 PDF MERGER */
    function renderPdfMergerUI() {
        const fileZone = createFileZone('application/pdf', true);
        toolModalBody.innerHTML = `
            <p class="text-secondary">Upload two or more PDF documents to merge them into a single file.</p>
            ${fileZone.html}
            <div class="tool-progress-container" id="pdf-merge-progress" style="display:none;">
                <div class="tool-progress-header">
                    <span class="tool-progress-text">Merging files...</span>
                    <span class="tool-progress-percent">0%</span>
                </div>
                <div class="tool-progress-bar">
                    <div class="tool-progress-fill"></div>
                </div>
            </div>
            <button class="primary-btn w-full margin-top" id="mergePdfsBtn" style="display:none;"><i data-lucide="files"></i> Merge Documents</button>
        `;

        let selectedFiles = [];

        setupDragAndDrop('tool-upload-zone', fileZone.inputId, (files) => {
            selectedFiles = Array.from(files);
            const listEl = document.getElementById('tool-file-list');
            listEl.innerHTML = '';
            
            selectedFiles.forEach(file => {
                listEl.innerHTML += `
                    <div class="tool-file-item">
                        <div class="tool-file-info">
                            <i data-lucide="file-text"></i>
                            <span class="tool-file-name">${file.name}</span>
                            <span class="tool-file-size">(${Math.round(file.size / 1024)} KB)</span>
                        </div>
                    </div>
                `;
            });
            refreshIcons();
            document.getElementById('mergePdfsBtn').style.display = 'block';
        });

        const mergeBtn = document.getElementById('mergePdfsBtn');
        if (mergeBtn) {
            mergeBtn.addEventListener('click', async () => {
                if (selectedFiles.length < 2) {
                    showToast('Please upload at least 2 PDF files to merge', 'error');
                    return;
                }
                mergeBtn.style.display = 'none';
                document.getElementById('pdf-merge-progress').style.display = 'flex';

                try {
                    const mergedPdf = await PDFLib.PDFDocument.create();

                    for (let i = 0; i < selectedFiles.length; i++) {
                        const progress = (i / selectedFiles.length) * 100;
                        updateToolProgress('pdf-merge-progress', progress, `Importing ${selectedFiles[i].name}...`);

                        const bytes = await selectedFiles[i].arrayBuffer();
                        const pdfDoc = await PDFLib.PDFDocument.load(bytes);
                        const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
                        copiedPages.forEach((page) => mergedPdf.addPage(page));
                    }

                    updateToolProgress('pdf-merge-progress', 90, 'Assembling merged document...');
                    const mergedPdfBytes = await mergedPdf.save();
                    
                    updateToolProgress('pdf-merge-progress', 100, 'Merge Complete!');

                    setTimeout(() => {
                        const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'merged-document.pdf';
                        a.click();
                        showToast('Merged PDF downloaded!');
                        toolModal.style.display = 'none';
                    }, 500);

                } catch (err) {
                    console.error(err);
                    showToast('Failed to merge documents', 'error');
                }
            });
        }
    }

    /* ✂️ PDF SPLITTER */
    function renderPdfSplitterUI() {
        const fileZone = createFileZone('application/pdf');
        toolModalBody.innerHTML = `
            <p class="text-secondary">Upload a PDF to split it. You can either extract a specific page range or split the entire document into individual pages.</p>
            ${fileZone.html}
            <div id="pdf-split-settings" style="display:none;">
                <div class="form-group" style="margin-bottom: 1.25rem;">
                    <label style="font-weight: 700; margin-bottom: 0.5rem; display: block;">Splitting Mode</label>
                    <div style="display: flex; gap: 1.5rem; margin-top: 0.5rem;">
                        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-size: 0.95rem;">
                            <input type="radio" name="splitMode" value="range" checked style="accent-color: var(--accent); width: 16px; height: 16px;">
                            Extract Page Range
                        </label>
                        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-size: 0.95rem;">
                            <input type="radio" name="splitMode" value="individual" style="accent-color: var(--accent); width: 16px; height: 16px;">
                            Split All Pages (ZIP)
                        </label>
                    </div>
                </div>
                <div class="form-group" id="split-range-group">
                    <label for="split-pages" id="split-range-label">Page Ranges to Extract</label>
                    <p class="settings-p-desc">Example: 1-3, 5 (splits page 1 to 3, and page 5)</p>
                    <input type="text" id="split-pages" placeholder="e.g. 1-2, 4">
                </div>
                <button class="primary-btn w-full margin-top" id="splitPdfBtn"><i data-lucide="scissors"></i> Split &amp; Download PDF</button>
            </div>
            <div class="tool-progress-container" id="pdf-split-progress" style="display:none;">
                <div class="tool-progress-header">
                    <span class="tool-progress-text">Extracting pages...</span>
                    <span class="tool-progress-percent">0%</span>
                </div>
                <div class="tool-progress-bar">
                    <div class="tool-progress-fill"></div>
                </div>
            </div>
        `;

        let selectedFile = null;

        setupDragAndDrop('tool-upload-zone', fileZone.inputId, async (files) => {
            selectedFile = files[0];
            document.getElementById('tool-upload-zone').style.display = 'none';
            
            const listEl = document.getElementById('tool-file-list');
            listEl.innerHTML = `
                <div class="tool-file-item">
                    <div class="tool-file-info">
                        <i data-lucide="file-text"></i>
                        <span class="tool-file-name">${selectedFile.name}</span>
                        <span class="tool-file-size">(${Math.round(selectedFile.size / 1024)} KB)</span>
                    </div>
                </div>
            `;
            refreshIcons();

            try {
                const bytes = await selectedFile.arrayBuffer();
                const srcDoc = await PDFLib.PDFDocument.load(bytes);
                const totalPages = srcDoc.getPageCount();
                const rangeLabel = document.getElementById('split-range-label');
                if (rangeLabel) {
                    rangeLabel.innerHTML = `Page Ranges to Extract <span style="color:var(--accent); font-weight:normal;">(Total Pages: ${totalPages})</span>`;
                }
            } catch (err) {
                console.error("Error reading pages:", err);
            }

            document.getElementById('pdf-split-settings').style.display = 'block';

            // Handle splitting mode toggles
            const modeRadios = document.querySelectorAll('input[name="splitMode"]');
            const rangeGroup = document.getElementById('split-range-group');
            modeRadios.forEach(radio => {
                radio.addEventListener('change', (e) => {
                    if (e.target.value === 'range') {
                        rangeGroup.style.display = 'block';
                    } else {
                        rangeGroup.style.display = 'none';
                    }
                });
            });
        });

        const splitBtn = document.getElementById('splitPdfBtn');
        if (splitBtn) {
            splitBtn.addEventListener('click', async () => {
                if (!selectedFile) return;

                const splitMode = document.querySelector('input[name="splitMode"]:checked').value;

                if (splitMode === 'range') {
                    const rangeStr = document.getElementById('split-pages').value.trim();
                    if (!rangeStr) {
                        showToast('Please enter a valid page range', 'error');
                        return;
                    }

                    document.getElementById('pdf-split-settings').style.display = 'none';
                    document.getElementById('pdf-split-progress').style.display = 'flex';

                    try {
                        const bytes = await selectedFile.arrayBuffer();
                        const srcDoc = await PDFLib.PDFDocument.load(bytes);
                        const totalPages = srcDoc.getPageCount();

                        // Parse ranges (e.g. 1-3, 5 -> indices [0, 1, 2, 4])
                        const pagesToExtract = [];
                        const parts = rangeStr.split(',');
                        
                        parts.forEach(part => {
                            part = part.trim();
                            // Support standard hyphen, en-dash, and em-dash
                            if (part.match(/[-–—]/)) {
                                const [start, end] = part.split(/[-–—]/).map(Number);
                                for (let i = start; i <= end; i++) {
                                    if (i >= 1 && i <= totalPages) pagesToExtract.push(i - 1);
                                }
                            } else {
                                const pageNum = Number(part);
                                if (pageNum >= 1 && pageNum <= totalPages) pagesToExtract.push(pageNum - 1);
                            }
                        });

                        if (pagesToExtract.length === 0) {
                            showToast('No valid page numbers found matching range', 'error');
                            document.getElementById('pdf-split-settings').style.display = 'block';
                            document.getElementById('pdf-split-progress').style.display = 'none';
                            return;
                        }

                        updateToolProgress('pdf-split-progress', 40, 'Copying specified pages...');
                        const newDoc = await PDFLib.PDFDocument.create();
                        const copiedPages = await newDoc.copyPages(srcDoc, pagesToExtract);
                        copiedPages.forEach(page => newDoc.addPage(page));

                        updateToolProgress('pdf-split-progress', 80, 'Saving new document...');
                        const splitBytes = await newDoc.save();

                        updateToolProgress('pdf-split-progress', 100, 'Extraction Complete!');
                        
                        setTimeout(() => {
                            const blob = new Blob([splitBytes], { type: 'application/pdf' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `split_${selectedFile.name}`;
                            a.click();
                            showToast('Extracted document downloaded!');
                            toolModal.style.display = 'none';
                        }, 500);

                    } catch (err) {
                        console.error(err);
                        showToast('Failed to split document', 'error');
                        document.getElementById('pdf-split-settings').style.display = 'block';
                        document.getElementById('pdf-split-progress').style.display = 'none';
                    }
                } else {
                    // Split into individual pages
                    document.getElementById('pdf-split-settings').style.display = 'none';
                    document.getElementById('pdf-split-progress').style.display = 'flex';

                    try {
                        const bytes = await selectedFile.arrayBuffer();
                        const srcDoc = await PDFLib.PDFDocument.load(bytes);
                        const totalPages = srcDoc.getPageCount();

                        if (typeof JSZip === 'undefined') {
                            throw new Error('ZIP library not loaded. Check your internet connection.');
                        }

                        const zip = new JSZip();

                        for (let i = 0; i < totalPages; i++) {
                            const progress = Math.round((i / totalPages) * 80);
                            updateToolProgress('pdf-split-progress', progress, `Extracting Page ${i + 1} of ${totalPages}...`);
                            
                            const newDoc = await PDFLib.PDFDocument.create();
                            const [copiedPage] = await newDoc.copyPages(srcDoc, [i]);
                            newDoc.addPage(copiedPage);
                            
                            const pageBytes = await newDoc.save();
                            const pageName = `${selectedFile.name.replace('.pdf', '')}_page_${i + 1}.pdf`;
                            zip.file(pageName, pageBytes);
                        }

                        updateToolProgress('pdf-split-progress', 90, 'Generating ZIP package...');
                        const zipBlob = await zip.generateAsync({ type: 'blob' });

                        updateToolProgress('pdf-split-progress', 100, 'All Pages Split!');

                        setTimeout(() => {
                            const url = URL.createObjectURL(zipBlob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${selectedFile.name.replace('.pdf', '')}_split_pages.zip`;
                            a.click();
                            showToast('ZIP file downloaded successfully!');
                            toolModal.style.display = 'none';
                        }, 500);

                    } catch (err) {
                        console.error(err);
                        showToast('Failed to split pages: ' + err.message, 'error');
                        document.getElementById('pdf-split-settings').style.display = 'block';
                        document.getElementById('pdf-split-progress').style.display = 'none';
                    }
                }
            });
        }
    }

    /* 🗜️ PDF COMPRESSOR */
    function renderPdfCompressorUI() {
        const fileZone = createFileZone('application/pdf');
        toolModalBody.innerHTML = `
            <p class="text-secondary">Reduce file size of large PDF documents for easier sharing over emails.</p>
            <div id="compress-settings-container" style="margin-bottom: 1.5rem;">
                <div class="form-group">
                    <label for="compress-quality">Quality Level: <span id="quality-val-display">50%</span></label>
                    <p class="settings-p-desc">Lower quality results in smaller file size (10% - 100%)</p>
                    <input type="range" id="compress-quality" min="10" max="100" step="5" value="50" style="width: 100%; height: 6px; background: var(--bg-dark); border-radius: 4px; outline: none;">
                </div>
            </div>
            ${fileZone.html}
            <div class="tool-progress-container" id="compress-progress" style="display:none;">
                <div class="tool-progress-header">
                    <span class="tool-progress-text">Reducing image asset size...</span>
                    <span class="tool-progress-percent">0%</span>
                </div>
                <div class="tool-progress-bar">
                    <div class="tool-progress-fill"></div>
                </div>
            </div>
            <div class="card" id="compress-success-card" style="display:none; text-align:center; padding:1.5rem; border-color:var(--success);">
                <i data-lucide="check-circle" class="text-success" style="width:48px; height:48px; margin-bottom:0.75rem;"></i>
                <h4 class="text-success">Compression Successful!</h4>
                <p style="margin: 0.5rem 0 1rem 0;" id="compress-ratio-text">File size reduced by 45% (8.2 MB → 4.5 MB)</p>
                <button class="primary-btn w-full" id="downloadCompressedBtn"><i data-lucide="download"></i> Download Compressed PDF</button>
            </div>
        `;

        const qualitySlider = document.getElementById('compress-quality');
        const qualityValDisplay = document.getElementById('quality-val-display');
        if (qualitySlider) {
            qualitySlider.addEventListener('input', (e) => {
                qualityValDisplay.textContent = `${e.target.value}%`;
            });
        }

        let selectedFile = null;
        let compressedBlob = null;

        setupDragAndDrop('tool-upload-zone', fileZone.inputId, async (files) => {
            selectedFile = files[0];
            document.getElementById('tool-upload-zone').style.display = 'none';
            document.getElementById('compress-settings-container').style.display = 'none';

            const progress = document.getElementById('compress-progress');
            progress.style.display = 'flex';
            
            const quality = parseFloat(qualitySlider.value) / 100;

            try {
                const arrayBuffer = await selectedFile.arrayBuffer();
                const pdfjsLib = window['pdfjs-dist/build/pdf'];
                pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
                
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                const { jsPDF } = window.jspdf;
                const outDoc = new jsPDF();
                
                const totalPages = pdf.numPages;
                for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
                    updateToolProgress('compress-progress', ((pageNum - 1) / totalPages) * 100, `Compressing Page ${pageNum} of ${totalPages}...`);
                    
                    const page = await pdf.getPage(pageNum);
                    const scale = 1.3;
                    const viewport = page.getViewport({ scale: scale });
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;
                    
                    await page.render({ canvasContext: context, viewport: viewport }).promise;
                    
                    const imgUrl = canvas.toDataURL('image/jpeg', quality);
                    
                    if (pageNum > 1) {
                        outDoc.addPage();
                    }
                    
                    const pdfW = outDoc.internal.pageSize.getWidth();
                    const pdfH = outDoc.internal.pageSize.getHeight();
                    outDoc.addImage(imgUrl, 'JPEG', 0, 0, pdfW, pdfH);
                }
                
                updateToolProgress('compress-progress', 95, 'Generating compressed document...');
                const pdfBytes = outDoc.output('arraybuffer');
                compressedBlob = new Blob([pdfBytes], { type: 'application/pdf' });
                
                updateToolProgress('compress-progress', 100, 'Compression complete!');
                
                setTimeout(() => {
                    progress.style.display = 'none';
                    
                    const originalSize = selectedFile.size;
                    const compressedSize = compressedBlob.size;
                    const originalSizeMB = (originalSize / (1024 * 1024)).toFixed(2);
                    const compressedSizeMB = (compressedSize / (1024 * 1024)).toFixed(2);
                    
                    const percentReduction = Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100));
                    
                    document.getElementById('compress-ratio-text').textContent = `File size reduced by ${percentReduction}% (${originalSizeMB} MB → ${compressedSizeMB} MB)`;
                    document.getElementById('compress-success-card').style.display = 'block';
                    refreshIcons();
                }, 500);
            } catch (err) {
                console.error("Compression failed:", err);
                showToast("Failed to compress PDF: " + err.message, "error");
                document.getElementById('tool-upload-zone').style.display = 'block';
                document.getElementById('compress-settings-container').style.display = 'block';
                progress.style.display = 'none';
            }
        });

        toolModalBody.addEventListener('click', (e) => {
            const btn = e.target.closest('#downloadCompressedBtn');
            if (btn && compressedBlob && selectedFile) {
                const link = document.createElement('a');
                link.download = `compressed_${selectedFile.name}`;
                link.href = URL.createObjectURL(compressedBlob);
                link.click();
                showToast('Compressed PDF downloaded');
                toolModal.style.display = 'none';
            }
        });
    }

    /* 📷 DOCUMENT SCANNER (CamScanner style) */
    /* 📷 DOCUMENT SCANNER (CamScanner style with Camera scanning) */
    function renderDocScannerUI() {
        toolModalBody.innerHTML = `
            <p class="text-secondary">Scan a document. You can capture it live using your camera, or upload an existing photo to enhance it.</p>
            
            <div class="doc-scanner-options" id="doc-scanner-options" style="display:flex; gap:1rem; margin-bottom:1rem;">
                <button class="primary-btn flex-1" id="btn-doc-camera-mode"><i data-lucide="camera"></i> Scan with Camera</button>
                <button class="secondary-btn flex-1" id="btn-doc-upload-mode"><i data-lucide="image"></i> Upload Photo</button>
            </div>

            <!-- Upload Mode Container -->
            <div id="doc-upload-container" style="display:none;">
                <div class="tool-upload-zone" id="tool-upload-zone">
                    <i data-lucide="upload-cloud" class="tool-upload-icon"></i>
                    <div class="tool-upload-text">
                        <h4>Drag & drop document image here</h4>
                        <p>or click to browse your device (image/*)</p>
                    </div>
                    <input type="file" id="doc-file-input" accept="image/*" style="display:none;">
                </div>
            </div>

            <!-- Camera Mode Container -->
            <div id="doc-camera-container" style="display:none; flex-direction:column; gap:1rem;">
                <div class="form-group">
                    <label for="doc-camera-select">Select Camera Device</label>
                    <div class="select-wrapper">
                        <select id="doc-camera-select">
                            <option value="">Loading cameras...</option>
                        </select>
                        <i data-lucide="chevron-down" class="select-chevron"></i>
                    </div>
                </div>
                <div style="position:relative; width:100%; border-radius:16px; overflow:hidden; background:#0b0f19; aspect-ratio:4/3; display:flex; align-items:center; justify-content:center;">
                    <video id="doc-scanner-video" autoplay playsinline style="width:100%; height:100%; object-fit:cover;"></video>
                </div>
                <button class="primary-btn w-full" id="btn-doc-capture"><i data-lucide="aperture"></i> Capture Photo</button>
            </div>

            <!-- Editing & Filtering Workspace -->
            <div id="doc-scanner-workspace" style="display:none; flex-direction:column; gap:1rem;">
                <div class="doc-scanner-preview-wrapper">
                    <canvas id="doc-scanner-canvas" style="max-width:100%; max-height:300px; border-radius:8px;"></canvas>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="doc-filter">Enhancement Filter</label>
                        <div class="select-wrapper">
                            <select id="doc-filter">
                                <option value="magic">Magic Enhance (Contrast)</option>
                                <option value="gray">Grayscale (B&amp;W Doc)</option>
                                <option value="threshold">High Contrast B&amp;W</option>
                                <option value="sharpen">Sharpen Text</option>
                                <option value="sepia">Sepia Vintage</option>
                                <option value="brightness">Brightness Boost</option>
                                <option value="cool">Cool Blue Tint</option>
                                <option value="invert">Invert Colors</option>
                                <option value="none">Original Image</option>
                            </select>
                            <i data-lucide="chevron-down" class="select-chevron"></i>
                        </div>
                    </div>
                </div>
                <div class="tool-action-btn-row">
                    <button class="secondary-btn btn" id="btn-doc-reset"><i data-lucide="rotate-ccw"></i> Reset</button>
                    <button class="primary-btn btn" id="downloadScannedPdfBtn"><i data-lucide="file-output"></i> Export Scanned PDF</button>
                </div>
            </div>
        `;

        refreshIcons();

        let originalImg = null;
        const canvas = document.getElementById('doc-scanner-canvas');
        const optionsDiv = document.getElementById('doc-scanner-options');
        const uploadContainer = document.getElementById('doc-upload-container');
        const cameraContainer = document.getElementById('doc-camera-container');
        const workspace = document.getElementById('doc-scanner-workspace');
        
        const btnCameraMode = document.getElementById('btn-doc-camera-mode');
        const btnUploadMode = document.getElementById('btn-doc-upload-mode');
        const btnCapture = document.getElementById('btn-doc-capture');
        const btnReset = document.getElementById('btn-doc-reset');
        
        const cameraSelect = document.getElementById('doc-camera-select');
        const videoElement = document.getElementById('doc-scanner-video');

        // Setup Upload Action
        setupDragAndDrop('tool-upload-zone', 'doc-file-input', (files) => {
            const file = files[0];
            if (!file.type.startsWith('image/')) {
                showToast('Please upload a document image', 'error');
                return;
            }
            loadDocumentImage(file);
        });

        function loadDocumentImage(file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    originalImg = img;
                    uploadContainer.style.display = 'none';
                    cameraContainer.style.display = 'none';
                    optionsDiv.style.display = 'none';
                    workspace.style.display = 'flex';
                    applyFilter();
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }

        // Toggle Upload Mode
        btnUploadMode.addEventListener('click', () => {
            stopDocScannerCamera();
            uploadContainer.style.display = 'block';
            cameraContainer.style.display = 'none';
            workspace.style.display = 'none';
        });

        // Toggle Camera Mode
        btnCameraMode.addEventListener('click', async () => {
            uploadContainer.style.display = 'none';
            workspace.style.display = 'none';
            cameraContainer.style.display = 'flex';
            await startDocCamera();
        });

        // Start Document Camera Feed
        async function startDocCamera() {
            stopDocScannerCamera();
            try {
                // Request camera permission
                const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
                tempStream.getTracks().forEach(t => t.stop()); // request permission first

                // List camera devices
                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = devices.filter(device => device.kind === 'videoinput');

                cameraSelect.innerHTML = '';
                videoDevices.forEach(device => {
                    const option = document.createElement('option');
                    option.value = device.deviceId;
                    option.text = device.label || `Camera ${cameraSelect.length + 1}`;
                    cameraSelect.appendChild(option);
                });

                if (videoDevices.length === 0) {
                    showToast('No cameras detected', 'error');
                    return;
                }

                // Listen to device selection changes
                cameraSelect.onchange = startStream;
                await startStream();

            } catch (err) {
                console.error(err);
                showToast('Camera permission denied or camera not found', 'error');
            }
        }

        async function startStream() {
            stopDocScannerCamera();
            const deviceId = cameraSelect.value;
            const constraints = {
                video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode: 'environment' }
            };

            try {
                docScannerStream = await navigator.mediaDevices.getUserMedia(constraints);
                videoElement.srcObject = docScannerStream;
                videoElement.play();
            } catch (err) {
                console.error(err);
                showToast('Unable to stream camera feed', 'error');
            }
        }

        // Capture photo from video feed
        btnCapture.addEventListener('click', () => {
            if (!videoElement.srcObject) return;
            
            // Draw video frame to temporary canvas
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = videoElement.videoWidth || 640;
            tempCanvas.height = videoElement.videoHeight || 480;
            const ctx = tempCanvas.getContext('2d');
            ctx.drawImage(videoElement, 0, 0, tempCanvas.width, tempCanvas.height);

            // Convert to image object
            const img = new Image();
            img.onload = () => {
                originalImg = img;
                stopDocScannerCamera();
                cameraContainer.style.display = 'none';
                optionsDiv.style.display = 'none';
                workspace.style.display = 'flex';
                applyFilter();
            };
            img.src = tempCanvas.toDataURL('image/jpeg');
        });

        // Reset workspace to options screen
        btnReset.addEventListener('click', () => {
            stopDocScannerCamera();
            workspace.style.display = 'none';
            optionsDiv.style.display = 'flex';
            uploadContainer.style.display = 'none';
            cameraContainer.style.display = 'none';
        });

        function convolutionSharpen(ctx, imgData) {
            const w = imgData.width;
            const h = imgData.height;
            const weights = [
                 0, -1,  0,
                -1,  5, -1,
                 0, -1,  0
            ];
            const src = imgData.data;
            const output = ctx.createImageData(w, h);
            const dst = output.data;
            
            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    const dstOff = (y * w + x) * 4;
                    let r = 0, g = 0, b = 0;
                    for (let cy = 0; cy < 3; cy++) {
                        for (let cx = 0; cx < 3; cx++) {
                            const scy = Math.min(h - 1, Math.max(0, y + cy - 1));
                            const scx = Math.min(w - 1, Math.max(0, x + cx - 1));
                            const srcOff = (scy * w + scx) * 4;
                            const wt = weights[cy * 3 + cx];
                            r += src[srcOff] * wt;
                            g += src[srcOff + 1] * wt;
                            b += src[srcOff + 2] * wt;
                        }
                    }
                    dst[dstOff] = Math.min(255, Math.max(0, r));
                    dst[dstOff + 1] = Math.min(255, Math.max(0, g));
                    dst[dstOff + 2] = Math.min(255, Math.max(0, b));
                    dst[dstOff + 3] = src[dstOff + 3];
                }
            }
            return output;
        }

        function applyFilter() {
            if (!originalImg || !canvas) return;
            const ctx = canvas.getContext('2d');
            const filter = document.getElementById('doc-filter').value;

            canvas.width = originalImg.width;
            canvas.height = originalImg.height;
            ctx.drawImage(originalImg, 0, 0);

            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imgData.data;

            if (filter === 'gray') {
                for (let i = 0; i < data.length; i += 4) {
                    const val = data[i] * 0.3 + data[i+1] * 0.59 + data[i+2] * 0.11;
                    data[i] = val;
                    data[i+1] = val;
                    data[i+2] = val;
                }
                ctx.putImageData(imgData, 0, 0);
            } else if (filter === 'magic') {
                // Color contrast enhancement + brightness boost
                for (let i = 0; i < data.length; i += 4) {
                    let r = data[i] * 1.1;
                    let g = data[i+1] * 1.1;
                    let b = data[i+2] * 1.1;
                    
                    r = (r - 128) * 1.35 + 128;
                    g = (g - 128) * 1.35 + 128;
                    b = (b - 128) * 1.35 + 128;
                    
                    data[i] = Math.min(255, Math.max(0, r));
                    data[i+1] = Math.min(255, Math.max(0, g));
                    data[i+2] = Math.min(255, Math.max(0, b));
                }
                ctx.putImageData(imgData, 0, 0);
            } else if (filter === 'threshold') {
                // High contrast pure B&W (Thresholding)
                for (let i = 0; i < data.length; i += 4) {
                    const gray = data[i] * 0.299 + data[i+1] * 0.587 + data[i+2] * 0.114;
                    const val = gray > 120 ? 255 : 0;
                    data[i] = val;
                    data[i+1] = val;
                    data[i+2] = val;
                }
                ctx.putImageData(imgData, 0, 0);
            } else if (filter === 'sepia') {
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i], g = data[i+1], b = data[i+2];
                    data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
                    data[i+1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
                    data[i+2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
                }
                ctx.putImageData(imgData, 0, 0);
            } else if (filter === 'brightness') {
                // Brightness Boost
                for (let i = 0; i < data.length; i += 4) {
                    data[i] = Math.min(255, data[i] + 40);
                    data[i+1] = Math.min(255, data[i+1] + 40);
                    data[i+2] = Math.min(255, data[i+2] + 40);
                }
                ctx.putImageData(imgData, 0, 0);
            } else if (filter === 'cool') {
                // Cool Blue Tint
                for (let i = 0; i < data.length; i += 4) {
                    data[i] = Math.max(0, data[i] - 15);
                    data[i+1] = Math.min(255, data[i+1] + 10);
                    data[i+2] = Math.min(255, data[i+2] + 25);
                }
                ctx.putImageData(imgData, 0, 0);
            } else if (filter === 'invert') {
                // Invert Colors
                for (let i = 0; i < data.length; i += 4) {
                    data[i] = 255 - data[i];
                    data[i+1] = 255 - data[i+1];
                    data[i+2] = 255 - data[i+2];
                }
                ctx.putImageData(imgData, 0, 0);
            } else if (filter === 'sharpen') {
                // Sharpen convolution filter
                const sharpenedData = convolutionSharpen(ctx, imgData);
                ctx.putImageData(sharpenedData, 0, 0);
            }
        }

        toolModalBody.addEventListener('change', (e) => {
            if (e.target.id === 'doc-filter') {
                applyFilter();
            }
        });

        toolModalBody.addEventListener('click', (e) => {
            const btn = e.target.closest('#downloadScannedPdfBtn');
            if (btn && canvas) {
                const imgDataUrl = canvas.toDataURL('image/jpeg');
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF();
                
                const width = pdf.internal.pageSize.getWidth();
                const height = pdf.internal.pageSize.getHeight();
                pdf.addImage(imgDataUrl, 'JPEG', 10, 10, width - 20, height - 20);
                pdf.save('scanned-document.pdf');
                showToast('Scanned PDF downloaded successfully!');
                toolModal.style.display = 'none';
            }
        });
    }

    /* 🏛️ MOCK DOCUMENT FORMAT CONVERTERS (Excel/Word/PPT to PDF and vice versa) */
    function renderOfficeConverterUI(toolId, title) {
        let accept = '.docx, .doc';
        let promptText = 'Upload Word document (.docx)';
        if (toolId === 'ppt-to-pdf') {
            accept = '.pptx, .ppt';
            promptText = 'Upload PowerPoint Presentation (.pptx)';
        } else if (toolId === 'pdf-to-word') {
            accept = '.pdf';
            promptText = 'Upload PDF file (.pdf)';
        }

        const fileZone = createFileZone(accept);
        toolModalBody.innerHTML = `
            <p class="text-secondary">Convert files to and from PDF securely and offline in your browser.</p>
            ${fileZone.html}
            <div class="tool-progress-container" id="conv-progress" style="display:none;">
                <div class="tool-progress-header">
                    <span class="tool-progress-text">Parsing file structure...</span>
                    <span class="tool-progress-percent">0%</span>
                </div>
                <div class="tool-progress-bar">
                    <div class="tool-progress-fill"></div>
                </div>
            </div>
            <div class="card" id="conv-success-card" style="display:none; text-align:center; padding:1.5rem; border-color:var(--success);">
                <i data-lucide="check-circle" class="text-success" style="width:48px; height:48px; margin-bottom:0.75rem;"></i>
                <h4 class="text-success">Conversion Completed!</h4>
                <p style="margin: 0.5rem 0 1rem 0;">Successfully converted file format to target output.</p>
                <button class="primary-btn w-full" id="downloadConvBtn"><i data-lucide="download"></i> Download Converted Document</button>
            </div>
        `;

        let selectedFile = null;

        setupDragAndDrop('tool-upload-zone', fileZone.inputId, (files) => {
            selectedFile = files[0];
            document.getElementById('tool-upload-zone').style.display = 'none';

            const progress = document.getElementById('conv-progress');
            progress.style.display = 'flex';

            let count = 0;
            const interval = setInterval(() => {
                count += 10;
                updateToolProgress('conv-progress', count, `Parsing structures and rendering pages...`);
                if (count >= 100) {
                    clearInterval(interval);
                    progress.style.display = 'none';
                    document.getElementById('conv-success-card').style.display = 'block';
                    refreshIcons();
                }
            }, 200);
        });

        toolModalBody.addEventListener('click', async (e) => {
            const btn = e.target.closest('#downloadConvBtn');
            if (btn && selectedFile) {
                try {
                    const { jsPDF } = window.jspdf;
                    
                    if (toolId === 'pdf-to-word') {
                        // PDF to Word - Real Text Extraction
                        try {
                            const arrayBuffer = await selectedFile.arrayBuffer();
                            const pdfjsLib = window['pdfjs-dist/build/pdf'];
                            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
                            
                            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                            
                            let textContent = "";
                            const docxParagraphs = [];
                            
                            const hasDocxLib = typeof window.docx !== 'undefined';
                            
                            if (hasDocxLib) {
                                const docx = window.docx;
                                docxParagraphs.push(
                                    new docx.Paragraph({
                                        children: [
                                            new docx.TextRun({
                                                text: selectedFile.name.replace('.pdf', '') + " (Extracted PDF)",
                                                bold: true,
                                                size: 28,
                                            })
                                        ],
                                        spacing: { after: 200 }
                                    })
                                );
                            }

                            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                                const page = await pdf.getPage(pageNum);
                                const textVal = await page.getTextContent();
                                
                                // Sort by position
                                const items = textVal.items;
                                items.sort((a, b) => {
                                    if (Math.abs(a.transform[5] - b.transform[5]) < 5) {
                                        return a.transform[4] - b.transform[4];
                                    }
                                    return b.transform[5] - a.transform[5];
                                });
                                
                                let lastY = null;
                                let line = "";
                                let pageLines = [];
                                
                                items.forEach(item => {
                                    const y = item.transform[5];
                                    if (lastY === null || Math.abs(y - lastY) < 5) {
                                        line += (line ? " " : "") + item.str;
                                    } else {
                                        if (line.trim()) pageLines.push(line.trim());
                                        line = item.str;
                                    }
                                    lastY = y;
                                });
                                if (line.trim()) pageLines.push(line.trim());
                                
                                if (hasDocxLib) {
                                    const docx = window.docx;
                                    if (pageNum > 1) {
                                        docxParagraphs.push(
                                            new docx.Paragraph({
                                                children: [],
                                                pageBreakBefore: true
                                            })
                                        );
                                    }
                                    pageLines.forEach(textLine => {
                                        docxParagraphs.push(
                                            new docx.Paragraph({
                                                children: [
                                                    new docx.TextRun({
                                                        text: textLine,
                                                        size: 22
                                                    })
                                                ],
                                                spacing: { after: 120 }
                                            })
                                        );
                                    });
                                } else {
                                    textContent += pageLines.join("\n") + "\n\n--- Page Break ---\n\n";
                                }
                            }
                            
                            if (hasDocxLib) {
                                const docx = window.docx;
                                const doc = new docx.Document({
                                    sections: [{
                                        properties: {},
                                        children: docxParagraphs
                                    }]
                                });
                                const docxBlob = await docx.Packer.toBlob(doc);
                                const link = document.createElement('a');
                                link.download = selectedFile.name.replace('.pdf', '') + '.docx';
                                link.href = URL.createObjectURL(docxBlob);
                                link.click();
                            } else {
                                // Fallback to HTML-compatible .doc format
                                const docContent = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><title>Extracted DOC</title><style>body {font-family: Arial; font-size: 11pt; line-height: 1.5;}</style></head><body>${textContent.replace(/\n/g, '<br>')}</body></html>`;
                                const blob = new Blob([docContent], { type: 'application/msword' });
                                const link = document.createElement('a');
                                link.download = selectedFile.name.replace('.pdf', '') + '.doc';
                                link.href = URL.createObjectURL(blob);
                                link.click();
                            }
                            showToast('✓ PDF to Word extraction complete!');
                        } catch (err) {
                            console.error(err);
                            showToast('Extraction failed: ' + err.message, 'error');
                        }
                    } else if (toolId === 'word-to-pdf') {
                        // Real Word to PDF using JSZip & DOMParser
                        try {
                            const fileBuffer = await selectedFile.arrayBuffer();
                            const zip = new JSZip();
                            const zipData = await zip.loadAsync(fileBuffer);
                            
                            if (!zipData.file("word/document.xml")) {
                                throw new Error("Could not find word/document.xml in Docx zip. Make sure it's a valid Docx file.");
                            }
                            
                            const docXml = await zipData.file("word/document.xml").async("text");
                            const parser = new DOMParser();
                            const xmlDoc = parser.parseFromString(docXml, "text/xml");
                            
                            const paragraphs = xmlDoc.getElementsByTagName("w:p");
                            let extractedTexts = [];
                            
                            for (let p of paragraphs) {
                                const textNodes = p.getElementsByTagName("w:t");
                                let pText = "";
                                for (let t of textNodes) {
                                    pText += t.textContent;
                                }
                                extractedTexts.push(pText);
                            }
                            
                            const doc = new jsPDF('p', 'mm', 'a4');
                            const pageWidth = doc.internal.pageSize.getWidth();
                            const pageHeight = doc.internal.pageSize.getHeight();
                            const margin = 20;
                            const maxW = pageWidth - (margin * 2);
                            
                            doc.setFont("Helvetica", "normal");
                            doc.setFontSize(11);
                            doc.setTextColor(45, 45, 45);
                            
                            let y = margin;
                            const lineHeight = 6.5;
                            
                            extractedTexts.forEach((pText) => {
                                const lines = doc.splitTextToSize(pText, maxW);
                                lines.forEach(line => {
                                    if (y + lineHeight > pageHeight - margin) {
                                        doc.addPage();
                                        y = margin;
                                    }
                                    doc.text(line, margin, y);
                                    y += lineHeight;
                                });
                                y += 3; // Space between paragraphs
                            });
                            
                            doc.save(selectedFile.name.replace('.docx', '') + '.pdf');
                            showToast('✓ Word converted to PDF!');
                        } catch (err) {
                            console.error(err);
                            showToast('Word to PDF conversion failed: ' + err.message, 'error');
                        }
                    } else if (toolId === 'ppt-to-pdf') {
                        // PPT to PDF - Continuous layout page filling
                        try {
                            const fileBuffer = await selectedFile.arrayBuffer();
                            const zip = new JSZip();
                            const zipData = await zip.loadAsync(fileBuffer);
                            
                            const slideFiles = Object.keys(zipData.files).filter(f => 
                                f.match(/ppt\/slides\/slide\d+\.xml$/) && !f.includes('rels')
                            ).sort((a, b) => {
                                const numA = parseInt(a.match(/\d+/)[0]);
                                const numB = parseInt(b.match(/\d+/)[0]);
                                return numA - numB;
                            });
                            
                            let slideContent = [];
                            
                            for (const slideFile of slideFiles) {
                                try {
                                    const slideText = await zipData.files[slideFile].async('text');
                                    const textMatches = slideText.match(/<a:t>([^<]*)<\/a:t>/g) || [];
                                    const texts = textMatches.map(match => 
                                        match.replace(/<a:t>|<\/a:t>/g, '').trim()
                                    ).filter(t => t.length > 0);
                                    
                                    slideContent.push({ 
                                        slide: parseInt(slideFile.match(/\d+/)[0]), 
                                        content: texts 
                                    });
                                } catch (e) {
                                    slideContent.push({
                                        slide: parseInt(slideFile.match(/\d+/)[0]),
                                        content: []
                                    });
                                }
                            }
                            
                            const doc = new jsPDF('p', 'mm', 'a4');
                            const pageWidth = doc.internal.pageSize.getWidth();
                            const pageHeight = doc.internal.pageSize.getHeight();
                            
                            const margins = {
                                top: 15,
                                bottom: 15,
                                left: 15,
                                right: 15
                            };
                            
                            const contentWidth = pageWidth - margins.left - margins.right;
                            let yPos = margins.top;
                            const maxYPos = pageHeight - margins.bottom;
                            
                            slideContent.forEach((slide) => {
                                // Add Slide divider and title
                                if (yPos + 12 > maxYPos) {
                                    doc.addPage();
                                    yPos = margins.top;
                                }
                                
                                doc.setFont("Helvetica", "bold");
                                doc.setTextColor(100, 110, 120);
                                doc.setFontSize(10);
                                doc.text(`Slide ${slide.slide}`, margins.left, yPos);
                                yPos += 4;
                                
                                doc.setDrawColor(220, 225, 230);
                                doc.line(margins.left, yPos, margins.left + contentWidth, yPos);
                                yPos += 5;
                                
                                doc.setFont("Helvetica", "normal");
                                doc.setTextColor(40, 40, 40);
                                doc.setFontSize(10);
                                
                                if (slide.content.length > 0) {
                                    slide.content.forEach((text) => {
                                        const lines = doc.splitTextToSize(text, contentWidth);
                                        lines.forEach((line) => {
                                            if (yPos + 6 > maxYPos) {
                                                doc.addPage();
                                                yPos = margins.top;
                                            }
                                            doc.text(line, margins.left, yPos);
                                            yPos += 6;
                                        });
                                        yPos += 2;
                                    });
                                } else {
                                    if (yPos + 6 > maxYPos) {
                                        doc.addPage();
                                        yPos = margins.top;
                                    }
                                    doc.setFont("Helvetica", "italic");
                                    doc.setTextColor(180, 180, 180);
                                    doc.text("[Empty Slide]", margins.left, yPos);
                                    doc.setFont("Helvetica", "normal");
                                    doc.setTextColor(40, 40, 40);
                                    yPos += 6;
                                }
                                yPos += 6; // Spacing after slide
                            });
                            
                            // Write Page numbers footer
                            const totalPagesCount = doc.internal.getNumberOfPages();
                            for (let i = 1; i <= totalPagesCount; i++) {
                                doc.setPage(i);
                                doc.setFontSize(8);
                                doc.setTextColor(160, 160, 160);
                                doc.text(
                                    `Page ${i} of ${totalPagesCount}`,
                                    pageWidth / 2,
                                    pageHeight - 8,
                                    { align: 'center' }
                                );
                            }
                            
                            const outName = selectedFile.name.split('.')[0] + '.pdf';
                            doc.save(outName);
                            showToast(`✓ PPT converted to PDF!`);
                        } catch (pptError) {
                            console.error('PPT extraction error:', pptError);
                            showToast('Error: Could not process PowerPoint file.', 'error');
                        }
                    }
                    
                    toolModal.style.display = 'none';
                } catch (error) {
                    console.error('Conversion error:', error);
                    showToast('Conversion error: ' + error.message, 'error');
                }
            }
        });
    }

    /* ═══ OCR TEXT EXTRACTOR TOOL ═══ */
    function renderOcrToolUI() {
        const fileZone = createFileZone('image/*');
        toolModalBody.innerHTML = `
            <p class="text-secondary">Upload an image to extract text using advanced OCR technology. Supports photos, screenshots, scanned documents, and more.</p>
            ${fileZone.html}
            <div id="ocr-progress-area" style="display:none;">
                <div class="ocr-progress-wrapper">
                    <i data-lucide="loader" class="rotating" style="width:32px;height:32px;color:var(--accent);"></i>
                    <div class="ocr-progress-bar"><div class="ocr-progress-bar-fill" id="ocr-progress-fill"></div></div>
                    <p class="ocr-progress-text" id="ocr-progress-text">Initializing OCR engine...</p>
                </div>
            </div>
            <div id="ocr-result-area" class="ocr-result-area" style="display:none;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem;">
                    <h4 style="margin:0;color:var(--text);"><i data-lucide="file-text" style="width:16px;height:16px;vertical-align:middle;margin-right:6px;"></i>Extracted Text</h4>
                    <div style="display:flex;gap:0.5rem;">
                        <button class="secondary-btn btn-sm" id="ocr-copy-btn"><i data-lucide="copy" style="width:14px;height:14px;"></i> Copy</button>
                        <button class="primary-btn btn-sm" id="ocr-download-btn"><i data-lucide="download" style="width:14px;height:14px;"></i> Save .TXT</button>
                    </div>
                </div>
                <textarea id="ocr-result-text" readonly placeholder="Extracted text will appear here..."></textarea>
            </div>
        `;
        refreshIcons();

        setupDragAndDrop('tool-upload-zone', fileZone.inputId, async (files) => {
            const file = files[0];
            if (!file || !file.type.startsWith('image/')) {
                showToast('Please upload a valid image file', 'error');
                return;
            }

            const progressArea = document.getElementById('ocr-progress-area');
            const resultArea = document.getElementById('ocr-result-area');
            const progressFill = document.getElementById('ocr-progress-fill');
            const progressText = document.getElementById('ocr-progress-text');
            const resultTextarea = document.getElementById('ocr-result-text');
            const uploadZone = document.getElementById('tool-upload-zone');

            if (uploadZone) uploadZone.style.display = 'none';
            progressArea.style.display = 'block';
            resultArea.style.display = 'none';
            refreshIcons();

            try {
                if (typeof Tesseract === 'undefined') {
                    showToast('OCR engine is still loading. Please wait a moment and try again.', 'error');
                    progressArea.style.display = 'none';
                    if (uploadZone) uploadZone.style.display = '';
                    return;
                }

                const worker = await Tesseract.createWorker('eng', 1, {
                    logger: (m) => {
                        if (m.status === 'recognizing text') {
                            const pct = Math.round(m.progress * 100);
                            progressFill.style.width = pct + '%';
                            progressText.textContent = `Recognizing text... ${pct}%`;
                        } else {
                            progressText.textContent = m.status.charAt(0).toUpperCase() + m.status.slice(1) + '...';
                        }
                    }
                });

                const { data } = await worker.recognize(file);
                await worker.terminate();

                progressArea.style.display = 'none';
                resultArea.style.display = 'block';
                resultTextarea.value = data.text.trim() || '(No text detected in this image)';
                showToast('Text extracted successfully!', 'success');
            } catch (err) {
                console.error('OCR Error:', err);
                progressArea.style.display = 'none';
                if (uploadZone) uploadZone.style.display = '';
                showToast('OCR failed. Please try a clearer image.', 'error');
            }
        });

        // Wire copy and download buttons after a short delay
        setTimeout(() => {
            const copyBtn = document.getElementById('ocr-copy-btn');
            const downloadBtn = document.getElementById('ocr-download-btn');
            const resultTextarea = document.getElementById('ocr-result-text');

            if (copyBtn) {
                copyBtn.addEventListener('click', () => {
                    if (resultTextarea && resultTextarea.value) {
                        navigator.clipboard.writeText(resultTextarea.value).then(() => {
                            showToast('Text copied to clipboard!', 'success');
                        });
                    }
                });
            }
            if (downloadBtn) {
                downloadBtn.addEventListener('click', () => {
                    if (resultTextarea && resultTextarea.value) {
                        const blob = new Blob([resultTextarea.value], { type: 'text/plain' });
                        const link = document.createElement('a');
                        link.href = URL.createObjectURL(blob);
                        link.download = 'extracted-text.txt';
                        link.click();
                        URL.revokeObjectURL(link.href);
                        showToast('Text file downloaded!', 'success');
                    }
                });
            }
        }, 100);
    }

    /* ═══ WORD COUNTER TOOL ═══ */
    function renderWordCounterUI() {
        toolModalBody.innerHTML = `
            <p class="text-secondary">Type or paste your text below. Statistics update in real-time as you type.</p>
            <textarea class="word-counter-textarea" id="wc-textarea" placeholder="Start typing or paste your text here..."></textarea>
            <div class="word-stats-grid" id="wc-stats-grid">
                <div class="word-stat-card">
                    <span class="word-stat-value" id="wc-words">0</span>
                    <span class="word-stat-label">Words</span>
                </div>
                <div class="word-stat-card">
                    <span class="word-stat-value" id="wc-chars">0</span>
                    <span class="word-stat-label">Characters</span>
                </div>
                <div class="word-stat-card">
                    <span class="word-stat-value" id="wc-chars-no-space">0</span>
                    <span class="word-stat-label">No Spaces</span>
                </div>
                <div class="word-stat-card">
                    <span class="word-stat-value" id="wc-sentences">0</span>
                    <span class="word-stat-label">Sentences</span>
                </div>
                <div class="word-stat-card">
                    <span class="word-stat-value" id="wc-paragraphs">0</span>
                    <span class="word-stat-label">Paragraphs</span>
                </div>
                <div class="word-stat-card">
                    <span class="word-stat-value" id="wc-reading-time">0s</span>
                    <span class="word-stat-label">Reading Time</span>
                </div>
            </div>
            <div class="tool-action-btn-row" style="margin-top:1rem;">
                <button class="secondary-btn btn" id="wc-clear-btn"><i data-lucide="trash-2"></i> Clear</button>
                <button class="secondary-btn btn" id="wc-copy-btn"><i data-lucide="copy"></i> Copy Text</button>
            </div>
        `;
        refreshIcons();

        const textarea = document.getElementById('wc-textarea');
        const wordsEl = document.getElementById('wc-words');
        const charsEl = document.getElementById('wc-chars');
        const charsNoSpaceEl = document.getElementById('wc-chars-no-space');
        const sentencesEl = document.getElementById('wc-sentences');
        const paragraphsEl = document.getElementById('wc-paragraphs');
        const readingEl = document.getElementById('wc-reading-time');

        function sanitizeCounterText(rawText) {
            return (rawText || '')
                .replace(/\u00A0/g, ' ')
                .replace(/[\u200B-\u200D\uFEFF]/g, '')
                .replace(/\r\n?/g, '\n')
                .replace(/\t/g, ' ')
                .replace(/\u2028/g, '\n')
                .replace(/\u2029/g, '\n')
                .trim();
        }

        function countWordsInText(rawText) {
            const text = sanitizeCounterText(rawText).replace(/\s+/g, ' ').trim();
            if (!text) {
                return 0;
            }

            return (text.match(/[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*/g) || []).length;
        }

        function countSentencesInText(rawText) {
            const text = sanitizeCounterText(rawText);
            if (!text) {
                return 0;
            }

            const normalized = text.replace(/\s+/g, ' ').trim();
            const sentenceMatches = normalized.match(/[^.!?]+(?:[.!?]+(?=\s|\n|$)|$)/g) || [];
            const sentences = sentenceMatches
                .map(sentence => sentence.trim())
                .filter(sentence => sentence.length > 0);

            return sentences.length > 0 ? sentences.length : 1;
        }

        function countParagraphsInText(rawText) {
            const text = sanitizeCounterText(rawText);
            if (!text) {
                return 0;
            }

            return text
                .split(/\n\s*\n+/)
                .map(block => block.trim())
                .filter(block => block.length > 0).length;
        }

        function updateStats() {
            const rawText = textarea.value || '';
            const normalizedText = sanitizeCounterText(rawText);

            // Characters
            charsEl.textContent = rawText.length;
            charsNoSpaceEl.textContent = rawText.replace(/[\s]/g, '').length;

            // Words
            const words = countWordsInText(normalizedText);
            wordsEl.textContent = words;

            // Sentences
            sentencesEl.textContent = countSentencesInText(normalizedText);

            // Paragraphs: count blocks separated by blank lines.
            paragraphsEl.textContent = countParagraphsInText(normalizedText);

            // Reading time (avg 200 words/min)
            if (words === 0) {
                readingEl.textContent = '0s';
            } else {
                const minutes = words / 200;
                if (minutes < 1) {
                    readingEl.textContent = Math.max(1, Math.ceil(minutes * 60)) + 's';
                } else {
                    readingEl.textContent = Math.max(1, Math.ceil(minutes)) + 'm';
                }
            }
        }

        textarea.addEventListener('input', updateStats);

        document.getElementById('wc-clear-btn').addEventListener('click', () => {
            textarea.value = '';
            updateStats();
            textarea.focus();
        });

        document.getElementById('wc-copy-btn').addEventListener('click', () => {
            if (textarea.value) {
                navigator.clipboard.writeText(textarea.value).then(() => {
                    showToast('Text copied to clipboard!', 'success');
                });
            }
        });
    }

    /* ═══ IMAGE COMPRESSOR TOOL ═══ */
    function renderImageCompressorUI() {
        const fileZone = createFileZone('image/*');
        toolModalBody.innerHTML = `
            <p class="text-secondary">Upload an image and adjust the compression quality to reduce file size. Lower quality = smaller file size.</p>
            ${fileZone.html}
            <div id="compressor-workspace" style="display:none;">
                <div style="text-align:center;margin-top:1rem;">
                    <img id="compressor-preview" class="compressor-preview-img" alt="Preview">
                </div>
                <div class="compressor-controls">
                    <label style="font-weight:600;color:var(--text);display:block;margin-bottom:0.25rem;">Compression Percentage</label>
                    <p style="font-size:0.8rem;color:var(--text-secondary);margin-bottom:0.75rem;">Choose how much of the original image size to keep. Example: 50% means the compressed output aims to be about half the original size.</p>
                    <div class="compressor-slider-row">
                        <span style="font-size:0.8rem;color:var(--text-secondary);">1%</span>
                        <input type="range" id="compressor-quality" min="1" max="100" value="70">
                        <span style="font-size:0.8rem;color:var(--text-secondary);">100%</span>
                        <span class="compressor-quality-badge" id="compressor-quality-value">70%</span>
                    </div>
                    <div class="compressor-size-info" id="compressor-size-info" style="display:none;">
                        <div class="compressor-size-card">
                            <span class="size-value" id="comp-original-size">—</span>
                            <span class="size-label">Original</span>
                        </div>
                        <div class="compressor-size-card">
                            <span class="size-value" id="comp-new-size">—</span>
                            <span class="size-label">Compressed</span>
                        </div>
                        <div class="compressor-size-card savings">
                            <span class="size-value" id="comp-savings">—</span>
                            <span class="size-label">Saved</span>
                        </div>
                    </div>
                </div>
                <div class="tool-action-btn-row" style="margin-top:1rem;">
                    <button class="secondary-btn btn" id="compressor-reset-btn"><i data-lucide="refresh-cw"></i> New Image</button>
                    <button class="primary-btn btn" id="compressor-download-btn"><i data-lucide="download"></i> Download</button>
                </div>
            </div>
        `;
        refreshIcons();

        let originalFile = null;
        let originalImg = null;

        function formatBytes(bytes) {
            if (bytes < 1024) return bytes + ' B';
            if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
            return (bytes / 1048576).toFixed(2) + ' MB';
        }

        function canvasToBlob(canvas, quality, mimeType = 'image/jpeg') {
            return new Promise((resolve) => {
                canvas.toBlob((blob) => resolve(blob), mimeType, quality);
            });
        }

        async function compressAndPreview() {
            if (!originalImg) return;
            const targetPercent = Math.max(1, Math.min(100, parseInt(document.getElementById('compressor-quality').value) || 70));
            document.getElementById('compressor-quality-value').textContent = targetPercent + '%';

            const targetRatio = Math.max(0.01, targetPercent / 100);
            const targetBytes = originalFile.size * targetRatio;
            const canvas = document.createElement('canvas');
            canvas.width = originalImg.naturalWidth;
            canvas.height = originalImg.naturalHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(originalImg, 0, 0);

            let lowQuality = 0.01;
            let highQuality = 1;
            let bestBlob = null;

            for (let i = 0; i < 12; i++) {
                const midQuality = (lowQuality + highQuality) / 2;
                const blob = await canvasToBlob(canvas, midQuality, 'image/jpeg');
                const blobRatio = blob.size / originalFile.size;

                if (blob.size <= targetBytes) {
                    bestBlob = blob;
                    lowQuality = midQuality;
                } else {
                    highQuality = midQuality;
                }

                if (Math.abs(blobRatio - targetRatio) < 0.01) {
                    break;
                }
            }

            if (!bestBlob) {
                bestBlob = await canvasToBlob(canvas, lowQuality, 'image/jpeg');
            }

            const sizeInfo = document.getElementById('compressor-size-info');
            sizeInfo.style.display = 'flex';

            document.getElementById('comp-original-size').textContent = formatBytes(originalFile.size);
            document.getElementById('comp-new-size').textContent = formatBytes(bestBlob.size);

            const saved = Math.max(0, ((originalFile.size - bestBlob.size) / originalFile.size) * 100);
            document.getElementById('comp-savings').textContent = saved.toFixed(1) + '%';

            const compUrl = URL.createObjectURL(bestBlob);
            document.getElementById('compressor-preview').src = compUrl;
        }

        setupDragAndDrop('tool-upload-zone', fileZone.inputId, (files) => {
            const file = files[0];
            if (!file || !file.type.startsWith('image/')) {
                showToast('Please upload a valid image file', 'error');
                return;
            }
            originalFile = file;

            const img = new Image();
            img.onload = () => {
                originalImg = img;
                document.getElementById('compressor-preview').src = img.src;
                document.getElementById('tool-upload-zone').style.display = 'none';
                document.getElementById('compressor-workspace').style.display = 'block';
                compressAndPreview();
            };
            img.src = URL.createObjectURL(file);
        });

        setTimeout(() => {
            const slider = document.getElementById('compressor-quality');
            if (slider) {
                slider.addEventListener('input', compressAndPreview);
            }

            const downloadBtn = document.getElementById('compressor-download-btn');
            if (downloadBtn) {
                downloadBtn.addEventListener('click', async () => {
                    if (!originalImg) return;
                    const targetPercent = Math.max(1, Math.min(100, parseInt(document.getElementById('compressor-quality').value) || 70));
                    const targetRatio = Math.max(0.01, targetPercent / 100);
                    const targetBytes = originalFile.size * targetRatio;
                    const canvas = document.createElement('canvas');
                    canvas.width = originalImg.naturalWidth;
                    canvas.height = originalImg.naturalHeight;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(originalImg, 0, 0);

                    let lowQuality = 0.01;
                    let highQuality = 1;
                    let bestBlob = null;

                    for (let i = 0; i < 12; i++) {
                        const midQuality = (lowQuality + highQuality) / 2;
                        const blob = await canvasToBlob(canvas, midQuality, 'image/jpeg');
                        const blobRatio = blob.size / originalFile.size;

                        if (blob.size <= targetBytes) {
                            bestBlob = blob;
                            lowQuality = midQuality;
                        } else {
                            highQuality = midQuality;
                        }

                        if (Math.abs(blobRatio - targetRatio) < 0.01) {
                            break;
                        }
                    }

                    if (!bestBlob) {
                        bestBlob = await canvasToBlob(canvas, lowQuality, 'image/jpeg');
                    }

                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(bestBlob);
                    const baseName = originalFile.name.replace(/\.[^/.]+$/, '');
                    link.download = `${baseName}-compressed.jpg`;
                    link.click();
                    URL.revokeObjectURL(link.href);
                    showToast('Compressed image downloaded!', 'success');
                });
            }

            const resetBtn = document.getElementById('compressor-reset-btn');
            if (resetBtn) {
                resetBtn.addEventListener('click', () => {
                    originalFile = null;
                    originalImg = null;
                    document.getElementById('compressor-workspace').style.display = 'none';
                    document.getElementById('tool-upload-zone').style.display = '';
                    document.getElementById('compressor-size-info').style.display = 'none';
                    document.getElementById('compressor-quality').value = 70;
                    document.getElementById('compressor-quality-value').textContent = '70%';
                });
            }
        }, 100);
    }

    /* ═══ IMAGE WATERMARK TOOL ═══ */
    function renderImageWatermarkUI() {
        const fileZone = createFileZone('image/*');
        toolModalBody.innerHTML = `
            <p class="text-secondary">Add a custom text watermark to your image or use the eraser to remove unwanted areas.</p>
            <div class="watermark-tab-bar">
                <button class="watermark-tab-btn active" data-wm-tab="add"><i data-lucide="plus-circle" style="width:16px;height:16px;"></i> Add Watermark</button>
                <button class="watermark-tab-btn" data-wm-tab="eraser"><i data-lucide="eraser" style="width:16px;height:16px;"></i> Eraser</button>
            </div>

            <div class="watermark-tab-content active" id="wm-add-tab">
                ${fileZone.html}
                <div id="wm-add-workspace" style="display:none;">
                    <div class="watermark-canvas-wrapper">
                        <canvas id="wm-add-canvas"></canvas>
                    </div>
                    <div class="watermark-settings">
                        <div class="form-group">
                            <label for="wm-text">Watermark Text</label>
                            <input type="text" id="wm-text" placeholder="e.g. © Your Name" value="© Litescan">
                        </div>
                        <div class="form-group">
                            <label for="wm-font-size">Font Size</label>
                            <input type="number" id="wm-font-size" min="8" max="200" value="48">
                        </div>
                        <div class="form-group">
                            <label for="wm-color">Text Color</label>
                            <div class="color-picker-wrapper">
                                <input type="color" id="wm-color" value="#ffffff">
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="wm-opacity">Opacity</label>
                            <input type="range" id="wm-opacity" min="0.05" max="1" step="0.05" value="0.35">
                        </div>
                        <div class="form-group">
                            <label for="wm-position">Position</label>
                            <div class="select-wrapper">
                                <select id="wm-position">
                                    <option value="center">Center</option>
                                    <option value="tile">Tile (Repeat)</option>
                                    <option value="top-left">Top Left</option>
                                    <option value="top-right">Top Right</option>
                                    <option value="bottom-left">Bottom Left</option>
                                    <option value="bottom-right">Bottom Right</option>
                                </select>
                                <i data-lucide="chevron-down" class="select-chevron"></i>
                            </div>
                        </div>
                    </div>
                    <div class="tool-action-btn-row" style="margin-top:1rem;">
                        <button class="secondary-btn btn" id="wm-apply-btn"><i data-lucide="refresh-cw"></i> Apply</button>
                        <button class="primary-btn btn" id="wm-download-btn"><i data-lucide="download"></i> Download</button>
                    </div>
                </div>
            </div>

            <div class="watermark-tab-content" id="wm-eraser-tab">
                <div class="tool-upload-zone" id="wm-eraser-upload-zone">
                    <i data-lucide="upload-cloud" class="tool-upload-icon"></i>
                    <div class="tool-upload-text">
                        <h4>Drag & drop image here</h4>
                        <p>or click to browse your device (image/*)</p>
                    </div>
                    <input type="file" id="wm-eraser-file-input" accept="image/*" style="display:none;">
                </div>
                <div id="wm-eraser-workspace" style="display:none;">
                    <div class="eraser-controls">
                        <label>Brush Size:</label>
                        <input type="range" id="wm-eraser-size" min="5" max="80" value="25" style="flex:1;max-width:200px;">
                        <span id="wm-eraser-size-val" style="font-weight:600;color:var(--accent);">25px</span>
                    </div>
                    <p style="font-size:0.8rem;color:var(--text-secondary);margin-top:0.5rem;">Paint over the watermark area to blur/remove it</p>
                    <div class="watermark-canvas-wrapper" style="cursor:crosshair;">
                        <canvas id="wm-eraser-canvas"></canvas>
                    </div>
                    <div class="tool-action-btn-row" style="margin-top:1rem;">
                        <button class="secondary-btn btn" id="wm-eraser-reset-btn"><i data-lucide="undo"></i> Reset</button>
                        <button class="primary-btn btn" id="wm-eraser-download-btn"><i data-lucide="download"></i> Download</button>
                    </div>
                </div>
            </div>
        `;
        refreshIcons();

        // Tab switching
        const tabBtns = toolModalBody.querySelectorAll('.watermark-tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById('wm-add-tab').classList.toggle('active', btn.dataset.wmTab === 'add');
                document.getElementById('wm-eraser-tab').classList.toggle('active', btn.dataset.wmTab === 'eraser');
            });
        });

        // ===== ADD WATERMARK TAB =====
        let wmOriginalImg = null;

        setupDragAndDrop('tool-upload-zone', fileZone.inputId, (files) => {
            const file = files[0];
            if (!file || !file.type.startsWith('image/')) {
                showToast('Please upload a valid image file', 'error');
                return;
            }
            const img = new Image();
            img.onload = () => {
                wmOriginalImg = img;
                document.getElementById('tool-upload-zone').style.display = 'none';
                document.getElementById('wm-add-workspace').style.display = 'block';
                applyWatermark();
            };
            img.src = URL.createObjectURL(file);
        });

        function applyWatermark() {
            if (!wmOriginalImg) return;
            const canvas = document.getElementById('wm-add-canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = wmOriginalImg.naturalWidth;
            canvas.height = wmOriginalImg.naturalHeight;
            ctx.drawImage(wmOriginalImg, 0, 0);

            const text = document.getElementById('wm-text').value || '© Litescan';
            const fontSize = parseInt(document.getElementById('wm-font-size').value) || 48;
            const color = document.getElementById('wm-color').value || '#ffffff';
            const opacity = parseFloat(document.getElementById('wm-opacity').value) || 0.35;
            const position = document.getElementById('wm-position').value || 'center';

            ctx.globalAlpha = opacity;
            ctx.fillStyle = color;
            ctx.font = `bold ${fontSize}px 'Plus Jakarta Sans', Arial, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Add subtle shadow for readability
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;

            const w = canvas.width;
            const h = canvas.height;
            const pad = fontSize;

            if (position === 'tile') {
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';
                const stepX = ctx.measureText(text).width + 60;
                const stepY = fontSize + 60;
                ctx.save();
                ctx.translate(w / 2, h / 2);
                ctx.rotate(-Math.PI / 6);
                const diag = Math.sqrt(w * w + h * h);
                for (let y = -diag; y < diag; y += stepY) {
                    for (let x = -diag; x < diag; x += stepX) {
                        ctx.fillText(text, x, y);
                    }
                }
                ctx.restore();
            } else {
                let x = w / 2, y = h / 2;
                if (position === 'top-left') { x = pad; y = pad; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; }
                else if (position === 'top-right') { x = w - pad; y = pad; ctx.textAlign = 'right'; ctx.textBaseline = 'top'; }
                else if (position === 'bottom-left') { x = pad; y = h - pad; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; }
                else if (position === 'bottom-right') { x = w - pad; y = h - pad; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; }
                ctx.fillText(text, x, y);
            }

            ctx.globalAlpha = 1;
            ctx.shadowColor = 'transparent';
        }

        setTimeout(() => {
            const applyBtn = document.getElementById('wm-apply-btn');
            if (applyBtn) applyBtn.addEventListener('click', applyWatermark);

            // Live update on settings change
            ['wm-text', 'wm-font-size', 'wm-color', 'wm-opacity', 'wm-position'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.addEventListener('input', applyWatermark);
                if (el) el.addEventListener('change', applyWatermark);
            });

            const dlBtn = document.getElementById('wm-download-btn');
            if (dlBtn) {
                dlBtn.addEventListener('click', () => {
                    const canvas = document.getElementById('wm-add-canvas');
                    if (!canvas) return;
                    const link = document.createElement('a');
                    link.download = 'watermarked-image.png';
                    link.href = canvas.toDataURL('image/png');
                    link.click();
                    showToast('Watermarked image downloaded!', 'success');
                });
            }
        }, 100);

        // ===== ERASER TAB =====
        let eraserImg = null;
        let eraserOriginalData = null;

        const eraserUploadZone = document.getElementById('wm-eraser-upload-zone');
        const eraserFileInput = document.getElementById('wm-eraser-file-input');
        if (eraserUploadZone && eraserFileInput) {
            eraserUploadZone.addEventListener('click', () => eraserFileInput.click());
            eraserUploadZone.addEventListener('dragover', (e) => { e.preventDefault(); eraserUploadZone.classList.add('dragover'); });
            eraserUploadZone.addEventListener('dragleave', () => eraserUploadZone.classList.remove('dragover'));
            eraserUploadZone.addEventListener('drop', (e) => {
                e.preventDefault();
                eraserUploadZone.classList.remove('dragover');
                if (e.dataTransfer.files.length > 0) loadEraserImage(e.dataTransfer.files);
            });
            eraserFileInput.addEventListener('change', () => {
                if (eraserFileInput.files.length > 0) loadEraserImage(eraserFileInput.files);
            });
        }

        function loadEraserImage(files) {
            const file = files[0];
            if (!file || !file.type.startsWith('image/')) {
                showToast('Please upload a valid image file', 'error');
                return;
            }
            const img = new Image();
            img.onload = () => {
                eraserImg = img;
                const canvas = document.getElementById('wm-eraser-canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                ctx.drawImage(img, 0, 0);
                eraserOriginalData = ctx.getImageData(0, 0, canvas.width, canvas.height);

                document.getElementById('wm-eraser-upload-zone').style.display = 'none';
                document.getElementById('wm-eraser-workspace').style.display = 'block';

                setupEraserDrawing(canvas);
            };
            img.src = URL.createObjectURL(file);
        }

        function setupEraserDrawing(canvas) {
            const ctx = canvas.getContext('2d');
            let isErasing = false;

            function getEraserPos(e) {
                const rect = canvas.getBoundingClientRect();
                const scaleX = canvas.width / rect.width;
                const scaleY = canvas.height / rect.height;
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
            }

            function eraseAt(pos) {
                const brushSize = parseInt(document.getElementById('wm-eraser-size').value) || 25;
                const radius = brushSize;
                // Apply box blur effect over the area
                const x0 = Math.max(0, Math.floor(pos.x - radius));
                const y0 = Math.max(0, Math.floor(pos.y - radius));
                const x1 = Math.min(canvas.width, Math.ceil(pos.x + radius));
                const y1 = Math.min(canvas.height, Math.ceil(pos.y + radius));
                const w = x1 - x0;
                const h = y1 - y0;
                if (w <= 0 || h <= 0) return;

                const imgData = ctx.getImageData(x0, y0, w, h);
                const data = imgData.data;
                const blurR = Math.min(10, Math.floor(radius / 3));

                // Simple box blur
                for (let pass = 0; pass < 3; pass++) {
                    for (let py = blurR; py < h - blurR; py++) {
                        for (let px = blurR; px < w - blurR; px++) {
                            let r = 0, g = 0, b = 0, count = 0;
                            for (let dy = -blurR; dy <= blurR; dy++) {
                                for (let dx = -blurR; dx <= blurR; dx++) {
                                    const i = ((py + dy) * w + (px + dx)) * 4;
                                    r += data[i]; g += data[i + 1]; b += data[i + 2]; count++;
                                }
                            }
                            const i = (py * w + px) * 4;
                            data[i] = r / count;
                            data[i + 1] = g / count;
                            data[i + 2] = b / count;
                        }
                    }
                }
                ctx.putImageData(imgData, x0, y0);
            }

            canvas.addEventListener('mousedown', (e) => { isErasing = true; eraseAt(getEraserPos(e)); });
            canvas.addEventListener('mousemove', (e) => { if (isErasing) eraseAt(getEraserPos(e)); });
            window.addEventListener('mouseup', () => { isErasing = false; });
            canvas.addEventListener('touchstart', (e) => { isErasing = true; eraseAt(getEraserPos(e)); e.preventDefault(); });
            canvas.addEventListener('touchmove', (e) => { if (isErasing) eraseAt(getEraserPos(e)); e.preventDefault(); });
            window.addEventListener('touchend', () => { isErasing = false; });
        }

        setTimeout(() => {
            const eraserSizeSlider = document.getElementById('wm-eraser-size');
            const eraserSizeVal = document.getElementById('wm-eraser-size-val');
            if (eraserSizeSlider && eraserSizeVal) {
                eraserSizeSlider.addEventListener('input', () => {
                    eraserSizeVal.textContent = eraserSizeSlider.value + 'px';
                });
            }

            const eraserResetBtn = document.getElementById('wm-eraser-reset-btn');
            if (eraserResetBtn) {
                eraserResetBtn.addEventListener('click', () => {
                    const canvas = document.getElementById('wm-eraser-canvas');
                    if (canvas && eraserOriginalData) {
                        const ctx = canvas.getContext('2d');
                        ctx.putImageData(eraserOriginalData, 0, 0);
                        showToast('Image reset to original', 'success');
                    }
                });
            }

            const eraserDlBtn = document.getElementById('wm-eraser-download-btn');
            if (eraserDlBtn) {
                eraserDlBtn.addEventListener('click', () => {
                    const canvas = document.getElementById('wm-eraser-canvas');
                    if (!canvas) return;
                    const link = document.createElement('a');
                    link.download = 'edited-image.png';
                    link.href = canvas.toDataURL('image/png');
                    link.click();
                    showToast('Edited image downloaded!', 'success');
                });
            }
        }, 100);
    }

    /* ═══ IMAGE FORMAT CONVERTER TOOL ═══ */
    function renderImageFormatConverterUI() {
        const fileZone = createFileZone('image/*');
        toolModalBody.innerHTML = `
            <p class="text-secondary">Upload any image and convert it to your desired format. Select the target format below.</p>
            ${fileZone.html}
            <div id="converter-workspace" style="display:none;">
                <div class="format-preview" id="converter-preview-area">
                    <img id="converter-preview-img" alt="Preview">
                    <div class="format-file-info">
                        <span id="converter-source-info">—</span>
                        <span class="format-arrow">→</span>
                        <span id="converter-target-info" style="color:var(--accent);font-weight:600;">—</span>
                    </div>
                </div>
                <div style="margin-top:1.25rem;">
                    <label style="font-weight:600;color:var(--text);display:block;margin-bottom:0.65rem;">Select Output Format</label>
                    <div class="format-selector-grid" id="format-selector-grid">
                        <button class="format-btn active" data-format="jpg">JPG</button>
                        <button class="format-btn" data-format="jpeg">JPEG</button>
                        <button class="format-btn" data-format="png">PNG</button>
                        <button class="format-btn" data-format="webp">WebP</button>
                        <button class="format-btn" data-format="svg">SVG</button>
                        <button class="format-btn" data-format="bmp">BMP</button>
                    </div>
                </div>
                <div class="tool-action-btn-row" style="margin-top:1.25rem;">
                    <button class="secondary-btn btn" id="converter-reset-btn"><i data-lucide="refresh-cw"></i> New Image</button>
                    <button class="primary-btn btn" id="converter-download-btn"><i data-lucide="download"></i> Convert & Download</button>
                </div>
            </div>
        `;
        refreshIcons();

        let converterFile = null;
        let converterImg = null;
        let selectedFormat = 'jpg';

        setupDragAndDrop('tool-upload-zone', fileZone.inputId, (files) => {
            const file = files[0];
            if (!file || !file.type.startsWith('image/')) {
                showToast('Please upload a valid image file', 'error');
                return;
            }
            converterFile = file;
            const img = new Image();
            img.onload = () => {
                converterImg = img;
                document.getElementById('converter-preview-img').src = img.src;
                document.getElementById('tool-upload-zone').style.display = 'none';
                document.getElementById('converter-workspace').style.display = 'block';

                const ext = file.name.split('.').pop().toUpperCase();
                document.getElementById('converter-source-info').textContent = `${ext} (${file.name})`;
                updateTargetInfo();
            };
            img.src = URL.createObjectURL(file);
        });

        function updateTargetInfo() {
            const targetInfo = document.getElementById('converter-target-info');
            if (targetInfo) {
                targetInfo.textContent = selectedFormat.toUpperCase();
            }
        }

        setTimeout(() => {
            // Format button click handling
            const formatBtns = document.querySelectorAll('#format-selector-grid .format-btn');
            formatBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    formatBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    selectedFormat = btn.dataset.format;
                    updateTargetInfo();
                });
            });

            const dlBtn = document.getElementById('converter-download-btn');
            if (dlBtn) {
                dlBtn.addEventListener('click', () => {
                    if (!converterImg) return;
                    const canvas = document.createElement('canvas');
                    canvas.width = converterImg.naturalWidth;
                    canvas.height = converterImg.naturalHeight;
                    const ctx = canvas.getContext('2d');

                    if (selectedFormat === 'svg') {
                        ctx.drawImage(converterImg, 0, 0);
                        const dataUrl = canvas.toDataURL('image/png');
                        const svgContent = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}">\n  <image href="${dataUrl}" width="${canvas.width}" height="${canvas.height}"/>\n</svg>`;
                        const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
                        const link = document.createElement('a');
                        link.href = URL.createObjectURL(blob);
                        const baseName = converterFile.name.replace(/\.[^/.]+$/, '');
                        link.download = `${baseName}.svg`;
                        link.click();
                        URL.revokeObjectURL(link.href);
                        showToast('Image converted to SVG and downloaded!', 'success');
                        return;
                    }

                    // For JPG/JPEG/BMP, fill white background (no transparency)
                    if (selectedFormat === 'jpg' || selectedFormat === 'jpeg' || selectedFormat === 'bmp') {
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                    }
                    ctx.drawImage(converterImg, 0, 0);

                    let mimeType = 'image/jpeg';
                    let ext = 'jpg';
                    if (selectedFormat === 'jpeg') {
                        ext = 'jpeg';
                    } else if (selectedFormat === 'png') {
                        mimeType = 'image/png';
                        ext = 'png';
                    } else if (selectedFormat === 'webp') {
                        mimeType = 'image/webp';
                        ext = 'webp';
                    } else if (selectedFormat === 'bmp') {
                        mimeType = 'image/bmp';
                        ext = 'bmp';
                    }
                    canvas.toBlob((blob) => {
                        if (!blob) {
                            showToast('Conversion failed. Try a different format.', 'error');
                            return;
                        }
                        const link = document.createElement('a');
                        link.href = URL.createObjectURL(blob);
                        const baseName = converterFile.name.replace(/\.[^/.]+$/, '');
                        link.download = `${baseName}.${ext}`;
                        link.click();
                        URL.revokeObjectURL(link.href);
                        showToast(`Image converted to ${ext.toUpperCase()} and downloaded!`, 'success');
                    }, mimeType, 0.92);
                });
            }

            const resetBtn = document.getElementById('converter-reset-btn');
            if (resetBtn) {
                resetBtn.addEventListener('click', () => {
                    converterFile = null;
                    converterImg = null;
                    selectedFormat = 'jpg';
                    document.getElementById('converter-workspace').style.display = 'none';
                    document.getElementById('tool-upload-zone').style.display = '';
                    const formatBtns = document.querySelectorAll('#format-selector-grid .format-btn');
                    formatBtns.forEach((b, i) => b.classList.toggle('active', i === 0));
                });
            }
        }, 100);
    }


    /* HELP ACCORDION LOGIC */
    function bindHelpAccordions() {
        const helpAccordionHeaders = document.querySelectorAll('.help-accordion-header');
        helpAccordionHeaders.forEach(header => {
            header.onclick = () => {
                const accordion = header.parentElement;
                accordion.classList.toggle('open');
            };
        });
    }

    const helpGuideContainer = document.getElementById('helpGuideContainer');
    if (helpGuideContainer) {
        fetch('data/help-guides.html')
            .then(response => {
                if (!response.ok) throw new Error('Failed to load help guides');
                return response.text();
            })
            .then((html) => {
                helpGuideContainer.innerHTML = html;
                bindHelpAccordions();
                if (window.lucide && window.lucide.createIcons) {
                    window.lucide.createIcons();
                }
            })
            .catch((error) => {
                console.warn('Help guide load failed:', error);
                helpGuideContainer.innerHTML = '<p class="text-secondary">Help guides are unavailable right now.</p>';
            });
    } else {
        bindHelpAccordions();
    }

    /* EXPORT BUTTONS LOGIC */
    const downloadTxtBtn = document.getElementById('downloadTxtBtn');
    if (downloadTxtBtn) {
        downloadTxtBtn.addEventListener('click', () => {
            if (!appState.currentResult && !elements.rawResultText.textContent) return;
            const textContent = (appState.currentResult && appState.currentResult.raw) ? appState.currentResult.raw : elements.rawResultText.textContent;
            if (!textContent) {
                showToast("No data to export", "error");
                return;
            }

            const blob = new Blob([textContent], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Litescan_Scan_${new Date().getTime()}.txt`;
            a.click();
            URL.revokeObjectURL(url);
            showToast("Saved as TXT", "success");
        });
    }

    const downloadCsvBtn = document.getElementById('downloadCsvBtn');
    if (downloadCsvBtn) {
        downloadCsvBtn.addEventListener('click', () => {
            if (!appState.currentResult && !elements.rawResultText.textContent) return;
            let textContent = (appState.currentResult && appState.currentResult.raw) ? appState.currentResult.raw : elements.rawResultText.textContent;
            if (!textContent) {
                showToast("No data to export", "error");
                return;
            }

            const lines = textContent.split('\n').map(line => `"${line.replace(/"/g, '""')}"`);
            const csvContent = lines.join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Litescan_Scan_${new Date().getTime()}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            showToast("Saved as CSV", "success");
        });
    }

    // ═══════════════════════════════════════════════════
    // MOBILE BOTTOM NAV & DRAWER LOGIC
    // ═══════════════════════════════════════════════════

    // Mobile bottom nav elements
    const mobileNavBtns = document.querySelectorAll('.mobile-nav-btn[data-tab]');
    const mobileMoreBtn = document.getElementById('mobileMoreBtn');
    const mobileDrawer = document.getElementById('mobileDrawer');
    const closeDrawerBtn = document.getElementById('closeDrawerBtn');
    const mobileHistoryBadge = document.getElementById('mobileHistoryBadge');

    // Drawer menu items
    const drawerInstallBtn = document.getElementById('drawerInstallBtn');
    const drawerSettingsBtn = document.getElementById('drawerSettingsBtn');
    const drawerThemeBtn = document.getElementById('drawerThemeBtn');
    const drawerAboutBtn = document.getElementById('drawerAboutBtn');
    const drawerLicenseBtn = document.getElementById('drawerLicenseBtn');
    const drawerPrivacyBtn = document.getElementById('drawerPrivacyBtn');
    const drawerTermsBtn = document.getElementById('drawerTermsBtn');
    const drawerFileScanBtn = document.querySelector('.drawer-menu-item[data-tab="file-scan"]');

    // Legal modals
    const privacyModal = document.getElementById('privacyModal');
    const termsModal = document.getElementById('termsModal');

    // Footer links
    const footerPrivacyBtn = document.getElementById('footerPrivacyBtn');
    const footerTermsBtn = document.getElementById('footerTermsBtn');
    const footerLicenseBtn = document.getElementById('footerLicenseBtn');
    const footerAboutBtn = document.getElementById('footerAboutBtn');

    // Header dropdown new items
    const openLicenseBtn = document.getElementById('openLicenseBtn');
    const openPrivacyBtn = document.getElementById('openPrivacyBtn');
    const openTermsBtn = document.getElementById('openTermsBtn');

    // Mobile nav tab switching
    function switchTab(tabId) {
        // Update desktop tab buttons
        elements.tabButtons.forEach(b => b.classList.remove('active'));
        elements.tabPanes.forEach(p => p.classList.remove('active'));
        
        const desktopBtn = document.querySelector(`.app-tabs .tab-btn[data-tab="${tabId}"]`);
        if (desktopBtn) desktopBtn.classList.add('active');
        
        const pane = document.getElementById(tabId);
        if (pane) pane.classList.add('active');

        // Update mobile nav buttons
        mobileNavBtns.forEach(b => b.classList.remove('active'));
        const mobileBtn = document.querySelector(`.mobile-nav-btn[data-tab="${tabId}"]`);
        if (mobileBtn) mobileBtn.classList.add('active');
        
        if (tabId !== 'camera-scan') {
            stopScanner();
        }
        closeResultPane();
    }

    // Mobile nav button clicks
    mobileNavBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            switchTab(tabId);
        });
    });

    // Drawer open/close
    function openDrawer() {
        if (mobileDrawer) {
            mobileDrawer.style.display = 'block';
            mobileDrawer.style.pointerEvents = 'auto';
            requestAnimationFrame(() => {
                mobileDrawer.classList.add('open');
            });
        }
    }

    // Close drawer
    function closeDrawer() {
        if (mobileDrawer) {
            mobileDrawer.classList.remove('open');
            setTimeout(() => {
                if (!mobileDrawer.classList.contains('open')) {
                    mobileDrawer.style.display = '';
                    mobileDrawer.style.pointerEvents = '';
                }
            }, 350);
        }
    }

    if (mobileMoreBtn) mobileMoreBtn.addEventListener('click', openDrawer);
    if (closeDrawerBtn) closeDrawerBtn.addEventListener('click', closeDrawer);

    // Close drawer on overlay click
    if (mobileDrawer) {
        mobileDrawer.addEventListener('click', (e) => {
            if (e.target === mobileDrawer) closeDrawer();
        });
    }

    // Drawer menu actions
    if (drawerFileScanBtn) {
        drawerFileScanBtn.addEventListener('click', () => {
            switchTab('file-scan');
            closeDrawer();
        });
    }

    if (drawerInstallBtn) {
        drawerInstallBtn.addEventListener('click', () => {
            closeDrawer();
        });
    }

    if (drawerSettingsBtn) {
        drawerSettingsBtn.addEventListener('click', () => {
            closeDrawer();
            setTimeout(() => { if (elements.settingsModal) elements.settingsModal.style.display = 'flex'; }, 200);
        });
    }

    if (drawerThemeBtn) {
        drawerThemeBtn.addEventListener('click', () => {
            elements.themeToggle.click();
            closeDrawer();
        });
    }

    if (drawerAboutBtn) {
        drawerAboutBtn.addEventListener('click', () => {
            closeDrawer();
            setTimeout(() => { if (elements.aboutModal) elements.aboutModal.style.display = 'flex'; }, 200);
        });
    }

    // Privacy Policy modal
    function openPrivacy() {
        if (privacyModal) privacyModal.style.display = 'flex';
    }

    function openTerms() {
        if (termsModal) termsModal.style.display = 'flex';
    }

    function openLicensePage() {
        window.location.href = 'pages/license.html';
    }

    if (drawerLicenseBtn) {
        drawerLicenseBtn.addEventListener('click', () => {
            closeDrawer();
            setTimeout(openLicensePage, 200);
        });
    }

    if (drawerPrivacyBtn) {
        drawerPrivacyBtn.addEventListener('click', () => {
            closeDrawer();
            setTimeout(openPrivacy, 200);
        });
    }

    if (drawerTermsBtn) {
        drawerTermsBtn.addEventListener('click', () => {
            closeDrawer();
            setTimeout(openTerms, 200);
        });
    }

    // Header dropdown privacy/terms
    if (openLicenseBtn) openLicenseBtn.addEventListener('click', () => {
        if (elements.moreDropdown) elements.moreDropdown.classList.remove('show');
        openLicensePage();
    });

    if (openPrivacyBtn) openPrivacyBtn.addEventListener('click', () => {
        if (elements.moreDropdown) elements.moreDropdown.classList.remove('show');
        openPrivacy();
    });

    if (openTermsBtn) openTermsBtn.addEventListener('click', () => {
        if (elements.moreDropdown) elements.moreDropdown.classList.remove('show');
        openTerms();
    });

    // Footer links
    if (footerPrivacyBtn) footerPrivacyBtn.addEventListener('click', openPrivacy);
    if (footerTermsBtn) footerTermsBtn.addEventListener('click', openTerms);
    if (footerLicenseBtn) footerLicenseBtn.addEventListener('click', openLicensePage);
    if (footerAboutBtn) footerAboutBtn.addEventListener('click', () => {
        if (elements.aboutModal) elements.aboutModal.style.display = 'flex';
    });

    // Close legal modals with closeModalBtn
    document.querySelectorAll('#privacyModal .closeModalBtn, #termsModal .closeModalBtn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (privacyModal) privacyModal.style.display = 'none';
            if (termsModal) termsModal.style.display = 'none';
        });
    });

    // Close legal modals on overlay click
    [privacyModal, termsModal].forEach(modal => {
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.style.display = 'none';
            });
        }
    });

    // Sync mobile history badge with desktop badge
    function syncMobileHistoryBadge() {
        if (mobileHistoryBadge && elements.historyBadge) {
            mobileHistoryBadge.textContent = elements.historyBadge.textContent;
            mobileHistoryBadge.style.display = elements.historyBadge.style.display;
        }
    }

    // Observe the desktop badge for changes
    if (elements.historyBadge) {
        const badgeObserver = new MutationObserver(syncMobileHistoryBadge);
        badgeObserver.observe(elements.historyBadge, { childList: true, attributes: true, attributeFilter: ['style'] });
    }

    // ═══════════════════════════════════════════════════
    // FLIP CAMERA LOGIC
    // ═══════════════════════════════════════════════════
    const flipCameraBtn = document.getElementById('flipCameraBtn');

    if (flipCameraBtn) {
        flipCameraBtn.addEventListener('click', () => {
            const select = elements.cameraSelect;
            if (select && select.options.length > 1) {
                // Cycle to next camera
                let nextIndex = (select.selectedIndex + 1) % select.options.length;
                select.selectedIndex = nextIndex;
                select.dispatchEvent(new Event('change'));

                // If scanning, restart with new camera
                if (appState.isScanning && appState.html5QrCode) {
                    const stopBtn = elements.stopScanBtn;
                    const startBtn = elements.startScanBtn;
                    if (stopBtn) stopBtn.click();
                    setTimeout(() => {
                        if (startBtn) startBtn.click();
                    }, 500);
                }
            }
        });
    }

    // Also sync desktop tab clicks with mobile nav
    elements.tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            mobileNavBtns.forEach(mb => mb.classList.remove('active'));
            const mobileBtn = document.querySelector(`.mobile-nav-btn[data-tab="${tabId}"]`);
            if (mobileBtn) mobileBtn.classList.add('active');
        });
    });

    // Re-create icons for newly added elements
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
});

