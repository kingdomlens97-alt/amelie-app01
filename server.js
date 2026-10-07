const express = require('express');
const cors = require('cors');
const MetaApi = require('metaapi.cloud-sdk').default;

const app = express();
app.use(cors());
app.use(express.json());

const api = new MetaApi('COLLE TON TOKEN METAAPI ICI');

// On stocke qui copie qui (après on mettra en base de données)
let masters = {}; // { masterId: [followerId1, followerId2] }

app.get('/', (req,res) => res.send('Amelie Etape 3 Copy B OK'));

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

// --- NOUVEAU : COPY TRADING B ---
app.post('/become-master/:accountId', (req, res) => {
  masters[req.params.accountId] = masters[req.params.accountId] || [];
  console.log(`${req.params.accountId} est devenu Master`);
  res.json({ success: true, masters });
});

app.get('/list-masters', (req, res) => {
  res.json({ masters: Object.keys(masters) });
});

app.post('/copy-master', (req, res) => {
  const { masterId, followerId } = req.body;
  if (!masters[masterId]) masters[masterId] = [];
  if (!masters[masterId].includes(followerId)) {
    masters[masterId].push(followerId);
  }
  res.json({ success: true, message: `Tu copies ${masterId}`, masters });
});

app.listen(10000, () => console.log('Serveur Etape 3 Copy B lancé'));
