const scope = 'https://www.googleapis.com/auth/dataportability.saved.collections';
const expectedStateKey = 'spotory-portability-state';
const tokenKey = 'spotory-portability-token';
const jobKey = 'spotory-portability-job';
const errorKey = 'spotory-portability-error';

export type PortabilitySession = { accessToken: string; expiresAt: number; jobId?: string };
export type PortabilityArchiveState = { state?: 'IN_PROGRESS' | 'COMPLETE' | 'FAILED' | 'CANCELLED'; urls?: string[]; error?: { message?: string } };

export function consumePortabilityOAuthCallback() {
  const params = new URLSearchParams(location.hash.replace(/^#/, ''));
  const accessToken = params.get('access_token'); const state = params.get('state');
  const oauthError = params.get('error');
  if (!state || (!accessToken && !oauthError)) return;
  const expected = sessionStorage.getItem(expectedStateKey);
  if (!expected || state !== expected) sessionStorage.setItem(errorKey, 'Google認証の確認情報が一致しません。もう一度接続してください。');
  else if (oauthError) sessionStorage.setItem(errorKey, params.get('error_description') || 'Google保存リストへのアクセスが許可されませんでした。');
  else {
    const expiresIn = Number(params.get('expires_in') || 3600);
    sessionStorage.setItem(tokenKey, JSON.stringify({ accessToken: accessToken!, expiresAt: Date.now() + expiresIn * 1000 } satisfies PortabilitySession));
    sessionStorage.removeItem(errorKey);
  }
  sessionStorage.removeItem(expectedStateKey);
  history.replaceState(null, '', `${location.pathname}${location.search}#/settings`);
}

export function startPortabilityAuthorization() {
  const clientId = import.meta.env.VITE_GOOGLE_PORTABILITY_CLIENT_ID?.trim();
  if (!clientId) throw new Error('Data Portability用OAuth Client IDが未設定です。');
  const state = crypto.randomUUID(); sessionStorage.setItem(expectedStateKey, state);
  const redirectUri = `${location.origin}${location.pathname}`;
  const params = new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri, response_type: 'token', scope, state, include_granted_scopes: 'false', prompt: 'consent' });
  location.assign(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}

export function getPortabilitySession(): PortabilitySession | null {
  try { const value = JSON.parse(sessionStorage.getItem(tokenKey) || 'null') as PortabilitySession | null; return value?.accessToken ? { ...value, jobId: sessionStorage.getItem(jobKey) || value.jobId } : null; }
  catch { return null; }
}

export function getPortabilityError() { const error = sessionStorage.getItem(errorKey) || ''; sessionStorage.removeItem(errorKey); return error; }

async function portabilityRequest<T>(path: string, accessToken: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`https://dataportability.googleapis.com/v1/${path}`, { ...init, headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', ...init?.headers } });
  const data = await response.json().catch(() => ({})) as T & { error?: { message?: string } };
  if (!response.ok) throw new Error(data.error?.message || `Googleデータ取得に失敗しました（${response.status}）`);
  return data;
}

export async function initiatePortabilityArchive(accessToken: string) {
  const result = await portabilityRequest<{ archiveJobId?: string; jobId?: string }>('portabilityArchive:initiate', accessToken, { method: 'POST', body: JSON.stringify({ resources: ['saved.collections'] }) });
  const jobId = result.archiveJobId || result.jobId; if (!jobId) throw new Error('GoogleからジョブIDが返されませんでした。');
  sessionStorage.setItem(jobKey, jobId); return jobId;
}

export function getPortabilityArchiveState(accessToken: string, jobId: string) {
  return portabilityRequest<PortabilityArchiveState>(`archiveJobs/${encodeURIComponent(jobId)}/portabilityArchiveState`, accessToken);
}

export function clearPortabilitySession() { sessionStorage.removeItem(tokenKey); sessionStorage.removeItem(jobKey); sessionStorage.removeItem(errorKey); }
