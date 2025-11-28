# 🔍 Análisis de Sesgos - Scoring Turing

Dashboard interactivo para detectar y visualizar sesgos algorítmicos en el modelo de scoring crediticio "Scoring Turing".

## 🎯 Objetivo

Demostrar mediante visualizaciones interactivas en D3.js cómo el modelo discrimina por:
- Nacionalidad
- Comuna (ubicación geográfica)
- Edad
- Etnia
- Sexo

## 📊 Demo en Vivo

🔗 **[Ver Dashboard](https://TU_USUARIO.github.io/taller7/web/)**

## 🛠️ Tecnologías

- **D3.js v7** - Visualización de datos
- **Python** - ETL y análisis de datos
- **SQLAlchemy** - Conexión a base de datos
- **HTML/CSS/JavaScript** - Frontend

## 📁 Estructura del Proyecto

```
taller7/
├── web/                           # Frontend
│   ├── index.html                 # Dashboard principal
│   ├── script.js                  # Visualizaciones D3.js
│   ├── styles.css                 # Estilos
│   └── datos_consolidados.json    # Dataset (10,000 clientes)
│
├── etl_banco.py                   # Script ETL principal
├── consolidar_datos.py            # Consolidación BD + API
├── analizar_sesgos.py             # Análisis estadístico
└── RESUMEN_SESGOS.md             # Reporte de hallazgos

```

## 🚀 Uso Local

### Opción 1: Live Server (VS Code)
1. Instala la extensión "Live Server" en VS Code
2. Abre `web/index.html`
3. Click derecho → "Open with Live Server"

### Opción 2: Python HTTP Server
```bash
cd web
python -m http.server 8000
# Abrir http://localhost:8000
```

### Opción 3: Node.js HTTP Server
```bash
npx http-server web -p 8000
```

## 📊 Principales Hallazgos

### 🚨 Sesgo por Nacionalidad
- **Haitianos**: 99.32% de rechazo
- **Colombianos**: 98.65% de rechazo
- **Chilenos**: 32.54% de rechazo

### 🏘️ Sesgo por Comuna
- Comunas populares (El Bosque, La Pintana, Renca): **100% de rechazo**
- Independiente del nivel de ingresos

### 👥 Sesgo por Edad
- Jóvenes 18-25: **50.78% de rechazo**
- Adultos mayores 66+: **32.08% de rechazo**

### 🌍 Sesgo por Etnia
- Población Mapuche: **52.26% de rechazo** (vs 37.97% promedio)

## 📦 Instalación y Configuración

### Prerrequisitos
```bash
Python 3.8+
pip
```

### Instalar dependencias
```bash
pip install -r requirements.txt
```

### Ejecutar ETL completo
```bash
# 1. Extraer datos y obtener predicciones
python etl_banco.py

# 2. Consolidar datos
python consolidar_datos.py

# 3. Analizar sesgos
python analizar_sesgos.py
```

## 📈 Visualizaciones Incluidas

1. **Gráfico de Barras** - Tasa de rechazo por nacionalidad
2. **Scatter Plot** - Relación Ingresos vs Score (color por nacionalidad)
3. **Ranking** - Top 10 comunas con mayor rechazo
4. **Barras Apiladas** - Decisiones por grupo etario

Todas con:
- ✅ Tooltips interactivos
- ✅ Filtros dinámicos
- ✅ Estadísticas en tiempo real

## 👥 Autor

Juan Pablo - Taller 7 - Análisis de Sesgos Algorítmicos

## 📄 Licencia

Este proyecto es para fines académicos.

---

**⚠️ Nota**: Este proyecto tiene como objetivo evidenciar sesgos en modelos de ML para propósitos educativos.
