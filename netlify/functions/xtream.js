/**
 * NEXWORLD — Netlify Function
 * Backend Xtream / VOD
 *
 * Actions :
 *   vod_categories
 *   vod
 *   vod_info
 *   series_categories
 *   series
 *   series_info
 *   live_categories
 *   live
 *
 * Méthode : POST
 *
 * IMPORTANT :
 * Les identifiants Xtream sont reçus temporairement par la Function
 * et ne sont jamais enregistrés par ce code.
 */

'use strict';

const ALLOWED_ACTIONS = new Set([
  'vod_categories',
  'vod',
  'vod_info',
  'series_categories',
  'series',
  'series_info',
  'live_categories',
  'live'
]);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json; charset=utf-8'
};

function response(statusCode, data) {
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify(data)
  };
}

function clean(value) {
  return String(value ?? '').trim();
}

function normalizeServer(server) {
  let value = clean(server);

  if (!value) {
    throw new Error('Serveur Xtream manquant.');
  }

  if (!/^https?:\/\//i.test(value)) {
    value = 'http://' + value;
  }

  value = value.replace(/\/+$/, '');

  const parsed = new URL(value);

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Protocole serveur non autorisé.');
  }

  return parsed.origin;
}

function buildXtreamURL(server, username, password, action, extra = {}) {
  const base = normalizeServer(server);

  const url = new URL(base + '/player_api.php');

  url.searchParams.set('username', username);
  url.searchParams.set('password', password);

  if (action) {
    url.searchParams.set('action', action);
  }

  for (const [key, value] of Object.entries(extra)) {
    if (
      value !== undefined &&
      value !== null &&
      value !== ''
    ) {
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

async function fetchJSON(url) {

  const controller = new AbortController();

  const timeout = setTimeout(
    () => controller.abort(),
    30000
  );

  try {

    const result = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      signal: controller.signal
    });

    if (!result.ok) {
      throw new Error(
        `Serveur Xtream HTTP ${result.status}`
      );
    }

    const text = await result.text();

    if (!text) {
      throw new Error(
        'Réponse vide du serveur Xtream.'
      );
    }

    try {
      return JSON.parse(text);
    } catch {
      throw new Error(
        'Le serveur Xtream a renvoyé une réponse invalide.'
      );
    }

  } finally {

    clearTimeout(timeout);

  }
}

function sanitizeCredentials(body) {

  const server =
    clean(body.server);

  const username =
    clean(body.username);

  const password =
    clean(body.password);

  if (!server) {
    throw new Error(
      'URL du serveur Xtream obligatoire.'
    );
  }

  if (!username) {
    throw new Error(
      'Identifiant Xtream obligatoire.'
    );
  }

  if (!password) {
    throw new Error(
      'Mot de passe Xtream obligatoire.'
    );
  }

  return {
    server,
    username,
    password
  };
}

async function execute(action, body) {

  const credentials =
    sanitizeCredentials(body);

  const {
    server,
    username,
    password
  } = credentials;

  switch (action) {

    case 'vod_categories': {

      const url =
        buildXtreamURL(
          server,
          username,
          password,
          'get_vod_categories'
        );

      return await fetchJSON(url);
    }

    case 'vod': {

      const extra = {};

      if (body.category_id) {
        extra.category_id =
          clean(body.category_id);
      }

      const url =
        buildXtreamURL(
          server,
          username,
          password,
          'get_vod_streams',
          extra
        );

      return await fetchJSON(url);
    }

    case 'vod_info': {

      const vodId =
        clean(
          body.vod_id ||
          body.stream_id
        );

      if (!vodId) {
        throw new Error(
          'vod_id obligatoire.'
        );
      }

      const url =
        buildXtreamURL(
          server,
          username,
          password,
          'get_vod_info',
          {
            vod_id: vodId
          }
        );

      return await fetchJSON(url);
    }

    case 'series_categories': {

      const url =
        buildXtreamURL(
          server,
          username,
          password,
          'get_series_categories'
        );

      return await fetchJSON(url);
    }

    case 'series': {

      const extra = {};

      if (body.category_id) {
        extra.category_id =
          clean(body.category_id);
      }

      const url =
        buildXtreamURL(
          server,
          username,
          password,
          'get_series',
          extra
        );

      return await fetchJSON(url);
    }

    case 'series_info': {

      const seriesId =
        clean(
          body.series_id
        );

      if (!seriesId) {
        throw new Error(
          'series_id obligatoire.'
        );
      }

      const url =
        buildXtreamURL(
          server,
          username,
          password,
          'get_series_info',
          {
            series_id: seriesId
          }
        );

      return await fetchJSON(url);
    }

    case 'live_categories': {

      const url =
        buildXtreamURL(
          server,
          username,
          password,
          'get_live_categories'
        );

      return await fetchJSON(url);
    }

    case 'live': {

      const extra = {};

      if (body.category_id) {
        extra.category_id =
          clean(body.category_id);
      }

      const url =
        buildXtreamURL(
          server,
          username,
          password,
          'get_live_streams',
          extra
        );

      return await fetchJSON(url);
    }

    default:

      throw new Error(
        'Action non autorisée.'
      );
  }
}

exports.handler = async function(event) {

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return response(
      405,
      {
        ok: false,
        error: 'Méthode POST obligatoire.'
      }
    );
  }

  let body;

  try {

    body =
      JSON.parse(
        event.body || '{}'
      );

  } catch {

    return response(
      400,
      {
        ok: false,
        error: 'JSON invalide.'
      }
    );
  }

  const action =
    clean(body.action);

  if (
    !ALLOWED_ACTIONS.has(action)
  ) {

    return response(
      400,
      {
        ok: false,
        error:
          'Action inconnue.',
        allowed:
          [...ALLOWED_ACTIONS]
      }
    );
  }

  try {

    const data =
      await execute(
        action,
        body
      );

    return response(
      200,
      {
        ok: true,
        action,
        data
      }
    );

  } catch (error) {

    console.error(
      'NEXWORLD Xtream error:',
      error.message
    );

    return response(
      502,
      {
        ok: false,
        error:
          error.message ||
          'Erreur backend Xtream.'
      }
    );
  }
};
