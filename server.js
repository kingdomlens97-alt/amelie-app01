const express = require('express');
const cors = require('cors');
const MetaApi = require('metaapi.cloud-sdk').default;

const app = express();
app.use(cors());
app.use(express.json());

// Mets ton token ici après, on le sécurisera
const api = new MetaApi('COLLE TON TOKEN METAAPI ICI');

app.get('/', (req,res) => res.send('Amelie Tableau de bord OK'));

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

app.listen(10000, () => console.log('Serveur lancé'));
