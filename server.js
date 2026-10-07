const express = require('express');
const cors = require('cors');
const MetaApi = require('metaapi.cloud-sdk').default;

const app = express();
app.use(cors());
app.use(express.json());

const api = new MetaApi('COLLE TON TOKEN METAAPI ICI');

app.get('/', (req,res) => res.send('Amelie Etape 2 OK'));

// ANCIENNE ROUTE - Tableau de bord
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

// NOUVELLE ROUTE - Multiposition SL/TP en 1 clic
app.post('/multi-sl-tp', async (req, res) => {
  const { accountId, sl, tp } = req.body;
  console.log(`Demande de placer SL:${sl} TP:${tp} sur compte ${accountId}`);
  try {
    const account = await api.metatraderAccountApi.getAccount(accountId);
    const connection = account.getRPCConnection();
    await connection.connect();
    await connection.waitSynchronized();
    const positions = await connection.getPositions();
    
    for (let pos of positions) {
      await connection.updatePosition(pos.id, { 
        stopLoss: parseFloat(sl), 
        takeProfit: parseFloat(tp) 
      });
    }
    res.json({ success: true, message: `Fait! ${positions.length} positions modifiées` });
  } catch (e) { 
    res.status(500).json({ error: e.message }); 
  }
});

app.listen(10000, () => console.log('Serveur Etape 2 lancé'));
