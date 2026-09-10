const fs = require('fs');
 
const token = process.env.TMDB_ACCESS_TOKEN;
 
if (!token) {
  console.error('❌ TMDB_ACCESS_TOKEN não está configurado nas Environment Variables da Vercel.');
  process.exit(1);
}
 
const content = `export const environment = {
  linkUrl: 'https://api.themoviedb.org/3',
  linkImageUrl: 'https://image.tmdb.org/t/p/w500',
  acessToken: '${token}',
};
`;
 
fs.writeFileSync('src/environments/environment.ts', content);
fs.writeFileSync('src/environments/environment.development.ts', content);
 
console.log('✅ environment.ts gerado com sucesso a partir da variável de ambiente.');