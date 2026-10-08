import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
 const env=loadEnv(mode, process.cwd(), 'VITE_');
 const apiOrigin=env.VITE_API_URL ? new URL(env.VITE_API_URL).origin : '';
 if(apiOrigin && !apiOrigin.startsWith('https://')) throw new Error('VITE_API_URL deve usar HTTPS na compilação de produção.');
 const policy=[
  "default-src 'self'", "script-src 'self'", "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com", "img-src 'self' https: data:",
  "frame-src https://maps.google.com https://www.google.com", `connect-src 'self' ${apiOrigin}`.trim(),
  "object-src 'none'", "base-uri 'none'", "form-action 'self'"
 ].join('; ');
 return {
  plugins:[{name:'production-security-policy', apply:'build', transformIndexHtml(){return [
   {tag:'meta',attrs:{'http-equiv':'Content-Security-Policy',content:policy},injectTo:'head-prepend'},
   {tag:'meta',attrs:{name:'referrer',content:'strict-origin-when-cross-origin'},injectTo:'head-prepend'}
  ];}}],
  server:{host:'127.0.0.1',proxy:{'/api':'http://127.0.0.1:3001'}},
  build:{outDir:'dist'}
 };
});
