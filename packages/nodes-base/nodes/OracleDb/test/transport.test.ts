import oracledb from 'oracledb';
import type { ICredentialTestFunctions } from 'n8n-workflow';

import { configureOracleDb } from '../transport';

jest.mock('oracledb');

describe('OracleDb transport', () => {
    const mockGetConnection = oracledb.getConnection as unknown as jest.Mock;

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('creates connection using connection string', async () => {
        const fakeConn = { close: jest.fn() };
        mockGetConnection.mockResolvedValue(fakeConn);

        const functions = {} as ICredentialTestFunctions;
        const creds = {
            host: 'localhost',
            port: 1521,
            database: 'xe',
            user: 'user',
            password: 'pass',
            connectionString: 'custom',
        };
        const conn = await configureOracleDb.call(functions, creds);
        expect(oracledb.getConnection).toHaveBeenCalledWith({
            user: 'user',
            password: 'pass',
            connectString: 'custom',
            ssl: undefined,
        });
        expect(conn).toBe(fakeConn);
    });
});
