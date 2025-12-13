module.exports = {
  apps: [
    {
      name: 'adonis-api-app',
      script: './bin/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      env: {
        NODE_ENV: 'production',
        ENV_PATH: '/etc/secrets/adonis-api-app',
      },
    },
  ],
};
