const sharp = require('sharp');
sharp('public/images/la-cabanne/hero-piscina-resort.png')
  .webp({ quality: 82 })
  .toFile('public/images/la-cabanne/hero-piscina-resort.webp')
  .then(() => {
    console.log('ok');
    process.exit(0);
  })
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
