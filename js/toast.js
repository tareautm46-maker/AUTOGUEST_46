/**
 * AutoGuest Modern Toast & Notification System
 * Replaces native browser alert() with beautiful dark-theme toasts & modals
 */

(function () {
    // Inject Toast Container and CSS
    const style = document.createElement('style');
    style.id = 'autoguest-toast-styles';
    style.innerHTML = `
        .ag-toast-container {
            position: fixed;
            top: 24px;
            right: 24px;
            z-index: 99999;
            display: flex;
            flex-direction: column;
            gap: 12px;
            pointer-events: none;
            max-width: 420px;
            width: calc(100% - 48px);
        }

        .ag-toast {
            pointer-events: auto;
            background: #1e1e1e;
            border-left: 5px solid #f39c12;
            border-radius: 10px;
            padding: 16px 20px;
            color: #ffffff;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6), 0 0 1px rgba(255, 255, 255, 0.1);
            display: flex;
            align-items: flex-start;
            gap: 14px;
            animation: agToastSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }

        .ag-toast.hiding {
            animation: agToastSlideOut 0.3s ease forwards;
        }

        .ag-toast-success {
            border-left-color: #2ecc71;
        }
        .ag-toast-success .ag-toast-icon {
            color: #2ecc71;
            background: rgba(46, 204, 113, 0.15);
        }

        .ag-toast-error {
            border-left-color: #e74c3c;
        }
        .ag-toast-error .ag-toast-icon {
            color: #e74c3c;
            background: rgba(231, 76, 60, 0.15);
        }

        .ag-toast-warning {
            border-left-color: #f39c12;
        }
        .ag-toast-warning .ag-toast-icon {
            color: #f39c12;
            background: rgba(243, 156, 18, 0.15);
        }

        .ag-toast-info {
            border-left-color: #3498db;
        }
        .ag-toast-info .ag-toast-icon {
            color: #3498db;
            background: rgba(52, 152, 219, 0.15);
        }

        .ag-toast-icon {
            width: 34px;
            height: 34px;
            min-width: 34px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
        }

        .ag-toast-body {
            flex: 1;
        }

        .ag-toast-title {
            font-weight: 700;
            font-size: 15px;
            margin-bottom: 3px;
            color: #ffffff;
            letter-spacing: 0.3px;
        }

        .ag-toast-msg {
            font-size: 13.5px;
            color: #cccccc;
            line-height: 1.45;
            word-break: break-word;
        }

        .ag-toast-close {
            background: none;
            border: none;
            color: #888888;
            cursor: pointer;
            padding: 4px;
            font-size: 16px;
            line-height: 1;
            border-radius: 4px;
            transition: color 0.2s, background 0.2s;
        }
        .ag-toast-close:hover {
            color: #ffffff;
            background: rgba(255, 255, 255, 0.1);
        }

        .ag-toast-progress {
            position: absolute;
            bottom: 0;
            left: 0;
            height: 3px;
            background: rgba(255, 255, 255, 0.25);
            width: 100%;
            transform-origin: left;
            animation: agProgressLinear linear forwards;
        }

        @keyframes agToastSlideIn {
            from {
                opacity: 0;
                transform: translateX(50px) scale(0.95);
            }
            to {
                opacity: 1;
                transform: translateX(0) scale(1);
            }
        }

        @keyframes agToastSlideOut {
            from {
                opacity: 1;
                transform: translateX(0) scale(1);
            }
            to {
                opacity: 0;
                transform: translateX(60px) scale(0.9);
            }
        }

        @keyframes agProgressLinear {
            from { transform: scaleX(1); }
            to { transform: scaleX(0); }
        }

        @media (max-width: 600px) {
            .ag-toast-container {
                top: 16px;
                right: 16px;
                left: 16px;
                width: auto;
            }
        }
    `;

    function initToastContainer() {
        if (!document.getElementById('autoguest-toast-styles')) {
            document.head.appendChild(style);
        }
        let container = document.getElementById('agToastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'agToastContainer';
            container.className = 'ag-toast-container';
            document.body.appendChild(container);
        }
        return container;
    }

    /**
     * Show modern toast
     * @param {string} message
     * @param {'success'|'error'|'warning'|'info'} type
     * @param {number} duration ms (default 3500)
     */
    function showToast(message, type = 'info', duration = 3500) {
        if (!document.body) {
            window.addEventListener('DOMContentLoaded', () => showToast(message, type, duration));
            return;
        }

        const container = initToastContainer();

        // Detect type from message if generic
        const lowerMsg = String(message).toLowerCase();
        if (type === 'info') {
            if (lowerMsg.includes('éxito') || lowerMsg.includes('exitosamente') || lowerMsg.includes('bienvenido') || lowerMsg.includes('correctamente') || lowerMsg.includes('guardado')) {
                type = 'success';
            } else if (lowerMsg.includes('error') || lowerMsg.includes('falló') || lowerMsg.includes('fallo') || lowerMsg.includes('incorrecta') || lowerMsg.includes('no se pudo')) {
                type = 'error';
            } else if (lowerMsg.includes('atención') || lowerMsg.includes('advertencia') || lowerMsg.includes('requerido') || lowerMsg.includes('por favor') || lowerMsg.includes('debes')) {
                type = 'warning';
            }
        }

        const icons = {
            success: 'fa-circle-check',
            error: 'fa-circle-xmark',
            warning: 'fa-triangle-exclamation',
            info: 'fa-circle-info'
        };

        const titles = {
            success: '¡Éxito!',
            error: 'Atención / Error',
            warning: 'Aviso',
            info: 'Información'
        };

        const toast = document.createElement('div');
        toast.className = `ag-toast ag-toast-${type}`;

        const iconClass = icons[type] || 'fa-bell';
        const titleText = titles[type] || 'Notificación';

        toast.innerHTML = `
            <div class="ag-toast-icon">
                <i class="fas ${iconClass}"></i>
            </div>
            <div class="ag-toast-body">
                <div class="ag-toast-title">${titleText}</div>
                <div class="ag-toast-msg">${message}</div>
            </div>
            <button class="ag-toast-close" title="Cerrar">&times;</button>
            <div class="ag-toast-progress" style="animation-duration: ${duration}ms;"></div>
        `;

        const closeBtn = toast.querySelector('.ag-toast-close');
        let timer = null;

        function dismiss() {
            if (timer) clearTimeout(timer);
            toast.classList.add('hiding');
            setTimeout(() => {
                if (toast.parentElement) toast.parentElement.removeChild(toast);
            }, 300);
        }

        closeBtn.onclick = dismiss;
        timer = setTimeout(dismiss, duration);

        container.appendChild(toast);
        return toast;
    }

    // Expose globally
    window.showToast = showToast;
    window.AutoGuestToast = { show: showToast };

    // Override native alert() gracefully
    const originalAlert = window.alert;
    window.alert = function (msg) {
        showToast(msg);
    };

    // Ensure DOM ready adds container
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initToastContainer);
    } else {
        initToastContainer();
    }
})();
