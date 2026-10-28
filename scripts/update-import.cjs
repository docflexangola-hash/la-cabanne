const fs = require('fs');
let s = fs.readFileSync('scripts/import-menu.mjs','utf8');
s = s.replace("      serves: item.serves,\n      status: 'draft',\n      variantGroups", "      serves: item.serves,\n      status: 'published',\n      published_at: new Date().toISOString(),\n      variantGroups");
s = s.replace("        serves,\n        status: 'draft'\n      });", "        serves,\n        status: 'published',\n        published_at: new Date().toISOString()\n      });");
fs.writeFileSync('scripts/import-menu.mjs', s);
console.log('done');
