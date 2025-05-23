import oracledb from 'oracledb';
import { mock } from 'jest-mock-extended';
import type { ICredentialDataDecryptedObject, ICredentialTestFunctions } from 'n8n-workflow';

import { OracleDb } from '../OracleDb.node';

jest.mock('../transport', () => ({
    configureOracleDb: jest.fn(),
}));

const { configureOracleDb } = jest.requireMock('../transport');

describe('OracleDb node credential test', () => {
    it('returns OK on successful connection', async () => {
        const fakeConn = { close: jest.fn() };
        configureOracleDb.mockResolvedValue(fakeConn);
        const functions = mock<ICredentialTestFunctions>();
        const credential = { data: {} as ICredentialDataDecryptedObject } as any;

        const node = new OracleDb();
        const result = await node.methods.credentialTest.oracleDbConnectionTest.call(functions, credential);

        expect(configureOracleDb).toHaveBeenCalled();
        expect(fakeConn.close).toHaveBeenCalled();
        expect(result).toEqual({ status: 'OK', message: 'Connection successful!' });
    });

    it('returns error on failure', async () => {
        configureOracleDb.mockRejectedValue(new Error('fail'));
        const functions = mock<ICredentialTestFunctions>();
        const credential = { data: {} as ICredentialDataDecryptedObject } as any;

        const node = new OracleDb();
        const result = await node.methods.credentialTest.oracleDbConnectionTest.call(functions, credential);

        expect(result.status).toBe('Error');
    });
});
