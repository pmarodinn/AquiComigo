require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
const { v4: uuidv4 } = require('uuid');
const db = require('./database');

const app = express();
const port = process.env.PORT || 3000;

// Configuração do Mercado Pago
const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN 
});

app.use(express.json());
app.use(cors());

// Rota de Teste
app.get('/', (req, res) => {
  res.send('API AquiComigo operando 🚀');
});

// Listar Produtos
app.get('/api/products', (req, res) => {
  db.all('SELECT * FROM products', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Criar Preferência de Pagamento
app.post('/api/create_preference', async (req, res) => {
  const { productId, payer } = req.body;

  if (!productId) {
    return res.status(400).json({ error: 'Produto não especificado' });
  }

  // Buscar produto no banco (Segurança: backend define o preço)
  db.get('SELECT * FROM products WHERE id = ?', [productId], async (err, product) => {
    if (err) {
      return res.status(500).json({ error: 'Erro no banco de dados' });
    }
    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    try {
      const orderId = uuidv4();
      const preference = new Preference(client);

      // Divide o nome completo em nome e sobrenome
      const [name, ...surnameParts] = payer && payer.name ? payer.name.split(' ') : ['Cliente', 'Anônimo'];
      const surname = surnameParts.join(' ') || '';

      const body = {
        items: [
          {
            id: product.id,
            title: product.title,
            quantity: 1,
            unit_price: Number(product.price),
            currency_id: 'BRL',
            description: product.description,
            picture_url: 'https://aquicomigo.com/images/logo/icon.png' // Substituir por URL real em produção
          }
        ],
        payer: {
          name: name,
          surname: surname,
          email: payer?.email || 'email@naoinformado.com',
          phone: {
            area_code: payer?.phone ? payer.phone.substring(0, 2) : '',
            number: payer?.phone ? payer.phone.substring(2) : ''
          }
        },
        back_urls: {
          success: `${process.env.FRONTEND_URL}/index.html?status=success`,
          failure: `${process.env.FRONTEND_URL}/index.html?status=failure`,
          pending: `${process.env.FRONTEND_URL}/index.html?status=pending`
        },
        auto_return: 'approved',
        external_reference: orderId,
        statement_descriptor: 'AQUICOMIGO'
      };

      const response = await preference.create({ body });

      // Salvar pedido no banco com dados do comprador
      const stmt = db.prepare('INSERT INTO orders (id, preference_id, product_id, status, payer_email, payer_name, payer_phone) VALUES (?, ?, ?, ?, ?, ?, ?)');
      stmt.run(orderId, response.id, product.id, 'pending', payer?.email, payer?.name, payer?.phone, (dbErr) => {
        if (dbErr) {
          console.error('Erro ao salvar pedido:', dbErr);
          // Não falhar a requisição se o pedido não for salvo, mas logar o erro
        }
      });
      stmt.finalize();

      res.json({
        id: response.id,
        init_point: response.init_point // URL para redirecionar o usuário
      });

    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao criar preferência no Mercado Pago' });
    }
  });
});

// Webhook (Simplificado)
app.post('/api/webhook', async (req, res) => {
  const { type, data } = req.body;
  // O Mercado Pago envia { action: 'payment.created', data: { id: '...' }, type: 'payment' }

  try {
    if (type === 'payment' || req.body.topic === 'payment') {
      const paymentId = data?.id || req.body.id;
      
      const paymentHelper = new Payment(client);
      const payment = await paymentHelper.get({ id: paymentId });
      
      // Ajuste para diferentes versões da SDK: response pode estar em .response ou no root
      const paymentData = payment.response || payment; 

      if (paymentData) {
        const charStatus = paymentData.status; // 'approved', 'pending', etc
        const orderId = paymentData.external_reference;

        console.log(`Pagamento ${paymentId} recebido. Status: ${charStatus}. Pedido: ${orderId}`);

        // Atualizar pedido no banco
        if (orderId) {
          const stmt = db.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
          stmt.run(charStatus, orderId, (err) => {
            if (err) console.error('Erro ao atualizar pedido no SQLite:', err.message);
            else console.log(`Pedido ${orderId} atualizado para ${charStatus}`);
          });
          stmt.finalize();
        }
      }
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Erro no webhook:', error);
    res.status(500).send('Erro interno');
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
