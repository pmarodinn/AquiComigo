const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'aquicomigo.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err.message);
  } else {
    console.log('Conectado ao banco de dados SQLite.');
    initDb();
  }
});

function initDb() {
  db.serialize(() => {
    // Tabela de Produtos
    db.run(`CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      currency_id TEXT DEFAULT 'BRL'
    )`);

    // Tabela de Pedidos
    db.run(`CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      preference_id TEXT,
      product_id TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(product_id) REFERENCES products(id)
    )`);

    // Seed de Produtos (Inserir se não existir)
    const seedProducts = [
      {
        id: 'kit-essencial',
        title: 'Kit Essencial AquiComigo',
        description: '1 Tag AquiComigo + Cabo Magnético + App Grátis',
        price: 197.90
      },
      {
        id: 'kit-familia',
        title: 'Kit Família AquiComigo',
        description: '2 Tags AquiComigo + 2 Cabos Magnéticos + App Grátis + Suporte Prioritário',
        price: 347.90
      }
    ];

    const insert = db.prepare('INSERT OR IGNORE INTO products (id, title, description, price) VALUES (?, ?, ?, ?)');
    
    seedProducts.forEach((product) => {
      insert.run(product.id, product.title, product.description, product.price);
    });

    insert.finalize();
    console.log('Tabelas verificadas e produtos iniciais inseridos (se necessário).');
  });
}

module.exports = db;
