import json
import pandas as pd

def cargar_datos():
    """Carga los datos consolidados"""
    with open("datos_consolidados.json", "r", encoding="utf-8") as f:
        datos = json.load(f)
    return pd.DataFrame(datos)


def analizar_sesgos():
    """Analiza los posibles sesgos del modelo"""
    df = cargar_datos()
    
    print("=" * 80)
    print("🔍 ANÁLISIS DE SESGOS DEL MODELO 'Scoring Turing'")
    print("=" * 80)
    
    # 1. SESGO POR NACIONALIDAD
    print("\n📍 1. ANÁLISIS POR NACIONALIDAD")
    print("-" * 80)
    por_nacionalidad = df.groupby('nacionalidad').agg({
        'decision_legacy': lambda x: (x == 'RECHAZADO').sum() / len(x) * 100,
        'score_riesgo': 'mean',
        'ingresos_mensuales': 'mean',
        'id_cliente': 'count'
    }).round(2)
    por_nacionalidad.columns = ['% Rechazo', 'Score Promedio', 'Ingreso Promedio', 'Total Casos']
    print(por_nacionalidad.sort_values('% Rechazo', ascending=False))
    
    # 2. SESGO POR COMUNA (Top 10 con mayor rechazo)
    print("\n\n📍 2. ANÁLISIS POR COMUNA (Top 10 con mayor rechazo)")
    print("-" * 80)
    por_comuna = df.groupby('comuna').agg({
        'decision_legacy': lambda x: (x == 'RECHAZADO').sum() / len(x) * 100,
        'score_riesgo': 'mean',
        'ingresos_mensuales': 'mean',
        'id_cliente': 'count'
    }).round(2)
    por_comuna.columns = ['% Rechazo', 'Score Promedio', 'Ingreso Promedio', 'Total Casos']
    print(por_comuna.sort_values('% Rechazo', ascending=False).head(10))
    
    # 3. SESGO POR SEXO
    print("\n\n📍 3. ANÁLISIS POR SEXO")
    print("-" * 80)
    por_sexo = df.groupby('sexo').agg({
        'decision_legacy': lambda x: (x == 'RECHAZADO').sum() / len(x) * 100,
        'score_riesgo': 'mean',
        'ingresos_mensuales': 'mean',
        'id_cliente': 'count'
    }).round(2)
    por_sexo.columns = ['% Rechazo', 'Score Promedio', 'Ingreso Promedio', 'Total Casos']
    print(por_sexo)
    
    # 4. SESGO POR EDAD (Grupos etarios)
    print("\n\n📍 4. ANÁLISIS POR GRUPO ETARIO")
    print("-" * 80)
    df['grupo_edad'] = pd.cut(df['edad'], bins=[0, 25, 35, 45, 55, 65, 100], 
                               labels=['18-25', '26-35', '36-45', '46-55', '56-65', '66+'])
    por_edad = df.groupby('grupo_edad').agg({
        'decision_legacy': lambda x: (x == 'RECHAZADO').sum() / len(x) * 100,
        'score_riesgo': 'mean',
        'ingresos_mensuales': 'mean',
        'id_cliente': 'count'
    }).round(2)
    por_edad.columns = ['% Rechazo', 'Score Promedio', 'Ingreso Promedio', 'Total Casos']
    print(por_edad)
    
    # 5. SESGO POR ETNIA
    print("\n\n📍 5. ANÁLISIS POR ETNIA")
    print("-" * 80)
    df_etnia = df[df['etnia'].notna()]
    if len(df_etnia) > 0:
        por_etnia = df_etnia.groupby('etnia').agg({
            'decision_legacy': lambda x: (x == 'RECHAZADO').sum() / len(x) * 100,
            'score_riesgo': 'mean',
            'ingresos_mensuales': 'mean',
            'id_cliente': 'count'
        }).round(2)
        por_etnia.columns = ['% Rechazo', 'Score Promedio', 'Ingreso Promedio', 'Total Casos']
        print(por_etnia.sort_values('% Rechazo', ascending=False))
    else:
        print("No hay datos de etnia disponibles")
    
    # 6. ANÁLISIS CRUZADO: Rechazo por comuna e ingreso
    print("\n\n📍 6. COMUNAS CON ALTO RECHAZO A PESAR DE BUENOS INGRESOS")
    print("-" * 80)
    comunas_sospechosas = por_comuna[
        (por_comuna['Ingreso Promedio'] > df['ingresos_mensuales'].median()) &
        (por_comuna['% Rechazo'] > df.groupby('decision_legacy').size()['RECHAZADO'] / len(df) * 100)
    ].sort_values('% Rechazo', ascending=False)
    print(comunas_sospechosas.head(10))
    
    # 7. ANÁLISIS CRUZADO: Nacionalidad y Score
    print("\n\n📍 7. ¿SE PENALIZA EL SCORE POR NACIONALIDAD?")
    print("-" * 80)
    print("Comparación de score promedio controlando por ingresos similares:")
    
    # Dividir en cuartiles de ingreso
    df['cuartil_ingreso'] = pd.qcut(df['ingresos_mensuales'], q=4, labels=['Q1', 'Q2', 'Q3', 'Q4'])
    
    for cuartil in ['Q1', 'Q2', 'Q3', 'Q4']:
        print(f"\n{cuartil} (Ingresos similares):")
        df_cuartil = df[df['cuartil_ingreso'] == cuartil]
        score_por_nac = df_cuartil.groupby('nacionalidad')['score_riesgo'].mean().round(2)
        print(score_por_nac.sort_values())
    
    print("\n" + "=" * 80)
    print("📊 RESUMEN DE HALLAZGOS")
    print("=" * 80)
    print("\nEste análisis te da las evidencias cuantitativas para 'acusar' al modelo.")
    print("Ahora puedes crear visualizaciones en D3.js que muestren estos sesgos.")
    print("\n✅ Datos listos en: datos_consolidados.json")


if __name__ == "__main__":
    analizar_sesgos()
