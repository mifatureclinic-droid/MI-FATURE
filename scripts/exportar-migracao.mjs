import { createConnection } from "mysql2/promise";
import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";

const projectRoot = "/home/ubuntu/mifature-portal";
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const exportRoot = `/home/ubuntu/migration_exports/mifature-migration-${timestamp}`;
const sourceRoot = path.join(exportRoot, "codigo-fonte");
const databaseRoot = path.join(exportRoot, "banco-de-dados");
const tablesRoot = path.join(databaseRoot, "tabelas-json");
const localAssetsRoot = path.join(exportRoot, "arquivos-estaticos-locais");

const excludedTables = new Set([
  "__drizzle_migrations",
  "bradescoCredenciais",
  "geapCredenciais",
]);

function quoteIdentifier(identifier) {
  return `\`${identifier.replaceAll("`", "``")}\``;
}

function serialise(value) {
  return JSON.stringify(value, (_key, nestedValue) => {
    if (typeof nestedValue === "bigint") return nestedValue.toString();
    if (Buffer.isBuffer(nestedValue)) return { encoding: "base64", value: nestedValue.toString("base64") };
    return nestedValue;
  }, 2);
}

async function sha256(filePath) {
  const bytes = await readFile(filePath);
  return createHash("sha256").update(bytes).digest("hex");
}

async function scanForHostedFileReferences(directory) {
  const references = new Set();
  const queue = [directory];
  const urlPattern = /(?:https?:\/\/[^\s"'`<>]+|\/manus-storage\/[^\s"'`<>]+)/g;

  while (queue.length > 0) {
    const current = queue.pop();
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const filePath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        queue.push(filePath);
        continue;
      }
      if (!entry.isFile()) continue;
      try {
        const content = await readFile(filePath, "utf8");
        for (const match of content.matchAll(urlPattern)) {
          if (match[0].includes("manus-storage")) references.add(match[0]);
        }
      } catch {
        // Arquivos binários não precisam ser inspecionados para esta lista.
      }
    }
  }
  return [...references].sort();
}

await rm(exportRoot, { recursive: true, force: true });
await mkdir(tablesRoot, { recursive: true });

await cp(projectRoot, sourceRoot, {
  recursive: true,
  filter: source => {
    const relative = path.relative(projectRoot, source);
    if (!relative) return true;
    const parts = relative.split(path.sep);
    const blockedDirectories = new Set(["node_modules", "dist", ".git", ".manus-logs", "coverage", ".pnpm-store"]);
    if (parts.some(part => blockedDirectories.has(part))) return false;
    if (parts[0] === "scripts" && parts[1] === "exportar-migracao.mjs") return false;
    const filename = parts.at(-1) ?? "";
    if (filename.startsWith(".env") || filename === "tsconfig.tsbuildinfo") return false;
    return true;
  },
});

try {
  await cp("/home/ubuntu/webdev-static-assets", localAssetsRoot, { recursive: true });
} catch {
  await mkdir(localAssetsRoot, { recursive: true });
}

const connection = await createConnection(process.env.DATABASE_URL);
try {
  const [tableRows] = await connection.query(
    "SELECT TABLE_NAME AS tableName FROM information_schema.tables WHERE table_schema = DATABASE() AND TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME",
  );
  const tables = tableRows.map(row => row.tableName);
  const exportedTables = [];
  const schemas = [];

  for (const tableName of tables) {
    if (excludedTables.has(tableName)) continue;
    const [[createRow]] = await connection.query(`SHOW CREATE TABLE ${quoteIdentifier(tableName)}`);
    const createStatement = createRow["Create Table"];
    schemas.push(`${createStatement};\n`);

    const [rows] = await connection.query(`SELECT * FROM ${quoteIdentifier(tableName)}`);
    const tableFile = path.join(tablesRoot, `${tableName}.json`);
    await writeFile(tableFile, serialise(rows));
    exportedTables.push({
      table: tableName,
      rows: rows.length,
      file: `tabelas-json/${tableName}.json`,
      sha256: await sha256(tableFile),
    });
  }

  await writeFile(path.join(databaseRoot, "schema.sql"), schemas.join("\n"));
  const hostedFileReferences = await scanForHostedFileReferences(exportRoot);
  await writeFile(
    path.join(exportRoot, "referencias_arquivos_hospedados.txt"),
    hostedFileReferences.length > 0
      ? `${hostedFileReferences.join("\n")}\n`
      : "Nenhuma referência a /manus-storage foi localizada nos arquivos exportados.\n",
  );
  await writeFile(path.join(exportRoot, "README_MIGRACAO.md"), `# Pacote de Migração — Portal MIFATURE / Clínica CLIPSI

Este pacote é um retrato técnico gerado em ${new Date().toISOString()}.

## Conteúdo

- \`codigo-fonte/\`: aplicação React, servidor Express/tRPC, esquema Drizzle e scripts de build.
- \`banco-de-dados/schema.sql\`: estrutura SQL das tabelas exportadas.
- \`banco-de-dados/tabelas-json/\`: dados por tabela em JSON UTF-8.
- \`arquivos-estaticos-locais/\`: ativos locais usados pelo projeto, quando disponíveis.
- \`referencias_arquivos_hospedados.txt\`: URLs de arquivos gerenciados que devem ser migrados para o armazenamento de destino.
- \`migration_manifest.json\`: contagens e hashes SHA-256 de integridade.

## Itens deliberadamente não incluídos

As tabelas de credenciais de operadoras foram excluídas deste pacote por conterem segredos de integração. Configure credenciais novas no sistema de destino. Arquivos hospedados em armazenamento gerenciado, domínios, segredos de ambiente e serviços fornecidos pela plataforma também exigem um backup oficial separado.

## Como importar

1. Crie uma base MySQL compatível e execute \`banco-de-dados/schema.sql\`.
2. Importe os arquivos JSON de cada tabela preservando os nomes de colunas e os identificadores.
3. Migre os arquivos apontados por URLs de armazenamento antes de colocar o novo sistema em produção.
4. Configure novas credenciais, e-mail, mensageria, autenticação e pagamentos no ambiente de destino.

> Este pacote é uma exportação pontual. Alterações feitas após o horário de geração não estarão incluídas.
`);

  const sourcePackageJson = await stat(path.join(sourceRoot, "package.json"));
  const manifest = {
    product: "MIFATURE / Clínica CLIPSI",
    generatedAt: new Date().toISOString(),
    source: {
      path: "codigo-fonte",
      packageJsonBytes: sourcePackageJson.size,
    },
    database: {
      exportedTables,
      excludedTables: Array.from(excludedTables).filter(table => tables.includes(table)),
      schemaFile: "banco-de-dados/schema.sql",
    },
    hostedFileReferences: {
      count: hostedFileReferences.length,
      file: "referencias_arquivos_hospedados.txt",
    },
    limitations: [
      "A exportação é pontual e não sincroniza mudanças posteriores.",
      "Arquivos hospedados, domínios, segredos e integrações da plataforma exigem o backup oficial separado.",
      "Credenciais de operadoras foram excluídas para não transportar segredos em um arquivo não criptografado.",
    ],
  };
  await writeFile(path.join(exportRoot, "migration_manifest.json"), serialise(manifest));
  console.log(JSON.stringify({ exportRoot, exportedTables: exportedTables.length, excludedTables: manifest.database.excludedTables }, null, 2));
} finally {
  await connection.end();
}
