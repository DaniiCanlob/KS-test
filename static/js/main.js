// static/js/main.js
let chart = null;

// Función para mostrar alertas
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Insertar la alerta al principio del contenedor de la tarjeta
    const cardBody = document.querySelector('.card-body');
    cardBody.insertBefore(alertDiv, cardBody.firstChild);
    
    // Eliminar la alerta después de 5 segundos
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Función para validar la entrada de datos
function validateInputs() {
    const fileInput = document.getElementById('fileInput');
    const dataInput = document.getElementById('dataInput');
    
    // Si hay un archivo cargado y el textarea no está vacío
    if (fileInput.files.length > 0 && dataInput.value.trim() !== '') {
        showAlert('Por favor, use solo el campo de texto O cargue un archivo CSV, no ambos.', 'warning');
        return false;
    }
    
    // Si no hay ni archivo ni datos en el textarea
    if (fileInput.files.length === 0 && dataInput.value.trim() === '') {
        showAlert('Por favor, ingrese datos o seleccione un archivo CSV.', 'warning');
        return false;
    }
    
    return true;
}

// Función para analizar los datos
async function processFile() {
    const fileInput = document.getElementById('fileInput');
    const dataInput = document.getElementById('dataInput');
    const distribution = document.getElementById('distribution').value;
    const resultsContainer = document.getElementById('resultContainer');
    const resultsDiv = document.getElementById('results');
    const spinner = document.getElementById('spinner');
    const analyzeBtn = document.getElementById('analyzeBtn');

    // Validar las entradas
    if (!validateInputs()) {
        return;
    }

    // Validar que hay datos
    let data = [];
    if (dataInput.value.trim()) {
        // Procesar datos del textarea
        data = dataInput.value.split(/[,\s]+/).map(Number).filter(n => !isNaN(n));
    } else if (fileInput.files.length) {
        // Procesar archivo CSV
        try {
            const file = fileInput.files[0];
            const fileContent = await file.text();
            data = fileContent
                .split('\n')
                .filter(line => line.trim() !== '')
                .map(line => {
                    // Si la línea contiene comas, tomar el primer valor
                    const value = line.split(',')[0].trim();
                    return parseFloat(value);
                })
                .filter(n => !isNaN(n));
                
            if (data.length === 0) {
                throw new Error('No se encontraron valores numéricos en el archivo');
            }
        } catch (error) {
            showAlert('Error al procesar el archivo: ' + error.message, 'danger');
            return;
        }
    } else {
        showAlert('Por favor, ingrese datos o seleccione un archivo CSV', 'warning');
        return;
    }

    if (data.length < 5) {
        showAlert('Se requieren al menos 5 puntos de datos', 'warning');
        return;
    }

    // Mostrar spinner
    analyzeBtn.disabled = true;
    spinner.classList.remove('d-none');
    resultsContainer.classList.add('d-none');

    try {
        const response = await fetch('/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                data: data,
                distribution: distribution
            })
        });

        if (!response.ok) {
            throw new Error('Error en la respuesta del servidor');
        }

        const result = await response.json();
        displayResults(result, data);
    } catch (error) {
        console.error('Error:', error);
        resultsDiv.innerHTML = `
            <div class="alert alert-danger" role="alert">
                Error al procesar la solicitud: ${error.message}
            </div>
        `;
        resultsContainer.classList.remove('d-none');
    } finally {
        analyzeBtn.disabled = false;
        spinner.classList.add('d-none');
    }
}

// Función para mostrar los resultados
function displayResults(result, originalData) {
    const resultsContainer = document.getElementById('resultContainer');
    const resultsDiv = document.getElementById('results');
    
    // Formatear el nombre de la distribución
    const distNames = {
        'norm': 'Normal',
        'uniform': 'Uniforme',
        'expon': 'Exponencial'
    };
    
    const distName = distNames[result.distribution] || result.distribution;
    
    // Crear el HTML de los resultados
    let html = `
        <div class="result-item">
            <h4>Resultados de la prueba de Kolmogorov-Smirnov</h4>
            <table class="table">
                <tr>
                    <th>Distribución probada:</th>
                    <td>${distName}</td>
                </tr>
                <tr>
                    <th>Estadístico D:</th>
                    <td>${result.statistic.toFixed(6)}</td>
                </tr>
                <tr>
                    <th>Valor p:</th>
                    <td>${result.p_value.toFixed(6)}</td>
                </tr>
                <tr>
                    <th>Conclusión:</th>
                    <td class="${result.p_value > 0.05 ? 'text-success' : 'text-danger'}">
                        ${result.p_value > 0.05 ? 
                            'No se puede rechazar la hipótesis nula (los datos podrían seguir la distribución)' : 
                            'Se rechaza la hipótesis nula (los datos no siguen la distribución)'}
                    </td>
                </tr>
            </table>
            
            <h5 class="mt-4">Estadísticas Descriptivas</h5>
            <table class="table">
                <tr>
                    <th>Tamaño de la muestra:</th>
                    <td>${originalData.length}</td>
                </tr>
                <tr>
                    <th>Media:</th>
                    <td>${result.stats.mean.toFixed(4)}</td>
                </tr>
                <tr>
                    <th>Desviación estándar:</th>
                    <td>${result.stats.std.toFixed(4)}</td>
                </tr>
                <tr>
                    <th>Mínimo:</th>
                    <td>${result.stats.min.toFixed(4)}</td>
                </tr>
                <tr>
                    <th>Máximo:</th>
                    <td>${result.stats.max.toFixed(4)}</td>
                </tr>
            </table>
        </div>
    `;
    
    resultsDiv.innerHTML = html;
    resultsContainer.classList.remove('d-none');
    
    // Generar el gráfico
    generateChart(originalData, result);
    
    // Desplazarse a los resultados
    resultsContainer.scrollIntoView({ behavior: 'smooth' });
}

// Función para generar el gráfico
function generateChart(data, result) {
    const ctx = document.getElementById('distributionChart').getContext('2d');
    
    // Destruir el gráfico anterior si existe
    if (window.chartInstance) {
        window.chartInstance.destroy();
    }
    
    // Configuración del gráfico
    window.chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map((_, i) => i + 1),
            datasets: [{
                label: 'Datos',
                data: data,
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Valor'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Índice'
                    }
                }
            }
        }
    });
}