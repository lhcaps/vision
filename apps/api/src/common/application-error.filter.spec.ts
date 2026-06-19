import { ArgumentsHost, HttpException, Logger } from '@nestjs/common';
import { InfrastructureError } from './application-error';
import { ApplicationErrorFilter } from './application-error.filter';

describe('ApplicationErrorFilter', () => {
  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function createHost() {
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const response = { status };
    const request = {
      requestId: 'req-123',
      originalUrl: '/api/v1/forms/catalog',
      method: 'GET',
    };
    const host = {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    } as ArgumentsHost;

    return { host, json, status };
  }

  it('maps an application error to a stable public response', () => {
    const { host, json, status } = createHost();
    const filter = new ApplicationErrorFilter();

    filter.catch(
      new InfrastructureError(
        'CONTRACT_IO_ERROR',
        'Contract store unavailable.',
      ),
      host,
    );

    expect(status).toHaveBeenCalledWith(503);
    expect(json).toHaveBeenCalledWith({
      statusCode: 503,
      code: 'CONTRACT_IO_ERROR',
      message: 'Contract store unavailable.',
      requestId: 'req-123',
      timestamp: expect.any(String),
      path: '/api/v1/forms/catalog',
    });
  });

  it('keeps Nest HTTP status and public message', () => {
    const { host, json, status } = createHost();
    const filter = new ApplicationErrorFilter();

    filter.catch(new HttpException('Not allowed.', 403), host);

    expect(status).toHaveBeenCalledWith(403);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 403,
        code: 'HTTP_ERROR',
        message: 'Not allowed.',
      }),
    );
  });

  it('hides internal exception details from unexpected errors', () => {
    const { host, json, status } = createHost();
    const filter = new ApplicationErrorFilter();

    filter.catch(new Error('EACCES C:\\secret\\contracts'), host);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'INTERNAL_ERROR',
        message: 'Internal server error.',
      }),
    );
    expect(json.mock.calls[0][0]).not.toHaveProperty('stack');
  });
});
