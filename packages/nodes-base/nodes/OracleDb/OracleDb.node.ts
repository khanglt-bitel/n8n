import oracledb from 'oracledb';
import type {
    ICredentialDataDecryptedObject,
    ICredentialsDecrypted,
    ICredentialTestFunctions,
    IDataObject,
    IExecuteFunctions,
    INodeCredentialTestResult,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import { getResolvables } from '@utils/utilities';

import { configureOracleDb } from './transport';

export class OracleDb implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'Oracle DB',
        name: 'oracleDb',
        icon: 'file:oracle.svg',
        group: ['input'],
        version: 1,
        description: 'Execute queries on Oracle databases',
        defaults: {
            name: 'Oracle DB',
        },
        inputs: [NodeConnectionTypes.Main],
        outputs: [NodeConnectionTypes.Main],
        parameterPane: 'wide',
        credentials: [
            {
                name: 'oracleDb',
                required: true,
                testedBy: 'oracleDbConnectionTest',
            },
        ],
        properties: [
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                noDataExpression: true,
                options: [
                    {
                        name: 'Execute Query',
                        value: 'executeQuery',
                        description: 'Execute an SQL query',
                        action: 'Execute a SQL query',
                    },
                    {
                        name: 'Insert',
                        value: 'insert',
                        description: 'Insert rows in database',
                        action: 'Insert rows in database',
                    },
                    {
                        name: 'Update',
                        value: 'update',
                        description: 'Update rows in database',
                        action: 'Update rows in database',
                    },
                    {
                        name: 'Delete',
                        value: 'delete',
                        description: 'Delete rows in database',
                        action: 'Delete rows in database',
                    },
                ],
                default: 'executeQuery',
            },
            {
                displayName: 'Query',
                name: 'query',
                type: 'string',
                noDataExpression: true,
                typeOptions: {
                    editor: 'sqlEditor',
                    sqlDialect: 'Oracle',
                },
                displayOptions: {
                    show: {
                        operation: ['executeQuery'],
                    },
                },
                default: '',
                placeholder: 'SELECT * FROM mytable',
                required: true,
            },
            {
                displayName: 'Table',
                name: 'table',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: ['insert', 'update', 'delete'],
                    },
                },
                default: '',
                required: true,
                description: 'Name of the table to operate on',
            },
            {
                displayName: 'Columns',
                name: 'columns',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: ['insert', 'update'],
                    },
                },
                default: '',
                placeholder: 'id,name',
                description: 'Comma-separated list of columns',
            },
            {
                displayName: 'Update Key',
                name: 'updateKey',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: ['update'],
                    },
                },
                default: 'id',
                description: 'Property used to match rows for update',
            },
            {
                displayName: 'Delete Key',
                name: 'deleteKey',
                type: 'string',
                displayOptions: {
                    show: {
                        operation: ['delete'],
                    },
                },
                default: 'id',
                description: 'Property used to match rows for deletion',
            },
        ],
    };

    methods = {
        credentialTest: {
            async oracleDbConnectionTest(
                this: ICredentialTestFunctions,
                credential: ICredentialsDecrypted,
            ): Promise<INodeCredentialTestResult> {
                const credentials = credential.data as ICredentialDataDecryptedObject;
                try {
                    const connection = await configureOracleDb.call(this, credentials as any);
                    await connection.close();
                } catch (error) {
                    return {
                        status: 'Error',
                        message: (error as Error).message,
                    };
                }
                return {
                    status: 'OK',
                    message: 'Connection successful!',
                };
            },
        },
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const credentials = await this.getCredentials('oracleDb');
        const connection = await configureOracleDb.call(this, credentials as any);

        const items = this.getInputData();
        const operation = this.getNodeParameter('operation', 0);
        let returnItems: INodeExecutionData[] = [];

        try {
            if (operation === 'executeQuery') {
                for (let i = 0; i < items.length; i++) {
                    let query = this.getNodeParameter('query', i) as string;
                    for (const resolvable of getResolvables(query)) {
                        query = query.replace(resolvable, this.evaluateExpression(resolvable, i) as string);
                    }
                    const result = await connection.execute(query, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
                    if (result.rows) {
                        returnItems = returnItems.concat(
                            this.helpers.constructExecutionMetaData(
                                this.helpers.returnJsonArray(result.rows as unknown as IDataObject[]),
                                { itemData: { item: i } },
                            ),
                        );
                    }
                }
            } else if (operation === 'insert') {
                const table = this.getNodeParameter('table', 0) as string;
                const columnString = this.getNodeParameter('columns', 0) as string;
                const columns = columnString.split(',').map((c) => c.trim());
                const placeholders = columns.map((_, idx) => `:${idx + 1}`).join(',');
                const sql = `INSERT INTO ${table} (${columnString}) VALUES (${placeholders})`;
                for (let i = 0; i < items.length; i++) {
                    const values = columns.map((c) => items[i].json[c]);
                    await connection.execute(sql, values, { autoCommit: true });
                }
                returnItems = items;
            } else if (operation === 'update') {
                const table = this.getNodeParameter('table', 0) as string;
                const updateKey = this.getNodeParameter('updateKey', 0) as string;
                const columnString = this.getNodeParameter('columns', 0) as string;
                const columns = columnString.split(',').map((c) => c.trim());
                if (!columns.includes(updateKey)) columns.unshift(updateKey);
                const sets = columns
                    .filter((c) => c !== updateKey)
                    .map((c, idx) => `${c} = :${idx + 1}`)
                    .join(',');
                const sql = `UPDATE ${table} SET ${sets} WHERE ${updateKey} = :${columns.length}`;
                for (let i = 0; i < items.length; i++) {
                    const values = columns.map((c) => items[i].json[c]);
                    await connection.execute(sql, values, { autoCommit: true });
                }
                returnItems = items;
            } else if (operation === 'delete') {
                const table = this.getNodeParameter('table', 0) as string;
                const deleteKey = this.getNodeParameter('deleteKey', 0) as string;
                const sql = `DELETE FROM ${table} WHERE ${deleteKey} = :1`;
                for (let i = 0; i < items.length; i++) {
                    const value = items[i].json[deleteKey];
                    await connection.execute(sql, [value], { autoCommit: true });
                }
                returnItems = items;
            } else {
                throw new NodeOperationError(this.getNode(), `The operation "${operation}" is not supported!`);
            }
        } catch (error) {
            if (this.continueOnFail()) {
                returnItems = this.helpers.returnJsonArray({ error: (error as Error).message });
            } else {
                await connection.close();
                throw error;
            }
        }

        await connection.close();
        return [returnItems];
    }
}
