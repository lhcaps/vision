import {
  ConfigurationError,
  ConflictError,
  InfrastructureError,
  InvalidInputError,
  ResourceNotFoundError,
} from './application-error';

describe('ApplicationError', () => {
  it.each([
    [new InvalidInputError('INVALID_INPUT', 'Bad input'), 400],
    [new ResourceNotFoundError('FORM_NOT_FOUND', 'Missing form'), 404],
    [new ConflictError('FORM_CONFLICT', 'Conflict'), 409],
    [new ConfigurationError('CONFIGURATION_ERROR', 'Invalid config'), 500],
    [
      new InfrastructureError('CONTRACT_IO_ERROR', 'Contract store failed'),
      503,
    ],
  ])('stores a stable code and status', (error, expectedStatus) => {
    expect(error.code).toEqual(expect.any(String));
    expect(error.status).toBe(expectedStatus);
    expect(error.name).toBe(error.constructor.name);
  });

  it('preserves the original cause without exposing it in the message', () => {
    const cause = new Error('EACCES C:\\secret\\contracts');
    const error = new InfrastructureError(
      'CONTRACT_IO_ERROR',
      'Contract store is unavailable.',
      cause,
    );

    expect(error.cause).toBe(cause);
    expect(error.message).toBe('Contract store is unavailable.');
  });
});
