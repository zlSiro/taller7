import json
import requests
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Configurar DB
DB_URL = "mysql+pymysql://u549055514_Turing:Salmos#100@auth-db465.hstgr.io/u549055514_Banco_Turing"
API_URL = "https://scoring-bancoturing.semilla42.com/predict_batch"

engine = create_engine(DB_URL)
Session = sessionmaker(bind=engine)
session = Session()

QUERY = """
SELECT 
    c.id_cliente,
    c.ingresos_mensuales,
    c.anios_empleo,
    c.tipo_contrato,
    c.deuda_total,
    c.limite_tc,
    c.comportamiento_pago,
    c.edad,
    c.sexo,
    c.nacionalidad,
    c.comuna,
    IFNULL(c.etnia, 'No Informado') AS etnia,

    s.monto_solicitado,
    s.plazo_meses,
    s.tipo_producto,
    s.canal_origen,
    s.tasa_interes_anual,

    -- Historial de pagos
    IFNULL(MAX(h.dias_atraso), 0) AS max_dias_mora_historico,

    IFNULL(SUM(
        CASE 
            WHEN h.pagado = 0 OR h.dias_atraso > 0 THEN 1 
            ELSE 0 
        END
    ), 0) AS cantidad_atrasos,

    -- Bienes raíces
    IFNULL(SUM(b.avaluo_fiscal), 0) AS patrimonio_inmobiliario,

    -- Marca 1 si cualquier bien está en remate
    IFNULL(MAX(
        CASE 
            WHEN b.en_remate = 1 THEN 1 
            ELSE 0 
        END
    ), 0) AS tiene_propiedad_en_remate

FROM clientes c
LEFT JOIN solicitudes_credito s 
    ON s.id_cliente = c.id_cliente
LEFT JOIN historial_pagos h 
    ON h.id_cliente = c.id_cliente
LEFT JOIN bienes_raices b 
    ON b.id_cliente = c.id_cliente

GROUP BY 
    c.id_cliente,
    c.ingresos_mensuales,
    c.anios_empleo,
    c.tipo_contrato,
    c.deuda_total,
    c.limite_tc,
    c.comportamiento_pago,
    c.edad,
    c.sexo,
    c.nacionalidad,
    c.comuna,
    c.etnia,
    s.monto_solicitado,
    s.plazo_meses,
    s.tipo_producto,
    s.canal_origen,
    s.tasa_interes_anual;
"""

def fetch_data():
    
    with engine.connect() as conn:
        rows = conn.execute(text(QUERY)).mappings().all()
    return rows


def build_payload_rows(rows):
    clientes = []
    for r in rows:
        cliente = {
            "id_cliente": r["id_cliente"],
            "anios_empleo": r["anios_empleo"],
            "canal_origen": r["canal_origen"],
            "cantidad_atrasos": int(r["cantidad_atrasos"]) if r["cantidad_atrasos"] is not None else 0,
            "comportamiento_pago": r["comportamiento_pago"],
            "comuna": r["comuna"],
            "deuda_total": float(r["deuda_total"]) if r["deuda_total"] is not None else 0.0,
            "edad": r["edad"],
            "etnia": r["etnia"],
            "ingresos_mensuales": float(r["ingresos_mensuales"]) if r["ingresos_mensuales"] is not None else 0.0,
            "limite_tc": float(r["limite_tc"]) if r["limite_tc"] is not None else 0.0,
            "max_dias_mora_historico": int(r["max_dias_mora_historico"]) if r["max_dias_mora_historico"] is not None else 0,
            "monto_solicitado": float(r["monto_solicitado"]) if r["monto_solicitado"] is not None else 0.0,
            "nacionalidad": r["nacionalidad"],
            "patrimonio_inmobiliario": float(r["patrimonio_inmobiliario"]) if r["patrimonio_inmobiliario"] is not None else 0.0,
            "plazo_meses": r["plazo_meses"],
            "sexo": r["sexo"],
            "tasa_interes_anual": float(r["tasa_interes_anual"]) if r["tasa_interes_anual"] is not None else 0.0,
            "tiene_propiedad_en_remate": int(r["tiene_propiedad_en_remate"]) if r["tiene_propiedad_en_remate"] is not None else 0,
            "tipo_contrato": r["tipo_contrato"],
            "tipo_producto": r["tipo_producto"]
        }
        clientes.append(cliente)
    return clientes


def call_predict_api(clientes):
    try:
        body = {"clientes": clientes}
        response = requests.post(API_URL, json=body)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print("Error al conectar con la la API: ", e)
        return {"error: ": str(e)}

def save_json(data):
    with open("data.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        
        
def main():
    rows = fetch_data()
    clientes_json = build_payload_rows(rows)
    
    print(f"Enviando {len(clientes_json)} clientes a la API")
    predictions = call_predict_api(clientes_json)
    
    save_json(predictions)
    
    print("Archivo data.json generado correctamente")
    
    
if __name__ == "__main__":
    main()
