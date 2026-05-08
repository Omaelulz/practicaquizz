// Netlify Function que sirve toda la API Fastify.
// Las llamadas a /api/* se redirigen aqui (ver netlify.toml).
import awsLambdaFastify from '@fastify/aws-lambda';
import { buildApp } from '../../api/src/app.js';

let proxyPromise;

async function getProxy() {
  if (!proxyPromise) {
    proxyPromise = (async () => {
      const app = await buildApp();
      await app.ready();
      return awsLambdaFastify(app, {
        // El redirect de Netlify reescribe /api/foo -> /.netlify/functions/api/foo,
        // por lo que el path que llega aqui incluye el prefijo de la function.
        // Lo quitamos para que las rutas Fastify (definidas como /subjects, /quiz/start...) coincidan.
        stripBasePath: '/.netlify/functions/api'
      });
    })();
  }
  return proxyPromise;
}

export const handler = async (event, context) => {
  const proxy = await getProxy();
  return proxy(event, context);
};
