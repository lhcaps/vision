export type RenderPayloadSanitizerContext = {
  actorName?: string | null;
  agencyName?: string | null;
  parentAgencyName?: string | null;
  agencyCode?: string | null;
};

const LEGACY_PERSON_MARKERS = decodeMarkers([
  'VHLhuqduIFRoYW5oIE5hbQ==',
  'VHLDocK6wqduIFRoYW5oIE5hbQ==',
  'Tmd1eeG7hW4gVGhhbmggTmFt',
  'Tmd1ecOhwrvigKZuIFRoYW5oIE5hbQ==',
  'Tmd1eeG7hW4gVGjhu4sgVGhhbmggSHV54buBbg==',
  'Tmd1ecOhwrvigKZuIFRow6HCu+KAuSBUaGFuaCBIdXnDocK7woFu',
  'Tmd1eeG7hW4gVGjhu4sgSOG7k25nIEjhuqFuaA==',
  'Tmd1ecOhwrvigKZuIFRow6HCu+KAuSBIw6HCu+KAnG5nIEjDocK6wqFuaA==',
  'xJBvw6BuIFbEg24gRMWpbmc=',
  'w4TCkG/Dg8KgbiBWw4TGkm4gRMOFwqluZw==',
  'VGhhbmggQsOsbmg=',
  'VGhhbmggQsODwqxuaA==',
]);

const LEGACY_BODY_MARKERS = decodeMarkers([
  'cGjGsOG7nW5nIFRydW5nIE3hu7kgVMOieQ==',
  'cGjDhsKww6HCu8KdbmcgVHJ1bmcgTcOhwrvCuSBUw4PConk=',
  'c+G7kSAxMy80QSwg4bqkcCAxMDcsIHjDoyDEkMO0bmcgVGjhuqFuaCwgVGjDoG5oIHBo4buRIEjhu5MgQ2jDrSBNaW5o',
  'c8OhwrvigJggMTMvNEEsIMOhwrrCpHAgMTA3LCB4w4PCoyDDhMKQw4PCtG5nIFRow6HCusKhbmgsIFRow4PCoG5oIHBow6HCu+KAmCBIw6HCu+KAnCBDaMODwq0gTWluaA==',
]);

const LEGACY_PARENT_AGENCY_MARKERS = decodeMarkers([
  'Vknhu4ZOIEtJ4buCTSBTw4FUIE5Iw4JOIETDgk4gVEjDgE5IIFBI4buQIEjhu5IgQ0jDjSBNSU5I',
  'VknDocK74oCgTiBLScOhwrvigJpNIFPDg8KBVCBOSMOD4oCaTiBEw4PigJpOIFRIw4PigqxOSCBQSMOhwrvCkCBIw6HCu+KAmSBDSMODwo0gTUlOSA==',
  'VknDocK74oCgTiBLScOhwrvigJpNIFPDg8KBVCBOSMOD4oCaTiBEw4PigJpOIFRIw4PigqxOSCBQSMOhwrvCkCBIw6HCu+KAnCBDSMODwo0gTUlOSA==',
  'Vmnhu4duIGtp4buDbSBzw6F0IG5ow6JuIGTDom4gVGjDoG5oIHBo4buRIEjhu5MgQ2jDrSBNaW5o',
  'VmnDocK74oChbiBracOhwrvGkm0gc8ODwqF0IG5ow4PCom4gZMODwqJuIFRow4PCoG5oIHBow6HCu+KAmCBIw6HCu+KAnCBDaMODwq0gTWluaA==',
]);

const LEGACY_AGENCY_MARKERS = decodeMarkers([
  'Vknhu4ZOIEtJ4buCTSBTw4FUIE5Iw4JOIETDgk4gS0hVIFbhu7BDIDc=',
  'VknDocK74oCgTiBLScOhwrvigJpNIFPDg8KBVCBOSMOD4oCaTiBEw4PigJpOIEtIVSBWw6HCu8KwQyA3',
  'Vmnhu4duIGtp4buDbSBzw6F0IG5ow6JuIGTDom4ga2h1IHbhu7FjIDc=',
  'VmnDocK74oChbiBracOhwrvGkm0gc8ODwqF0IG5ow4PCom4gZMODwqJuIGtodSB2w6HCu8KxYyA3',
]);

const LEGACY_AGENCY_CODE_PATTERNS = [
  new RegExp(decodeMarker('VktTS1Y3'), 'gu'),
  new RegExp(decodeMarker('VktTLUtWNw=='), 'gu'),
];

export function sanitizeRenderPayloadRuntimeDefaults<T>(
  payload: T,
  context: RenderPayloadSanitizerContext,
): T {
  return sanitizeValue(payload, normalizeContext(context), 'payload') as T;
}

type NormalizedContext = {
  actorName: string;
  agencyName: string;
  parentAgencyName: string;
  agencyCode: string;
};

function normalizeContext(
  context: RenderPayloadSanitizerContext,
): NormalizedContext {
  return {
    actorName: clean(context.actorName),
    agencyName: clean(context.agencyName),
    parentAgencyName: clean(context.parentAgencyName),
    agencyCode: clean(context.agencyCode),
  };
}

function sanitizeValue(
  value: unknown,
  context: NormalizedContext,
  path: string,
): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'string') {
    return sanitizeText(value, context, path);
  }

  if (Array.isArray(value)) {
    return value.map((item, index) =>
      sanitizeValue(item, context, `${path}[${index}]`),
    );
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    for (const key of Object.keys(record)) {
      record[key] = sanitizeValue(record[key], context, `${path}.${key}`);
    }

    return record;
  }

  return value;
}

function sanitizeText(input: string, context: NormalizedContext, path: string) {
  let output = input;

  output = replaceMarkers(
    output,
    LEGACY_PARENT_AGENCY_MARKERS,
    context.parentAgencyName,
  );
  output = replaceMarkers(output, LEGACY_AGENCY_MARKERS, context.agencyName);

  const actorReplacement = isActorPath(path) ? context.actorName : '';
  output = replaceMarkers(output, LEGACY_PERSON_MARKERS, actorReplacement);
  output = replaceMarkers(output, LEGACY_BODY_MARKERS, '');

  if (context.agencyCode) {
    for (const pattern of LEGACY_AGENCY_CODE_PATTERNS) {
      output = output.replace(pattern, context.agencyCode);
    }
  }

  return tidyText(output);
}

function isActorPath(path: string) {
  return /(?:signature|signer|updatedByName|renderedByName|convertedByName|reviewerName|approvedByName|generatedByName|official|prosecutor|inspector|receiver)/iu.test(
    path,
  );
}

function replaceMarkers(input: string, markers: string[], replacement: string) {
  let output = input;
  for (const marker of markers) {
    output = output.replace(
      new RegExp(escapeRegExp(marker), 'giu'),
      replacement,
    );
  }

  return output;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function clean(value: unknown) {
  return String(value ?? '').trim();
}

function decodeMarkers(values: string[]) {
  return values.map(decodeMarker);
}

function decodeMarker(value: string) {
  return Buffer.from(value, 'base64').toString('utf8');
}

function tidyText(value: string) {
  return value
    .replace(/[ \t]{2,}/gu, ' ')
    .replace(/\s+([,.;:])/gu, '$1')
    .replace(/\(\s+\)/gu, '')
    .trim();
}
