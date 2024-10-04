import { DataSource } from './DataSource';
import { DataSourceType } from './DataSourceType';
import { SQLType } from './SQLType';

export interface AddDataInput {
  name: string;
  description?: string;
  path: string;
  connectionInfo?: { type: SQLType; database: string; port: number; username: string; password: string };
}
