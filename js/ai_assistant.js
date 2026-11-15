/**
 * AutoGuest AI - Widget Inteligente de Asistente y Pre-Diagnóstico
 * Integración con Google Gemini
 */

(function () {
    // Inyectar estilos del widget
    const style = document.createElement('style');
    style.textContent = `
        .autoguest-ai-fab {
            position: fixed;
            bottom: 24px;
            right: 24px;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, #f39c12, #d35400);
            color: #ffffff;
            border: none;
            box-shadow: 0 4px 20px rgba(243, 156, 18, 0.45);
            cursor: pointer;
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            transition: all 0.3s ease;
        }
        .autoguest-ai-fab:hover {
            transform: scale(1.08);
            box-shadow: 0 6px 25px rgba(243, 156, 18, 0.6);
        }
        .autoguest-ai-badge {
            position: absolute;
            top: -4px;
            right: -4px;
            background: #27ae60;
            color: white;
            font-size: 10px;
            font-weight: 800;
            padding: 2px 6px;
            border-radius: 10px;
            letter-spacing: 0.5px;
            border: 2px solid #fff;
        }

        .autoguest-ai-modal {
            position: fixed;
            bottom: 96px;
            right: 24px;
            width: 380px;
            max-width: calc(100vw - 32px);
            height: 540px;
            max-height: calc(100vh - 120px);
            background: #1e222d;
            color: #ecf0f1;
            border-radius: 16px;
            box-shadow: 0 12px 40px rgba(0,0,0,0.5);
            border: 1px solid rgba(255,255,255,0.08);
            display: none;
            flex-direction: column;
            overflow: hidden;
            z-index: 99999;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .autoguest-ai-modal.active {
            display: flex;
            animation: aiSlideUp 0.3s ease forwards;
        }
        @keyframes aiSlideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .autoguest-ai-header {
            background: #14171f;
            padding: 14px 18px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .autoguest-ai-title {
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 700;
            font-size: 15px;
            color: #fff;
        }
        .autoguest-ai-title i {
            color: #f39c12;
            font-size: 18px;
        }
        .autoguest-ai-close {
            background: transparent;
            border: none;
            color: #7f8c8d;
            font-size: 18px;
            cursor: pointer;
            padding: 4px;
        }
        .autoguest-ai-close:hover { color: #fff; }

        .autoguest-ai-tabs {
            display: flex;
            background: #171a23;
            border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .autoguest-ai-tab {
            flex: 1;
            padding: 10px 0;
            background: transparent;
            border: none;
            color: #95a5a6;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            border-bottom: 2px solid transparent;
            transition: all 0.2s;
            text-align: center;
        }
        .autoguest-ai-tab.active {
            color: #f39c12;
            border-bottom-color: #f39c12;
            background: rgba(243, 156, 18, 0.05);
        }

        .autoguest-ai-body {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            background: #1a1e28;
        }
        .autoguest-ai-panel {
            flex: 1;
            display: none;
            flex-direction: column;
            overflow-y: auto;
            padding: 14px;
        }
        .autoguest-ai-panel.active { display: flex; }

        /* Mensajes de chat */
        .autoguest-ai-messages {
            flex: 1;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 12px;
            padding-bottom: 10px;
        }
        .ai-msg {
            max-width: 82%;
            padding: 10px 14px;
            border-radius: 12px;
            font-size: 13px;
            line-height: 1.45;
            word-wrap: break-word;
        }
        .ai-msg-assistant {
            align-self: flex-start;
            background: #252b39;
            color: #ecf0f1;
            border: 1px solid rgba(255,255,255,0.06);
        }
        .ai-msg-user {
            align-self: flex-end;
            background: #f39c12;
            color: #fff;
            font-weight: 500;
        }

        .autoguest-ai-quick-prompts {
            display: flex;
            gap: 6px;
            overflow-x: auto;
            padding: 6px 0;
            scrollbar-width: none;
        }
        .ai-quick-btn {
            background: rgba(255,255,255,0.06);
            border: 1px solid rgba(255,255,255,0.1);
            color: #bdc3c7;
            font-size: 11px;
            padding: 5px 10px;
            border-radius: 12px;
            white-space: nowrap;
            cursor: pointer;
        }
        .ai-quick-btn:hover {
            background: rgba(243,156,18,0.15);
            color: #f39c12;
            border-color: #f39c12;
        }

        .autoguest-ai-input-area {
            display: flex;
            gap: 8px;
            padding: 10px 12px;
            background: #14171f;
            border-top: 1px solid rgba(255,255,255,0.06);
        }
        .autoguest-ai-input {
            flex: 1;
            background: #252b39;
            border: 1px solid rgba(255,255,255,0.1);
            color: #fff;
            padding: 9px 12px;
            border-radius: 8px;
            font-size: 13px;
            outline: none;
        }
        .autoguest-ai-input:focus { border-color: #f39c12; }
        .autoguest-ai-send {
            background: #f39c12;
            color: white;
            border: none;
            width: 36px;
            height: 36px;
            border-radius: 8px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .autoguest-ai-send:disabled {
            background: #555;
            cursor: not-allowed;
        }

        /* Formulario Pre-diagnóstico */
        .diag-form-group {
            margin-bottom: 12px;
        }
        .diag-label {
            display: block;
            font-size: 12px;
            color: #bdc3c7;
            margin-bottom: 6px;
            font-weight: 600;
        }
        .diag-textarea {
            width: 100%;
            height: 90px;
            background: #252b39;
            border: 1px solid rgba(255,255,255,0.1);
            color: #fff;
            padding: 10px;
            border-radius: 8px;
            font-size: 13px;
            outline: none;
            resize: none;
            box-sizing: border-box;
        }
        .diag-textarea:focus { border-color: #f39c12; }
        .diag-inputs-row {
            display: flex;
            gap: 8px;
        }
        .diag-input {
            flex: 1;
            background: #252b39;
            border: 1px solid rgba(255,255,255,0.1);
            color: #fff;
            padding: 8px 10px;
            border-radius: 8px;
            font-size: 12px;
            outline: none;
            box-sizing: border-box;
        }
        .diag-submit-btn {
            width: 100%;
            padding: 12px;
            background: linear-gradient(135deg, #f39c12, #d35400);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            transition: opacity 0.2s;
        }
        .diag-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        /* Resultado Pre-diagnóstico */
        .diag-result-card {
            background: #252b39;
            border-radius: 10px;
            padding: 14px;
            margin-top: 12px;
            border: 1px solid rgba(255,255,255,0.08);
            display: none;
        }
        .diag-urgency-badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            margin-bottom: 8px;
        }
        .urgency-Bajo { background: rgba(39, 174, 96, 0.2); color: #2ecc71; border: 1px solid #2ecc71; }
        .urgency-Medio { background: rgba(243, 156, 18, 0.2); color: #f39c12; border: 1px solid #f39c12; }
        .urgency-Urgente { background: rgba(231, 76, 60, 0.2); color: #e74c3c; border: 1px solid #e74c3c; }

        .diag-problem-title {
            font-size: 14px;
            font-weight: 700;
            color: #fff;
            margin: 0 0 8px 0;
        }
        .diag-desc {
            font-size: 12px;
            color: #bdc3c7;
            line-height: 1.4;
            margin: 0 0 10px 0;
        }
        .diag-service-box {
            background: rgba(243,156,18,0.1);
            border-left: 3px solid #f39c12;
            padding: 8px 10px;
            font-size: 12px;
            color: #f1c40f;
            margin-bottom: 12px;
            border-radius: 0 6px 6px 0;
        }
        .diag-book-btn {
            display: block;
            text-align: center;
            background: #27ae60;
            color: white;
            text-decoration: none;
            padding: 9px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 700;
        }
        .diag-book-btn:hover { background: #219150; }
    `;
    document.head.appendChild(style);

    // Crear HTML del botón flotante y el modal
    const widgetContainer = document.createElement('div');
    widgetContainer.innerHTML = `
        <!-- Botón flotante -->
        <button class="autoguest-ai-fab" id="autoguestAiFab" title="Asistente & Pre-diagnóstico IA">
            <i class="fas fa-robot"></i>
            <span class="autoguest-ai-badge">IA</span>
        </button>

        <!-- Modal del Asistente -->
        <div class="autoguest-ai-modal" id="autoguestAiModal">
            <div class="autoguest-ai-header">
                <div class="autoguest-ai-title">
                    <i class="fas fa-microchip"></i>
                    <span>AutoGuest AI</span>
                </div>
                <button class="autoguest-ai-close" id="autoguestAiClose">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <!-- Pestañas -->
            <div class="autoguest-ai-tabs">
                <button class="autoguest-ai-tab active" data-tab="chat">
                    <i class="fas fa-comments"></i> Asistente 24/7
                </button>
                <button class="autoguest-ai-tab" data-tab="diag">
                    <i class="fas fa-stethoscope"></i> Pre-Diagnóstico
                </button>
            </div>

            <!-- Cuerpo del modal -->
            <div class="autoguest-ai-body">
                <!-- Panel 1: Chat -->
                <div class="autoguest-ai-panel active" id="aiTabChat">
                    <div class="autoguest-ai-messages" id="aiChatMessages">
                        <div class="ai-msg ai-msg-assistant">
                            Hola, soy el asistente inteligente de <strong>AutoGuest</strong>. ¿Tienes dudas sobre fallas mecánicas, servicios preventivos o cómo agendar tu cita?
                        </div>
                    </div>

                    <!-- Preguntas rápidas -->
                    <div class="autoguest-ai-quick-prompts">
                        <button class="ai-quick-btn" data-q="¿Cada cuánto debo cambiar el aceite?">Cambio de aceite</button>
                        <button class="ai-quick-btn" data-q="¿Qué incluye una afinación mayor?">Afinación mayor</button>
                        <button class="ai-quick-btn" data-q="Mi coche rechina al frenar, ¿qué puede ser?">Rechinido de frenos</button>
                    </div>

                    <!-- Entrada de texto -->
                    <div class="autoguest-ai-input-area">
                        <input type="text" class="autoguest-ai-input" id="aiChatInput" placeholder="Escribe tu consulta automotriz...">
                        <button class="autoguest-ai-send" id="aiChatSend">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                </div>

                <!-- Panel 2: Pre-diagnóstico -->
                <div class="autoguest-ai-panel" id="aiTabDiag">
                    <div class="diag-form-group">
                        <label class="diag-label">¿Qué falla o síntoma notas en tu vehículo?</label>
                        <textarea class="diag-textarea" id="diagSintomas" placeholder="Ej: Se escucha un zumbido al acelerar, tiembla el volante a 80 km/h o se encendió el Check Engine..."></textarea>
                    </div>

                    <div class="diag-form-group">
                        <label class="diag-label">Datos de tu auto (Opcional):</label>
                        <div class="diag-inputs-row">
                            <input type="text" class="diag-input" id="diagMarca" placeholder="Marca (ej. Nissan)">
                            <input type="text" class="diag-input" id="diagModelo" placeholder="Modelo (ej. Versa)">
                            <input type="text" class="diag-input" id="diagAno" placeholder="Año (ej. 2018)" style="max-width: 80px;">
                        </div>
                    </div>

                    <button class="diag-submit-btn" id="diagSubmitBtn">
                        <i class="fas fa-search"></i> Analizar con IA
                    </button>

                    <!-- Tarjeta de resultados -->
                    <div class="diag-result-card" id="diagResultCard">
                        <span class="diag-urgency-badge" id="diagUrgency">Media</span>
                        <h4 class="diag-problem-title" id="diagProblemTitle">Falla en Sistema</h4>
                        <p class="diag-desc" id="diagExplanation"></p>
                        <div class="diag-service-box">
                            <strong>Servicio recomendado:</strong><br>
                            <span id="diagService">Revisión General</span>
                        </div>
                        <a href="/pages/cliente/mis_citas.html" class="diag-book-btn">
                            <i class="fas fa-calendar-check"></i> Agendar cita en taller
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(widgetContainer);

    // Elementos DOM
    const fab = document.getElementById('autoguestAiFab');
    const modal = document.getElementById('autoguestAiModal');
    const closeBtn = document.getElementById('autoguestAiClose');
    const tabs = document.querySelectorAll('.autoguest-ai-tab');
    const panels = {
        chat: document.getElementById('aiTabChat'),
        diag: document.getElementById('aiTabDiag')
    };

    // Toggle Modal
    fab.addEventListener('click', () => modal.classList.toggle('active'));
    closeBtn.addEventListener('click', () => modal.classList.remove('active'));

    // Navegación entre pestañas
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            Object.keys(panels).forEach(key => {
                panels[key].classList.toggle('active', key === target);
            });
        });
    });

    // Lógica del Chat
    const chatInput = document.getElementById('aiChatInput');
    const chatSend = document.getElementById('aiChatSend');
    const chatMessages = document.getElementById('aiChatMessages');
    const quickBtns = document.querySelectorAll('.ai-quick-btn');
    let chatHistory = [];

    async function sendChatMessage(text) {
        if (!text || text.trim() === '') return;

        // Mostrar mensaje del usuario
        appendMessage('user', text);
        chatInput.value = '';
        chatSend.disabled = true;

        // Indicador de "Escribiendo..."
        const typingId = 'typing-' + Date.now();
        const typingEl = document.createElement('div');
        typingEl.className = 'ai-msg ai-msg-assistant';
        typingEl.id = typingId;
        typingEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analizando...';
        chatMessages.appendChild(typingEl);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        try {
            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mensaje: text,
                    historial: chatHistory
                })
            });

            const data = await res.json();
            const typingMsg = document.getElementById(typingId);
            if (typingMsg) typingMsg.remove();

            if (data.exito && data.respuesta) {
                appendMessage('assistant', data.respuesta);
                chatHistory.push({ rol: 'usuario', texto: text });
                chatHistory.push({ rol: 'asistente', texto: data.respuesta });
                // Limitar memoria a últimos 10 mensajes
                if (chatHistory.length > 10) chatHistory = chatHistory.slice(-10);
            } else {
                appendMessage('assistant', 'Lo siento, ocurrió un error al responder. Por favor intenta de nuevo.');
            }
        } catch (err) {
            const typingMsg = document.getElementById(typingId);
            if (typingMsg) typingMsg.remove();
            appendMessage('assistant', 'Error de conexión con el servicio de IA.');
        } finally {
            chatSend.disabled = false;
        }
    }

    function appendMessage(role, text) {
        const msg = document.createElement('div');
        msg.className = `ai-msg ai-msg-${role}`;
        msg.textContent = text;
        chatMessages.appendChild(msg);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    chatSend.addEventListener('click', () => sendChatMessage(chatInput.value));
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendChatMessage(chatInput.value);
    });
    quickBtns.forEach(btn => {
        btn.addEventListener('click', () => sendChatMessage(btn.dataset.q));
    });

    // Lógica del Pre-Diagnóstico
    const diagBtn = document.getElementById('diagSubmitBtn');
    const diagSintomas = document.getElementById('diagSintomas');
    const diagMarca = document.getElementById('diagMarca');
    const diagModelo = document.getElementById('diagModelo');
    const diagAno = document.getElementById('diagAno');
    const diagResultCard = document.getElementById('diagResultCard');
    const diagUrgency = document.getElementById('diagUrgency');
    const diagProblemTitle = document.getElementById('diagProblemTitle');
    const diagExplanation = document.getElementById('diagExplanation');
    const diagService = document.getElementById('diagService');

    diagBtn.addEventListener('click', async () => {
        const sintomas = diagSintomas.value.trim();
        if (!sintomas) {
            alert('Por favor describe los síntomas o ruidos de tu vehículo.');
            return;
        }

        diagBtn.disabled = true;
        diagBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando diagnóstico...';
        diagResultCard.style.display = 'none';

        try {
            const res = await fetch('/api/ai/prediagnostico', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sintomas: sintomas,
                    marca: diagMarca.value.trim(),
                    modelo: diagModelo.value.trim(),
                    ano: diagAno.value.trim()
                })
            });

            const data = await res.json();
            if (data.exito && data.diagnostico) {
                const diag = data.diagnostico;
                diagProblemTitle.textContent = diag.problema_probable || 'Diagnóstico preliminar';
                diagExplanation.textContent = diag.explicacion || '';
                diagService.textContent = diag.servicio_recomendado || 'Revisión General';

                const nivel = diag.nivel_urgencia || 'Medio';
                diagUrgency.textContent = 'Urgencia: ' + nivel;
                diagUrgency.className = `diag-urgency-badge urgency-${nivel}`;

                diagResultCard.style.display = 'block';
            } else {
                alert('No se pudo generar el diagnóstico con la IA.');
            }
        } catch (e) {
            alert('Error de conexión al procesar el pre-diagnóstico.');
        } finally {
            diagBtn.disabled = false;
            diagBtn.innerHTML = '<i class="fas fa-search"></i> Analizar con IA';
        }
    });
})();
