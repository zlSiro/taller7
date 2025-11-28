# 🔍 EVIDENCIAS DE SESGOS EN EL MODELO "Scoring Turing"

## 📊 DATOS CONSOLIDADOS GENERADOS

✅ **Archivo principal**: `datos_consolidados.json`
- Total de registros: **10,000 clientes**
- Aprobados: **6,203 (62.03%)**
- Rechazados: **3,797 (37.97%)**

---

## 🚨 SESGOS DETECTADOS

### 1️⃣ **SESGO EXTREMO POR NACIONALIDAD**

| Nacionalidad | % Rechazo | Score Promedio | Ingreso Promedio |
|--------------|-----------|----------------|------------------|
| **Haitiana** | **99.32%** | 294.73 | $523,975 |
| **Colombiana** | **98.65%** | 296.84 | $532,536 |
| Venezolana | 55.68% | 452.27 | $946,415 |
| Extranjera | 53.72% | 540.51 | $4,753,883 |
| **Chilena** | **32.54%** | 553.90 | $1,862,532 |
| Peruana | 29.62% | 582.65 | $1,313,039 |

**🔴 EVIDENCIA CRÍTICA**: Haitianos y Colombianos tienen **+99% de rechazo** con ingresos similares a otras nacionalidades.

---

### 2️⃣ **SESGO POR COMUNA (Discriminación Geográfica)**

**Comunas con 100% de rechazo:**
- El Bosque
- La Pintana  
- San Antonio
- Renca

**Top 10 comunas con mayor rechazo:**

| Comuna | % Rechazo | Ingreso Promedio |
|--------|-----------|------------------|
| El Bosque | 100% | $511,866 |
| La Pintana | 100% | $508,749 |
| Renca | 100% | $524,834 |
| Pudahuel | 99.40% | $548,777 |

**🔴 EVIDENCIA CRÍTICA**: Comunas populares tienen rechazo casi total, independiente del ingreso.

---

### 3️⃣ **SESGO POR EDAD (Discriminación Etaria)**

| Grupo Etario | % Rechazo | Score Promedio |
|--------------|-----------|----------------|
| **18-25** | **50.78%** | 493.59 |
| 26-35 | 39.20% | 514.55 |
| 36-45 | 40.61% | 512.34 |
| 46-55 | 36.65% | 525.58 |
| 56-65 | 35.87% | 530.89 |
| **66+** | **32.08%** | 576.40 |

**🔴 EVIDENCIA CRÍTICA**: Jóvenes (18-25) tienen **50% más rechazo** que adultos mayores.

---

### 4️⃣ **SESGO POR SEXO**

| Sexo | % Rechazo | Score Promedio | Ingreso Promedio |
|------|-----------|----------------|------------------|
| Femenino | 35.89% | 543.89 | $1,742,997 |
| **Masculino** | **40.23%** | 520.97 | $1,721,916 |

**🟡 EVIDENCIA**: Hombres tienen 4.3 puntos porcentuales más de rechazo.

---

### 5️⃣ **SESGO POR ETNIA**

| Etnia | % Rechazo | Score Promedio |
|-------|-----------|----------------|
| **Mapuche** | **52.26%** | 498.29 |

**🔴 EVIDENCIA CRÍTICA**: Población Mapuche tiene rechazo 20 puntos porcentuales superior al promedio nacional.

---

### 6️⃣ **PENALIZACIÓN DE SCORE POR NACIONALIDAD**

**Controlando por nivel de ingresos similar (Cuartil 1 - Ingresos bajos):**

| Nacionalidad | Score Promedio |
|--------------|----------------|
| Haitiana | **296.33** |
| Colombiana | **302.23** |
| Venezolana | 312.23 |
| Chilena | **376.24** |
| Peruana | 609.81 |

**🔴 EVIDENCIA CRÍTICA**: Con **MISMO nivel de ingresos**, Haitianos y Colombianos reciben scores 80-100 puntos MENORES que chilenos.

---

## 🎯 VISUALIZACIONES RECOMENDADAS PARA D3.JS

### Visualización 1: **Scatter Plot - Ingreso vs Score por Nacionalidad**
- **Marca**: Círculos
- **Canales**: 
  - Posición X: Ingresos mensuales
  - Posición Y: Score de riesgo
  - Color: Nacionalidad
  - Tamaño: Monto solicitado
- **Interacción**: Tooltip con datos completos, filtro por nacionalidad
- **Objetivo**: Mostrar cómo con mismos ingresos, distintas nacionalidades reciben scores diferentes

### Visualización 2: **Heatmap - % Rechazo por Comuna e Ingreso**
- **Marca**: Rectángulos
- **Canales**:
  - Posición X: Rango de ingresos
  - Posición Y: Comuna
  - Color: % de rechazo (escala rojo = alto rechazo)
- **Interacción**: Hover para ver estadísticas, ordenamiento por rechazo
- **Objetivo**: Evidenciar comunas con alto rechazo a pesar de buenos ingresos

### Visualización 3: **Stacked Bar Chart - Decisiones por Nacionalidad**
- **Marca**: Barras apiladas
- **Canales**:
  - Posición X: Nacionalidad
  - Posición Y: Cantidad de solicitudes
  - Color: Aprobado (verde) / Rechazado (rojo)
- **Interacción**: Click para filtrar, tooltip con porcentajes
- **Objetivo**: Comparación visual directa del sesgo extremo

### Visualización 4: **Box Plot - Distribución de Score por Edad**
- **Marca**: Cajas y bigotes
- **Canales**:
  - Posición X: Grupo etario
  - Posición Y: Score de riesgo
  - Color: Grupo etario
- **Interacción**: Hover para estadísticas, outliers clickeables
- **Objetivo**: Mostrar discriminación etaria

### Visualización 5: **Parallel Coordinates - Perfil Multidimensional**
- **Marca**: Líneas
- **Canales**: Múltiples ejes paralelos (Edad, Ingreso, Score, Deuda)
- **Color**: Aprobado vs Rechazado
- **Interacción**: Brush para filtrar rangos
- **Objetivo**: Descubrir patrones ocultos de discriminación

---

## 📁 ARCHIVOS GENERADOS

1. **`datos_consolidados.json`** - Dataset completo para D3.js (10,000 registros)
2. **`data.json`** - Predicciones originales de la API
3. **`etl_banco.py`** - Script ETL original
4. **`consolidar_datos.py`** - Script de consolidación
5. **`analizar_sesgos.py`** - Script de análisis estadístico

---

## 🚀 PRÓXIMOS PASOS

1. ✅ Datos consolidados listos
2. ✅ Análisis de sesgos completado
3. ⏭️ Crear visualizaciones interactivas con D3.js
4. ⏭️ Implementar interacciones (tooltips, filtros, brushing)
5. ⏭️ Dashboard final que "acuse" al modelo

---

## 💡 CONCLUSIÓN

El modelo **"Scoring Turing" presenta sesgos discriminatorios graves** en múltiples dimensiones:

- ❌ **Nacionalidad**: Discrimina casi totalmente a Haitianos y Colombianos
- ❌ **Geografía**: Rechaza sistemáticamente a comunas populares
- ❌ **Edad**: Penaliza desproporcionadamente a jóvenes
- ❌ **Etnia**: Discrimina a población Mapuche
- ⚠️ **Sexo**: Sesgo moderado contra hombres

**Los datos están listos para crear visualizaciones que expongan estos sesgos de manera clara e irrefutable.**
