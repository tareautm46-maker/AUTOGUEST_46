const express = require('express');
const router = express.Router();
const { Preference } = require('mercadopago');
const client = require('../config/mercadopago');
const db = require('../config/database');

// Ruta para obtener la clave pública de MercadoPago
router.get('/public-key', (req, res) => {
    res.json({ publicKey: process.env.MP_PUBLIC_KEY || 'TEST-99999999-9999-9999-9999-999999999999' });
});

router.post('/create-preference', async (req, res) => {
    const { id_cotizacion, price, amount, title, idCita } = req.body;

    try {
        let unitPrice = 0;
        if (price && parseFloat(price) > 0) {
            unitPrice = parseFloat(price);
        } else if (amount && parseFloat(amount) > 0) {
            unitPrice = parseFloat(amount);
        } else if (id_cotizacion) {
            const [rows] = await db.query('SELECT totalAprobado FROM cotizacion WHERE idCotizacion = ?', [id_cotizacion]);
            if (rows.length > 0 && rows[0].totalAprobado) {
                unitPrice = parseFloat(rows[0].totalAprobado);
            }
        } else if (idCita) {
            const [rows] = await db.query('SELECT totalAprobado FROM cotizacion WHERE idCita = ? ORDER BY idCotizacion DESC LIMIT 1', [idCita]);
            if (rows.length > 0 && rows[0].totalAprobado) {
                unitPrice = parseFloat(rows[0].totalAprobado);
            }
        }

        if (unitPrice <= 0) unitPrice = 100;

        if (process.env.MP_ACCESS_TOKEN) {
            try {
                const preference = new Preference(client);
                const response = await preference.create({
                    body: {
                        items: [
                            {
                                title: title || `Servicio AutoGuest - Cita ${idCita || ''}`,
                                unit_price: unitPrice,
                                quantity: 1,
                            },
                        ],
                        back_urls: {
                            success: '/pages/cliente/detalle_cita.html?id=' + (idCita || ''),
                            failure: '/pages/cliente/detalle_cita.html?id=' + (idCita || ''),
                            pending: '/pages/cliente/detalle_cita.html?id=' + (idCita || ''),
                        },
                        auto_return: 'approved',
                    }
                });
                return res.json({ id: response.id, preferenceId: response.id, success: true });
            } catch (mpErr) {
                console.warn('[MercadoPago Warning] SDK fallo:', mpErr.message);
            }
        }

        // Si no hay MP_ACCESS_TOKEN o falló, generar preferencia sandbox
        const mockPrefId = 'PREF-SANDBOX-' + Date.now();
        res.json({ id: mockPrefId, preferenceId: mockPrefId, success: true, sandbox: true });

    } catch (error) {
        console.error('Error MP:', error);
        res.status(500).json({ error: 'Failed to create preference', message: error.message });
    }
});

module.exports = router;
