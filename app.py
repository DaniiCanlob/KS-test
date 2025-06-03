from flask import Flask, render_template, request, jsonify, send_from_directory
import numpy as np
from scipy import stats
import os
import json

app = Flask(__name__)

# Configuración
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Tamaño mínimo de muestra para la prueba
MIN_SAMPLE_SIZE = 5

@app.route('/')
def index():
    return render_template('index.html')

def validate_sample(sample):
    """
    Valida que la muestra sea adecuada para la prueba.
    Retorna (es_válido, mensaje_error)
    """
    if len(sample) < MIN_SAMPLE_SIZE:
        return False, f'Se requieren al menos {MIN_SAMPLE_SIZE} puntos de datos.'
    
    if np.isnan(sample).any():
        return False, 'Los datos contienen valores no numéricos.'
    
    if len(np.unique(sample)) < 2:
        return False, 'Los datos deben contener al menos dos valores diferentes.'
    
    return True, ''

@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        # Obtener y validar datos de entrada
        if not request.is_json:
            return jsonify({'status': 'error', 'message': 'Se esperaba un JSON'}), 400
            
        data = request.get_json()
        
        if 'data' not in data or 'distribution' not in data:
            return jsonify({'status': 'error', 'message': 'Faltan campos requeridos'}), 400
        
        try:
            sample = np.array(data['data'], dtype=float)
        except (ValueError, TypeError) as e:
            return jsonify({'status': 'error', 'message': 'Los datos deben ser numéricos'}), 400
        
        dist_name = data['distribution']
        
        # Validar la muestra
        is_valid, error_msg = validate_sample(sample)
        if not is_valid:
            return jsonify({'status': 'error', 'message': error_msg}), 400
        
        # Mapeo de distribuciones con sus nombres completos para mensajes
        dist_map = {
            'norm': {
                'func': stats.norm,
                'name': 'Normal'
            },
            'uniform': {
                'func': stats.uniform,
                'name': 'Uniforme'
            },
            'expon': {
                'func': stats.expon,
                'name': 'Exponencial'
            }
        }
        
        if dist_name not in dist_map:
            dist_names = ', '.join(f'"{k}" ({v["name"]})' for k, v in dist_map.items())
            return jsonify({
                'status': 'error', 
                'message': f'Distribución no soportada. Use una de: {dist_names}'
            }), 400
        
        # Obtener la distribución
        dist_info = dist_map[dist_name]
        dist = dist_info['func']
        
        # Ajustar parámetros de la distribución
        try:
            params = dist.fit(sample)
            
            # Para la distribución uniforme, asegurarse de que los parámetros sean válidos
            if dist_name == 'uniform' and len(params) >= 2:
                loc, scale = params[0], params[1]
                if scale <= 0:
                    return jsonify({
                        'status': 'error',
                        'message': 'La escala de la distribución uniforme debe ser mayor que cero'
                    }), 400
            
            # Realizar la prueba de Kolmogorov-Smirnov
            D, p_value = stats.kstest(sample, dist_name, args=params)
            
            # Calcular estadísticas descriptivas
            stats_data = {
                'mean': float(np.mean(sample)),
                'std': float(np.std(sample, ddof=1)) if len(sample) > 1 else 0.0,
                'min': float(np.min(sample)),
                'max': float(np.max(sample)),
                'size': len(sample),
                'variance': float(np.var(sample, ddof=1)) if len(sample) > 1 else 0.0,
                'median': float(np.median(sample)),
                'q1': float(np.percentile(sample, 25)),
                'q3': float(np.percentile(sample, 75))
            }
            
            return jsonify({
                'status': 'success',
                'statistic': float(D),
                'p_value': float(p_value),
                'distribution': dist_name,
                'distribution_name': dist_info['name'],
                'params': [float(p) for p in params],
                'stats': stats_data
            })
            
        except ValueError as ve:
            return jsonify({
                'status': 'error',
                'message': f'Error en los parámetros de la distribución: {str(ve)}'
            }), 400
            
    except Exception as e:
        # Registrar el error en el servidor
        app.logger.error(f'Error en /analyze: {str(e)}', exc_info=True)
        return jsonify({
            'status': 'error',
            'message': 'Error interno del servidor al procesar la solicitud'
        }), 500

if __name__ == '__main__':
    app.run(debug=True)