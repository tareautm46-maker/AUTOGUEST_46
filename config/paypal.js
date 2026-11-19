const paypal = require('@paypal/checkout-server-sdk');

// 1. Configurar el entorno de PayPal con fallbacks seguros para evitar caídas de servidor
const clientId = process.env.PAYPAL_CLIENT_ID || 'AV3YWOgsecWq7gVh6mebi4LkOetFi1ULwCt0GWcO3AjuvGe86rFVzvEUj3wqcsfJ24480P5_7xanUTZG';
const clientSecret = process.env.PAYPAL_SECRET || 'EMOCK_SECRET_SANDBOX_KEY_DEFAULT_2026';

const environment = process.env.PAYPAL_MODE === 'live'
    ? new paypal.core.LiveEnvironment(clientId, clientSecret)
    : new paypal.core.SandboxEnvironment(clientId, clientSecret);

const client = new paypal.core.PayPalHttpClient(environment);

module.exports = client;
