import oracledb from 'oracledb';
import type {
    IExecuteFunctions,
    ICredentialTestFunctions,
    ILoadOptionsFunctions,
} from 'n8n-workflow';

export interface OracleCredentials {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
    connectionString?: string;
    ssl?: boolean;
}

export async function configureOracleDb(
    this: IExecuteFunctions | ICredentialTestFunctions | ILoadOptionsFunctions,
    credentials: OracleCredentials,
) {
    const connectString = credentials.connectionString || `${credentials.host}:${credentials.port}/${credentials.database}`;

    const connection = await oracledb.getConnection({
        user: credentials.user,
        password: credentials.password,
        connectString,
        ssl: credentials.ssl ? {} : undefined,
    });

    return connection;
}
