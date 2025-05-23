// Variables globales
let productos = [];
let carritoItems = [];
let productosFiltrados = [];
let paginaActual = 1;
let productosPorPagina = 12;
let filtroActual = "todos";
let terminoBusquedaActual = "";

// Cargar contenido cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  // Ocultar el loader después de que todo esté cargado
  window.addEventListener('load', function() {
    setTimeout(function() {
      document.getElementById('loader').classList.add('fade-out');
    }, 500);
  });
  
  // Inicializar el slider
  initSlider();
  
  // Cargar productos
  cargarProductos();
  
  // Añadir evento de scroll para la navbar
  window.addEventListener('scroll', function() {
    if (window.scrollY > 50) {
      document.getElementById('navbar').classList.add('scrolled');
    } else {
      document.getElementById('navbar').classList.remove('scrolled');
    }
  });
  
  // Recuperar carrito del localStorage
  const carritoGuardado = localStorage.getItem('carrito');
  if (carritoGuardado) {
    carritoItems = JSON.parse(carritoGuardado);
    actualizarContadorCarrito();
    actualizarCarrito();
  }
  
  // Actualizar copyright con el año actual
  updateCopyright();
});

// Función para cargar productos desde el JSON con filtros y paginación
async function cargarProductos(filtro = "todos", terminoBusqueda = "") {
  try {
    if (filtro !== filtroActual || terminoBusqueda !== terminoBusquedaActual) {
      paginaActual = 1; // Resetear a primera página al cambiar filtro o búsqueda
    }
    
    filtroActual = filtro;
    terminoBusquedaActual = terminoBusqueda;
    
    // Mostrar loader
    document.getElementById('productos-container').innerHTML = `
      <div class="col-12 text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
        <p class="mt-2">Cargando productos...</p>
      </div>
    `;
    
    // Obtener los productos del archivo JSON
    const response = await fetch('/api/products');
    
    if (!response.ok) {
      throw new Error('Error al cargar los productos');
    }
    
    const data = await response.json();
productos = data.products; // accedemos a la clave "products"
    
    // Aplicar filtros
    if (filtro === "todos" && !terminoBusqueda) {
      productosFiltrados = [...productos];
    } else {
      productosFiltrados = productos.filter(producto => {
        // Filtro por categoría
        let pasaFiltroCategoria = true;
        if (filtro !== "todos") {
          if (filtro === "arabe") {
            pasaFiltroCategoria = producto.arabe === true;
          } else if (filtro === "arabe-masculino") {
            pasaFiltroCategoria = producto.arabe === true && producto.tipo === "masculino";
          } else if (filtro === "arabe-femenino") {
            pasaFiltroCategoria = producto.arabe === true && producto.tipo === "femenino";
          } else if (filtro === "arabe-unisex") {
            pasaFiltroCategoria = producto.arabe === true && producto.tipo === "unisex";
          } else {
            pasaFiltroCategoria = producto.tipo === filtro;
          }
        }
        
        // Filtro por búsqueda
        let pasaFiltroBusqueda = true;
        if (terminoBusqueda) {
          const termino = terminoBusqueda.toLowerCase();
          pasaFiltroBusqueda = 
            producto.nombre.toLowerCase().includes(termino) || 
            producto.marca.toLowerCase().includes(termino) || 
            (producto.descripcion && producto.descripcion.toLowerCase().includes(termino));
        }
        return pasaFiltroCategoria && pasaFiltroBusqueda;
      });
    }
    
    // Actualizar botones de filtro activos
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    // Activar botón correspondiente al filtro actual
    if (filtro.startsWith('arabe-')) {
      // Para los filtros compuestos no hay botón específico, así que activamos el de árabes
      document.querySelector('.filter-btn[onclick="filtrarCategoria(\'arabe\')"]')?.classList.add('active');
    } else {
      document.querySelector(`.filter-btn[onclick="filtrarCategoria('${filtro}')"]`)?.classList.add('active');
    }
    
    // Calcular paginación
    const totalPaginas = Math.ceil(productosFiltrados.length / productosPorPagina);
    
    // Generar HTML de productos para la página actual
    const inicio = (paginaActual - 1) * productosPorPagina;
    const fin = inicio + productosPorPagina;
    const productosEnPagina = productosFiltrados.slice(inicio, fin);
    
    if (productosEnPagina.length === 0) {
      document.getElementById('productos-container').innerHTML = `
        <div class="col-12 text-center py-5">
          <i class="fas fa-search fa-3x mb-3 text-muted"></i>
          <h3>No se encontraron productos</h3>
          <p class="text-muted">Prueba con otros criterios de búsqueda</p>
        </div>
      `;
      document.getElementById('pagination').innerHTML = '';
      return;
    }
    
    // Generar HTML de productos
    let productosHTML = '';
    
    productosEnPagina.forEach(producto => {
      // Determinar las clases para las etiquetas
      let tagClasses = '';
      if (producto.tipo === 'masculino') {
        tagClasses = 'tag-masculino';
      } else if (producto.tipo === 'femenino') {
        tagClasses = 'tag-femenino';
      } else if (producto.tipo === 'unisex') {
        tagClasses = 'tag-unisex';
      }
      
      productosHTML += `
        <div class="col-md-6 col-lg-4 col-xl-3 mb-4">
          <div class="producto-card">
            <div class="producto-imagen">
              <img src="${producto.imagen}" alt="${producto.nombre}">
              <span class="producto-tag ${tagClasses}">${capitalizeFirstLetter(producto.tipo)}</span>
              ${producto.arabe ? '<span class="producto-tag tag-arabe">Árabe</span>' : ''}
            </div>
            <div class="producto-info">
              <div class="producto-brand">${producto.marca}</div>
              <h3 class="producto-name">${producto.nombre}</h3>
              <div class="producto-description">${producto.descripcion || ''}</div>
              <div class="producto-footer">
                <div class="producto-price">$${producto.precio.toLocaleString('es-AR')}</div>
                <button class="add-to-cart" onclick="agregarAlCarrito('${producto.nombre}', ${producto.precio})">
                  <i class="fas fa-plus"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    });
    
    document.getElementById('productos-container').innerHTML = productosHTML;
    
    // Generar controles de paginación
    generarControlesPaginacion(totalPaginas);
    
  } catch (error) {
    console.error('Error al cargar los productos:', error);
    document.getElementById('productos-container').innerHTML = `
      <div class="col-12 text-center py-5">
        <i class="fas fa-exclamation-triangle fa-3x mb-3 text-danger"></i>
        <h3>Error al cargar los productos</h3>
        <p>${error.message}</p>
        <button class="btn btn-primary mt-3" onclick="cargarProductos()">Reintentar</button>
      </div>
    `;
  }
}

// Generar controles de paginación
function generarControlesPaginacion(totalPaginas) {
  if (totalPaginas <= 1) {
    document.getElementById('pagination').innerHTML = '';
    return;
  }
  
  let paginacionHTML = `
    <div class="page-link ${paginaActual === 1 ? 'disabled' : ''}" onclick="${paginaActual > 1 ? 'irAPagina(' + (paginaActual - 1) + ')' : ''}">
      <i class="fas fa-chevron-left"></i>
    </div>
  `;
  
  // Limitar el número de páginas mostradas
  let paginaInicio = Math.max(1, paginaActual - 2);
  let paginaFin = Math.min(totalPaginas, paginaActual + 2);
  
  // Asegurar que siempre se muestren 5 páginas si hay suficientes
  if (paginaFin - paginaInicio < 4 && totalPaginas > 5) {
    if (paginaActual < 3) {
      paginaFin = Math.min(5, totalPaginas);
    } else if (paginaActual > totalPaginas - 2) {
      paginaInicio = Math.max(1, totalPaginas - 4);
    }
  }
  
  // Añadir primera página y puntos suspensivos si es necesario
  if (paginaInicio > 1) {
    paginacionHTML += `
      <div class="page-link" onclick="irAPagina(1)">1</div>
      ${paginaInicio > 2 ? '<div class="page-link disabled">...</div>' : ''}
    `;
  }
  
  // Añadir páginas numeradas
  for (let i = paginaInicio; i <= paginaFin; i++) {
    paginacionHTML += `
      <div class="page-link ${i === paginaActual ? 'active' : ''}" onclick="irAPagina(${i})">
        ${i}
      </div>
    `;
  }
  
  // Añadir última página y puntos suspensivos si es necesario
  if (paginaFin < totalPaginas) {
    paginacionHTML += `
      ${paginaFin < totalPaginas - 1 ? '<div class="page-link disabled">...</div>' : ''}
      <div class="page-link" onclick="irAPagina(${totalPaginas})">${totalPaginas}</div>
    `;
  }
  
  paginacionHTML += `
    <div class="page-link ${paginaActual === totalPaginas ? 'disabled' : ''}" onclick="${paginaActual < totalPaginas ? 'irAPagina(' + (paginaActual + 1) + ')' : ''}">
      <i class="fas fa-chevron-right"></i>
    </div>
  `;
  
  document.getElementById('pagination').innerHTML = paginacionHTML;
}

// Ir a una página específica
function irAPagina(pagina) {
  paginaActual = pagina;
  window.scrollTo({
    top: document.getElementById('perfumes').offsetTop - 100,
    behavior: 'smooth'
  });
  cargarProductos(filtroActual, terminoBusquedaActual);
}

// Filtrar por categoría
function filtrarCategoria(tipo) {
  filtroActual = tipo;
  window.scrollTo({
    top: document.getElementById('perfumes').offsetTop - 100,
    behavior: 'smooth'
  });
  cargarProductos(tipo, terminoBusquedaActual);
}

// Buscar productos
function buscarProductos() {
  const terminoBusqueda = document.getElementById('search-input').value.trim();
  terminoBusquedaActual = terminoBusqueda;
  cargarProductos(filtroActual, terminoBusqueda);
}

// Agregar al carrito
function agregarAlCarrito(nombre, precio) {
  // Buscar si el producto ya está en el carrito
  const productoEnCarrito = carritoItems.find(item => item.nombre === nombre);
  
  if (productoEnCarrito) {
    // Si ya está, incrementar cantidad
    productoEnCarrito.cantidad++;
  } else {
    // Si no está, añadirlo
    const producto = productos.find(p => p.nombre === nombre);
    
    if (producto) {
      carritoItems.push({
        id: producto.id,
        nombre: producto.nombre,
        precio: producto.precio,
        imagen: producto.imagen,
        cantidad: 1
      });
    }
  }
  
  // Guardar en localStorage
  localStorage.setItem('carrito', JSON.stringify(carritoItems));
  
  // Actualizar UI
  actualizarContadorCarrito();
  actualizarCarrito();
  
  // Mostrar notificación toast
  mostrarToast(nombre);
}

// Actualizar contador del carrito
function actualizarContadorCarrito() {
  const cantidadTotal = carritoItems.reduce((total, item) => total + item.cantidad, 0);
  document.querySelector('.cart-count').textContent = cantidadTotal;
  document.querySelector('.contador-carrito').textContent = cantidadTotal;
}

// Mostrar notificación de producto agregado
function mostrarToast(nombreProducto) {
  const toastEl = document.getElementById('toast');
  const toastBody = document.getElementById('toast-message');
  
  toastBody.textContent = `${nombreProducto} agregado al carrito`;
  
  const toast = new bootstrap.Toast(toastEl, {
    delay: 3000
  });
  toast.show();
}

// Función para enviar pedido por WhatsApp
function enviarWhatsApp() {
  if (carritoItems.length === 0) {
    alert('El carrito está vacío');
    return;
  }
  
  const telefono = "+5491112345678"; // Reemplazar con número real
  let mensaje = "Hola, me gustaría realizar el siguiente pedido:\n\n";
  
  carritoItems.forEach(item => {
    mensaje += `• ${item.cantidad}x ${item.nombre} - $${(item.precio * item.cantidad).toLocaleString('es-AR')}\n`;
  });
  
  const total = carritoItems.reduce((suma, item) => suma + (item.precio * item.cantidad), 0);
  mensaje += `\nTotal: $${total.toLocaleString('es-AR')}`;
  
  // Codificar el mensaje para URL
  const mensajeCodificado = encodeURIComponent(mensaje);
  
  // Abrir WhatsApp
  window.open(`https://wa.me/${telefono}?text=${mensajeCodificado}`, '_blank');
}

// Actualizar carrito
function actualizarCarrito() {
  const carritoItemsContainer = document.getElementById('carrito-items');
  const carritoTotalElement = document.getElementById('carrito-total');
  
  if (carritoItems.length === 0) {
    carritoItemsContainer.innerHTML = `
      <div class="carrito-empty">
        <i class="fas fa-shopping-bag"></i>
        <p>Tu carrito está vacío</p>
        <a href="#perfumes" class="btn btn-outline-primary btn-sm" onclick="cerrarCarrito()">Ver Perfumes</a>
      </div>
    `;
    carritoTotalElement.textContent = '$0';
    return;
  }
  
  let itemsHTML = '';
  let total = 0;
  
  carritoItems.forEach((item, index) => {
    const subtotal = item.precio * item.cantidad;
    total += subtotal;
    
    itemsHTML += `
      <div class="carrito-item">
        <div class="carrito-item-img">
          <img src="${item.imagen}" alt="${item.nombre}">
        </div>
        <div class="carrito-item-info">
          <div class="carrito-item-title">${item.nombre}</div>
          <div class="d-flex align-items-center">
            <span class="me-2">Cantidad: ${item.cantidad}</span>
            <div class="carrito-item-price">$${subtotal.toLocaleString('es-AR')}</div>
          </div>
        </div>
        <button class="carrito-item-remove" onclick="eliminarDelCarrito(${index})">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
  });
  
  carritoItemsContainer.innerHTML = itemsHTML;
  carritoTotalElement.textContent = `$${total.toLocaleString('es-AR')}`;
}

// Calcular total del carrito
function calcularTotal() {
  return carritoItems.reduce((total, item) => total + (item.precio * item.cantidad), 0);
}

// Eliminar producto del carrito
function eliminarDelCarrito(index) {
  if (carritoItems[index].cantidad > 1) {
    carritoItems[index].cantidad--;
  } else {
    carritoItems.splice(index, 1);
  }
  
  // Guardar en localStorage
  localStorage.setItem('carrito', JSON.stringify(carritoItems));
  
  // Actualizar UI
  actualizarContadorCarrito();
  actualizarCarrito();
}

// Mostrar/ocultar carrito
function toggleCarrito() {
  document.getElementById('carrito').classList.toggle('show');
  document.getElementById('carrito-overlay').classList.toggle('show');
  
  // Evitar scroll en el body cuando el carrito está abierto
  if (document.getElementById('carrito').classList.contains('show')) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
}

// Cerrar el carrito
function cerrarCarrito() {
  document.getElementById('carrito').classList.remove('show');
  document.getElementById('carrito-overlay').classList.remove('show');
  document.body.style.overflow = '';
}

// Toggle del menú en móviles
function toggleMenu() {
  document.getElementById('navbarNav').classList.toggle('show');
}

// Inicializar el slider
function initSlider() {
  const slides = document.querySelectorAll('.slide');
  const dots = document.querySelectorAll('.dot');
  let currentSlide = 0;
  
  // Función para mostrar slide específico
  function showSlide(n) {
    // Ocultar todos los slides
    slides.forEach(slide => {
      slide.classList.remove('active');
    });
    
    // Desactivar todos los dots
    dots.forEach(dot => {
      dot.classList.remove('active');
    });
    
    // Activar el slide y dot correspondiente
    slides[n].classList.add('active');
    dots[n].classList.add('active');
    
    // Actualizar slide actual
    currentSlide = n;
  }
  
  // Función para avanzar al siguiente slide
  function nextSlide() {
    currentSlide = (currentSlide + 1) % slides.length;
    showSlide(currentSlide);
  }
  
  // Añadir eventos a los dots
  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      showSlide(index);
    });
  });
  
  // Iniciar slider automático
  setInterval(nextSlide, 5000);
}

// Actualizar copyright con el año actual
function updateCopyright() {
  const year = new Date().getFullYear();
  document.getElementById('copyright-text').textContent = `© ${year} Perfumes Géminis. Todos los derechos reservados.`;
}

// Función para capitalizar primera letra
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}