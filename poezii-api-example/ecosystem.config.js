module.exports = {
  apps: [{
    name: 'poezii-api',
    script: 'dist/server.js',
    instances: 2,                      // rulează 2 instanțe
    exec_mode: 'cluster',              // mod cluster pentru multiple core-uri
    watch: false,
    max_memory_restart: '512M',        // repornește dacă depășește 512MB
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: 'logs/err.log',
    out_file: 'logs/out.log',
    log_file: 'logs/combined.log',
    time: true
  }]
};