const BASE = '/api';

function getToken(): string | null {
  try {
    const stored = sessionStorage.getItem('valoris_user');
    return stored ? JSON.parse(stored).token ?? null : null;
  } catch { return null; }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const authHeader: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(BASE + path, {
    ...init,
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', ...authHeader, ...init?.headers },
  });
  if (res.status === 401) {
    sessionStorage.removeItem('valoris_user');
    window.location.href = '/login';
    throw new Error('Sessie verlopen');
  }
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  if (res.status === 204) return undefined as T;
  return res.json();
}

// --- Domeinen ---
export const getDomeinen = () => request<Domein[]>('/domeinen');
export const createDomein = (body: DomeinCreate) => request<number>('/domeinen', { method: 'POST', body: JSON.stringify(body) });
export const updateDomein = (id: number, body: DomeinCreate) => request<void>(`/domeinen/${id}`, { method: 'PUT', body: JSON.stringify(body) });
export const getZaaksoorten = (domeinId: number) => request<Zaaksoort[]>(`/domeinen/${domeinId}/zaaksoorten`);
export const createZaaksoort = (domeinId: number, body: ZaaksoortCreate) => request<number>(`/domeinen/${domeinId}/zaaksoorten`, { method: 'POST', body: JSON.stringify(body) });
export const updateZaaksoort = (domeinId: number, id: number, body: ZaaksoortCreate) => request<void>(`/domeinen/${domeinId}/zaaksoorten/${id}`, { method: 'PUT', body: JSON.stringify(body) });
export const verplaatsZaaksoort = (domeinId: number, id: number, richting: 'omhoog' | 'omlaag') => request<void>(`/domeinen/${domeinId}/zaaksoorten/${id}/verplaats`, { method: 'PUT', body: JSON.stringify({ richting }) });
export const herordZaaksoorten = (domeinId: number, volgordeIds: number[]) => request<void>(`/domeinen/${domeinId}/zaaksoorten/herschikken`, { method: 'PUT', body: JSON.stringify(volgordeIds) });
export const getIndicatoren = (domeinId: number) => request<DomeinIndicator[]>(`/domeinen/${domeinId}/indicatoren`);
export const koppelIndicator = (domeinId: number, indicatorId: number) => request<number>(`/domeinen/${domeinId}/indicatoren`, { method: 'POST', body: JSON.stringify({ indicatorId }) });
export const ontkoppelIndicator = (domeinId: number, domeinIndicatorId: number) => request<void>(`/domeinen/${domeinId}/indicatoren/${domeinIndicatorId}`, { method: 'DELETE' });

// --- Metingsdoelen ---
export const getMetingsdoelen = (domeinId: number) => request<Metingsdoel[]>(`/domeinen/${domeinId}/metingsdoelen`);
export const createMetingsdoel = (body: MetingsdoelCreate) => request<number>('/metingsdoelen', { method: 'POST', body: JSON.stringify(body) });
export const updateMetingsdoel = (id: number, body: MetingsdoelUpdate) => request<void>(`/metingsdoelen/${id}`, { method: 'PUT', body: JSON.stringify(body) });

// --- Metingen ---
export const getMetingen = (domeinId: number) => request<Meting[]>(`/domeinen/${domeinId}/metingen`);
export const createMeting = (body: MetingCreate) => request<number>('/metingen', { method: 'POST', body: JSON.stringify(body) });
export const updateMeting = (id: number, body: MetingUpdate) => request<void>(`/metingen/${id}`, { method: 'PUT', body: JSON.stringify(body) });

// --- Veranderingen ---
export const getVeranderingen = (domeinId: number) => request<Verandering[]>(`/domeinen/${domeinId}/veranderingen`);
export const createVerandering = (body: VeranderingCreate) => request<number>('/veranderingen', { method: 'POST', body: JSON.stringify(body) });
export const updateVerandering = (id: number, body: VeranderingUpdate) => request<void>(`/veranderingen/${id}`, { method: 'PUT', body: JSON.stringify(body) });
export const importVeranderingenCsv = (domeinId: number, file: File) => {
  const form = new FormData();
  form.append('file', file);
  const token = getToken();
  return request<{ imported: number; warnings: string[] }>(`/veranderingen/import-csv?domeinId=${domeinId}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
};

// --- Veranderimpact ---
export const getVeranderimpact = (domeinId: number) => request<Veranderimpact[]>(`/domeinen/${domeinId}/veranderimpact`);
export const createVeranderimpact = (body: VeranderimpactCreate) => request<number>('/veranderimpact', { method: 'POST', body: JSON.stringify(body) });
export const updateVeranderimpact = (id: number, body: VeranderimpactUpdate) => request<void>(`/veranderimpact/${id}`, { method: 'PUT', body: JSON.stringify(body) });
export const deleteVeranderimpact = (id: number) => request<void>(`/veranderimpact/${id}`, { method: 'DELETE' });

// --- Strategie ---
export const getStrategie = (domeinId: number, periodeId?: number) =>
  request<Strategie>(`/domeinen/${domeinId}/strategie${periodeId ? `?periodeId=${periodeId}` : ''}`);

// --- Periodes ---
export const getPeriodes = (domeinId: number) => request<HuidigePeriode[]>(`/domeinen/${domeinId}/periodes`);
export const getHuidigePeride = (domeinId: number) => request<HuidigePeriode>(`/domeinen/${domeinId}/periodes/huidig`);
export const getAllePeriodes = () => request<HuidigePeriode[]>('/periodes');
export const createPeriode = (body: PeriodeCreate) => request<number>('/periodes', { method: 'POST', body: JSON.stringify(body) });
export const updatePeriode = (id: number, body: PeriodeCreate) => request<void>(`/periodes/${id}`, { method: 'PUT', body: JSON.stringify(body) });

// --- Auth ---
export const login = (email: string, wachtwoord: string) =>
  request<{ id: number; naam: string; email: string; rollen: { domeinId: number; rol: string }[]; token: string }>(
    '/auth/login', { method: 'POST', body: JSON.stringify({ email, wachtwoord }) });

// --- Gebruikers ---
export const getGebruikers = () => request<GebruikerDetail[]>('/gebruikers');
export const createGebruiker = (body: GebruikerCreate) => request<number>('/gebruikers', { method: 'POST', body: JSON.stringify(body) });
export const wijzigWachtwoord = (id: number, nieuwWachtwoord: string) => request<void>(`/gebruikers/${id}/wachtwoord`, { method: 'PUT', body: JSON.stringify({ nieuwWachtwoord }) });
export const wijzigEigenWachtwoord = (huidigWachtwoord: string, nieuwWachtwoord: string) => request<void>('/auth/wachtwoord', { method: 'PUT', body: JSON.stringify({ huidigWachtwoord, nieuwWachtwoord }) });
export const koppelRol = (id: number, domeinId: number, rol: string) => request<void>(`/gebruikers/${id}/rollen`, { method: 'POST', body: JSON.stringify({ domeinId, rol }) });
export const ontkoppelRol = (id: number, rolId: number) => request<void>(`/gebruikers/${id}/rollen/${rolId}`, { method: 'DELETE' });

// --- Producten ---
export const getProducten = (domeinId: number) => request<Product[]>(`/domeinen/${domeinId}/producten`);
export const createProduct = (domeinId: number, body: ProductCreate) => request<number>(`/domeinen/${domeinId}/producten`, { method: 'POST', body: JSON.stringify(body) });
export const updateProduct = (domeinId: number, id: number, body: Partial<ProductCreate> & { actief?: boolean }) => request<void>(`/domeinen/${domeinId}/producten/${id}`, { method: 'PUT', body: JSON.stringify(body) });

// --- Processen ---
export const getProcessen = (domeinId: number) => request<Proces[]>(`/domeinen/${domeinId}/processen`);
export const createProces = (domeinId: number, body: ProcesCreate) => request<number>(`/domeinen/${domeinId}/processen`, { method: 'POST', body: JSON.stringify(body) });
export const updateProces = (domeinId: number, id: number, body: Partial<ProcesCreate> & { actief?: boolean }) => request<void>(`/domeinen/${domeinId}/processen/${id}`, { method: 'PUT', body: JSON.stringify(body) });

// --- Scope ---
export const getScopeMatrix = (domeinId: number) => request<ScopeMatrix>(`/domeinen/${domeinId}/scope`);
export const createScope = (domeinId: number, body: ScopeCreate) => request<number>(`/domeinen/${domeinId}/scope/scopes`, { method: 'POST', body: JSON.stringify(body) });
export const updateScope = (domeinId: number, id: number, body: ScopeUpdate) => request<void>(`/domeinen/${domeinId}/scope/scopes/${id}`, { method: 'PUT', body: JSON.stringify(body) });
export const deleteScope = (domeinId: number, id: number) => request<void>(`/domeinen/${domeinId}/scope/scopes/${id}`, { method: 'DELETE' });
export const setHoofdproces = (domeinId: number, zaaksoortId: number, hoofdprocesId: number | null) => request<void>(`/domeinen/${domeinId}/scope/zaaksoorten/${zaaksoortId}/hoofdproces`, { method: 'PUT', body: JSON.stringify({ hoofdprocesId }) });

// --- Indicatoren bibliotheek ---
export const getAlleIndicatoren = () => request<Indicator[]>('/indicatoren');
export const createIndicator = (body: IndicatorCreate) => request<number>('/indicatoren', { method: 'POST', body: JSON.stringify(body) });
export const updateIndicator = (id: number, body: IndicatorCreate) => request<void>(`/indicatoren/${id}`, { method: 'PUT', body: JSON.stringify(body) });

// --- Types ---
export interface Domein { id: number; naam: string; omschrijving: string; basisperiode: string; interventiedrempel: number; actief: boolean; }
export interface Zaaksoort { id: number; domeinId: number; naam: string; omschrijving: string; icoon?: string; behandeling?: string; volgorde: number; actief: boolean; }
export interface DomeinIndicator { id: number; domeinId: number; indicatorId: number; indicatorNaam: string; type: string; eenheid: string; aggregatiewijze: string; actief: boolean; }
export interface Metingsdoel { id: number; domeinIndicatorId: number; zaaksoortId: number; zaaksoortNaam: string; indicatorNaam: string; normWaarde: number; normRichting: string; gewicht: number; actief: boolean; }
export interface MetingsdoelCreate { domeinIndicatorId: number; zaaksoortId: number; normWaarde: number; normRichting: string; gewicht: number; }
export interface MetingsdoelUpdate { normWaarde: number; normRichting: string; gewicht: number; actief: boolean; }
export interface Meting { id: number; metingsdoelId: number; periodeId: number; waarde: number; datum: string; bron: string; gevalideerd: boolean; }
export interface MetingCreate { metingsdoelId: number; periodeId: number; waarde: number; datum: string; bron: string; }
export interface MetingUpdate { waarde: number; datum: string; bron: string; gevalideerd: boolean; }
export interface Verandering { id: number; domeinId: number; naam: string; omschrijving: string; type: string; status: string; prioriteit: number; kosten: number; startdatum: string; einddatum: string; }
export interface VeranderingCreate { domeinId: number; naam: string; omschrijving: string; type: string; status: string; prioriteit: number; kosten: number; startdatum: string; einddatum: string; }
export interface VeranderingUpdate { naam: string; omschrijving: string; type: string; status: string; prioriteit: number; kosten: number; startdatum: string; einddatum: string; }
export interface Veranderimpact { id: number; veranderingId: number; metingsdoelId: number; periodeId: number; waarde: number; type: string; }
export interface VeranderimpactCreate { veranderingId: number; metingsdoelId: number; periodeId: number; waarde: number; type: string; }
export interface VeranderimpactUpdate { waarde: number; type: string; }
export interface HuidigePeriode { id: number; startdatum: string; einddatum: string; type: string; }
export interface MetingsdoelScore { metingsdoelId: number; indicatorNaam: string; indicatorType: string; istWaarde: number | null; normWaarde: number; normRichting: string; gewicht: number; score: number; }
export interface ZaaksoortStrategie { zaaksoortId: number; zaaksoortNaam: string; icoon?: string; behandeling?: string; volgorde: number; istScore: number; sollScore: number; prestatieScore: number; inrichtingScore: number; vectorPrestatieScore: number; vectorInrichtingScore: number; heeftMetingen: boolean; gekoppeldeVerandering?: string; metingsdoelen: MetingsdoelScore[]; }
export interface Strategie { domeinId: number; periodeId: number | null; interventiedrempel: number; zaaksoorten: ZaaksoortStrategie[]; }
export interface Indicator { id: number; naam: string; type: string; eenheid: string; aggregatiewijze: string; actief: boolean; }
export interface GebruikerRol { id: number; domeinId: number; domeinNaam: string; rol: string; }
export interface GebruikerDetail { id: number; naam: string; email: string; actief: boolean; rollen: GebruikerRol[]; }
export interface GebruikerCreate { naam: string; email: string; wachtwoord: string; }
export interface DomeinCreate { naam: string; omschrijving: string; basisperiode: string; interventiedrempel: number; }
export interface ZaaksoortCreate { naam: string; omschrijving: string; icoon?: string; behandeling?: string; }
export interface IndicatorCreate { naam: string; type: string; eenheid: string; aggregatiewijze: string; }
export interface PeriodeCreate { startdatum: string; einddatum: string; type: string; }
export interface Product { id: number; domeinId: number; naam: string; omschrijving: string; actief: boolean; }
export interface ProductCreate { naam: string; omschrijving?: string; }
export interface Proces { id: number; domeinId: number; naam: string; omschrijving: string; volgorde: number; actief: boolean; }
export interface ProcesCreate { naam: string; omschrijving?: string; volgorde?: number; }
export interface ScopeRegel { id: number; zaaksoortId: number; productId: number; procesId: number; type: 'verplicht' | 'optioneel'; frequentiePeriode?: string; frequentie?: number; }
export interface ScopeZaaksoort { id: number; naam: string; icoon?: string; behandeling?: string; hoofdprocesId?: number; }
export interface ScopeMatrix { producten: Product[]; processen: Proces[]; scopes: ScopeRegel[]; zaaksoorten: ScopeZaaksoort[]; }
export interface ScopeCreate { zaaksoortId: number; productId: number; procesId: number; type: string; frequentiePeriode?: string; frequentie?: number; }
export interface ScopeUpdate { type: string; frequentiePeriode?: string; frequentie?: number; }
