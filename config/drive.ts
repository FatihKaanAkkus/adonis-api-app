import env from '#start/env';
import app from '@adonisjs/core/services/app';
import { defineConfig, services } from '@adonisjs/drive';

const driveConfig = defineConfig({
  default: env.get('DRIVE_DISK'),

  /**
   * The services object can be used to configure multiple file system
   * services each using the same or a different driver.
   */
  services: {
    fs: services.fs({
      location:
        env.get('NODE_ENV') === 'test'
          ? app.tmpPath('test_storage')
          : env.get('DRIVE_PATH', app.tmpPath('storage')),
      serveFiles: true,
      routeBasePath: '/files',
      visibility: 'public',
    }),
  },
});

export default driveConfig;

declare module '@adonisjs/drive/types' {
  export interface DriveDisks extends InferDriveDisks<typeof driveConfig> {}
}
