export interface TestDBConnectionInput {
  type: string;
  url: string;
  database: string;
  port: string;
  secret?: string;
  username?: string;
  password?: string;
}
