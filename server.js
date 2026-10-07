const express = require('express');
const cors = require('cors');
const MetaApi = require('metaapi.cloud-sdk').default;

const app = express();
app.use(cors());
app.use(express.json());

const METAAPI_TOKEN = process.env.METAAPI_TOKEN || 'COLLE TON TOKEN METAAPI ICI';
const api = new MetaApi(METAAPI_TOKEN);

let masters = {};
let priceAlerts = [];

app.get('/', (req,res) => res.send('Amelie App FINALE OK - 5 onglets'));

// 1. Tableau de bord
app.get('/dashboard/:accountId', async (req, res) => {
  try {
    const account = await api.metatraderAccountApi.getAccount(req.params.accountId);
    const connection = account.getRPCConnection();
    await connection.connect();
    await connection.waitSynchronized();
    const info = await connection.getAccountInformation();
    const positions = await connection.getPositions();
    res.json({ info, positions });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 2. Multiposition
app.post('/multi-sl-tp', async (req, res) => {
  const { accountId, sl, tp } = req.body;
  try {
    const account = await api.metatraderAccountApi.getAccount(accountId);
    const connection = account.getRPCConnection();
    await connection.connect();
    await connection.waitSynchronized();
    const positions = await connection.getPositions();
    for (let pos of positions) {
      await connection.updatePosition(pos.id, { stopLoss: parseFloat(sl), takeProfit: parseFloat(tp) });
    }
    res.json({ success: true, message: `${positions.length} positions modifiées` });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 3. Copy B
app.post('/become-master/:accountId', (req, res) => {
  masters[req.params.accountId] = masters[req.params.accountId] || [];
  res.json({ success: true, masters });
});
app.get('/list-masters', (req, res) => { res.json({ masters: Object.keys(masters) }); });
app.post('/copy-master', (req, res) => {
  const { masterId, followerId } = req.body;
  if (!masters[masterId]) masters[masterId] = [];
  if (!masters[masterId].includes(followerId)) masters[masterId].push(followerId);
  res.json({ success: true, message: `Tu copies ${masterId}`, masters });
});

// 4. Alerte Prix
app.post('/price-alert', (req, res) => {
  const { symbol, price, phone } = req.body;
  priceAlerts.push({ symbol, price: parseFloat(price), phone, id: Date.now() });
  res.json({ success: true, alerts: priceAlerts });
});
app.get('/price-alerts', (req, res) => { res.json({ alerts: priceAlerts }); });

// 5. PORTEFEUILLE - NOUVEAU
app.post('/portefeuille', async (req, res) => {
  const { accountIds } = req.body; // ["id1", "id2", "id3"]
  try {
    let totalBalance = 0;
    let totalEquity = 0;
    let allPositions = [];
    for (let id of accountIds) {
      const account = await api.metatraderAccountApi.getAccount(id);
      const connection = account.getRPCConnection();
      await connection.connect();
      await connection.waitSynchronized();
      const info = await connection.getAccountInformation();
      const positions = await connection.getPositions();
      totalBalance += info.balance;
      totalEquity += info.equity;
      allPositions = allPositions.concat(positions);
    }
    res.json({ totalBalance, totalEquity, totalPositions: allPositions.length, allPositions });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Amelie FINALE sur ${PORT}`));
