# OptiCut 3D

OptiCut 3D es una herramienta web para optimizar el aprovechamiento de material al planificar cortes en planchas, láminas o paneles. Permite ingresar piezas, definir dimensiones de la plancha y obtener una distribución automática que minimiza el desperdicio.

## ¿Qué hace este proyecto?

Esta aplicación ayuda a resolver un problema común en producción y manufactura: cómo ubicar múltiples piezas dentro de una plancha de manera eficiente. El sistema utiliza un algoritmo de empaquetado 2D para posicionar las piezas y mostrar una vista visual del resultado.

## Características principales

- Ingreso de dimensiones de la plancha.
- Registro de piezas a cortar con nombre, medidas y cantidad.
- Cálculo automático de distribución de cortes.
- Visualización 3D del resultado sobre la plancha.
- Cálculo de aprovechamiento y desperdicio estimado.
- Navegación entre múltiples planchas generadas.
- Exportación del resultado a PDF.
- Soporte para kerf o pérdida por corte.

## Instalación

1. Clona este repositorio:
   ```bash
   git clone <url-del-repositorio>
   cd optimizador_de_cortes
   ```
   
## Uso

Inicia la aplicación en modo desarrollo:

```
Con Live Server
```

Esto abrirá la interfaz en tu navegador. Desde allí puedes:

1. Definir las dimensiones de la plancha.
2. Agregar las piezas que deseas cortar.
3. Presionar "Calcular Optimización".
4. Revisar la distribución en pantalla y exportar el reporte si lo deseas.

## A quién le puede servir

Este proyecto es útil para personas y empresas que trabajan con:

- Talleres de carpintería y ebanistería.
- Industria metalmecánica.
- Fabricación de muebles y mobiliario.
- Empresas de corte láser, CNC o de agua.
- Producción de vidrio, plástico, aluminio o paneles.
- Estudiantes y profesionales de ingeniería industrial, diseño industrial o manufactura.

## Tecnologías utilizadas

- HTML, CSS y JavaScript.
- Webpack para la construcción del proyecto.
- Three.js para la visualización 3D.
- jsPDF y html2canvas para la generación de reportes PDF.

## Nota

Este proyecto está pensado como una herramienta práctica para apoyar la toma de decisiones en el proceso de corte y aprovechamiento de material, especialmente cuando se busca reducir desperdicios y mejorar la organización de la producción.
