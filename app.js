// app.js - Lightweight UI polish and interaction behaviors

(function() {
    'use strict';

    // ============================================================================
    // ACTIVE NAVIGATION HIGHLIGHTING
    // ============================================================================
    function highlightActiveNav() {
        const currentPath = window.location.pathname.split('/').pop() || 'index.html';
        const navLinks = document.querySelectorAll('.tmc-nav .tmc-link[data-route]');
        let oldPath = null;
        let newPath = null;
        let newEl = null;

        // find previous active (if any)
        const prev = document.querySelector('.tmc-nav .tmc-link.is-active, .tmc-nav .tmc-link.active');
        if (prev) {
            oldPath = prev.getAttribute('data-route') || prev.getAttribute('href') || null;
        }

        navLinks.forEach(link => {
            const linkPath = link.getAttribute('data-route') || link.getAttribute('href');
            const isMatch = (linkPath === currentPath) ||
                (currentPath === '' && linkPath === 'index.html') ||
                (currentPath === 'index.html' && linkPath === 'index.html');

            if (isMatch) {
                link.classList.add('is-active');
                // keep backward compat class
                link.classList.add('active');
                link.setAttribute('aria-current', 'page');
                newPath = linkPath;
                newEl = link;
            } else {
                link.classList.remove('is-active');
                link.classList.remove('active');
                link.removeAttribute('aria-current');
            }
        });

        // Emit active link changed if something changed
        if (oldPath !== newPath) {
            try {
                document.dispatchEvent(new CustomEvent('tmc:active-link-changed', {
                    detail: { oldPath, newPath, el: newEl }
                }));
            } catch (err) {
                console.warn('Failed to dispatch tmc:active-link-changed', err);
            }
        }
    }

    // ============================================================================
    // TOGGLE SWITCH BEHAVIOR
    // ============================================================================
    function initToggleSwitches() {
        const toggles = document.querySelectorAll('[data-toggle]');
        
        toggles.forEach(toggle => {
            const tmcId = toggle.getAttribute('data-tmc-id');
            if (!tmcId) {
                console.warn('Toggle missing data-tmc-id', toggle);
            }

            // Initialize ARIA state based on initial class
            const initialPressed = toggle.classList.contains('active') || toggle.classList.contains('is-active');
            toggle.setAttribute('role', toggle.getAttribute('role') || 'button');
            toggle.setAttribute('aria-pressed', initialPressed ? 'true' : 'false');

            toggle.addEventListener('click', function(e) {
                e.preventDefault();
                this.classList.toggle('active');
                this.classList.toggle('toggle-on');

                // Add canonical contract class
                const isNowActive = this.classList.contains('active');
                if (isNowActive) {
                    this.classList.add('is-active');
                } else {
                    this.classList.remove('is-active');
                }

                // Update ARIA
                this.setAttribute('aria-pressed', isNowActive ? 'true' : 'false');

                // Trigger any specific behavior based on data attributes
                const toggleType = this.getAttribute('data-toggle');
                if (toggleType) {
                    console.log(`Toggle ${toggleType} switched: ${isNowActive}`);
                }

                // Dispatch contract event
                try {
                    document.dispatchEvent(new CustomEvent('tmc:toggle', {
                        detail: {
                            id: tmcId || null,
                            state: isNowActive,
                            source: 'toggle'
                        }
                    }));
                } catch (err) {
                    console.warn('Failed to dispatch tmc:toggle', err);
                }
            });
        });
    }

    // ============================================================================
    // SELECTABLE CARD BEHAVIOR
    // ============================================================================
    function initSelectableCards() {
        const cards = document.querySelectorAll('[data-selectable]');
        
        cards.forEach(card => {
            const tmcId = card.getAttribute('data-tmc-id');
            if (!tmcId) {
                console.warn('Selectable card missing data-tmc-id', card);
            }

            // Keyboard accessibility
            if (!card.hasAttribute('tabindex')) {
                card.setAttribute('tabindex', '0');
            }
            // Initialize ARIA selected
            const initiallySelected = card.classList.contains('selected') || card.classList.contains('is-selected');
            card.setAttribute('aria-selected', initiallySelected ? 'true' : 'false');

            card.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Check if multi-select is allowed
                const multiSelect = this.getAttribute('data-multi-select') === 'true';
                
                if (!multiSelect) {
                    // Single select: deselect all others in the same group
                    const group = this.getAttribute('data-group');
                    if (group) {
                        document.querySelectorAll(`[data-selectable][data-group="${group}"]`).forEach(c => {
                            if (c !== this) {
                                c.classList.remove('selected');
                                c.classList.remove('is-selected');
                                c.setAttribute('aria-selected', 'false');
                            }
                        });
                    }
                }
                
                // Toggle selected state
                this.classList.toggle('selected');
                
                // Add canonical contract class
                const isSelected = this.classList.contains('selected');
                if (isSelected) {
                    this.classList.add('is-selected');
                } else {
                    this.classList.remove('is-selected');
                }

                // Update ARIA
                this.setAttribute('aria-selected', isSelected ? 'true' : 'false');
                
                // Visual feedback
                if (isSelected) {
                    console.log('Card selected:', this.getAttribute('data-selectable'));
                } else {
                    console.log('Card deselected:', this.getAttribute('data-selectable'));
                }

                // Dispatch contract event
                try {
                    document.dispatchEvent(new CustomEvent('tmc:toggle', {
                        detail: {
                            id: tmcId || null,
                            state: isSelected,
                            source: 'selectable'
                        }
                    }));
                } catch (err) {
                    console.warn('Failed to dispatch tmc:toggle (selectable)', err);
                }
            });
            
            card.addEventListener('keypress', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.click();
                }
            });
        });
    }

    // ============================================================================
    // MODAL OPEN/CLOSE BEHAVIOR
    // ============================================================================
    function initModals() {
        const modalTriggers = document.querySelectorAll('[data-modal-trigger]');
        const modals = document.querySelectorAll('[data-modal]');
        
        // Open modal
        modalTriggers.forEach(trigger => {
            trigger.addEventListener('click', function(e) {
                e.preventDefault();
                const modalId = this.getAttribute('data-modal-trigger');
                const modal = document.querySelector(`[data-modal="${modalId}"]`);
                
                if (modal) {
                    modal.classList.add('modal-open');
                    modal.setAttribute('aria-hidden', 'false');
                    document.body.style.overflow = 'hidden';
                    
                    // Focus trap
                    const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                    if (focusableElements.length > 0) {
                        focusableElements[0].focus();
                    }
                }
            });
        });
        
        // Close modal
        modals.forEach(modal => {
            // Close button
            const closeBtn = modal.querySelector('[data-modal-close]');
            if (closeBtn) {
                closeBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    closeModal(modal);
                });
            }
            
            // Backdrop click
            modal.addEventListener('click', function(e) {
                if (e.target === this) {
                    closeModal(this);
                }
            });
            
            // ESC key
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && modal.classList.contains('modal-open')) {
                    closeModal(modal);
                }
            });
        });
        
        function closeModal(modal) {
            modal.classList.remove('modal-open');
            modal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        }
    }

    // ============================================================================
    // IMAGE PREVIEW MODAL
    // ============================================================================
    function initImagePreviews() {
        const previewTriggers = document.querySelectorAll('[data-preview-image]');
        
        // Create modal if it doesn't exist
        let imageModal = document.querySelector('#image-preview-modal');
        if (!imageModal) {
            imageModal = document.createElement('div');
            imageModal.id = 'image-preview-modal';
            imageModal.setAttribute('data-modal', 'image-preview');
            imageModal.setAttribute('role', 'dialog');
            imageModal.setAttribute('aria-modal', 'true');
            imageModal.setAttribute('aria-label', 'Image preview');
            imageModal.innerHTML = `
                <div class="modal-overlay">
                    <div class="modal-content image-preview-content">
                        <button class="modal-close" data-modal-close aria-label="Close preview">
                            <svg viewBox="0 0 24 24" width="24" height="24">
                                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </button>
                        <img src="" alt="Preview" class="preview-image">
                    </div>
                </div>
            `;
            document.body.appendChild(imageModal);
        }
        
        previewTriggers.forEach(trigger => {
            trigger.addEventListener('click', function(e) {
                e.preventDefault();
                const imageSrc = this.getAttribute('data-preview-image');
                const imageAlt = this.getAttribute('data-preview-alt') || 'Image preview';
                
                const previewImg = imageModal.querySelector('.preview-image');
                previewImg.src = imageSrc;
                previewImg.alt = imageAlt;
                
                imageModal.classList.add('modal-open');
                imageModal.setAttribute('aria-hidden', 'false');
                document.body.style.overflow = 'hidden';
            });
        });
    }

    // ============================================================================
    // UPDATE WEBSITE BEFORE/AFTER PREVIEW
    // ============================================================================
    function initBeforeAfterPreview() {
        const beforeAfterContainer = document.querySelector('[data-before-after]');
        if (beforeAfterContainer) {
            const imageSrc = 'https://im.runware.ai/image/ws/2/ii/38a74661-6d97-4ce1-8a72-efad694ea401.jpg';
            
            // Set up the two-panel preview
            const beforePanel = beforeAfterContainer.querySelector('.before-panel');
            const afterPanel = beforeAfterContainer.querySelector('.after-panel');
            
            if (beforePanel) {
                beforePanel.style.backgroundImage = `url(${imageSrc})`;
                beforePanel.style.backgroundPosition = 'left center';
                beforePanel.style.backgroundSize = '200% 100%';
            }
            
            if (afterPanel) {
                afterPanel.style.backgroundImage = `url(${imageSrc})`;
                afterPanel.style.backgroundPosition = 'right center';
                afterPanel.style.backgroundSize = '200% 100%';
            }
            
            // Draggable divider functionality
            const divider = beforeAfterContainer.querySelector('.divider');
            if (divider) {
                let isDragging = false;
                
                divider.addEventListener('mousedown', function() {
                    isDragging = true;
                });
                
                document.addEventListener('mousemove', function(e) {
                    if (!isDragging) return;
                    
                    const rect = beforeAfterContainer.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const percentage = (x / rect.width) * 100;
                    
                    if (percentage >= 0 && percentage <= 100) {
                        beforePanel.style.width = `${percentage}%`;
                        divider.style.left = `${percentage}%`;
                    }
                });
                
                document.addEventListener('mouseup', function() {
                    isDragging = false;
                });
            }
        }
    }

    // ============================================================================
    // TRANSIENT TOAST NOTIFICATIONS
    // ============================================================================
    function showToast(message, duration = 3000, type = 'default') {
        let container = document.querySelector('#tmc-toast-container');

        if (!container) {
            console.warn('#tmc-toast-container not found. Creating fallback container.');
            container = document.createElement('div');
            container.id = 'tmc-toast-container';
            container.setAttribute('role', 'status');
            container.setAttribute('aria-live', 'polite');
            container.setAttribute('aria-atomic', 'true');
            container.className = 'tmc-toast-container';
            document.body.appendChild(container);
        } else {
            // ensure container accessibility attributes
            container.setAttribute('role', container.getAttribute('role') || 'status');
            container.setAttribute('aria-live', container.getAttribute('aria-live') || 'polite');
            container.setAttribute('aria-atomic', container.getAttribute('aria-atomic') || 'true');
        }

        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.textContent = message;
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');
        
        container.appendChild(toast);
        
        // Emit toast show event
        try {
            document.dispatchEvent(new CustomEvent('tmc:toast-show', {
                detail: { message, type, duration }
            }));
        } catch (err) {
            console.warn('Failed to dispatch tmc:toast-show', err);
        }
        
        // Animate in
        setTimeout(() => {
            toast.classList.add('toast-visible');
        }, 10);
        
        // Remove after duration
        setTimeout(() => {
            toast.classList.remove('toast-visible');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
    }

    // Expose toast globally for use in other scripts
    window.showToast = showToast;

    // ============================================================================
    // ACTION BUTTON HANDLERS
    // ============================================================================
    function initActionButtons() {
        // Mission launch
        const launchButtons = document.querySelectorAll('[data-action="launch-mission"]');
        launchButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const missionId = this.getAttribute('data-mission-id') || this.getAttribute('data-tmc-id') || null;
                const tankId = this.getAttribute('data-tank-id') || null;
                try {
                    document.dispatchEvent(new CustomEvent('tmc:launch-mission', {
                        detail: { missionId, tankId }
                    }));
                } catch (err) {
                    console.warn('Failed to dispatch tmc:launch-mission', err);
                }
                showToast('Mission launched!');
            });
        });
        
        // Upgrade equipped
        const upgradeButtons = document.querySelectorAll('[data-action="equip-upgrade"]');
        upgradeButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const upgradeId = this.getAttribute('data-upgrade-id') || this.getAttribute('data-tmc-id') || null;
                const tankId = this.getAttribute('data-tank-id') || null;
                try {
                    document.dispatchEvent(new CustomEvent('tmc:upgrade-equipped', {
                        detail: { upgradeId, tankId }
                    }));
                } catch (err) {
                    console.warn('Failed to dispatch tmc:upgrade-equipped', err);
                }
                showToast('Upgrade equipped!');
            });
        });
        
        // Generic action handlers
        const actionButtons = document.querySelectorAll('[data-action]');
        actionButtons.forEach(btn => {
            const action = btn.getAttribute('data-action');
            if (!['launch-mission', 'equip-upgrade'].includes(action)) {
                btn.addEventListener('click', function() {
                    console.log('Action triggered:', action);
                });
            }
        });
    }

    // ============================================================================
    // HUD ANIMATION TRIGGERS
    // ============================================================================
    function initHudAnimations() {
        const hudElements = document.querySelectorAll('[data-hud-animate]');
        
        hudElements.forEach(element => {
            const animationType = element.getAttribute('data-hud-animate');
            
            // Intersection observer for scroll-triggered animations
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        element.classList.add('hud-animated', `hud-${animationType}`);
                    }
                });
            }, { threshold: 0.1 });
            
            observer.observe(element);
        });
    }

    // ============================================================================
    // PILL/BUTTON GROUP TOGGLE
    // ============================================================================
    function initButtonGroups() {
        const buttonGroups = document.querySelectorAll('[data-button-group]');
        
        buttonGroups.forEach(group => {
            const buttons = group.querySelectorAll('button, [role="button"]');
            
            buttons.forEach(button => {
                button.addEventListener('click', function(e) {
                    e.preventDefault();
                    
                    // Remove active from all buttons in group
                    buttons.forEach(btn => btn.classList.remove('active'));
                    
                    // Add active to clicked button
                    this.classList.add('active');
                    
                    console.log('Button group selection:', this.textContent.trim());
                });
            });
        });
    }

    // ============================================================================
    // ACCESSIBILITY ENHANCEMENTS
    // ============================================================================
    function enhanceAccessibility() {
        // Add keyboard navigation to interactive elements
        const interactiveElements = document.querySelectorAll('[data-interactive]');
        
        interactiveElements.forEach(element => {
            if (!element.hasAttribute('tabindex')) {
                element.setAttribute('tabindex', '0');
            }
            
            element.addEventListener('keypress', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.click();
                }
            });
        });
    }

    // ============================================================================
    // INITIALIZATION
    // ============================================================================
    function init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }

        // Basic integrity/diagnostics
        const diagnostics = [];
        const navCheck = document.querySelectorAll('.tmc-nav .tmc-link[data-route]');
        if (!navCheck || navCheck.length === 0) {
            diagnostics.push('No .tmc-nav .tmc-link[data-route] elements found.');
            console.warn('TankManapp init: no .tmc-nav .tmc-link[data-route] found.');
        }
        const toastContainer = document.querySelector('#tmc-toast-container');
        if (!toastContainer) {
            diagnostics.push('#tmc-toast-container not found (will create fallback).');
        }

        highlightActiveNav();
        initToggleSwitches();
        initSelectableCards();
        initModals();
        initImagePreviews();
        initBeforeAfterPreview();
        initActionButtons();
        initHudAnimations();
        initButtonGroups();
        enhanceAccessibility();
        
        console.log('TankMan UI initialized');

        // Emit nav-ready event after init
        try {
            const currentPath = window.location.pathname.split('/').pop() || 'index.html';
            document.dispatchEvent(new CustomEvent('tmc:nav-ready', { detail: { pathname: currentPath, diagnostics } }));
        } catch (err) {
            console.warn('Failed to dispatch tmc:nav-ready', err);
        }
    }

    // Start initialization
    init();

    // ============================================================================
    // Public API for external integration (minimal surface)
    // ============================================================================
    const _modules = new Map();

    window.TankManapp = {
        init: init,
        highlightNav: highlightActiveNav,
        showToast: function(opts) {
            if (!opts) return;
            const message = (typeof opts === 'string') ? opts : (opts.message || '');
            const duration = opts.duration || 3000;
            const type = opts.type || 'default';
            showToast(message, duration, type);
        },
        toggleUI: function(id, state) {
            if (!id) return false;
            const el = document.querySelector(`[data-tmc-id="${id}"]`);
            if (!el) {
                console.warn('toggleUI: element not found for data-tmc-id', id);
                return false;
            }
            const isActive = !!state;
            if (isActive) {
                el.classList.add('is-active');
                el.classList.add('active');
                el.setAttribute('aria-pressed', 'true');
            } else {
                el.classList.remove('is-active');
                el.classList.remove('active');
                el.setAttribute('aria-pressed', 'false');
            }
            try {
                document.dispatchEvent(new CustomEvent('tmc:toggle', { detail: { id, state: isActive, source: 'api' } }));
            } catch (err) {
                console.warn('toggleUI dispatch error', err);
            }
            return true;
        },
        registerModule: function(name, options) {
            if (!name) return false;
            _modules.set(name, options || {});
            return true;
        },
        _modulesMap: _modules
    };

})();
 
// ============================================================================
// GLOBAL STYLES FOR APP.JS FUNCTIONALITY
// ============================================================================
(function() {
    const style = document.createElement('style');
    style.textContent = `
        /* Active navigation highlighting */
        .nav-links a.active {
            color: var(--neon-cyan, #00F0FF);
            text-shadow: 0 0 10px var(--neon-cyan, #00F0FF);
        }
        
        .nav-links a.active::after {
            width: 100%;
        }
        
        /* Toggle switches */
        [data-toggle] {
            position: relative;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        [data-toggle].active,
        [data-toggle].toggle-on {
            color: var(--neon-cyan, #00F0FF);
            text-shadow: 0 0 10px var(--neon-cyan, #00F0FF);
        }
        
        /* Selectable cards */
        [data-selectable] {
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;
        }
        
        [data-selectable].selected {
            border-color: var(--neon-cyan, #00F0FF);
            box-shadow: 0 0 30px rgba(0, 240, 255, 0.6);
            transform: translateY(-5px);
        }
        
        [data-selectable].selected::before {
            content: '?';
            position: absolute;
            top: 10px;
            right: 10px;
            width: 30px;
            height: 30px;
            background: var(--neon-cyan, #00F0FF);
            color: var(--deep-navy, #0A0E1A);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 18px;
            box-shadow: 0 0 15px var(--neon-cyan, #00F0FF);
            z-index: 10;
        }
        
        /* Modal styles */
        [data-modal] {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 9999;
            background: rgba(10, 14, 26, 0.95);
            backdrop-filter: blur(10px);
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        
        [data-modal].modal-open {
            display: flex;
            opacity: 1;
        }
        
        .modal-overlay {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .modal-content {
            position: relative;
            max-width: 90%;
            max-height: 90vh;
            background: rgba(13, 27, 46, 0.9);
            border: 2px solid var(--neon-cyan, #00F0FF);
            box-shadow: 0 0 40px rgba(0, 240, 255, 0.6);
            padding: 40px;
            clip-path: polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px);
            overflow: auto;
        }
        
        .image-preview-content {
            padding: 0;
            background: transparent;
            border: none;
            box-shadow: none;
            clip-path: none;
            max-width: 95%;
            max-height: 95vh;
        }
        
        .preview-image {
            width: 100%;
            height: auto;
            max-height: 90vh;
            object-fit: contain;
            border: 2px solid var(--neon-cyan, #00F0FF);
            box-shadow: 0 0 40px rgba(0, 240, 255, 0.6);
        }
        
        .modal-close {
            position: absolute;
            top: 20px;
            right: 20px;
            width: 40px;
            height: 40px;
            background: transparent;
            border: 2px solid var(--neon-cyan, #00F0FF);
            color: var(--neon-cyan, #00F0FF);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10;
            transition: all 0.3s ease;
            box-shadow: 0 0 15px rgba(0, 240, 255, 0.4);
        }
        
        .modal-close:hover,
        .modal-close:focus {
            background: var(--neon-cyan, #00F0FF);
            color: var(--deep-navy, #0A0E1A);
            box-shadow: 0 0 25px rgba(0, 240, 255, 0.8);
        }
        
        /* Before/After preview */
        [data-before-after] {
            position: relative;
            width: 100%;
            height: 500px;
            overflow: hidden;
            display: flex;
        }
        
        .before-panel,
        .after-panel {
            height: 100%;
            background-size: cover;
            background-repeat: no-repeat;
            position: relative;
        }
        
        .before-panel {
            width: 50%;
            border-right: 2px solid var(--neon-cyan, #00F0FF);
        }
        
        .after-panel {
            flex: 1;
        }
        
        .divider {
            position: absolute;
            top: 0;
            left: 50%;
            width: 4px;
            height: 100%;
            background: var(--neon-cyan, #00F0FF);
            cursor: ew-resize;
            transform: translateX(-50%);
            box-shadow: 0 0 20px var(--neon-cyan, #00F0FF);
            z-index: 10;
        }
        
        .divider::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 40px;
            height: 40px;
            background: var(--neon-cyan, #00F0FF);
            border-radius: 50%;
            transform: translate(-50%, -50%);
            box-shadow: 0 0 20px var(--neon-cyan, #00F0FF);
        }
        
        /* Toast notifications */
        .toast-notification {
            position: fixed;
            bottom: -100px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(13, 27, 46, 0.95);
            border: 2px solid var(--neon-cyan, #00F0FF);
            padding: 16px 32px;
            font-family: 'Orbitron', sans-serif;
            font-size: 16px;
            font-weight: 600;
            letter-spacing: 2px;
            color: var(--neon-cyan, #00F0FF);
            text-transform: uppercase;
            box-shadow: 0 0 30px rgba(0, 240, 255, 0.6);
            z-index: 10000;
            transition: bottom 0.3s ease;
            clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
        }
        
        .toast-notification.toast-visible {
            bottom: 40px;
        }
        
        /* HUD animations */
        [data-hud-animate] {
            opacity: 0;
            transition: all 0.6s ease;
        }
        
        [data-hud-animate].hud-animated {
            opacity: 1;
        }
        
        [data-hud-animate].hud-fade-in {
            animation: fadeIn 0.6s ease forwards;
        }
        
        [data-hud-animate].hud-slide-up {
            animation: slideUp 0.6s ease forwards;
        }
        
        [data-hud-animate].hud-glow {
            animation: glowPulse 0.6s ease forwards;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes slideUp {
            from { 
                opacity: 0;
                transform: translateY(30px);
            }
            to { 
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        @keyframes glowPulse {
            0%, 100% { 
                opacity: 1;
                filter: drop-shadow(0 0 10px var(--neon-cyan));
            }
            50% { 
                opacity: 1;
                filter: drop-shadow(0 0 30px var(--neon-cyan));
            }
        }
        
        /* Button groups */
        [data-button-group] button,
        [data-button-group] [role="button"] {
            transition: all 0.3s ease;
        }
        
        [data-button-group] button.active,
        [data-button-group] [role="button"].active {
            background: var(--neon-cyan, #00F0FF);
            color: var(--deep-navy, #0A0E1A);
            box-shadow: 0 0 25px rgba(0, 240, 255, 0.8);
        }
        
        /* Interactive elements */
        [data-interactive]:focus {
            outline: 2px solid var(--neon-cyan, #00F0FF);
            outline-offset: 4px;
        }
    `;
    
    document.head.appendChild(style);
})();