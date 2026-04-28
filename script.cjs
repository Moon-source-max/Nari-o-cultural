const fs = require('fs');
const path = require('path');
const oldDir = 'public/icons/ICONOS NARIÑO CULTURAL';
const newDir = 'public/icons/nari-cultural';
if (fs.existsSync(oldDir)) {
  fs.renameSync(oldDir, newDir);
}
const files = fs.readdirSync(newDir);
for (const file of files) {
  // also handle "NARIÑO" and "nariño" and accents if any
  const newName = file
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
    .toLowerCase()
    .replace(/\s+/g, '-');
  if (file !== newName) {
    fs.renameSync(path.join(newDir, file), path.join(newDir, newName));
  }
}
