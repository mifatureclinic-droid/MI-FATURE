import mysql from 'mysql2/promise';

const FORGE_URL = process.env.BUILT_IN_FORGE_API_URL;
const FORGE_KEY = process.env.BUILT_IN_FORGE_API_KEY;

async function getPresignedUrl(key) {
  const r = await fetch(`${FORGE_URL}/v1/storage/presign/get?path=${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${FORGE_KEY}` }
  });
  const data = await r.json();
  return data.url;
}

async function uploadBytes(key, bytes, mime) {
  const r = await fetch(`${FORGE_URL}/v1/storage/presign/put?path=${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${FORGE_KEY}` }
  });
  const { url } = await r.json();
  const uploadR = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': mime },
    body: bytes
  });
  return uploadR.ok;
}

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  // Get all payments with spaces in comprovanteKey
  const [rows] = await conn.execute(
    "SELECT id, comprovanteKey, comprovanteUrl FROM pagamentos_atendimento WHERE comprovanteKey IS NOT NULL AND comprovanteKey LIKE '% %'"
  );
  
  console.log(`Found ${rows.length} comprovantes with spaces in filename`);
  
  for (const row of rows) {
    const oldKey = row.comprovanteKey;
    console.log(`Processing: ${oldKey}`);
    
    // Get presigned URL for old file
    const signedUrl = await getPresignedUrl(oldKey);
    
    // Download bytes using the raw URL (Node.js handles spaces)
    const r = await fetch(signedUrl);
    if (!r.ok) {
      console.error(`  Failed to download: HTTP ${r.status}`);
      continue;
    }
    const bytes = await r.arrayBuffer();
    const contentType = r.headers.get('content-type') || 'application/octet-stream';
    console.log(`  Downloaded ${bytes.byteLength} bytes, type: ${contentType}`);
    
    // Create new key with sanitized name
    const parts = oldKey.split('/');
    const filename = parts[parts.length - 1];
    const safeFilename = filename.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-');
    parts[parts.length - 1] = safeFilename;
    const newKey = parts.join('/');
    
    if (newKey === oldKey) {
      console.log(`  No spaces found, skipping`);
      continue;
    }
    
    console.log(`  New key: ${newKey}`);
    
    // Upload with new key
    const ok = await uploadBytes(newKey, bytes, contentType);
    if (!ok) {
      console.error(`  Failed to upload new file`);
      continue;
    }
    
    // Update database
    const newUrl = `/manus-storage/${newKey}`;
    await conn.execute(
      'UPDATE pagamentos_atendimento SET comprovanteKey = ?, comprovanteUrl = ? WHERE id = ?',
      [newKey, newUrl, row.id]
    );
    console.log(`  Updated DB: ${oldKey} -> ${newKey}`);
  }
  
  await conn.end();
  console.log('Done!');
}

main().catch(console.error);
