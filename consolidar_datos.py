import json
from sqlalchemy import create_engine, text

# Configurar DB
DB_URL = "mysql+pymysql://u549055514_Turing:Salmos#100@auth-db465.hstgr.io/u549055514_Banco_Turing"

# Consulta para obtener datos de clientes con atributos relevantes para análisis de sesgos
QUERY = """
SELECT 
    c.id_cliente,
    c.ingresos_mensuales,
    c.edad,
    c.sexo,
    c.nacionalidad,
    c.comuna,
    c.etnia,
    c.anios_empleo,
    c.tipo_contrato,
    c.deuda_total,
    c.limite_tc,
    c.comportamiento_pago,
    
    s.monto_solicitado,
    s.plazo_meses,
    s.tipo_producto,
    s.canal_origen,
    s.tasa_interes_anual

FROM clientes c
LEFT JOIN solicitudes_credito s 
    ON s.id_cliente = c.id_cliente
"""

def fetch_clientes_data():
    """Obtiene los datos de clientes de la base de datos"""
    engine = create_engine(DB_URL)
    with engine.connect() as conn:
        rows = conn.execute(text(QUERY)).mappings().all()
    
    # Convertir a diccionario indexado por id_cliente
    clientes_dict = {}
    for r in rows:
        clientes_dict[r["id_cliente"]] = {
            "id_cliente": r["id_cliente"],
            "ingresos_mensuales": float(r["ingresos_mensuales"]) if r["ingresos_mensuales"] is not None else 0.0,
            "edad": r["edad"],
            "sexo": r["sexo"],
            "nacionalidad": r["nacionalidad"],
            "comuna": r["comuna"],
            "etnia": r["etnia"],
            "anios_empleo": r["anios_empleo"],
            "tipo_contrato": r["tipo_contrato"],
            "deuda_total": float(r["deuda_total"]) if r["deuda_total"] is not None else 0.0,
            "limite_tc": float(r["limite_tc"]) if r["limite_tc"] is not None else 0.0,
            "comportamiento_pago": r["comportamiento_pago"],
            "monto_solicitado": float(r["monto_solicitado"]) if r["monto_solicitado"] is not None else 0.0,
            "plazo_meses": r["plazo_meses"],
            "tipo_producto": r["tipo_producto"],
            "canal_origen": r["canal_origen"],
            "tasa_interes_anual": float(r["tasa_interes_anual"]) if r["tasa_interes_anual"] is not None else 0.0
        }
    
    return clientes_dict


def load_predictions():
    """Carga las predicciones del archivo data.json"""
    with open("data.json", "r", encoding="utf-8") as f:
        data = json.load(f)
    return data["data"]


def consolidar_datos():
    """Consolida datos de clientes con predicciones de la API"""
    print("Obteniendo datos de clientes desde la base de datos...")
    clientes_dict = fetch_clientes_data()
    
    print("Cargando predicciones desde data.json...")
    predictions = load_predictions()
    
    print("Consolidando datos...")
    datos_consolidados = []
    
    for pred in predictions:
        id_cliente = pred["id_cliente"]
        
        # Buscar datos del cliente
        cliente = clientes_dict.get(id_cliente)
        
        if cliente:
            # Combinar datos del cliente con la predicción
            registro = {
                # Datos demográficos (para detectar sesgos)
                "id_cliente": id_cliente,
                "comuna": cliente["comuna"],
                "nacionalidad": cliente["nacionalidad"],
                "etnia": cliente["etnia"],
                "sexo": cliente["sexo"],
                "edad": cliente["edad"],
                
                # Datos financieros
                "ingresos_mensuales": cliente["ingresos_mensuales"],
                "deuda_total": cliente["deuda_total"],
                "limite_tc": cliente["limite_tc"],
                "monto_solicitado": cliente["monto_solicitado"],
                "plazo_meses": cliente["plazo_meses"],
                "tasa_interes_anual": cliente["tasa_interes_anual"],
                
                # Datos laborales
                "anios_empleo": cliente["anios_empleo"],
                "tipo_contrato": cliente["tipo_contrato"],
                "comportamiento_pago": cliente["comportamiento_pago"],
                
                # Datos del producto
                "tipo_producto": cliente["tipo_producto"],
                "canal_origen": cliente["canal_origen"],
                
                # Predicciones del modelo (para acusar sesgos)
                "score_riesgo": pred["score_riesgo"],
                "probabilidad_default": pred["probabilidad_default"],
                "decision_legacy": pred["decision_legacy"],
                "mensaje": pred["mensaje"]
            }
            
            datos_consolidados.append(registro)
    
    return datos_consolidados


def guardar_datos_consolidados(datos):
    """Guarda los datos consolidados en un archivo JSON para D3.js"""
    with open("datos_consolidados.json", "w", encoding="utf-8") as f:
        json.dump(datos, f, ensure_ascii=False, indent=2)
    
    print("\n✅ Archivo 'datos_consolidados.json' generado exitosamente")
    print(f"📊 Total de registros: {len(datos)}")
    
    # Estadísticas básicas
    aprobados = sum(1 for d in datos if d["decision_legacy"] == "APROBADO")
    rechazados = sum(1 for d in datos if d["decision_legacy"] == "RECHAZADO")
    
    print("\n📈 Estadísticas:")
    print(f"   - Aprobados: {aprobados} ({aprobados/len(datos)*100:.2f}%)")
    print(f"   - Rechazados: {rechazados} ({rechazados/len(datos)*100:.2f}%)")
    
    # Nacionalidades únicas
    nacionalidades = set(d["nacionalidad"] for d in datos if d["nacionalidad"])
    print(f"   - Nacionalidades únicas: {len(nacionalidades)}")
    
    # Comunas únicas
    comunas = set(d["comuna"] for d in datos if d["comuna"])
    print(f"   - Comunas únicas: {len(comunas)}")


def main():
    print("=" * 60)
    print("CONSOLIDACIÓN DE DATOS PARA ANÁLISIS DE SESGOS")
    print("=" * 60)
    
    datos = consolidar_datos()
    guardar_datos_consolidados(datos)
    
    print("\n" + "=" * 60)
    print("Proceso completado")
    print("=" * 60)


if __name__ == "__main__":
    main()
