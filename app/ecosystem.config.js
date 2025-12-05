module.exports = {
  apps: [
    {
      name: 'studek-app',
      script: 'npm',
      args: 'start',
      cwd: '/root/studek-app/app',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
