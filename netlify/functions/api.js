// Netlify Function que sirve toda la API Fastify.
// Las llamadas a /api/* se redirigen aqui (ver netlify.toml).
import awsLambdaFastify from '@fastify/aws-lambda';
import { buildApp } from '../../api/src/app.js';

let proxyPromise;

async function getProxy() {
  if (!proxyPromise) {
    proxyPromise = (async () => {
      const app = await buildApp();
      return awsLambdaFastify(app);
    })();
  }
  return proxyPromise;
}

// Netlify puede pasar a la function tanto el path reescrito (/.netlify/functions/api/...)
// como el original que matchea el redirect (/api/...). Quitamos ambos prefijos.
const PREFIXES = ['/.netlify/functions/api', '/api'];

function stripPrefix(path) {
  if (!path) return path;
  for (const prefix of PREFIXES) {
    if (path === prefix) return '/';
    if (path.startsWith(prefix + '/')) return path.slice(prefix.length);
  }
  return path;
}

export const handler = async (event, context) => {
  const proxy = await getProxy();

  // Netlify rewrite /api/foo -> /.netlify/functions/api/foo.
  // Quitamos el prefijo para que Fastify vea /foo y rutas como /health o /subjects coincidan.
  if (event.path) event.path = stripPrefix(event.path);
  if (event.rawPath) event.rawPath = stripPrefix(event.rawPath);
  if (event.requestContext?.http?.path) {
    event.requestContext.http.path = stripPrefix(event.requestContext.http.path);
  }

  return proxy(event, context);
};
