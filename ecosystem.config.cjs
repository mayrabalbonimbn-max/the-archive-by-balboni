module.exports = {
  apps: [
    {
      name: 'mayra-social-api',
      cwd: '/var/www/mayra-social/backend',
      script: 'src/server.js',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
}
