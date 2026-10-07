const express = require('express');
const cors = require('cors');
const MetaApi = require('metaapi.cloud-sdk').default;

const app = express();
app.use(cors());
app.use(express.json());

const api = new MetaApi('COLLE TON TOKEN METAAPI ICI');

let masters = {};
let priceAlerts = []; // On stocke les alertes ici

app.get('/', (req,res) => res.send('Amelie Etape 4 Alertes OK'));

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

app.post('/become-master/:accountId', (req, res) => {
  masters[req.params.accountId] = masters[req.params.accountId] || [];
  res.json({ success: true, masters });
});
app.get('/list-masters', (req, res) => {
  res.json({ masters: Object.keys(masters) });
});
app.post('/copy-master', (req, res) => {
  const { masterId, followerId } = req.body;
  if (!masters[masterId]) masters[masterId] = [];
  if (!masters[masterId].includes(followerId)) masters[masterId].push(followerId);
  res.json({ success: true, message: `Tu copies ${masterId}`, masters });
});

// --- NOUVEAU : ALERTE PRIX ---
app.post('/price-alert', (req, res) => {
  const { symbol, price, phone } = req.body;
  priceAlerts.push({ symbol, price: parseFloat(price), phone, id: Date.now() });
  console.log(`Nouvelle alerte ${symbol} à ${price} pour ${phone}`);
  res.json({ success: true, message: `Alerte placée sur ${symbol} à ${price}`, alerts: priceAlerts });
});

app.get('/price-alerts', (req, res) => {
  res.json({ alerts: priceAlerts });
});

app.delete('/price-alert/:id', (req, res) => {
  priceAlerts = priceAlerts.filter(a => a.id != req.params.id);
  res.json({ success: true, alerts: priceAlerts });
});

app.listen(10000, () => console.log('Serveur Etape 4 lancé'));
