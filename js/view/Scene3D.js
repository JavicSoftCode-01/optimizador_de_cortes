/**
 * Clase vista encargada del Renderizado 3D interactivo con Three.js.
 * Gestiona la escena, luces, cámara, materiales metálicos y la geometría de las piezas.
 */
export class Scene3D {
  /**
   * @param {string} containerId - ID del contenedor HTML donde se insertará el Canvas 3D.
   */
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error(`Error: Contenedor #${containerId} no encontrado en el DOM.`);
      return;
    }

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.sheetGroup = null; // Grupo que contendrá la plancha y sus cortes actualizables

    this.init();
  }

  /**
   * Inicializa el entorno Three.js (Escena, Cámara, Luces, Renderizador y Eventos)
   */
  init() {
    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 500;

    // 1. Escena 3D
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0f172a); // Coincide con la paleta Dark Mode

    // 2. Cámara Perspectiva
    this.camera = new THREE.PerspectiveCamera(45, width / height, 1, 50000);
    this.camera.position.set(0, -2500, 3000);

    // 3. Renderizador WebGL
    this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Limpiar contenido previo e insertar Canvas
    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    // 4. Controles de Cámara (OrbitControls)
    const OrbitControlsClass = THREE.OrbitControls || window.OrbitControls;
    if (OrbitControlsClass) {
      this.controls = new OrbitControlsClass(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.maxPolarAngle = Math.PI / 2 + 0.1; // Evita atravesar el suelo
    }

    // 5. Sistema de Iluminación Industrial
    this.setupLights();

    // 6. Grupo contenedor principal
    this.sheetGroup = new THREE.Group();
    this.scene.add(this.sheetGroup);

    // 7. Evento de redimensionamiento de ventana
    window.addEventListener('resize', () => this.onWindowResize());

    // 8. Bucle de animación
    this.animate();
  }

  /**
   * Configura las luces de la escena para resaltar el brillo metálico
   */
  setupLights() {
    // Luz Ambiental suave
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    // Luz Direccional Principal (Sol/Reflector)
    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight1.position.set(2000, 3000, 4000);
    dirLight1.castShadow = true;
    this.scene.add(dirLight1);

    // Luz de Relleno Contrapuesta
    const dirLight2 = new THREE.DirectionalLight(0x3b82f6, 0.4);
    dirLight2.position.set(-2000, -2000, -1000);
    this.scene.add(dirLight2);
  }

  /**
   * Renderiza una Plancha Metálica y la distribución de sus cortes
   * @param {import('../models/Sheet.js').Sheet} sheet
   */
  renderSheet(sheet) {
    if (!sheet) return;

    // Limpiar renderizado anterior dentro del grupo
    while (this.sheetGroup.children.length > 0) {
      const obj = this.sheetGroup.children[0];
      if (obj.geometry) obj.geometry.dispose();
      this.sheetGroup.remove(obj);
    }

    const sWidth = sheet.width;
    const sHeight = sheet.height;
    const sThickness = sheet.thickness;

    // --- A. CONSTRUCCIÓN DE LA PLANCHA BASE (METAL) ---
    const sheetGeo = new THREE.BoxGeometry(sWidth, sHeight, sThickness);

    // Material Metálico Realista
    const sheetMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,       // Gris metal
      metalness: 0.8,        // Alto nivel metálico
      roughness: 0.3,        // Ligera reflexión
      wireframe: false
    });

    const sheetMesh = new THREE.Mesh(sheetGeo, sheetMat);
    sheetMesh.receiveShadow = true;
    this.sheetGroup.add(sheetMesh);

    // Borde de la plancha base
    const sheetEdges = new THREE.EdgesGeometry(sheetGeo);
    const sheetLine = new THREE.LineSegments(
      sheetEdges,
      new THREE.LineBasicMaterial({ color: 0x334155, linewidth: 2 })
    );
    this.sheetGroup.add(sheetLine);

    // --- B. CONSTRUCCIÓN Y POSICIONAMIENTO DE CORTES ---
    sheet.placedCuts.forEach((placement) => {
      const piece = placement.cutPiece;
      const isRotated = placement.rotated;

      // Ancho y Alto según orientación calculada
      const pWidth = isRotated ? piece.height : piece.width;
      const pHeight = isRotated ? piece.width : piece.height;
      const pThickness = sThickness + 1.5; // Sobresale sutilmente para destacar

      // Geometría del corte
      const pieceGeo = new THREE.BoxGeometry(pWidth, pHeight, pThickness);

      // Convertir color HSL/Hex a Three.Color
      const pieceColor = new THREE.Color(piece.color);
      const pieceMat = new THREE.MeshStandardMaterial({
        color: pieceColor,
        metalness: 0.5,
        roughness: 0.4
      });

      const pieceMesh = new THREE.Mesh(pieceGeo, pieceMat);

      // Mapeo de Coordenadas:
      // Convertir origen (0,0) de esquina inferior-izquierda 2D a centro (0,0,0) en 3D
      const posX = -sWidth / 2 + placement.x + pWidth / 2;
      const posY = -sHeight / 2 + placement.y + pHeight / 2;
      const posZ = 0.8; // Desplazamiento en Z

      pieceMesh.position.set(posX, posY, posZ);
      pieceMesh.castShadow = true;
      pieceMesh.receiveShadow = true;

      this.sheetGroup.add(pieceMesh);

      // Bordes definidos para cada corte
      const pieceEdges = new THREE.EdgesGeometry(pieceGeo);
      const pieceLine = new THREE.LineSegments(
        pieceEdges,
        new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1.5 })
      );
      pieceLine.position.set(posX, posY, posZ);
      this.sheetGroup.add(pieceLine);
    });

    // --- C. AJUSTE AUTOMÁTICO DE CÁMARA Y ENFOQUE ---
    this.centerCameraOnSheet(sWidth, sHeight);
  }

  /**
   * Reencuadra la cámara para adaptar la vista a las dimensiones de la plancha actual.
   * Ajusta dinámicamente el rango de visión para no perder la plancha si se ingresan medidas gigantes.
   */
  centerCameraOnSheet(width, height) {
    const maxDim = Math.max(width, height);
    const aspect = (this.container.clientWidth || 800) / (this.container.clientHeight || 500);

    const fovInRad = (this.camera.fov * Math.PI) / 180;
    const distanceH = (height / 2) / Math.tan(fovInRad / 2);
    const distanceW = (width / 2) / (Math.tan(fovInRad / 2) * aspect);
    const distance = Math.max(distanceH, distanceW) * 1.25;

    // Ajustar dinámicamente el far clipping plane
    this.camera.far = Math.max(500000, distance * 10);
    this.camera.updateProjectionMatrix();

    // Vista con perspectiva 3D elegante e inclinación suavizada (0.3 Y, 1.2 Z)
    this.camera.position.set(0, -distance * 0.35, distance * 1.15);
    this.camera.lookAt(0, 0, 0);

    if (this.controls) {
      this.controls.target.set(0, 0, 0);
      this.controls.update();
    }
  }


  /**
   * Reajusta la proporción del render cuando cambia el tamaño de la pantalla
   */
  onWindowResize() {
    if (!this.container || !this.renderer || !this.camera) return;

    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * Bucle continuo de renderizado (60 FPS)
   */
  animate() {
    requestAnimationFrame(() => this.animate());

    if (this.controls) {
      this.controls.update();
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }
}
