# Aplicación de Prueba de Kolmogorov-Smirnov

Esta aplicación web permite realizar la prueba de Kolmogorov-Smirnov para determinar si un conjunto de datos sigue una distribución teórica específica (Normal, Uniforme o Exponencial).

## Requisitos Previos

- Python 3.7 o superior
- pip (gestor de paquetes de Python)

## Instalación

1. **Clonar el repositorio** (si lo tienes en un repositorio) o descargar los archivos.

2. **Crear un entorno virtual** (recomendado):
   ```bash
   python -m venv venv
   ```

3. **Activar el entorno virtual**:
   - En Windows:
     ```
     .\venv\Scripts\activate
     ```
   - En macOS/Linux:
     ```bash
     source venv/bin/activate
     ```

4. **Instalar las dependencias**:
   ```bash
   pip install -r requirements.txt
   ```

## Ejecución de la Aplicación

1. **Iniciar el servidor Flask**:
   ```bash
   python app.py
   ```

2. **Abrir el navegador** y navegar a:
   ```
   http://127.0.0.1:5000/
   ```

## Cómo Usar la Aplicación

### 1. Ingresar Datos

Puedes cargar datos de dos formas:

#### Opción A: Ingresar datos manualmente
1. En el área de texto, ingresa los valores numéricos separados por comas o espacios.
   Ejemplo: `1.2, 2.5, 3.1, 4.8, 5.2`

#### Opción B: Cargar un archivo CSV
1. Haz clic en "Seleccionar archivo" o arrastra un archivo CSV al área designada.
2. El archivo debe contener una columna de datos numéricos (puede tener encabezado).

> **Nota:** No puedes usar ambas opciones simultáneamente. Si lo haces, verás un mensaje de advertencia.

### 2. Seleccionar la Distribución

Elige la distribución teórica contra la que deseas comparar tus datos:
- **Normal**: Para datos con distribución en forma de campana.
- **Uniforme**: Para datos distribuidos equitativamente en un rango.
- **Exponencial**: Para datos que disminuyen exponencialmente.

### 3. Analizar los Datos

1. Haz clic en el botón "Analizar Datos".
2. Espera a que se procese la información (verás un indicador de carga).

### 4. Interpretar los Resultados

La aplicación mostrará:

- **Estadístico D**: Medida de la máxima diferencia entre las funciones de distribución.
- **Valor p**: Probabilidad de obtener un estadístico al menos tan extremo como el observado.

**Interpretación del valor p:**
- **p > 0.05**: No hay evidencia suficiente para rechazar la hipótesis nula (los datos podrían seguir la distribución).
- **p ≤ 0.05**: Se rechaza la hipótesis nula (los datos no siguen la distribución).

Además, verás:
- Un gráfico con la distribución de los datos.
- Estadísticas descriptivas (media, desviación estándar, mínimo, máximo).

## Archivos de Ejemplo

En la carpeta `ejemplos/` encontrarás archivos CSV de ejemplo:
- `datos_ejemplo_normal.csv`: Datos que siguen una distribución normal.
- `datos_ejemplo_uniforme.csv`: Datos con distribución uniforme.

## Solución de Problemas

- **Error al cargar el archivo**: Asegúrate de que el archivo CSV contenga solo números y esté en el formato correcto.
- **No se muestran resultados**: Verifica que hayas ingresado al menos 5 puntos de datos.
- **Error en el servidor**: Revisa la consola donde ejecutaste `app.py` para ver mensajes de error detallados.

## Tecnologías Utilizadas

- **Backend**: Python, Flask
- **Frontend**: HTML, CSS (Bootstrap), JavaScript (Chart.js)
- **Análisis estadístico**: SciPy, NumPy

## Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo `LICENSE` para más información.

---

Desarrollado por [Tu Nombre] - 2025
