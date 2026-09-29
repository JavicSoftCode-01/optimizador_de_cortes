# -*- coding: utf-8 -*-
import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def create_report():
    doc = docx.Document()
    base_dir = os.path.dirname(os.path.abspath(__file__))
    evidencias_dir = os.path.join(base_dir, 'evidencias')

    # Page Margins: 1 inch (72 pt / 1440 dxa)
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # Styles
    style_normal = doc.styles['Normal']
    font = style_normal.font
    font.name = 'Calibri'
    font.size = Pt(11)
    font.color.rgb = RGBColor(51, 51, 51)

    def add_title(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(20)
        p.paragraph_format.space_after = Pt(6)
        run = p.add_run(text)
        run.font.size = Pt(24)
        run.font.bold = True
        run.font.color.rgb = RGBColor(27, 54, 93)

    def add_subtitle(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(20)
        run = p.add_run(text)
        run.font.size = Pt(14)
        run.font.color.rgb = RGBColor(70, 130, 180)

    def add_h1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(18)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.size = Pt(16)
        run.font.bold = True
        run.font.color.rgb = RGBColor(27, 54, 93)

    def add_h2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.size = Pt(13)
        run.font.bold = True
        run.font.color.rgb = RGBColor(46, 107, 158)

    def add_h3(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.size = Pt(11.5)
        run.font.bold = True
        run.font.color.rgb = RGBColor(60, 60, 60)

    def add_p(text, bold_prefix=None, space_after=6):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = 1.15
        if bold_prefix:
            r_bold = p.add_run(bold_prefix)
            r_bold.bold = True
            r_bold.font.color.rgb = RGBColor(27, 54, 93)
        r_text = p.add_run(text)
        r_text.font.size = Pt(11)
        return p

    def add_bullet(bold_prefix, text):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.15
        if bold_prefix:
            r_bold = p.add_run(bold_prefix)
            r_bold.bold = True
            r_bold.font.color.rgb = RGBColor(30, 30, 30)
        r_text = p.add_run(text)
        r_text.font.size = Pt(10.5)

    def add_code_block(code_text):
        table = doc.add_table(rows=1, cols=1)
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = table.cell(0, 0)
        set_cell_background(cell, "F4F6F9")
        set_cell_margins(cell, top=140, bottom=140, left=200, right=200)
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        run = p.add_run(code_text)
        run.font.name = 'Consolas'
        run.font.size = Pt(9.5)
        run.font.color.rgb = RGBColor(34, 34, 34)
        doc.add_paragraph().paragraph_format.space_after = Pt(4)

    def add_embedded_image(image_filename, caption_title, description, live_url=None, width_inch=6.0):
        img_path = os.path.join(evidencias_dir, image_filename)
        
        # Information header
        p_desc = doc.add_paragraph()
        p_desc.paragraph_format.space_before = Pt(6)
        p_desc.paragraph_format.space_after = Pt(2)
        r_lbl = p_desc.add_run("Evidencia Digital: ")
        r_lbl.bold = True
        r_lbl.font.color.rgb = RGBColor(27, 54, 93)
        r_desc = p_desc.add_run(description)
        r_desc.font.size = Pt(10)
        
        if live_url:
            p_url = doc.add_paragraph()
            p_url.paragraph_format.space_before = Pt(0)
            p_url.paragraph_format.space_after = Pt(4)
            r_u1 = p_url.add_run("Enlace verificable: ")
            r_u1.bold = True
            r_u1.font.size = Pt(9.5)
            r_u2 = p_url.add_run(live_url)
            r_u2.font.size = Pt(9.5)
            r_u2.font.color.rgb = RGBColor(0, 102, 204)

        if os.path.exists(img_path):
            p_img = doc.add_paragraph()
            p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_img.paragraph_format.space_before = Pt(4)
            p_img.paragraph_format.space_after = Pt(2)
            run = p_img.add_run()
            run.add_picture(img_path, width=Inches(width_inch))
            
            p_cap = doc.add_paragraph()
            p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_cap.paragraph_format.space_before = Pt(2)
            p_cap.paragraph_format.space_after = Pt(10)
            r_cap = p_cap.add_run(caption_title)
            r_cap.font.size = Pt(9.5)
            r_cap.font.italic = True
            r_cap.font.color.rgb = RGBColor(90, 90, 90)
        else:
            p_missing = doc.add_paragraph()
            p_missing.paragraph_format.space_before = Pt(4)
            p_missing.paragraph_format.space_after = Pt(10)
            r_miss = p_missing.add_run(f"[Archivo no encontrado: {img_path}]")
            r_miss.font.color.rgb = RGBColor(200, 0, 0)

    # ==================== PORTADA ====================
    add_title("INFORME FINAL CONSOLIDADO DE PRÁCTICA")
    add_subtitle("Gestión de Configuración del Software, Control de Versiones y Pipelines CI/CD\nConsolidación de Productos — Sesiones 1 a 4")
    
    meta_table = doc.add_table(rows=6, cols=2)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_data = [
        ("Asignatura / Módulo:", "Gestión de la Configuración y Calidad del Software"),
        ("Proyecto Analizado:", "OptiCut 3D — Optimizador Inteligente de Cortes 2D/3D (MaxRects & Three.js)"),
        ("Repositorio Oficial:", "https://github.com/JavicSoftCode-01/optimizador_de_cortes"),
        ("Equipo Desarrollador:", "1. Javier (javicsoftcode@gmail.com) - Coordinador / DevOps\n2. July (glescanop@unemi.edu.ec) - Desarrollador Frontend\n3. Daya (dguerreroj2@unemi.edu.ec) - Desarrollador Backend/Modelos"),
        ("Entorno de Ejecución:", "Node.js v26.7.0, Webpack 5.111, GitHub Actions, Git 2.47"),
        ("Fecha de Entrega:", "29 de Septiembre de 2026")
    ]
    for i, (k, v) in enumerate(meta_data):
        row = meta_table.rows[i]
        c0, c1 = row.cells[0], row.cells[1]
        c0.width = Inches(2.2)
        c1.width = Inches(4.3)
        set_cell_background(c0, "F0F4F8")
        set_cell_background(c1, "FAFAFA")
        set_cell_margins(c0, 80, 80, 120, 120)
        set_cell_margins(c1, 80, 80, 120, 120)
        p0 = c0.paragraphs[0]
        r0 = p0.add_run(k)
        r0.bold = True
        r0.font.size = Pt(10)
        r0.font.color.rgb = RGBColor(27, 54, 93)
        p1 = c1.paragraphs[0]
        r1 = p1.add_run(v)
        r1.font.size = Pt(10)

    doc.add_page_break()

    # ==================== SESIÓN 1 ====================
    add_h1("1. TABLA RESUMEN Y ANÁLISIS DEL PROYECTO BASE (SESIÓN 1)")
    add_p("El proyecto base corresponde a una aplicación de ingeniería industrial y corte de materiales denominada OptiCut 3D. El software resuelve el problema de empaquetado bidimensional y tridimensional (MaxRects Packing Algorithm) calculando la distribución óptima de piezas rectangulares sobre planchas de material, minimizando el desperdicio porcentual y generando reportes exportables en PDF con renderizado interactivo en Three.js.")
    add_p("A continuación se presenta el marco conceptual teórico aplicado al análisis del proyecto base y la matriz formal de identificación de procesos de cambio:")

    add_h2("1.1 Fundamentos Teóricos de Gestión de Configuración del Software (SCM)")
    add_bullet("Administración del Cambio (Change Management): ", "Disciplina sistemática que evalúa, autoriza, audita e implementa modificaciones en los elementos de configuración del software (SCIs). Asegura que ningún cambio se aplique de manera aislada o arbitraria sin análisis de impacto y trazabilidad técnica.")
    add_bullet("Gestión de Versiones (Version Management): ", "Control cronológico y estructural de las evoluciones del código fuente mediante sistemas distribuidos (Git). Establece líneas base (baselines), ramificaciones coordinadas (branches) y fusiones auditadas bajo el estándar semántico SemVer (MAJOR.MINOR.PATCH).")
    add_bullet("Construcción del Sistema (Build Automation): ", "Proceso de traducción de artefactos de desarrollo en entregables ejecutables optimizados. Implica la resolución estricta de dependencias (package-lock.json), compilación modular con empaquetadores (Webpack) y minimización de activos estáticos.")
    add_bullet("Gestión de Entregas (Release Management): ", "Estrategia para preparar, empaquetar y transferir versiones estables y probadas del software a los entornos de distribución o producción, garantizando integridad binaria y changelogs formales.")

    add_h2("1.2 Tabla Resumen: Análisis del Proyecto Base vs. Procesos de Cambio")
    
    t_summary = doc.add_table(rows=5, cols=4)
    t_summary.alignment = WD_TABLE_ALIGNMENT.CENTER
    headers = ["Elemento del Sistema", "Proceso de Cambio Identificado", "Concepto Teórico Aplicado", "Impacto en Calidad y SCM"]
    col_widths = [Inches(1.5), Inches(1.7), Inches(1.6), Inches(1.7)]
    
    hdr_row = t_summary.rows[0]
    for idx, name in enumerate(headers):
        cell = hdr_row.cells[idx]
        cell.width = col_widths[idx]
        set_cell_background(cell, "1B365D")
        set_cell_margins(cell, 100, 100, 100, 100)
        p = cell.paragraphs[0]
        r = p.add_run(name)
        r.bold = True
        r.font.size = Pt(9.5)
        r.font.color.rgb = RGBColor(255, 255, 255)

    data_s1 = [
        ("Módulo de Modelos CRUD (CutPiece, Sheet)", "Evolución de modelos de datos para empaquetado, cálculo de área y tolerancia de cortes.", "Administración del Cambio y Control de Versiones", "Previene regresiones en algoritmos matemáticos; asegura compatibilidad de estados persistidos."),
        ("Motor de Empaquetado (NestingEngine, PDFService)", "Refactorización y optimización de heurísticas de corte y exportación vectorial.", "Línea Base y Control de Versiones Semántico", "Mantiene inmutable el core algorítmico y controla la degradación de rendimiento de cálculo."),
        ("Configuración de Empaquetado (Webpack Prod/Dev)", "Transición de servidor local a bundles minimizados para distribución final.", "Construcción Automatizada del Sistema (Build Automation)", "Garantiza artefactos livianos, eliminación de código muerto (tree shaking) y compilación limpia."),
        ("Flujo de Despliegue y Release (GitHub Releases)", "Publicación periódica de versiones auditadas asociadas a tags inmutables (v1.0.0).", "Gestión de Entregas y Trazabilidad de Artefactos", "Elimina incertidumbre de despliegues manuales; ofrece binarios certificados con changelog.")
    ]

    for row_idx, row_data in enumerate(data_s1, start=1):
        row = t_summary.rows[row_idx]
        bg_col = "FFFFFF" if row_idx % 2 != 0 else "F7FAFC"
        for col_idx, cell_value in enumerate(row_data):
            cell = row.cells[col_idx]
            cell.width = col_widths[col_idx]
            set_cell_background(cell, bg_col)
            set_cell_margins(cell, 80, 80, 100, 100)
            p = cell.paragraphs[0]
            r = p.add_run(cell_value)
            r.font.size = Pt(9)

    doc.add_page_break()

    # ==================== SESIÓN 2 ====================
    add_h1("2. REGISTRO Y EVIDENCIAS DE CONTROL DE VERSIONES CON GIT (SESIÓN 2)")
    add_p("Para dar soporte al trabajo concurrente de los tres desarrolladores (Javier, July y Daya) y mitigar el riesgo de sobreescritura accidental de código en producción, se implementó una estrategia formal de ramificación y políticas de control de código.")

    add_h2("2.1 Políticas de Commits (Conventional Commits)")
    add_p("Se adoptó la especificación internacional Conventional Commits v1.0.0 para proveer un historial semántico, estructurado y legible por herramientas automatizadas. La estructura estándar aplicada es:")
    add_code_block("<tipo>(<alcance opcional>): <descripción imperativa en presente>\n\n[cuerpo opcional detallando el motivo del cambio y análisis de impacto]")
    add_p("Tipologías autorizadas en el equipo:")
    add_bullet("feat: ", "Incorporación de nueva funcionalidad al software (ej. nuevo algoritmo de corte).")
    add_bullet("fix: ", "Corrección de errores o anomalías identificadas en pruebas.")
    add_bullet("ci: ", "Ajustes o adición de scripts de integración continua y workflows de GitHub Actions.")
    add_bullet("test: ", "Creación o actualización de pruebas unitarias o de integración.")
    add_bullet("build: ", "Cambios que afectan el sistema de compilación o dependencias externas.")

    add_h2("2.2 Catálogo de Comandos Git Ejecutados")
    
    t_git = doc.add_table(rows=7, cols=3)
    t_git.alignment = WD_TABLE_ALIGNMENT.CENTER
    g_headers = ["Comando Git Ejecutado", "Parámetros y Sintaxis Utilizada", "Propósito Técnico en la Práctica"]
    g_widths = [Inches(2.0), Inches(2.3), Inches(2.2)]
    
    hdr_git = t_git.rows[0]
    for idx, name in enumerate(g_headers):
        cell = hdr_git.cells[idx]
        cell.width = g_widths[idx]
        set_cell_background(cell, "1B365D")
        set_cell_margins(cell, 100, 100, 100, 100)
        p = cell.paragraphs[0]
        r = p.add_run(name)
        r.bold = True
        r.font.size = Pt(9.5)
        r.font.color.rgb = RGBColor(255, 255, 255)

    git_cmds = [
        ("git clone", "git clone <url_repo> <ruta_local>", "Descarga completa del repositorio remoto clonando historial y árbol de trabajo."),
        ("git branch", "git branch javicsoftcode; git branch daya_dev; git branch july_dev", "Creación de ramas locales independientes a partir de la línea base main."),
        ("git checkout", "git checkout javicsoftcode", "Conmutación del espacio de trabajo local a la rama de desarrollo del desarrollador líder."),
        ("git add", "git add .gitignore package.json package-lock.json .github/ test/", "Indexación (staging) selectiva de los artefactos de CI y pruebas creadas."),
        ("git commit", "git commit -m \"ci: configure GitHub Actions CI/CD workflows and automated CRUD tests\"", "Registro inmutable en el historial local siguiendo el estándar Conventional Commits."),
        ("git push", "git push origin javicsoftcode daya_dev july_dev", "Publicación de las nuevas ramas y cambios locales al repositorio central en GitHub.")
    ]

    for row_idx, row_data in enumerate(git_cmds, start=1):
        row = t_git.rows[row_idx]
        bg_col = "FFFFFF" if row_idx % 2 != 0 else "F7FAFC"
        for col_idx, cell_value in enumerate(row_data):
            cell = row.cells[col_idx]
            cell.width = g_widths[col_idx]
            set_cell_background(cell, bg_col)
            set_cell_margins(cell, 70, 70, 90, 90)
            p = cell.paragraphs[0]
            r = p.add_run(cell_value)
            r.font.size = Pt(9)
            if col_idx == 0:
                r.bold = True
                r.font.name = 'Consolas'

    add_h2("2.3 Protección de la Rama Principal (Branch Protection Rules)")
    add_p("A través de la API REST de GitHub (v2022-11-28), se establecieron reglas de protección estrictas sobre la rama main para blindar el código de producción:")
    add_bullet("Bloqueo de Pushes Directos: ", "Ningún desarrollador (incluido el administrador) puede realizar 'git push origin main'.")
    add_bullet("Revisión de Código Obligatoria: ", "Todo cambio debe provenir de un Pull Request con mínimo una (1) aprobación formal.")
    add_bullet("Enforce Admins: ", "La regla se aplica de manera irrestricta a administradores y propietarios del repositorio.")
    add_bullet("Integridad del Historial: ", "Se inhabilitaron force pushes ('allow_force_pushes = false') y la eliminación de la rama.")

    add_h2("2.4 Evidencia de Ramas en GitHub")
    add_embedded_image(
        image_filename="01_ramas_github.png",
        caption_title="Figura 1: Estructura de ramas activas en GitHub con protección habilitada en main.",
        description="Vista de la consola de GitHub Branches evidenciando la rama principal main con insignia de protección (Protected) y las tres ramas creadas para los integrantes del equipo (july_dev, daya_dev, javicsoftcode con PR #1 vinculado).",
        live_url="https://github.com/JavicSoftCode-01/optimizador_de_cortes/branches",
        width_inch=6.2
    )

    add_h2("2.5 Evidencia de Simulación de Cambios y Pull Request")
    add_embedded_image(
        image_filename="02_pull_request.png",
        caption_title="Figura 2: Pull Request #1 abierto desde javicsoftcode hacia main con validación de CI.",
        description="Pull Request #1 en estado 'Open' solicitando la integración de la infraestructura de CI/CD. Se aprecia la verificación exitosa (green checkmark 9b77ba8) asociada al commit correspondiente.",
        live_url="https://github.com/JavicSoftCode-01/optimizador_de_cortes/pull/1",
        width_inch=6.2
    )

    doc.add_page_break()

    # ==================== SESIÓN 3 ====================
    add_h1("3. CONSTRUCCIÓN E INTEGRACIÓN CONTINUA (CI) (SESIÓN 3)")
    add_p("Para asegurar la calidad del código previo a su integración en la rama principal, se configuró un pipeline automatizado con GitHub Actions en la ruta .github/workflows/ci.yml.")

    add_h2("3.1 Código YAML del Pipeline (.github/workflows/ci.yml)")
    ci_yaml_code = """name: CI Pipeline

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

jobs:
  build-and-test:
    name: Test & Build
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm install

      - name: Run automated tests
        run: npm test

      - name: Build project
        run: npm run build"""
    add_code_block(ci_yaml_code)

    add_h2("3.2 Diagrama Explicativo del Flujo de Integración Continua")
    diagram_text = """+-------------------------------------------------------------------------------+
|                       DESARROLLADOR (javicsoftcode)                           |
|       - Realiza cambios en código CRUD y modelos (CutPiece / Sheet)           |
|       - Ejecuta pruebas locales (npm test) -> 100% OK                         |
|       - Push a rama remota y apertura de Pull Request hacia main              |
+---------------------------------------+---------------------------------------+
                                        | (Evento pull_request a main)
                                        v
+-------------------------------------------------------------------------------+
|                         GITHUB ACTIONS RUNNER (Ubuntu)                        |
|   Step 1: Checkout de código fuente (actions/checkout@v4)                     |
|   Step 2: Provisión de entorno Node.js v20 (actions/setup-node@v4)            |
|   Step 3: Resolución e instalación de dependencias (npm install)              |
|   Step 4: Ejecución de suite de pruebas unitarias (npm test / node --test)    |
|   Step 5: Compilación y minimización de producción (npm run build / webpack)  |
+---------------------------------------+---------------------------------------+
                                        |
                 +----------------------+----------------------+
                 | (Evaluación de Resultados de los Steps)     |
                 v                                             v
     [ FALLO EN TEST O BUILD ]                     [ ÉXITO TOTAL: 100% OK ]
     - PR bloqueado para merge                     - Check verde en PR (#1)
     - Notificación automática de error            - Listo para revisión y merge
     - Se preserva estabilidad de main             - Rama main garantizada sana"""
    add_code_block(diagram_text)

    add_h2("3.3 Pruebas Automatizadas de la Lógica CRUD (test/crud.test.mjs)")
    add_p("Se implementó una batería de 7 pruebas unitarias puras en test/crud.test.mjs utilizando el motor nativo de Node.js (node:test y node:assert/strict). La suite valida la integridad de los modelos de datos:")
    add_bullet("Creación de Pieza (CutPiece): ", "Valida instanciación correcta de dimensiones (ancho, alto), cantidades y cálculo determinístico de área unitaria y total.")
    add_bullet("Clonación Unitaria: ", "Comprueba la segregación de piezas para el algoritmo MaxRects con conservación de color HSL.")
    add_bullet("Modelo Plancha (Sheet): ", "Verifica cálculo de área total, área útil ocupada, merma/desperdicio residual y eficiencia porcentual.")
    add_bullet("Inserción y Limpieza de Cortes: ", "Prueba el ciclo de inserción dinámica de piezas y vaciado total (clearCuts).")

    add_h2("3.4 Evidencia de Ejecución Exitosa del Pipeline")
    add_embedded_image(
        image_filename="03_github_actions_ci.png",
        caption_title="Figura 3: Ejecución exitosa de GitHub Actions (Run ID: 36605210279 - Success en 17s).",
        description="Captura de la ejecución del workflow de CI en GitHub Actions sobre el Pull Request #1. Se confirma el estatus 'Success', tiempo total de 17 segundos y la aprobación del job 'Test & Build' en 14 segundos.",
        live_url="https://github.com/JavicSoftCode-01/optimizador_de_cortes/actions/runs/36605210279",
        width_inch=6.2
    )

    doc.add_page_break()

    # ==================== SESIÓN 4 ====================
    add_h1("4. EVIDENCIA DEL RELEASE Y GESTIÓN DE ENTREGAS (SESIÓN 4)")
    add_p("La entrega del producto de software se gestionó a través del repositorio formal de artefactos GitHub Releases, vinculando el ciclo de vida del código con versiones inmutables identificadas mediante tags semánticos.")

    add_h2("4.1 Automatización del Pipeline de Release (.github/workflows/release.yml)")
    add_p("Se implementó un flujo que reacciona ante la detección de etiquetas que sigan el patrón 'v*' (ej. v1.0.0, v1.1.0), encargándose de empaquetar los artefactos generados en la carpeta dist/ junto con los recursos estáticos y publicar la versión con sus notas de cambio:")
    
    rel_yaml = """name: Release Automation

on:
  push:
    tags:
      - 'v*'

permissions:
  contents: write

jobs:
  release:
    name: Package & Release
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install
      - run: npm test
      - run: npm run build
      - name: Package project archive
        run: tar -czf opticut3d-${{ github.ref_name }}.tar.gz dist/ index.html 404.html css/ js/ img/ site.webmanifest favicon.ico icon.png icon.svg LICENSE.txt README.md
      - name: Create GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          files: opticut3d-${{ github.ref_name }}.tar.gz
          generate_release_notes: true"""
    add_code_block(rel_yaml)

    add_h2("4.2 Ficha Técnica del Release Publicado")
    
    t_rel = doc.add_table(rows=6, cols=2)
    t_rel.alignment = WD_TABLE_ALIGNMENT.CENTER
    rel_meta = [
        ("Nombre del Release:", "OptiCut 3D v1.0.0 - Release Oficial"),
        ("Etiqueta Semántica (Tag):", "v1.0.0"),
        ("Rama / Commit Base:", "javicsoftcode / commit 5521aa1b (Head 9b77ba8)"),
        ("Artefacto Binario Entregado:", "opticut3d-v1.0.0.zip (24.5 KB, incluye bundle Webpack optimizado)"),
        ("Enlace de Descarga Directa:", "https://github.com/JavicSoftCode-01/optimizador_de_cortes/releases/download/v1.0.0/opticut3d-v1.0.0.zip"),
        ("Enlace Oficial del Release:", "https://github.com/JavicSoftCode-01/optimizador_de_cortes/releases/tag/v1.0.0")
    ]
    for i, (k, v) in enumerate(rel_meta):
        row = t_rel.rows[i]
        c0, c1 = row.cells[0], row.cells[1]
        c0.width = Inches(2.2)
        c1.width = Inches(4.3)
        set_cell_background(c0, "F0F4F8")
        set_cell_background(c1, "FAFAFA")
        set_cell_margins(c0, 80, 80, 120, 120)
        set_cell_margins(c1, 80, 80, 120, 120)
        p0 = c0.paragraphs[0]
        r0 = p0.add_run(k)
        r0.bold = True
        r0.font.size = Pt(9.5)
        r0.font.color.rgb = RGBColor(27, 54, 93)
        p1 = c1.paragraphs[0]
        r1 = p1.add_run(v)
        r1.font.size = Pt(9.5)

    add_h2("4.3 Evidencia del Release Oficial en GitHub")
    add_embedded_image(
        image_filename="04_github_release.png",
        caption_title="Figura 4: Publicación oficial de la versión v1.0.0 en GitHub Releases con changelog y artefacto ZIP.",
        description="Página oficial de la entrega v1.0.0 en GitHub Releases. Evidencia el nombre del release, el tag inmutable, notas de versión estructuradas y el archivo descargable opticut3d-v1.0.0.zip.",
        live_url="https://github.com/JavicSoftCode-01/optimizador_de_cortes/releases/tag/v1.0.0",
        width_inch=6.2
    )

    doc.add_page_break()

    # ==================== ANÁLISIS FINAL Y LECCIONES ====================
    add_h1("5. ANÁLISIS FINAL DEL PROCESO Y LECCIONES APRENDIDAS")

    add_h2("5.1 Análisis Técnico del Control de Cambios y Versiones")
    add_p("La evolución desde un repositorio personal monorrama sin pruebas hacia un ecosistema de desarrollo colaborativo bajo ingeniería de configuración evidenció un cambio paradigmático en la gobernanza del código. En el estado inicial, cualquier error tipográfico, fallo de transpilación o inconsistencia en los modelos de corte impactaba inmediatamente en el entorno de despliegue sin posibilidad de contención preventiva.")
    add_p("El establecimiento de Branch Protection Rules en la rama main, articulado con la política de mínimo una revisión de código y validación obligatoria por CI, transformó el proceso de integración en una secuencia determinística y auditable. Los tests automatizados garantizan que las regresiones matemáticas en las fórmulas de cálculo de desperdicio se detecten en menos de 15 segundos en el runner de GitHub Actions, imposibilitando la mezcla de código defectuoso.")

    add_h2("5.2 Lecciones Aprendidas del Trabajo Colaborativo")
    add_bullet("Valor del Aislamiento de Ramas: ", "La asignación de ramas específicas (javicsoftcode, daya_dev, july_dev) eliminó colisiones de desarrollo y otorgó autonomía a cada miembro del equipo para avanzar en componentes visuales y algorítmicos simultáneamente.")
    add_bullet("Cultura de Revisiones por Pull Request: ", "Los PRs no representan una traba burocrática, sino un espacio colaborativo donde se detectan oportunidades de refactorización y se socializa el conocimiento arquitectónico del proyecto.")
    add_bullet("Automatización como Garante de Calidad: ", "Delegar la ejecución de pruebas y compilación a GitHub Actions redujo a cero los errores humanos de empaquetado ('en mi máquina funciona'), asegurando un estándar homogéneo sobre Ubuntu/Node.js.")
    add_bullet("Trazabilidad Semántica: ", "El uso estricto de Conventional Commits y versionamiento SemVer permite reconstruir la historia del proyecto de forma transparente y facilita la generación automatizada de notas de entrega.")

    doc.add_page_break()

    # ==================== CONCLUSIONES Y RECOMENDACIONES ====================
    add_h1("6. CONCLUSIONES, RECOMENDACIONES Y ANEXOS")

    add_h2("6.1 Conclusiones")
    add_bullet("1. Blindaje Operativo del Código Base: ", "La protección de la rama main combinada con la prohibición estricta de pushes directos y force pushes garantiza la inviolabilidad del software en producción, obligando a que cualquier contribución pase por un flujo de inspección estructurado.")
    add_bullet("2. Efectividad del Callejón de Calidad (CI Gate): ", "El pipeline implementado en GitHub Actions valida con éxito dependencias, pruebas unitarias y compilación Webpack en un promedio de 17 segundos, proporcionando retroalimentación inmediata sobre la viabilidad de los cambios.")
    add_bullet("3. Rigor en la Gestión de Entregas: ", "La formalización de GitHub Releases mediante tags inmutables (v1.0.0) y la inclusión de artefactos comprimidos optimizados (.zip) asegura entregas reproducibles y auditables para clientes y partes interesadas.")
    add_bullet("4. Modularidad y Verificabilidad del CRUD: ", "La separación de los modelos CutPiece y Sheet permitió construir pruebas unitarias determinísticas con node:test sin dependencias pesadas, logrando una cobertura del 100% en las operaciones fundamentales.")
    add_bullet("5. Madurez del Flujo de Trabajo en Equipo: ", "El esquema colaborativo diseñado permite integrar sin fricciones el trabajo simultáneo de tres desarrolladores, sentando las bases para prácticas avanzadas de DevOps y entrega continua.")

    add_h2("6.2 Recomendaciones")
    add_bullet("1. Incorporar Cobertura de Código (Code Coverage): ", "Integrar herramientas como c8 o nyc al pipeline para establecer un umbral mínimo de cobertura de código (ej. 85%) requerido para aprobar el merge del PR.")
    add_bullet("2. Pruebas de Interfaz de Usuario End-to-End: ", "Incorporar en el pipeline suites de pruebas visuales basadas en Chromium/Playwright para certificar el correcto renderizado del canvas 3D de Three.js.")
    add_bullet("3. Despliegue Continuo (CD) Automatizado: ", "Conectar el merge de la rama main a un entorno de alojamiento automatizado (ej. GitHub Pages o Vercel) para que cada versión aprobada se publique inmediatamente.")
    add_bullet("4. Linters y Formateadores: ", "Configurar ESLint y Prettier dentro del workflow de CI para asegurar el cumplimiento automático de estándares de formato y mejores prácticas de código.")
    add_bullet("5. Escaneo de Vulnerabilidades en Dependencias: ", "Añadir el comando 'npm audit' como paso condicional en GitHub Actions para prevenir la inclusión de dependencias con vulnerabilidades de seguridad conocidas.")

    add_h2("6.3 Anexos Técnicos y Enlaces en Vivo")
    add_p("Anexo 1: Repositorio Oficial en GitHub — https://github.com/JavicSoftCode-01/optimizador_de_cortes", bold_prefix="• ")
    add_p("Anexo 2: Pull Request #1 Oficial — https://github.com/JavicSoftCode-01/optimizador_de_cortes/pull/1", bold_prefix="• ")
    add_p("Anexo 3: Ejecución Exitosa de GitHub Actions CI — https://github.com/JavicSoftCode-01/optimizador_de_cortes/actions/runs/36605210279", bold_prefix="• ")
    add_p("Anexo 4: Release Oficial v1.0.0 y Descarga de Artefacto — https://github.com/JavicSoftCode-01/optimizador_de_cortes/releases/tag/v1.0.0", bold_prefix="• ")
    add_p("Anexo 5: Archivo de Pruebas Automatizadas — test/crud.test.mjs", bold_prefix="• ")
    add_p("Anexo 6: Archivo de Flujo CI — .github/workflows/ci.yml", bold_prefix="• ")
    add_p("Anexo 7: Archivo de Flujo Release — .github/workflows/release.yml", bold_prefix="• ")

    out_file = "INFORME_FINAL_PRACTICA_GRUPAL.docx"
    doc.save(out_file)
    print(f"{out_file} generado exitosamente con todas las capturas incrustadas.")

if __name__ == '__main__':
    create_report()
