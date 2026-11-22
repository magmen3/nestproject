import { DataSourceOptions } from 'typeorm';

export function createDatabaseOptions(
  environment: NodeJS.ProcessEnv,
): DataSourceOptions {
  return {
    type: 'postgres',
    host: environment.DB_HOST,
    port: Number(environment.DB_PORT),
    username: environment.DB_USER,
    password: environment.DB_PASSWORD,
    database: environment.DB_NAME,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/migrations/*{.ts,.js}'],
    synchronize: false,
  };
}
