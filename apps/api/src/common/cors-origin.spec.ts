import { createCorsOriginValidator, resolveCorsPolicy } from './cors-origin';

describe('resolveCorsPolicy', () => {
  it('parses comma-separated origins without blanks or duplicates', () => {
    expect(
      resolveCorsPolicy(
        'http://a.test, http://b.test, http://a.test, ',
        'production',
      ),
    ).toEqual({
      allowAll: false,
      origins: ['http://a.test', 'http://b.test'],
    });
  });

  it('adds loopback origins in development', () => {
    expect(resolveCorsPolicy('http://a.test', 'development').origins).toEqual([
      'http://a.test',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://[::1]:3000',
    ]);
  });

  it('represents wildcard configuration explicitly', () => {
    expect(resolveCorsPolicy('*', 'development')).toEqual({
      allowAll: true,
      origins: [],
    });
  });
});

describe('createCorsOriginValidator', () => {
  it('allows requests without an Origin header and configured origins', () => {
    const validator = createCorsOriginValidator({
      allowAll: false,
      origins: ['http://localhost:3000'],
    });
    const callback = jest.fn();

    validator(undefined, callback);
    validator('http://localhost:3000', callback);

    expect(callback).toHaveBeenNthCalledWith(1, null, true);
    expect(callback).toHaveBeenNthCalledWith(2, null, true);
  });

  it('rejects origins outside the allow-list', () => {
    const validator = createCorsOriginValidator({
      allowAll: false,
      origins: ['http://localhost:3000'],
    });
    const callback = jest.fn();

    validator('http://evil.test', callback);

    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'CORS origin is not allowed: http://evil.test',
      }),
      false,
    );
  });
});
