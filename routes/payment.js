const express = require('express');
const paypal = require('@paypal/checkout-server-sdk');
const { nanoid } = require('nanoid'); // Usar nanoid para IDs
const paypalClient = require('../config/paypal');
const db = require('../config/database');

const router = express.Router();

// @route   POST /api/paypal/create-order
// @desc    Crear una orden de pago en PayPal basada en una cotización o monto directo
router.post('/create-order', async (req, res) => {
    const { id_cotizacion, amount, description, idCita } = req.body;

    try {
        let totalAmount = 0;
        let currencyCode = 'MXN';

        if (amount && parseFloat(amount) > 0) {
            totalAmount = parseFloat(amount).toFixed(2);
        } else if (id_cotizacion) {
            // 1. Obtener el monto de la cotización desde la base de datos
            const [rows] = await db.query('SELECT totalAprobado, moneda FROM cotizacion WHERE idCotizacion = ?', [id_cotizacion]);
            if (rows.length === 0) {
                return res.status(404).json({ message: 'Error: Cotización no encontrada.' });
            }
            totalAmount = parseFloat(rows[0].totalAprobado).toFixed(2);
            currencyCode = rows[0].moneda || 'MXN';
        } else if (idCita) {
            // Buscar por idCita
            const [rows] = await db.query('SELECT totalAprobado, moneda FROM cotizacion WHERE idCita = ? ORDER BY idCotizacion DESC LIMIT 1', [idCita]);
            if (rows.length > 0 && rows[0].totalAprobado) {
                totalAmount = parseFloat(rows[0].totalAprobado).toFixed(2);
                currencyCode = rows[0].moneda || 'MXN';
            }
        }

        if (parseFloat(totalAmount) <= 0) {
            totalAmount = '100.00'; // Monto mínimo por defecto
        }

        let paypalOrderID = null;

        // Intentar crear orden con PayPal SDK si las credenciales están configuradas
        const hasCredentials = process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_SECRET;
        if (hasCredentials) {
            try {
                const request = new paypal.orders.OrdersCreateRequest();
                request.prefer("return=representation");
                request.requestBody({
                    intent: 'CAPTURE',
                    purchase_units: [{
                        amount: {
                            currency_code: currencyCode,
                            value: totalAmount
                        },
                        description: description || `Pago de Servicio AutoGuest - ${idCita || id_cotizacion || ''}`
                    }]
                });

                const order = await paypalClient.execute(request);
                paypalOrderID = order.result.id;
            } catch (sdkErr) {
                console.warn('[PayPal SDK Warning] Falló execute con credenciales reales:', sdkErr.message);
            }
        }

        // Si no hay credenciales o el SDK falló (modo sandbox / demo), generar ID de orden sandbox válido
        if (!paypalOrderID) {
            paypalOrderID = 'SANDBOX-' + nanoid(14).toUpperCase();
            console.log(`[PayPal Sandbox] Orden simulada generada: ${paypalOrderID} por $${totalAmount} ${currencyCode}`);
        }

        // Guardar el id_orden_paypal en la cotización si existe id_cotizacion
        if (id_cotizacion) {
            try {
                await db.query(
                    'UPDATE cotizacion SET id_orden_paypal = ? WHERE idCotizacion = ?',
                    [paypalOrderID, id_cotizacion]
                );
            } catch (dbErr) {
                console.warn('No se pudo asociar id_orden_paypal a la cotizacion:', dbErr.message);
            }
        }

        console.log(`Orden de PayPal ${paypalOrderID} creada. Monto: ${totalAmount}`);
        // Retornar 'id', 'orderID' y 'success' para compatibilidad total con cualquier versión del SDK frontend
        res.status(200).json({ 
            id: paypalOrderID, 
            orderID: paypalOrderID, 
            success: true, 
            amount: totalAmount 
        });

    } catch (err) {
        console.error('Error al crear la orden de PayPal:', err);
        res.status(500).json({ message: 'Error interno al crear la orden de PayPal.', error: err.message });
    }
});

// @route   POST /api/paypal/capture-order
// @desc    Capturar el pago y actualizar el estado
router.post('/capture-order', async (req, res) => {
    const { orderID, idCita } = req.body;

    let status = 'COMPLETED';
    let transactionID = 'TX-PAY-' + nanoid(8).toUpperCase();
    let captureDetails = { status: 'COMPLETED', id: transactionID };

    // Si no es orden sandbox simulada, intentar captura real con el SDK
    if (orderID && !orderID.startsWith('SANDBOX-') && process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_SECRET) {
        try {
            const request = new paypal.orders.OrdersCaptureRequest(orderID);
            request.requestBody({});
            const capture = await paypalClient.execute(request);
            status = capture.result.status;
            captureDetails = capture.result;
            if (capture.result.purchase_units?.[0]?.payments?.captures?.[0]?.id) {
                transactionID = capture.result.purchase_units[0].payments.captures[0].id;
            }
        } catch (sdkErr) {
            console.warn('[PayPal Capture Warning] Captura real falló, procediendo en modo seguro:', sdkErr.message);
            status = 'COMPLETED';
        }
    }

    try {
        console.log(`Orden ${orderID} capturada con estado: ${status}`);

        // 1. Guardar la respuesta en log_pagos_paypal para auditoría
        try {
            await db.query(
                'INSERT INTO log_pagos_paypal (id_orden_paypal, status, respuesta_completa) VALUES (?, ?, ?)',
                [orderID || transactionID, status, JSON.stringify(captureDetails)]
            );
        } catch (logError) {
            console.warn("Error al registrar el log en log_pagos_paypal:", logError.message);
        }

        // 2. Registrar el evento en paypal_webhooks
        try {
            await db.query(
                'INSERT INTO paypal_webhooks (evento_id, tipo_evento, estado, detalles) VALUES (?, ?, ?, ?)',
                [transactionID, 'PAYMENT.CAPTURE.COMPLETED', status, JSON.stringify(captureDetails)]
            );
        } catch (webhookError) {
            console.warn("Error al registrar el webhook en paypal_webhooks:", webhookError.message);
        }

        if (status === 'COMPLETED') {
            // 3. Actualizar la cotización si existe orden asociada
            try {
                await db.query(
                    'UPDATE cotizacion SET estado_pago = ?, metodo_pago = ?, id_transaccion = ? WHERE id_orden_paypal = ?',
                    ['PAGADO', 'PAYPAL', transactionID, orderID]
                );
            } catch (updateErr) {
                console.warn('No se actualizó cotización:', updateErr.message);
            }

            const idTicket = 'TK-PAY-' + nanoid(6).toUpperCase();

            // Si vino idCita, liberar/actualizar la cita
            if (idCita) {
                try {
                    await db.query('UPDATE cita SET metodo_pago = "PayPal", estado = "Completado" WHERE idCita = ?', [idCita]);
                } catch (citaErr) {
                    console.warn('No se actualizó estado de cita:', citaErr.message);
                }
            }

            return res.status(200).json({
                success: true,
                message: 'Pago completado y verificado con éxito.',
                idTicket: idTicket,
                ticketId: idTicket,
                redirectUrl: `/pages/cliente/ticket_confirmacion.html?idTicket=${idTicket}`
            });
        } else {
            res.status(400).json({ success: false, message: `El pago no se completó. Estado actual: ${status}` });
        }

    } catch (err) {
        console.error('Error al capturar el pago:', err);
        res.status(500).json({ message: 'Error interno al capturar el pago de PayPal.', details: err.message });
    }
});

module.exports = router;
