const { MercadoPagoConfig } = require('mercadopago');
require('dotenv').config();

const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN || 'TEST-0000000000000000-000000-00000000000000000000000000000000-000000000'
});

module.exports = client;
