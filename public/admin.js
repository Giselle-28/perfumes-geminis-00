// Variables globales
let currentProducts = [];
let currentProductId = null;
let currentCatalog = 'normal';
let deleteProductId = null;
let deleteModal;
let isLoggedIn = false;
let currentUser = null;



// Inicialización al cargar la página
document.addEventListener('DOMContentLoaded', function() {
  // Inicializar modal de eliminación
  deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
  
  // Comprobar si hay un usuario en sesión guardado
  checkSession();
  
  // Agregar manejador para confirmar eliminación
  document.getElementById('confirm-delete').addEventListener('click', confirmDelete);
  
  // Agregar manejador para cambiar contraseña
  document.getElementById('save-password')?.addEventListener('click', changePassword);
});

// Comprobar si hay una sesión activa
async function checkSession() {
  try {
    const response = await fetch('/api/session');
    const result = await response.json();

    if (result.success) {
      currentUser = result.user;
      isLoggedIn = true;
      renderAdminPanel();
    } else {
      renderLoginForm();
    }
  } catch (e) {
    console.error('Error al procesar la sesión:', e);
    renderLoginForm();
  }
}

// Renderizar formulario de login
function renderLoginForm() {
  const appContainer = document.getElementById('app');
  
  appContainer.innerHTML = `
    <div class="login-container">
      <div class="login-logo">
        <img src="https://fakeimg.pl/200x200/f0e6a9/d4af37?text=Admin" alt="Logo Admin">
        <h2 class="mt-3">Acceso Administrativo</h2>
      </div>
      
      <div id="login-alert" class="alert alert-danger d-none" role="alert">
        Credenciales incorrectas. Intente nuevamente.
      </div>
      
      <form id="login-form">
        <div class="mb-3">
          <label for="username" class="form-label">Usuario</label>
          <input type="text" class="form-control" id="username" required>
        </div>
        <div class="mb-3">
          <label for="password" class="form-label">Contraseña</label>
          <input type="password" class="form-control" id="password" required>
        </div>
        <div class="d-grid gap-2">
          <button type="submit" class="btn btn-primary">Iniciar Sesión</button>
        </div>
        <div class="mt-3 text-center">
          <a href="index.html" class="text-decoration-none">Volver a la tienda</a>
        </div>
      </form>
    </div>
  `;
  
  // Agregar evento al formulario
  document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    handleLogin();
  });
}

// Manejar inicio de sesión
async function handleLogin() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  try {
    console.log('Enviando login con:', { username, password });
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (data.success) {
      // Guardar usuario sin contraseña
      currentUser = data.user;
      localStorage.setItem('adminSession', JSON.stringify(currentUser));
      isLoggedIn = true;
      renderAdminPanel();
    } else {
      document.getElementById('login-alert').classList.remove('d-none');
    }
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    document.getElementById('login-alert').classList.remove('d-none');
  }
}

// Cerrar sesión
function handleLogout() {
  // Eliminar la sesión en el cliente (localStorage)
  localStorage.removeItem('adminSession');
  
  // Resetear variables globales
  currentUser = null;
  isLoggedIn = false;

  // Mostrar formulario de login
  renderLoginForm();
}

// Renderizar panel de administración
function renderAdminPanel() {
  if (!isLoggedIn) {
    renderLoginForm();
    return;
  }
  
  const appContainer = document.getElementById('app');
  
  appContainer.innerHTML = `
    <!-- Navbar -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark fixed-top">
      <div class="container">
        <a class="navbar-brand" href="index.html">Perfumes Géminis</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav ms-auto">
            <li class="nav-item">
              <a class="nav-link" href="index.html">Volver a la Tienda</a>
            </li>
            <li class="nav-item dropdown">
              <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                <i class="fas fa-user-circle me-1"></i>
                <span id="current-user">${currentUser.nombre}</span>
              </a>
              <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown">
                <li><a class="dropdown-item" href="#" data-bs-toggle="modal" data-bs-target="#changePasswordModal">
                  <i class="fas fa-key me-2"></i>Cambiar contraseña
                </a></li>
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item" href="#" id="logout-link">
                  <i class="fas fa-sign-out-alt me-2"></i>Cerrar sesión
                </a></li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>

    <!-- Contenido Principal -->
    <div class="container my-5">
      <div class="row">
        <div class="col-12 text-center mb-4">
          <h1 class="display-5">Panel de Administración</h1>
          <p class="lead text-muted">Gestiona el catálogo de perfumes</p>
        </div>
      </div>
      
      <!-- Pestañas de navegación -->
      <ul class="nav nav-tabs">
        <li class="nav-item">
          <a class="nav-link active" id="productos-link" href="#">Productos</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" id="importar-link" href="#">Importar Catálogo</a>
        </li>
      </ul>
      
      <!-- Sección de Productos -->
      <div id="productos-section">
        <div class="row mb-3">
          <div class="col-md-6">
            <h2>Lista de Productos</h2>
          </div>
          <div class="col-md-6 text-md-end">
            <button id="add-product-btn" class="btn btn-primary">
              <i class="fas fa-plus"></i> Agregar Producto
            </button>
          </div>
        </div>
        
        <div class="row mb-4">
          <div class="col-12">
            <div class="card p-3">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <button id="catalogo-normal" class="btn-catalogo active">Catálogo Básico</button>
                  <button id="catalogo-completo" class="btn-catalogo">Catálogo Completo</button>
                </div>
                <div class="col-md-4">
                  <input type="text" id="search-products" class="form-control" placeholder="Buscar productos...">
                </div>
              </div>
            </div>
          </div>
        </div>
      
        <!-- Tabla de productos -->
        <div class="table-responsive">
          <table class="table table-striped table-hover">
            <thead class="table-dark">
              <tr>
                <th>ID</th>
                <th>Imagen</th>
                <th>Nombre</th>
                <th>Marca</th>
                <th>Precio</th>
                <th>Tipo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody id="products-table">
              <!-- Aquí se cargarán los productos dinámicamente -->
              <tr>
                <td colspan="7" class="text-center py-3">
                  <div class="spinner-border spinner-border-sm text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                  </div>
                  <span class="ms-2">Cargando productos...</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Formulario para agregar/editar producto -->
        <div id="product-form">
          <h3 id="form-title">Agregar Nuevo Producto</h3>
          <form id="perfume-form">
            <input type="hidden" id="product-id">
            
            <div class="row mb-3">
              <div class="col-md-6">
                <label for="product-name" class="form-label">Nombre del Perfume</label>
                <input type="text" class="form-control" id="product-name" required>
              </div>
              <div class="col-md-6">
                <label for="product-brand" class="form-label">Marca</label>
                <input type="text" class="form-control" id="product-brand" required>
              </div>
            </div>
            
            <div class="row mb-3">
              <div class="col-md-4">
                <label for="product-price" class="form-label">Precio</label>
                <div class="input-group">
                  <span class="input-group-text">$</span>
                  <input type="number" class="form-control" id="product-price" min="0" step="0.01" required>
                </div>
              </div>
              <div class="col-md-4">
                <label for="product-type" class="form-label">Tipo</label>
                <select class="form-select" id="product-type" required>
                  <option value="masculino">Masculino</option>
                  <option value="femenino">Femenino</option>
                  <option value="unisex">Unisex</option>
                </select>
              </div>
              <div class="col-md-4">
                <div class="form-check mt-4">
                  <input class="form-check-input" type="checkbox" id="product-arabe">
                  <label class="form-check-label" for="product-arabe">
                    Es Perfume Árabe
                  </label>
                </div>
              </div>
            </div>
            
            <div class="mb-3">
              <label for="product-image" class="form-label">URL de la Imagen</label>
              <input type="url" class="form-control" id="product-image" required>
              <div class="form-text">Ingresa la URL de una imagen para el perfume.</div>
            </div>
            
            <div class="mb-3">
              <label for="product-description" class="form-label">Descripción</label>
              <textarea class="form-control" id="product-description" rows="3"></textarea>
            </div>
            
            <div class="mb-3 text-end">
              <button type="button" class="btn btn-secondary me-2" id="cancel-form">Cancelar</button>
              <button type="submit" class="btn btn-primary">Guardar Producto</button>
            </div>
          </form>
        </div>
      </div>
      
      <!-- Sección de Importar Catálogo -->
      <div id="importar-section" class="d-none">
        <div class="row mb-4">
          <div class="col-12">
            <h2>Importar Catálogo</h2>
            <p class="text-muted">Importa un catálogo desde un archivo PDF o texto.</p>
          </div>
        </div>
        
        <div class="import-section">
          <form id="import-form">
            <div class="mb-3">
              <label for="pdf-file" class="form-label">Archivo de Catálogo (PDF)</label>
              <input class="form-control" type="file" id="pdf-file" accept=".pdf,.txt">
              <div class="form-text">Sube un archivo PDF con el catálogo de perfumes.</div>
            </div>
            
            <div class="mb-3">
              <label class="form-label">Tipo de Catálogo</label>
              <div class="form-check">
                <input class="form-check-input" type="radio" name="catalog-type" id="catalog-basic" value="basico" checked>
                <label class="form-check-label" for="catalog-basic">
                  Catálogo Básico
                </label>
              </div>
              <div class="form-check">
                <input class="form-check-input" type="radio" name="catalog-type" id="catalog-complete" value="completo">
                <label class="form-check-label" for="catalog-complete">
                  Catálogo Completo
                </label>
              </div>
            </div>
            
            <div class="mb-3">
              <div class="form-check">
                <input class="form-check-input" type="checkbox" id="replace-catalog">
                <label class="form-check-label" for="replace-catalog">
                  Reemplazar catálogo existente
                </label>
                <div class="form-text text-danger">
                  Atención: Esto eliminará todos los productos actuales del catálogo seleccionado.
                </div>
              </div>
            </div>
            
            <div class="mb-3 text-end">
              <button type="submit" class="btn btn-primary">
                <i class="fas fa-upload me-2"></i>Importar Catálogo
              </button>
            </div>
          </form>
          
          <div id="import-results" class="d-none alert alert-success">
            <h4>Importación Completada</h4>
            <p id="import-summary"></p>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Cargar productos
  loadProducts();
  
  // Agregar eventos
  document.getElementById('logout-link').addEventListener('click', handleLogout);
  document.getElementById('add-product-btn').addEventListener('click', showAddProductForm);
  document.getElementById('cancel-form').addEventListener('click', hideProductForm);
  document.getElementById('perfume-form').addEventListener('submit', handleSaveProduct);
  
  // Eventos de las pestañas
  document.getElementById('productos-link').addEventListener('click', function(e) {
    e.preventDefault();
    showSection('productos');
  });
  
  document.getElementById('importar-link').addEventListener('click', function(e) {
    e.preventDefault();
    showSection('importar');
  });
  
  // Eventos de cambio de catálogo
  document.getElementById('catalogo-normal').addEventListener('click', function() {
    switchCatalog('normal');
  });
  
  document.getElementById('catalogo-completo').addEventListener('click', function() {
    switchCatalog('completo');
  });
  
  // Evento de búsqueda
  document.getElementById('search-products').addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase().trim();
    filterProducts(searchTerm);
  });
  
  // Evento del formulario de importación
  document.getElementById('import-form').addEventListener('submit', function(e) {
    e.preventDefault();
    handleImport();
  });
}

// Mostrar sección específica
function showSection(sectionName) {
  // Actualizar pestañas activas
  document.querySelectorAll('.nav-link').forEach(tab => {
    tab.classList.remove('active');
  });
  document.getElementById(`${sectionName}-link`).classList.add('active');
  
  // Mostrar la sección correcta
  if (sectionName === 'productos') {
    document.getElementById('productos-section').classList.remove('d-none');
    document.getElementById('importar-section').classList.add('d-none');
  } else if (sectionName === 'importar') {
    document.getElementById('productos-section').classList.add('d-none');
    document.getElementById('importar-section').classList.remove('d-none');
  }
}

// Función para cargar los productos desde archivo con Lowdb
async function loadProducts(catalog = 'normal') {
  try {
    const response = await fetch(`/api/products?catalog=${catalog}`);
    const data = await response.json();

if (data.success && Array.isArray(data.products)) {
  currentProducts = data.products;
  displayProducts(data.products);
} else {
  throw new Error('La respuesta no contiene un array de productos válido');
}


    return data.products;
  } catch (error) {
    console.error('Error al cargar productos desde la API:', error);
    const tableBody = document.getElementById('products-table');
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-3 text-danger">
          Error al cargar el catálogo de productos. Verifica el archivo o la conexión.
        </td>
      </tr>
    `;
    return [];
  }
}

// Función para mostrar los productos en la tabla
function displayProducts(products) {
  const tableBody = document.getElementById('products-table');
  tableBody.innerHTML = '';
  
  if (products.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-3">
          No hay productos en el catálogo.
        </td>
      </tr>
    `;
    return;
  }
  
  products.forEach(product => {
    const row = document.createElement('tr');
    
    // Determinar la clase de badge para el tipo
    let typeBadgeClass = '';
    switch (product.tipo) {
      case 'masculino':
        typeBadgeClass = 'type-masculino';
        break;
      case 'femenino':
        typeBadgeClass = 'type-femenino';
        break;
      case 'unisex':
        typeBadgeClass = 'type-unisex';
        break;
    }
    
    // Preparar el HTML para el tipo y badge de árabe
    let typeHtml = `<span class="type-badge ${typeBadgeClass}">${capitalizeFirstLetter(product.tipo)}</span>`;
    if (product.arabe) {
      typeHtml += ` <span class="type-badge type-arabe ms-1">Árabe</span>`;
    }
    
    row.innerHTML = `
      <td>${product.id}</td>
      <td><img src="${product.imagen}" alt="${product.nombre}" class="product-image"></td>
      <td>${product.nombre}</td>
      <td>${product.marca || '-'}</td>
      <td>$${product.precio.toLocaleString('es-AR')}</td>
      <td>${typeHtml}</td>
      <td>
        <button class="btn btn-sm btn-warning action-btn edit-btn" data-id="${product.id}">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn btn-sm btn-danger action-btn delete-btn" data-id="${product.id}">
          <i class="fas fa-trash-alt"></i>
        </button>
      </td>
    `;
    
    tableBody.appendChild(row);
  });
  
  // Agregar event listeners a los botones de editar y eliminar
  addActionButtonListeners();
}

// Agregar event listeners a los botones de acción
function addActionButtonListeners() {
  // Botones de editar
  document.querySelectorAll('.edit-btn').forEach(button => {
    button.addEventListener('click', function() {
      const productId = parseInt(this.getAttribute('data-id'));
      editProduct(productId);
    });
  });
  
  // Botones de eliminar
  document.querySelectorAll('.delete-btn').forEach(button => {
    button.addEventListener('click', function() {
      const productId = parseInt(this.getAttribute('data-id'));
      showDeleteConfirmation(productId);
    });
  });
}

// Mostrar el modal de confirmación de eliminación
function showDeleteConfirmation(productId) {
  deleteProductId = productId;
  deleteModal.show();
}

// Confirmar eliminación de producto
function confirmDelete() {
  if (!deleteProductId) return;
  
  const indexToDelete = currentProducts.findIndex(p => p.id === deleteProductId);
  if (indexToDelete !== -1) {
    currentProducts.splice(indexToDelete, 1);
    
    // Guardar cambios
    saveToJson(currentProducts, currentCatalog)
      .then(success => {
        if (success) {
          displayProducts(currentProducts);
          deleteModal.hide();
          showAlert('Producto eliminado correctamente', 'success');
        }
      });
  }
}

// Cambiar de catálogo
function switchCatalog(catalog) {
  // Actualizar UI
  document.getElementById('catalogo-normal').classList.toggle('active', catalog === 'normal');
  document.getElementById('catalogo-completo').classList.toggle('active', catalog === 'completo');
  
  // Cambiar catálogo activo
  currentCatalog = catalog;
  
  // Cargar productos del nuevo catálogo
  loadProducts(catalog);
}

// Filtrar productos por término de búsqueda
function filterProducts(searchTerm) {
  if (!searchTerm) {
    displayProducts(currentProducts);
    return;
  }
  
  const filtered = currentProducts.filter(product => {
    const nombre = product.nombre.toLowerCase();
    const marca = (product.marca || '').toLowerCase();
    const descripcion = (product.descripcion || '').toLowerCase();
    
    return nombre.includes(searchTerm) || 
           marca.includes(searchTerm) || 
           descripcion.includes(searchTerm);
  });
  
  displayProducts(filtered);
}

// Mostrar formulario para agregar producto
function showAddProductForm() {
  // Resetear formulario
  document.getElementById('perfume-form').reset();
  document.getElementById('product-id').value = '';
  document.getElementById('form-title').textContent = 'Agregar Nuevo Producto';
  
  // Mostrar formulario
  document.getElementById('product-form').classList.add('visible');
  
  // Desplazar a la vista del formulario
  document.getElementById('product-form').scrollIntoView({ behavior: 'smooth' });
  
  // Resetear currentProductId
  currentProductId = null;
}

// Ocultar formulario de producto
function hideProductForm() {
  document.getElementById('product-form').classList.remove('visible');
}

// Función para editar un producto
async function editProduct(productId) {
  const product = currentProducts.find(p => p.id === productId);
  if (!product) return;

  document.getElementById('product-id').value = product.id;
  document.getElementById('product-name').value = product.nombre;
  document.getElementById('product-brand').value = product.marca || '';
  document.getElementById('product-price').value = product.precio;
  document.getElementById('product-type').value = product.tipo;
  document.getElementById('product-image').value = product.imagen;
  document.getElementById('product-description').value = product.descripcion || '';
  document.getElementById('product-arabe').checked = product.arabe || false;

  document.getElementById('form-title').textContent = 'Editar Producto';
  document.getElementById('product-form').classList.add('visible');
  document.getElementById('product-form').scrollIntoView({ behavior: 'smooth' });

  currentProductId = productId; // Guardás cuál se está editando
}
async function updateProductInServer(productId, updatedData) {
  const response = await fetch(`/api/products/${productId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedData)
  });

  const result = await response.json();
  return result.success;
}

// Manejar guardado de producto (crear o actualizar)
async function handleSaveProduct(e) {
  e.preventDefault();

  const productData = {
    nombre: document.getElementById('product-name').value,
    marca: document.getElementById('product-brand').value,
    precio: parseFloat(document.getElementById('product-price').value),
    tipo: document.getElementById('product-type').value,
    imagen: document.getElementById('product-image').value,
    descripcion: document.getElementById('product-description').value,
    arabe: document.getElementById('product-arabe').checked
  };
const url = currentProductId ? `/api/producto/${currentProductId}` : '/api/producto';
  const method = currentProductId ? 'PUT' : 'POST';

  try {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData)
    });

    const result = await response.json();
    if (result.success) {
      showAlert('Producto guardado correctamente', 'success');
      // actualizar UI si querés
    } else {
      showAlert('Error al guardar producto', 'danger');
    }
  } catch (error) {
    console.error('Error al guardar producto:', error);
    showAlert('Error al guardar producto', 'danger');
  }
}

// Función para guardar los cambios en el archivo JSON
async function saveToJson(products, catalog = 'normal') {
  try {
    const response = await fetch('/api/catalogo/guardar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ products, catalog })
    });

    const result = await response.json();

    if (result.success) {
      console.log(`Catálogo '${catalog}' guardado correctamente.`);
      return true;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Error al guardar el catálogo:', error);
    showAlert(`Error al guardar: ${error.message}. Los cambios no se guardaron.`, 'danger');
    return false;
  }
}

// Función para obtener el siguiente ID disponible
/*async function getNextId() {
  const db = await getDbInstance(); // Obtener la instancia de la base de datos

  // Obtener todos los productos del catálogo activo
  const products = db.get(currentCatalog).value();
  
  if (products.length === 0) return 1; // Si no hay productos, el siguiente ID es 1

  const maxId = Math.max(...products.map(p => p.id)); // Encontrar el ID más alto
  return maxId + 1; // Retornar el siguiente ID
} */

// Manejo de importación
/*async function handleImport() {
  const fileInput = document.getElementById('pdf-file');
  const file = fileInput.files[0];
  
  if (!file) {
    showAlert('Por favor, selecciona un archivo para importar', 'danger');
    return;
  }
  
  const catalogType = document.querySelector('input[name="catalog-type"]:checked').value;
  const replaceCatalog = document.getElementById('replace-catalog').checked;
  
  // Mostrar mensaje de procesamiento
  showAlert('Procesando archivo...', 'info');
  
  // Aquí procesamos el archivo (en este ejemplo lo simularemos)
  setTimeout(async () => {
    // Simulamos la lectura de productos (en un entorno real, procesaríamos el PDF)
    const importCount = Math.floor(Math.random() * 20) + 5; // Simulación de productos importados
    
    // Mostrar mensaje con detalles de la importación
    const resultsDiv = document.getElementById('import-results');
    const summaryP = document.getElementById('import-summary');
    
    summaryP.innerHTML = `
      Se han ${replaceCatalog ? 'reemplazado' : 'añadido'} <strong>${importCount}</strong> perfumes al catálogo ${catalogType === 'completo' ? 'completo' : 'básico'}.
      <br><br>
      <button class="btn btn-primary btn-sm" id="reload-after-import">Recargar productos</button>
    `;
    
    resultsDiv.classList.remove('d-none');
    
    // Cargar productos al catálogo correspondiente
    const db = await getDbInstance(); // Obtener instancia de la base de datos Lowdb
    const products = db.get(catalogType).value();
    
    // Si se seleccionó reemplazar el catálogo, vaciarlo antes de añadir nuevos productos
    if (replaceCatalog) {
      db.set(catalogType, []).write();
    }
    
    // Simulamos la adición de productos (en un entorno real, leeríamos el archivo PDF y lo procesaríamos)
    for (let i = 0; i < importCount; i++) {
      const newProduct = {
        id: getNextId(products), // Asignar un ID único para cada nuevo producto
        nombre: `Perfume ${i + 1}`,
        marca: 'Marca Simulada',
        precio: Math.floor(Math.random() * 1000) + 500,
        imagen: 'https://via.placeholder.com/150',
        tipo: 'femenino',
        descripcion: 'Descripción simulada',
        arabe: false
      };
      db.get(catalogType).push(newProduct).write(); // Agregar el nuevo producto al catálogo
    }
    
    // Recargar productos y actualizar la vista
    document.getElementById('reload-after-import').addEventListener('click', function() {
      loadProducts(catalogType);
      switchCatalog(catalogType);
      showSection('productos');
    });
    
  }, 2000); // Simulamos un tiempo de procesamiento
}*/

// Función para cambiar contraseña
function changePassword() {
  const oldPassword = document.getElementById('old-password').value;
  const newPassword = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;
  
  // Validaciones básicas
  if (!oldPassword || !newPassword || !confirmPassword) {
    showAlert('Todos los campos son obligatorios', 'danger');
    return;
  }
  
  if (newPassword.length < 6) {
    showAlert('La nueva contraseña debe tener al menos 6 caracteres', 'danger');
    return;
  }
  
  if (newPassword !== confirmPassword) {
    showAlert('Las contraseñas no coinciden', 'danger');
    return;
  }
  
  // En un entorno real, esto se manejaría en el servidor
  // Aquí solo simulamos el cambio
  
  const user = users.find(u => u.username === currentUser.username);
  if (!user || user.password !== oldPassword) {
    showAlert('Contraseña actual incorrecta', 'danger');
    return;
  }
  
  // Cambiar contraseña (simulado)
  user.password = newPassword;
  
  // Cerrar modal
  const modal = bootstrap.Modal.getInstance(document.getElementById('changePasswordModal'));
  modal.hide();
  
  // Resetear formulario
  document.getElementById('change-password-form').reset();
  
  // Mostrar mensaje de éxito
  showAlert('Contraseña actualizada correctamente', 'success');
}

// Mostrar alerta
function showAlert(message, type = 'success') {
  // Crear elemento de alerta
  const alertEl = document.createElement('div');
  alertEl.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-4`;
  alertEl.style.zIndex = '9999';
  alertEl.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  
  // Agregar al body
  document.body.appendChild(alertEl);
  
  // Eliminar después de 5 segundos
  setTimeout(() => {
    alertEl.remove();
  }, 5000);
}

// Función para capitalizar la primera letra
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}