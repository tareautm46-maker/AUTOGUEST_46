const express = require('express');
const router = express.Router();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// Modelos compatibles con auto-fallback en caso de alta demanda o cambios de versión
const GEMINI_MODELS = ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-3.6-flash', 'gemini-3.8-flash'];

// Helper para invocar la API de Gemini mediante fetch nativo con reintento automático
async function callGemini(contents, systemInstruction = null, responseMimeType = null) {
    if (!GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY no está configurada en las variables de entorno.');
    }

    let lastError = null;

    for (const model of GEMINI_MODELS) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
            
            const body = {
                contents: contents,
                generationConfig: {
                    temperature: 0.3,
                    maxOutputTokens: 1024
                }
            };

            if (systemInstruction) {
                body.systemInstruction = {
                    parts: [{ text: systemInstruction }]
                };
            }

            if (responseMimeType) {
                body.generationConfig.responseMimeType = responseMimeType;
            }

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.warn(`[AI Warning] Modelo ${model} devolvió ${response.status}: ${errorText.slice(0, 120)}... Reintentando con siguiente modelo...`);
                lastError = new Error(`HTTP ${response.status}: ${errorText}`);
                continue; // Probar con el siguiente modelo de la lista
            }

            const data = await response.json();
            const candidate = data.candidates?.[0];
            if (!candidate || !candidate.content?.parts?.[0]?.text) {
                console.warn(`[AI Warning] Modelo ${model} devolvió contenido vacío. Reintentando...`);
                continue;
            }

            return candidate.content.parts[0].text;
        } catch (callErr) {
            console.warn(`[AI Warning] Error de conexión con modelo ${model}:`, callErr.message);
            lastError = callErr;
        }
    }

    throw lastError || new Error('No se pudo obtener respuesta de ningún modelo de IA disponible.');
}

// ============================================================
// 1. ENDPOINT: Chat Asistente Automotriz 24/7
// POST /api/ai/chat
// ============================================================
router.post('/chat', async (req, res) => {
    try {
        const { mensaje, historial = [] } = req.body;

        if (!mensaje || typeof mensaje !== 'string') {
            return res.status(400).json({ error: 'El mensaje es requerido.' });
        }

        const systemPrompt = `Eres "AutoGuest AI", el asistente inteligente oficial de AutoGuest, plataforma automotriz que conecta a conductores con talleres mecánicos modernos.
Tus responsabilidades:
- Orientar a conductores sobre mantenimiento preventivo (aceite, frenos, afinación, llantas, batería).
- Explicar fallas comunes de manera transparente, empática y sin tecnicismos excesivos.
- Invitar a agendar citas en los talleres registrados de AutoGuest cuando sea oportuno.
- Si el usuario reporta una falla grave que ponga en riesgo su seguridad (ej. frenos sin responder, humo denso, sobrecalentamiento crítico), recomiéndale no conducir el auto y solicitar asistencia.
- Mantén tus respuestas concisas, amables y profesionales.`;

        // Formatear historial si existe
        const contents = [];
        for (const item of historial) {
            if (item.rol === 'usuario') {
                contents.push({ role: 'user', parts: [{ text: item.texto }] });
            } else if (item.rol === 'asistente') {
                contents.push({ role: 'model', parts: [{ text: item.texto }] });
            }
        }
        contents.push({ role: 'user', parts: [{ text: mensaje }] });

        const respuesta = await callGemini(contents, systemPrompt);

        res.json({
            exito: true,
            respuesta: respuesta
        });
    } catch (error) {
        console.error('[AI Chat] Error:', error.message);
        res.status(500).json({
            exito: false,
            error: 'No se pudo generar la respuesta de la IA. Por favor intenta de nuevo.'
        });
    }
});

// ============================================================
// 2. ENDPOINT: Pre-Diagnóstico Inteligente de Fallas
// POST /api/ai/prediagnostico
// ============================================================
router.post('/prediagnostico', async (req, res) => {
    try {
        const { sintomas, marca = '', modelo = '', ano = '' } = req.body;

        if (!sintomas || typeof sintomas !== 'string') {
            return res.status(400).json({ error: 'Debes proporcionar los síntomas o fallas del vehículo.' });
        }

        const vehiculoInfo = (marca || modelo || ano) 
            ? `Vehículo: ${marca} ${modelo} ${ano}`.trim() 
            : 'Vehículo no especificado';

        const systemPrompt = `Eres un mecánico máster de diagnóstico automotriz en AutoGuest.
Analiza la descripción del conductor y genera un pre-diagnóstico técnico preliminar.
Debes responder ESTRICTAMENTE en formato JSON válido con la siguiente estructura:
{
  "problema_probable": "Título corto y claro del problema principal",
  "nivel_urgencia": "Bajo | Medio | Urgente",
  "posibles_causas": ["Causa 1", "Causa 2", "Causa 3"],
  "servicio_recomendado": "Nombre del servicio del taller sugerido (ej. Sistema de Frenos, Afinación Mayor, Suspensión y Dirección, Diagnóstico por Escáner OBD-II)",
  "explicacion": "Explicación sencilla de 2 a 3 oraciones de qué está pasando y por qué.",
  "recomendacion_seguridad": "Consejo puntual sobre si puede circular o si requiere atención inmediata."
}`;

        const promptUsuario = `${vehiculoInfo}\nSíntomas reportados por el conductor:\n"${sintomas}"`;

        const contents = [{ role: 'user', parts: [{ text: promptUsuario }] }];
        const rawJson = await callGemini(contents, systemPrompt, 'application/json');

        const diagnostico = JSON.parse(rawJson);

        res.json({
            exito: true,
            diagnostico: diagnostico
        });
    } catch (error) {
        console.error('[AI Pre-diagnóstico] Error:', error.message);
        res.status(500).json({
            exito: false,
            error: 'No se pudo procesar el pre-diagnóstico con la IA.'
        });
    }
});

// ============================================================
// 3. ENDPOINT: Escaneo Multimodal de Tarjetas de Circulación (OCR)
// POST /api/ai/scan-car
// ============================================================
router.post('/scan-car', async (req, res) => {
    try {
        const { imagenBase64, mimeType = 'image/jpeg' } = req.body;

        if (!imagenBase64) {
            return res.status(400).json({ error: 'Debes enviar la imagen en formato base64.' });
        }

        // Limpiar encabezado data:image/... si viene incluido
        const cleanBase64 = imagenBase64.replace(/^data:image\/[a-z]+;base64,/, '');

        const systemPrompt = `Eres un extractor de datos de documentos vehiculares (tarjetas de circulación, facturas y pólizas de seguro en México y Latinoamérica).
Analiza la imagen provista y extrae los datos del vehículo.
Responde ÚNICAMENTE en formato JSON válido con la estructura:
{
  "marca": "Marca (ej. Nissan, Ford, Toyota) o null si no es legible",
  "submarca": "Línea o modelo (ej. Versa, Fiesta, Corolla) o null",
  "ano": "Año del modelo (ej. 2018) o null",
  "placas": "Placas de circulación sin guiones ni espacios (ej. YZA1234) o null",
  "vin": "Número de Identificación Vehicular (NIV/VIN de 17 caracteres) o null",
  "color": "Color de carrocería o null"
}`;

        const contents = [{
            role: 'user',
            parts: [
                {
                    inlineData: {
                        mimeType: mimeType,
                        data: cleanBase64
                    }
                },
                {
                    text: 'Extrae los datos de este documento vehicular.'
                }
            ]
        }];

        const rawJson = await callGemini(contents, systemPrompt, 'application/json');
        const datosVehiculo = JSON.parse(rawJson);

        res.json({
            exito: true,
            datos: datosVehiculo
        });
    } catch (error) {
        console.error('[AI Scan Car] Error:', error.message);
        res.status(500).json({
            exito: false,
            error: 'No se pudo procesar la imagen del vehículo con IA.'
        });
    }
});

module.exports = router;
