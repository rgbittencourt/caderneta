const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const readerSource = fs.readFileSync(path.join(root, 'leitor.js'), 'utf8');

function between(source, start, end) {
  const a = source.indexOf(start);
  const b = source.indexOf(end, a + start.length);
  assert.notEqual(a, -1, `marcador inicial não encontrado: ${start}`);
  assert.notEqual(b, -1, `marcador final não encontrado: ${end}`);
  return source.slice(a, b);
}

const testContext = {
  S: { cfg: { accounts: [], cards: [], categories: [] }, months: {} },
  DEFAULTS: () => ({}),
  saveCfg() {},
  saveMonth() {},
};
const extracted = [
  between(app, 'function parseCentsInput(', '/* ---- datas ---- */'),
  between(app, 'function parseCsvRows(text){', 'function copyText('),
  between(app, 'const cloneJSON=x=>', '/* ---- contas usadas neste aparelho ---- */'),
  between(app, 'function validSnapshot(d){', 'function snapshotData(d){'),
  between(app, 'function juntarContas(deId,paraId){', '/* a mesma aplicação em duas contas'),
].join('\n\n');
vm.runInNewContext(
  `${extracted}\nthis.api={parseCentsInput,toCents,parseCsvRows,parseStatement,mergeCfg,mergeData,validSnapshot,juntarContas};`,
  testContext,
  { filename: 'index-regression-extract.js' },
);
const api = testContext.api;
const plain = (value) => JSON.parse(JSON.stringify(value));

async function runTwoDeviceSync() {
  const base = baseConfig();
  base.seen = true;
  const localCfg = structuredClone(base);
  localCfg.u = 3;
  localCfg.cats[0].n = 'Alimentação local';
  const remoteCfg = structuredClone(base);
  remoteCfg.u = 2;
  remoteCfg.cats[1].n = 'Transporte remoto';
  const snapshot = (cfg, months) => ({ app: 'caderneta', cfg, cfgBase: base, months });
  const drive = new Map([
    ['main', { id: 'main', name: 'caderneta-dados.json', data: snapshot(base, {}) }],
    ['replica-a', { id: 'replica-a', name: 'caderneta-replica-device-a.json', data: snapshot(remoteCfg, {
      '2026-01': { tx: { remote: { id: 'remote', v: 2000, u: 2 } } },
    }) }],
  ]);
  let nextId = 0;
  const S = {
    user: { id: 'g:synthetic', kind: 'google', email: 'test@example.test' },
    cfg: localCfg,
    cfgBase: base,
    months: { '2026-01': { tx: { local: { id: 'local', v: 1000, u: 3 } } } },
    deviceId: 'device-b',
    localCorrupt: false,
    sync: {},
    dirty: true,
    snap: null,
  };
  const copy = (value) => JSON.parse(JSON.stringify(value));
  const context = {
    S,
    syncing: false,
    syncAgain: false,
    navigator: { onLine: true, locks: null },
    tokenOk: () => true,
    renderSyncBadge() {},
    ensureFolder: async () => 'folder',
    findFile: async (name) => {
      const file = [...drive.values()].find((x) => x.name === name);
      return file ? { id: file.id, name: file.name } : null;
    },
    listReplicaFiles: async () => [...drive.values()]
      .filter((x) => x.name.startsWith('caderneta-replica-'))
      .map(({ id, name }) => ({ id, name })),
    readJson: async (id) => copy(drive.get(id).data),
    writeJson: async (name, parent, data, id) => {
      const current = id && drive.get(id);
      if (current) {
        current.data = copy(data);
        return id;
      }
      const created = `file-${++nextId}`;
      drive.set(created, { id: created, name, data: copy(data) });
      return created;
    },
    DEFAULTS: () => ({}),
    todayISO: () => '2026-01-15',
    ymOf: () => '2026-01',
    migrarCfg() {},
    garantirSalario() {},
    garantirNomeCompleto() {},
    safeRender() {},
    saveLocal() {},
    setTimeout: () => 0,
  };
  const code = [
    between(app, 'const cloneJSON=x=>', '/* ---- contas usadas neste aparelho ---- */'),
    between(app, 'function replicaDeviceId(){', 'function validSnapshot(d){'),
    between(app, 'function validSnapshot(d){', 'function snapshotData(d){'),
    between(app, 'function snapshotData(d){', 'function sameSnapshot(a,b){'),
    between(app, 'function sameSnapshot(a,b){', '/* ---- sincronização ---- */'),
    between(app, 'async function syncNow(){', 'function safeRender('),
  ].join('\n\n');
  vm.runInNewContext(`${code}\nthis.runSync=syncNowUnlocked;`, context, { filename: 'sync-regression-extract.js' });
  await context.runSync('g:synthetic');
  return { drive, state: plain(S) };
}

function baseConfig() {
  return {
    u: 1,
    cats: [
      { id: 'food', n: 'Alimentação', limit: 0 },
      { id: 'transit', n: 'Transporte', limit: 0 },
    ],
    cards: [{ id: 'card-1', n: 'Cartão', close: 10 }],
    accounts: [{ id: 'account-1', n: 'Conta', open: 10000, openDate: '2026-01-01' }],
    kwCat: { mercado: 'food' },
  };
}

test('sincronização real simulada preserva réplicas e combina alterações de dois aparelhos', async () => {
  const { drive, state } = await runTwoDeviceSync();
  const main = plain(drive.get('main').data);
  const replicaB = [...drive.values()].find((x) => x.name === 'caderneta-replica-device-b.json');
  assert.ok(replicaB, 'a réplica do segundo aparelho foi criada');
  assert.equal(main.cfg.cats.find((x) => x.id === 'food').n, 'Alimentação local');
  assert.equal(main.cfg.cats.find((x) => x.id === 'transit').n, 'Transporte remoto');
  assert.deepEqual(Object.keys(main.months['2026-01'].tx).sort(), ['local', 'remote']);
  assert.deepEqual(Object.keys(plain(replicaB.data).months['2026-01'].tx).sort(), ['local', 'remote']);
  assert.equal(state.sync.state, 'ok');
});

test('merge de configurações combina alterações independentes e resolve conflito pela revisão mais nova', () => {
  const base = baseConfig();
  const local = structuredClone(base);
  const remote = structuredClone(base);
  local.u = 10;
  local.cats[0].n = 'Mercado e alimentação';
  local.kwCat.padaria = 'food';
  remote.u = 20;
  remote.cats[1].limit = 50000;
  remote.cards[0].close = 12;

  const merged = plain(api.mergeCfg(base, local, remote));
  assert.equal(merged.cats.find((x) => x.id === 'food').n, 'Mercado e alimentação');
  assert.equal(merged.cats.find((x) => x.id === 'transit').limit, 50000);
  assert.equal(merged.cards[0].close, 12);
  assert.equal(merged.kwCat.padaria, 'food');
  assert.equal(merged.u, 20);

  const conflictLocal = structuredClone(base);
  const conflictRemote = structuredClone(base);
  conflictLocal.u = 30;
  conflictRemote.u = 40;
  conflictLocal.cards[0].n = 'Nome local';
  conflictRemote.cards[0].n = 'Nome remoto';
  assert.equal(plain(api.mergeCfg(base, conflictLocal, conflictRemote)).cards[0].n, 'Nome remoto');
});

test('merge respeita remoção local e preserva lançamentos/tombstones independentes', () => {
  const baseCfg = baseConfig();
  const localCfg = structuredClone(baseCfg);
  const remoteCfg = structuredClone(baseCfg);
  localCfg.u = 5;
  localCfg.cats = localCfg.cats.filter((x) => x.id !== 'food');
  remoteCfg.u = 4;
  const cfg = plain(api.mergeCfg(baseCfg, localCfg, remoteCfg));
  assert.equal(cfg.cats.some((x) => x.id === 'food'), false);

  const base = {
    cfg: baseCfg,
    months: { '2026-01': { tx: {
      keep: { id: 'keep', v: 1000, u: 1 },
      removed: { id: 'removed', del: 1, u: 2 },
    } } },
  };
  const local = {
    cfg: localCfg,
    months: { '2026-01': { tx: {
      keep: { id: 'keep', v: 1200, u: 3 },
      removed: { id: 'removed', del: 1, u: 2 },
      local: { id: 'local', v: 250, u: 3 },
    } } },
  };
  const remote = {
    cfg: remoteCfg,
    months: { '2026-01': { tx: {
      keep: { id: 'keep', v: 1000, u: 1 },
      removed: { id: 'removed', del: 1, u: 2 },
      remote: { id: 'remote', v: 350, u: 4 },
    } } },
  };
  const merged = plain(api.mergeData(local, remote, baseCfg));
  const tx = merged.months['2026-01'].tx;
  assert.equal(tx.keep.v, 1200);
  assert.equal(tx.removed.del, 1);
  assert.equal(tx.local.v, 250);
  assert.equal(tx.remote.v, 350);
});

test('validação monetária aceita formatos suportados e rejeita entradas ambíguas/inválidas', () => {
  assert.deepEqual(plain(api.parseCentsInput('1.234,56')), { ok: true, cents: 123456 });
  assert.deepEqual(plain(api.parseCentsInput('12.5')), { ok: true, cents: 1250 });
  assert.deepEqual(plain(api.parseCentsInput('-50,00')), { ok: true, cents: -5000 });
  assert.deepEqual(plain(api.parseCentsInput('0')), { ok: true, cents: 0 });
  assert.equal(api.parseCentsInput('12,345').ok, false);
  assert.equal(api.parseCentsInput('12abc').ok, false);
  assert.deepEqual(plain(api.parseCentsInput('')), { ok: true, cents: 0 });
});

test('CSV interpreta delimitadores, aspas escapadas, vírgulas e decimais localizados', () => {
  const csv = [
    'Data,Descrição,Valor',
    '01/02/2026,"Mercado, caixa 2","-25,50"',
    '02/02/2026,"Café ""do Zé"", Centro","12,34"',
  ].join('\n');
  const rows = api.parseCsvRows(csv);
  assert.equal(rows.length, 3);
  assert.equal(rows[1][1], 'Mercado, caixa 2');
  assert.equal(rows[2][1], 'Café "do Zé", Centro');
  const statement = plain(api.parseStatement(csv, 'both'));
  assert.equal(statement.length, 2);
  assert.equal(statement[0].v, 2550);
  assert.equal(statement[0].k, 'g');
  assert.equal(statement[0].desc, 'Mercado, caixa 2');
  assert.equal(statement[1].v, 1234);

  const semicolon = 'Data;Descrição;Valor\n03/02/2026;"Loja; unidade 2";1.234,56';
  const semicolonRows = api.parseCsvRows(semicolon);
  assert.equal(semicolonRows[1][1], 'Loja; unidade 2');
  assert.equal(plain(api.parseStatement(semicolon, 'both'))[0].v, 123456);
});

test('datas impossíveis são descartadas e datas válidas de ano bissexto são aceitas', () => {
  global.window = {};
  global.document = {};
  require(path.join(root, 'leitor.js'));
  const reader = global.window.Leitor;
  const valid = reader.lerLancamentos('Data Descrição Valor\n29/02/2024 Mercado R$ 10,00', 'fatura', '2024-02');
  const invalidLeapDay = reader.lerLancamentos('Data Descrição Valor\n29/02/2025 Mercado R$ 10,00', 'fatura', '2025-02');
  const invalidMonthDay = reader.lerLancamentos('Data Descrição Valor\n31/02/2026 Mercado R$ 10,00', 'fatura', '2026-02');
  assert.equal(valid.linhas.length, 1);
  assert.equal(valid.linhas[0].d, '2024-02-29');
  assert.equal(invalidLeapDay.linhas.length, 0);
  assert.equal(invalidMonthDay.linhas.length, 0);
});

test('Bradesco sem saldo inicial reconhecido não infere lançamentos', () => {
  global.window = global.window || {};
  global.document = global.document || {};
  require(path.join(root, 'leitor.js'));
  const reader = global.window.Leitor;
  const text = [
    'Bradesco Celular',
    'Extrato de: Agência 0001',
    'Histórico Docto',
    'PIX ENVIADO',
    '02/03/2026 123 20,00 980,00',
    'DES: TESTE SEM DADOS PESSOAIS',
  ].join('\n');
  const result = reader.lerLancamentos(text, 'extrato', '2026-03');
  assert.equal(result.linhas.length, 0);
  assert.match(result.erro, /saldo anterior conhecido/i);
});

test('leitor de PDF percorre todas as 16 páginas', async () => {
  global.window = global.window || {};
  global.document = {
    createElement() { return {}; },
    head: { appendChild(script) { script.onload(); } },
  };
  const pages = 16;
  global.window.pdfjsLib = {
    GlobalWorkerOptions: {},
    getDocument() {
      return {
        promise: Promise.resolve({
          numPages: pages,
          async getPage(number) {
            return {
              getTextContent: async () => ({ items: [{
                str: `PÁGINA ${String(number).padStart(2, '0')} com conteúdo de texto suficiente para dispensar OCR.`,
                transform: [1, 0, 0, 10, 0, 100],
                width: 300,
              }] }),
            };
          },
        }),
      };
    },
  };
  require(path.join(root, 'leitor.js'));
  const reader = global.window.Leitor;
  const pdf = { type: 'application/pdf', name: 'synthetic-16-pages.pdf', arrayBuffer: async () => new ArrayBuffer(1) };
  const result = await reader.ler(pdf, { tipo: 'cupom' });
  assert.match(result.texto, /PÁGINA 01/);
  assert.match(result.texto, /PÁGINA 16/);
  assert.equal((result.texto.match(/PÁGINA \d\d/g) || []).length, pages);
});

test('contas com datas de saldo inicial incompatíveis não podem ser unidas', () => {
  const original = {
    accounts: [
      { id: 'a', n: 'Conta A', opening: 1000, openDate: '2026-01-01' },
      { id: 'b', n: 'Conta B', opening: 2000, openDate: '2026-02-01' },
    ],
    cards: [],
  };
  testContext.S = { cfg: structuredClone(original), months: {} };
  assert.equal(api.juntarContas('a', 'b'), -2);
  assert.deepEqual(plain(testContext.S.cfg.accounts), original.accounts);
});

test('contas com a mesma data de saldo inicial podem ser unidas sem mudar a linha de base', () => {
  testContext.S = {
    cfg: { accounts: [
      { id: 'a', n: 'Conta A', opening: 1200, openDate: '2026-01-01' },
      { id: 'b', n: 'Conta B', opening: 800, openDate: '2026-01-01' },
    ], cards: [] },
    months: { '2026-01': { tx: { tx1: { id: 'tx1', acct: 'a', v: 500, u: 1 } } } },
  };
  assert.equal(api.juntarContas('a', 'b'), 1);
  assert.deepEqual(plain(testContext.S.cfg.accounts), [
    { id: 'b', n: 'Conta B', opening: 2000, openDate: '2026-01-01' },
  ]);
  assert.equal(testContext.S.months['2026-01'].tx.tx1.acct, 'b');
});

test('snapshot inválido é rejeitado', () => {
  assert.equal(api.validSnapshot({ app: 'caderneta', cfg: {}, months: {} }), true);
  assert.equal(api.validSnapshot({ app: 'caderneta', cfg: null, months: {} }), false);
  assert.equal(api.validSnapshot({ app: 'caderneta', cfg: {}, months: [] }), false);
  assert.equal(api.validSnapshot(null), false);
});
