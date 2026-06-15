module.exports = {
  apps: [
    {
      name: "monitoring-web",
      cwd: "/home/server/Reka/monitoring-app",
      script: "npm",
      args: "run start",
      env: {
        NODE_ENV: "production",
        PORT: "3002",
      },
    },
    {
      name: "monitoring-worker",
      cwd: "/home/server/Reka/monitoring-app",
      script: "npm",
      args: "run worker",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};