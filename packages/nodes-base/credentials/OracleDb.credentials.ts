import type { ICredentialType, INodeProperties } from 'n8n-workflow';

import { sshTunnelProperties } from '@utils/sshTunnel.properties';

export class OracleDb implements ICredentialType {
    name = 'oracleDb';
    displayName = 'Oracle DB';
    documentationUrl = 'oracleDb';
    properties: INodeProperties[] = [
        {
            displayName: 'Host',
            name: 'host',
            type: 'string',
            default: 'localhost',
        },
        {
            displayName: 'Port',
            name: 'port',
            type: 'number',
            default: 1521,
        },
        {
            displayName: 'Database',
            name: 'database',
            type: 'string',
            default: '',
        },
        {
            displayName: 'User',
            name: 'user',
            type: 'string',
            default: 'system',
        },
        {
            displayName: 'Password',
            name: 'password',
            type: 'string',
            typeOptions: {
                password: true,
            },
            default: '',
        },
        {
            displayName: 'Connection String',
            name: 'connectionString',
            type: 'string',
            default: '',
            description: 'Optional Oracle connection string. Overrides host, port and database',
        },
        {
            displayName: 'Use SSL',
            name: 'ssl',
            type: 'boolean',
            default: false,
        },
        ...sshTunnelProperties,
    ];
}
