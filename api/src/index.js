const express = require('express');
const cors = require('cors');
const bannersRouter = require('./routes/banners');
const evaluateRouter = require('./routes/evaluate');
const impressionsRouter = require('./routes/impressions');
const tenantsRouter = require('./routes/tenants');
const validateRouter = require('./routes/validate');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/banners', bannersRouter);
app.use('/api/evaluate', evaluateRouter);
app.use('/api/impressions', impressionsRouter);
app.use('/api/tenants', tenantsRouter);
app.use('/api/validate', validateRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'BannerOS API', version: '1.0.0' });
});

app.listen(PORT, () => {
  console.log(`BannerOS API running on http://localhost:${PORT}`);
});
