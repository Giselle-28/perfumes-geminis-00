import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb';
import path from 'path';

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));


// Base de datos de productos
const productAdapter = new JSONFile('catalogo-completo.json');
const db = new Low(productAdapter);

// Base de datos de usuarios
const userAdapter = new JSONFile('admin_users.json');
const usersDb = new Low(userAdapter);

async function initDatabases() {
  await db.read();
  db.data ||= { products: [] };
  await db.write();

  await usersDb.read();
  usersDb.data ||= { users: [] }; // Esto depende de tu estructura JSON
  await usersDb.write();
}

initDatabases();

// Ruta para guardar productos
app.post('/api/catalogo/guardar', async (req, res) => {
  try {
    const { products } = req.body;

    if (!Array.isArray(products)) {
      return res.status(400).json({ success: false, message: 'Formato de productos inválido' });
    }

    await db.read();
    db.data = products; // porque db.data es un array directamente
    await db.write();

    res.json({ success: true, message: 'Catálogo guardado correctamente' });
  } catch (error) {
    console.error('Error al guardar catálogo:', error);
    res.status(500).json({ success: false, message: 'Error al guardar catálogo' });
  }
});

// Importar catálogo desde PDF (simulado)
app.post('/api/import-catalog', (req, res) => {
  try {
    const { catalogType, replace } = req.body;
    
    // Este endpoint simularía el procesamiento de un PDF
    // Generar algunos perfumes aleatorios
    const perfumesGenerados = [];
    const cantidad = Math.floor(Math.random() * 15) + 5; // Entre 5 y 20
    
    for (let i = 0; i < cantidad; i++) {
      perfumesGenerados.push({
        id: i + 1,
        nombre: `Perfume Importado ${i + 1}`,
        marca: "Importado PDF",
        precio: Math.floor(Math.random() * 3000) + 2000,
        imagen: "https://images.pexels.com/photos/965989/pexels-photo-965989.jpeg?auto=compress&cs=tinysrgb&w=600",
        tipo: ["masculino", "femenino", "unisex"][Math.floor(Math.random() * 3)],
        descripcion: "Perfume importado desde catálogo PDF.",
        arabe: Math.random() > 0.8
      });
    }
    
    // Determinar archivo de destino
    const catalogFile = catalogType === 'completo' ? 'catalogo-completo.json' : 'productos.json';
    
    // Si no es reemplazo, cargar el catálogo existente y combinar
    if (!replace && fs.existsSync(catalogFile)) {
      const existingContent = fs.readFileSync(catalogFile, 'utf8');
      const existingPerfumes = JSON.parse(existingContent);
      
      // Asignar nuevos IDs a los perfumes importados
      const maxId = Math.max(...existingPerfumes.map(p => p.id), 0);
      for (let i = 0; i < perfumesGenerados.length; i++) {
        perfumesGenerados[i].id = maxId + i + 1;
      }
      
      // Combinar perfumes
      const combinedPerfumes = existingPerfumes.concat(perfumesGenerados);
      
      // Guardar en el archivo destino
      fs.writeFileSync(catalogFile, JSON.stringify(combinedPerfumes, null, 2), 'utf8');
    } else {
      // Reemplazar todo el contenido
      fs.writeFileSync(catalogFile, JSON.stringify(perfumesGenerados, null, 2), 'utf8');
    }
    
    // Contar perfumes por tipo
    const femeninos = perfumesGenerados.filter(p => p.tipo === 'femenino').length;
    const masculinos = perfumesGenerados.filter(p => p.tipo === 'masculino').length;
    const unisex = perfumesGenerados.filter(p => p.tipo === 'unisex').length;
    
    res.json({
      success: true,
      message: `Se han ${replace ? 'reemplazado' : 'añadido'} ${perfumesGenerados.length} perfumes al catálogo.`,
      summary: {
        total: perfumesGenerados.length,
        femeninos: femeninos,
        masculinos: masculinos,
        unisex: unisex
      }
    });
  } catch (error) {
    console.error('Error al importar:', error);
    res.status(500).json({ success: false, message: `Error al importar: ${error.message}` });
  }
});



// Ruta de autenticación
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    await usersDb.read();
    console.log('Contenido usersDb.data:', usersDb.data);

    const users = usersDb.data.users || [];
    console.log('Usuarios en base:', users);
console.log('Recibido:', username, password);

    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
      // Omitimos la contraseña en la respuesta
      const { password, ...userWithoutPassword } = user;

      res.json({
        success: true,
        user: userWithoutPassword
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas'
      });
    }
  } catch (error) {
    console.error('Error al autenticar:', error);
    res.status(500).json({
      success: false,
      message: `Error interno: ${error.message}`
    });
  }
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});

app.get('/api/session', async (req, res) => {
  try {
    await usersDb.read();

    if (!usersDb.data || !Array.isArray(usersDb.data.users)) {
      console.error('Estructura de datos inválida:', usersDb.data);
      return res.status(500).json({ success: false, message: 'Estructura inválida en la base de usuarios' });
    }

    const activeUser = usersDb.data.users.find(user => user.isActive);

    if (activeUser) {
      const { password, ...userWithoutPassword } = activeUser;
      res.json({ success: true, user: userWithoutPassword });
    } else {
      res.json({ success: false });
    }

  } catch (error) {
    console.error('Error al verificar sesión:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/producto', async (req, res) => {
  try {
    const productData = req.body;

    await db.read();

    // Asegurarse de que db.data es un array
    if (!Array.isArray(db.data)) {
      db.data = [];
    }

    // Generar nuevo ID
    const newId = db.data.length > 0
      ? Math.max(...db.data.map(p => p.id)) + 1
      : 1;

    const newProduct = { id: newId, ...productData };
    db.data.push(newProduct);

    await db.write();

    res.json({ success: true, product: newProduct });
  } catch (error) {
    console.error('Error al guardar producto:', error);
    res.status(500).json({ success: false, message: 'Error al guardar producto' });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    await db.read();

    let products;

    if (Array.isArray(db.data)) {
      // Si el JSON es un array directamente
      products = db.data;
    } else if (typeof db.data === 'object' && db.data[catalog]) {
      // Si el JSON tiene claves como "normal", "arabes", etc.
      products = db.data[catalog];
    } else {
      return res.status(404).json({ success: false, message: 'Catálogo no encontrado o inválido' });
    }

    res.json({ success: true, products });

  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/producto/:id', async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const updatedData = req.body;

    await db.read();

    // Si el JSON es un array directo
    if (!Array.isArray(db.data)) {
      return res.status(500).json({ success: false, message: 'La base de datos no es un array' });
    }

    const productIndex = db.data.findIndex(p => p.id === productId);
    if (productIndex === -1) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }

    db.data[productIndex] = { ...db.data[productIndex], ...updatedData };
    await db.write();

    res.json({ success: true, product: db.data[productIndex] });
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar producto' });
  }
});