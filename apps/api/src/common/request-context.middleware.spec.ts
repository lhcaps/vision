import {
  REQUEST_ID_HEADER,
  requestContextMiddleware,
} from './request-context.middleware';

describe('requestContextMiddleware', () => {
  it('preserves a valid incoming request id', () => {
    const request = {
      headers: {
        [REQUEST_ID_HEADER]: 'req-existing-123',
      },
    };
    const response = {
      setHeader: jest.fn(),
    };
    const next = jest.fn();

    requestContextMiddleware(request as never, response as never, next);

    expect(request).toMatchObject({ requestId: 'req-existing-123' });
    expect(response.setHeader).toHaveBeenCalledWith(
      REQUEST_ID_HEADER,
      'req-existing-123',
    );
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('generates a request id when the incoming value is absent', () => {
    const request = { headers: {} };
    const response = { setHeader: jest.fn() };

    requestContextMiddleware(request as never, response as never, jest.fn());

    expect(request).toMatchObject({
      requestId: expect.stringMatching(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      ),
    });
  });

  it('replaces an invalid incoming request id', () => {
    const request = {
      headers: {
        [REQUEST_ID_HEADER]: 'invalid request id with spaces',
      },
    };
    const response = { setHeader: jest.fn() };

    requestContextMiddleware(request as never, response as never, jest.fn());

    expect(request).not.toMatchObject({
      requestId: 'invalid request id with spaces',
    });
  });
});
