import env from '#start/env';
import app from '@adonisjs/core/services/app';
import { defineConfig } from '@adonisjs/lucid';

const dbConfig = defineConfig({
  connection: 'sqlite',
  connections: {
    sqlite: {
      client: 'better-sqlite3',
      connection: {
        filename:
          env.get('NODE_ENV') === 'test'
            ? app.tmpPath('test_db.sqlite3')
            : env.get('DB_PATH', app.tmpPath('db.sqlite3')),
      },
      useNullAsDefault: true,
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
    },
  },
});

export default dbConfig;
