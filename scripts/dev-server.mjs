import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import process from 'node:process';
import { loadEnv } from 'vite';

const viteHost = '127.0.0.1';
const vitePort = 5173;
const proxyHost = '127.0.0.1';
const proxyPort = 8787;
const cacheTtlMs = 28 * 1000;
const staleFallbackTtlMs = 3 * 60 * 1000;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function parseNumericParam(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function json(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  response.setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify(payload));
}

function projectStateRows(rows, categories, limit) {
  return Array.isArray(rows)
    ? rows
        .map((row) => {
          if (!Array.isArray(row)) {
            return null;
          }

          return {
            baroAltitude: typeof row[7] === 'number' ? row[7] : null,
            callsign: typeof row[1] === 'string' ? row[1].trim() || null : null,
            category: typeof row[17] === 'number' ? row[17] : null,
            icao24: typeof row[0] === 'string' ? row[0] : '',
            lastContact: typeof row[4] === 'number' ? row[4] : null,
            latitude: typeof row[6] === 'number' ? row[6] : null,
            longitude: typeof row[5] === 'number' ? row[5] : null,
            onGround: row[8] === true,
            originCountry: typeof row[2] === 'string' ? row[2] : null,
            trueTrack: typeof row[10] === 'number' ? row[10] : null,
            velocity: typeof row[9] === 'number' ? row[9] : null,
          };
        })
        .filter(
          (state) =>
            Boolean(state) &&
            Boolean(state.icao24) &&
            state.latitude !== null &&
            state.longitude !== null &&
            !state.onGround &&
            (state.category === null || categories.includes(state.category)),
        )
        .sort((left, right) => (right.velocity ?? 0) - (left.velocity ?? 0))
        .slice(0, limit)
    : [];
}

const env = loadEnv('development', process.cwd(), '');
const clientId = env.OPENSKY_CLIENT_ID || null;
const clientSecret = env.OPENSKY_CLIENT_SECRET || null;

let tokenCache = null;
const responseCache = new Map();
const pendingRequests = new Map();

async function getAccessToken() {
  if (!clientId || !clientSecret) {
    throw new Error(
      'OpenSky relay is running but OPENSKY_CLIENT_ID / OPENSKY_CLIENT_SECRET are missing.',
    );
  }

  if (tokenCache && Date.now() < tokenCache.expiresAtMs) {
    return tokenCache.accessToken;
  }

  const response = await fetch(
    'https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token',
    {
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials',
      }),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      method: 'POST',
    },
  );

  if (!response.ok) {
    throw new Error(`OpenSky auth failed with ${response.status}.`);
  }

  const payload = await response.json();
  if (!payload.access_token) {
    throw new Error('OpenSky auth response did not include an access token.');
  }

  tokenCache = {
    accessToken: payload.access_token,
    expiresAtMs:
      Date.now() + Math.max((payload.expires_in ?? 1800) - 30, 60) * 1000,
  };

  return tokenCache.accessToken;
}

async function fetchStates(requestUrl) {
  const categories = (requestUrl.searchParams.get('categories') ?? '4,5,6')
    .split(',')
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value));
  const limit = clamp(
    Math.floor(parseNumericParam(requestUrl.searchParams.get('limit'), 24)),
    1,
    48,
  );
  const upstreamUrl = new URL('https://opensky-network.org/api/states/all');
  upstreamUrl.searchParams.set('lamin', requestUrl.searchParams.get('lamin') ?? '-60');
  upstreamUrl.searchParams.set('lamax', requestUrl.searchParams.get('lamax') ?? '60');
  upstreamUrl.searchParams.set('lomin', requestUrl.searchParams.get('lomin') ?? '-180');
  upstreamUrl.searchParams.set('lomax', requestUrl.searchParams.get('lomax') ?? '180');
  upstreamUrl.searchParams.set('extended', '1');

  const cacheKey = [
    upstreamUrl.searchParams.get('lamin'),
    upstreamUrl.searchParams.get('lamax'),
    upstreamUrl.searchParams.get('lomin'),
    upstreamUrl.searchParams.get('lomax'),
    categories.join(','),
    String(limit),
  ].join('|');
  const cachedEntry = responseCache.get(cacheKey);
  const nowMs = Date.now();

  if (cachedEntry && nowMs - cachedEntry.cachedAtMs < cacheTtlMs) {
    return {
      ...cachedEntry.payload,
      meta: {
        cacheAgeMs: nowMs - cachedEntry.cachedAtMs,
        cached: true,
      },
    };
  }

  let pendingRequest = pendingRequests.get(cacheKey);
  if (!pendingRequest) {
    pendingRequest = (async () => {
      const accessToken = await getAccessToken();
      const upstreamResponse = await fetch(upstreamUrl.toString(), {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!upstreamResponse.ok) {
        throw new Error(`OpenSky states request failed with ${upstreamResponse.status}.`);
      }

      const payload = await upstreamResponse.json();
      let filteredStates = projectStateRows(payload.states, categories, limit);

      if (filteredStates.length === 0) {
        const fallbackUrl = new URL('https://opensky-network.org/api/states/all');
        fallbackUrl.searchParams.set('lamin', '-68');
        fallbackUrl.searchParams.set('lamax', '78');
        fallbackUrl.searchParams.set('lomin', '-180');
        fallbackUrl.searchParams.set('lomax', '180');
        fallbackUrl.searchParams.set('extended', '1');

        const fallbackResponse = await fetch(fallbackUrl.toString(), {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (fallbackResponse.ok) {
          const fallbackPayload = await fallbackResponse.json();
          filteredStates = projectStateRows(
            fallbackPayload.states,
            categories,
            limit,
          );
        }
      }

      const nextPayload = {
        meta: {
          cacheAgeMs: 0,
          cached: false,
        },
        states: filteredStates,
        time: typeof payload.time === 'number' ? payload.time : null,
      };

      responseCache.set(cacheKey, {
        cachedAtMs: Date.now(),
        payload: nextPayload,
      });

      return nextPayload;
    })().finally(() => {
      pendingRequests.delete(cacheKey);
    });

    pendingRequests.set(cacheKey, pendingRequest);
  }

  try {
    return await pendingRequest;
  } catch (error) {
    const staleEntry = responseCache.get(cacheKey);
    if (staleEntry && Date.now() - staleEntry.cachedAtMs < staleFallbackTtlMs) {
      return {
        ...staleEntry.payload,
        meta: {
          cacheAgeMs: Date.now() - staleEntry.cachedAtMs,
          cached: true,
        },
      };
    }

    throw error;
  }
}

const proxyServer = createServer(async (request, response) => {
  if (!request.url) {
    json(response, 400, { error: 'Missing request URL.' });
    return;
  }

  if (request.method === 'OPTIONS') {
    response.statusCode = 204;
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    response.end();
    return;
  }

  const requestUrl = new URL(request.url, `http://${proxyHost}:${proxyPort}`);

  if (requestUrl.pathname === '/api/opensky/status') {
    try {
      await getAccessToken();
      json(response, 200, { authenticated: true, configured: true });
    } catch (error) {
      json(response, 503, {
        authenticated: false,
        configured: Boolean(clientId && clientSecret),
        error: error instanceof Error ? error.message : 'OpenSky relay unavailable.',
      });
    }
    return;
  }

  if (requestUrl.pathname !== '/api/opensky/states') {
    json(response, 404, { error: 'Not found.' });
    return;
  }

  try {
    const payload = await fetchStates(requestUrl);
    json(response, 200, payload);
  } catch (error) {
    json(response, 502, {
      error: error instanceof Error ? error.message : 'OpenSky proxy failed.',
      meta: {
        cacheAgeMs: null,
        cached: false,
      },
      states: [],
      time: null,
    });
  }
});

proxyServer.listen(proxyPort, proxyHost, () => {
  process.stdout.write(
    `OpenSky proxy ready on http://${proxyHost}:${proxyPort}\n`,
  );
});

const viteProcess = spawn(
  process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
  ['exec', 'vite', '--host', viteHost, '--port', String(vitePort)],
  {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
  },
);

const shutdown = () => {
  proxyServer.close();
  if (!viteProcess.killed) {
    viteProcess.kill('SIGINT');
  }
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

viteProcess.on('exit', (code) => {
  proxyServer.close();
  process.exit(code ?? 0);
});
