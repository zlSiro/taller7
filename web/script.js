// Cargar datos y crear visualizaciones
d3.json("datos_consolidados.json").then((data) => {
  console.log("Datos cargados:", data.length, "registros");

  // Actualizar estadísticas generales
  actualizarEstadisticas(data);

  // Crear las 3 visualizaciones principales
  crearGraficoComunas(data);
  crearGraficoNacionalidadScore(data);
  crearGraficoEdad(data);
});

function actualizarEstadisticas(data) {
  const aprobados = data.filter((d) => d.decision_legacy === "APROBADO").length;
  const nacionalidades = new Set(data.map((d) => d.nacionalidad)).size;
  const comunas = new Set(data.map((d) => d.comuna)).size;

  d3.select("#total-clientes").text(data.length.toLocaleString());
  d3.select("#tasa-aprobacion").text(
    ((aprobados / data.length) * 100).toFixed(1) + "%"
  );
  d3.select("#nacionalidades").text(nacionalidades);
  d3.select("#comunas").text(comunas);
}

// VISUALIZACIÓN 1: Comunas con Mayor Rechazo (NUEVO ORDEN)
function crearGraficoComunas(data) {
  // Agrupar por comuna
  const porComuna = d3.rollup(
    data,
    (v) => ({
      total: v.length,
      rechazados: v.filter((d) => d.decision_legacy === "RECHAZADO").length,
      tasaRechazo:
        (v.filter((d) => d.decision_legacy === "RECHAZADO").length / v.length) *
        100,
      ingresoPromedio: d3.mean(v, (d) => d.ingresos_mensuales),
    }),
    (d) => d.comuna
  );

  const datos = Array.from(porComuna, ([comuna, stats]) => ({
    comuna,
    ...stats,
  }))
    .sort((a, b) => b.tasaRechazo - a.tasaRechazo)
    .slice(0, 10);

  const margin = { top: 40, right: 30, bottom: 100, left: 60 };
  const width = 1200 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  const svg = d3
    .select("#chart-comunas")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3
    .scaleBand()
    .domain(datos.map((d) => d.comuna))
    .range([0, width])
    .padding(0.2);

  const y = d3.scaleLinear().domain([0, 100]).range([height, 0]);

  const color = d3
    .scaleSequential()
    .domain([0, 100])
    .interpolator(d3.interpolateOranges);

  svg
    .selectAll("rect")
    .data(datos)
    .join("rect")
    .attr("x", (d) => x(d.comuna))
    .attr("y", (d) => y(d.tasaRechazo))
    .attr("width", x.bandwidth())
    .attr("height", (d) => height - y(d.tasaRechazo))
    .attr("fill", (d) => color(d.tasaRechazo))
    .attr("stroke", "#2c3e50")
    .attr("stroke-width", 1)
    .on("mouseover", function (event, d) {
      d3.select(this).attr("opacity", 0.7);
      mostrarTooltip(
        event,
        `
                        <strong>${d.comuna}</strong><br>
                        Tasa de Rechazo: <strong>${d.tasaRechazo.toFixed(
                          1
                        )}%</strong><br>
                        Ingreso Promedio: $${d.ingresoPromedio.toLocaleString(
                          "es-CL",
                          { maximumFractionDigits: 0 }
                        )}<br>
                        Total: ${d.total} clientes
                    `
      );
    })
    .on("mouseout", function () {
      d3.select(this).attr("opacity", 1);
      ocultarTooltip();
    });

  svg
    .append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    .attr("text-anchor", "end")
    .attr("font-size", "10px");

  svg.append("g").call(d3.axisLeft(y).tickFormat((d) => d + "%"));

  svg
    .append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -45)
    .attr("text-anchor", "middle")
    .text("% de Rechazo");
}

// VISUALIZACIÓN 2: Nacionalidad vs Score (Barras Agrupadas por Cuartiles)
function crearGraficoNacionalidadScore(data) {
  // Calcular cuartiles de ingreso
  const ingresos = data.map(d => d.ingresos_mensuales).sort((a, b) => a - b);
  const q1 = d3.quantile(ingresos, 0.25);
  const q2 = d3.quantile(ingresos, 0.50);
  const q3 = d3.quantile(ingresos, 0.75);

  // Clasificar por cuartil
  const dataConCuartil = data.map(d => ({
    ...d,
    cuartil: d.ingresos_mensuales <= q1 ? 'Q1 (Bajos)' :
             d.ingresos_mensuales <= q2 ? 'Q2 (Medio-Bajos)' :
             d.ingresos_mensuales <= q3 ? 'Q3 (Medio-Altos)' : 'Q4 (Altos)'
  }));

  // Agrupar por cuartil y nacionalidad
  const cuartiles = ['Q1 (Bajos)', 'Q2 (Medio-Bajos)', 'Q3 (Medio-Altos)', 'Q4 (Altos)'];
  const datos = cuartiles.map(cuartil => {
    const enCuartil = dataConCuartil.filter(d => d.cuartil === cuartil);
    const chilenos = enCuartil.filter(d => d.nacionalidad === 'Chilena');
    const extranjeros = enCuartil.filter(d => d.nacionalidad !== 'Chilena');

    return {
      cuartil,
      scoreChilenos: chilenos.length > 0 ? d3.mean(chilenos, d => d.score_riesgo) : 0,
      scoreExtranjeros: extranjeros.length > 0 ? d3.mean(extranjeros, d => d.score_riesgo) : 0
    };
  });

  const margin = { top: 40, right: 30, bottom: 80, left: 80 };
  const width = 600 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  const svg = d3
    .select("#chart-nacionalidad-score")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Escalas
  const x0 = d3.scaleBand()
    .domain(cuartiles)
    .range([0, width])
    .padding(0.2);

  const x1 = d3.scaleBand()
    .domain(['Chilenos', 'Extranjeros'])
    .range([0, x0.bandwidth()])
    .padding(0.05);

  const y = d3.scaleLinear()
    .domain([0, 800])
    .range([height, 0]);

  const color = d3.scaleOrdinal()
    .domain(['Chilenos', 'Extranjeros'])
    .range(['#27ae60', '#e67e22']);

  // Barras para Chilenos
  svg.selectAll('.bar-chilenos')
    .data(datos)
    .join('rect')
    .attr('class', 'bar-chilenos')
    .attr('x', d => x0(d.cuartil) + x1('Chilenos'))
    .attr('y', d => y(d.scoreChilenos))
    .attr('width', x1.bandwidth())
    .attr('height', d => height - y(d.scoreChilenos))
    .attr('fill', color('Chilenos'))
    .on('mouseover', function(event, d) {
      d3.select(this).attr('opacity', 0.7);
      mostrarTooltip(event, `<strong>Chilenos - ${d.cuartil}</strong><br>Score Promedio: ${d.scoreChilenos.toFixed(0)}`);
    })
    .on('mouseout', function() {
      d3.select(this).attr('opacity', 1);
      ocultarTooltip();
    });

  // Barras para Extranjeros
  svg.selectAll('.bar-extranjeros')
    .data(datos)
    .join('rect')
    .attr('class', 'bar-extranjeros')
    .attr('x', d => x0(d.cuartil) + x1('Extranjeros'))
    .attr('y', d => y(d.scoreExtranjeros))
    .attr('width', x1.bandwidth())
    .attr('height', d => height - y(d.scoreExtranjeros))
    .attr('fill', color('Extranjeros'))
    .on('mouseover', function(event, d) {
      d3.select(this).attr('opacity', 0.7);
      mostrarTooltip(event, `<strong>Extranjeros - ${d.cuartil}</strong><br>Score Promedio: ${d.scoreExtranjeros.toFixed(0)}`);
    })
    .on('mouseout', function() {
      d3.select(this).attr('opacity', 1);
      ocultarTooltip();
    });

  // Etiquetas de valores
  svg.selectAll('.label-chilenos')
    .data(datos)
    .join('text')
    .attr('class', 'label-chilenos')
    .attr('x', d => x0(d.cuartil) + x1('Chilenos') + x1.bandwidth() / 2)
    .attr('y', d => y(d.scoreChilenos) - 5)
    .attr('text-anchor', 'middle')
    .attr('font-size', '11px')
    .attr('font-weight', 'bold')
    .attr('fill', '#2c3e50')
    .text(d => d.scoreChilenos.toFixed(0));

  svg.selectAll('.label-extranjeros')
    .data(datos)
    .join('text')
    .attr('class', 'label-extranjeros')
    .attr('x', d => x0(d.cuartil) + x1('Extranjeros') + x1.bandwidth() / 2)
    .attr('y', d => y(d.scoreExtranjeros) - 5)
    .attr('text-anchor', 'middle')
    .attr('font-size', '11px')
    .attr('font-weight', 'bold')
    .attr('fill', '#2c3e50')
    .text(d => d.scoreExtranjeros.toFixed(0));

  // Ejes
  svg.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x0))
    .selectAll('text')
    .attr('transform', 'rotate(-20)')
    .attr('text-anchor', 'end')
    .attr('font-size', '11px');

  svg.append('g')
    .call(d3.axisLeft(y));

  // Etiquetas de ejes
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', height + 65)
    .attr('text-anchor', 'middle')
    .style('font-size', '12px')
    .style('font-weight', 'bold')
    .text('Nivel de Ingresos (Cuartiles)');

  svg.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -height / 2)
    .attr('y', -60)
    .attr('text-anchor', 'middle')
    .style('font-size', '12px')
    .style('font-weight', 'bold')
    .text('Score de Riesgo Promedio');

  // Leyenda
  const legend = svg.append('g')
    .attr('transform', `translate(${width - 150}, -20)`);

  ['Chilenos', 'Extranjeros'].forEach((grupo, i) => {
    const g = legend.append('g').attr('transform', `translate(${i * 80}, 0)`);
    g.append('rect').attr('width', 18).attr('height', 18).attr('fill', color(grupo));
    g.append('text').attr('x', 24).attr('y', 13).attr('font-size', '12px').text(grupo);
  });

  // Mensaje de conclusión
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', -15)
    .attr('text-anchor', 'middle')
    .attr('font-size', '13px')
    .attr('font-weight', 'bold')
    .attr('fill', '#e74c3c')
}

// VISUALIZACIÓN 3: Rechazo por Grupo Etario
function crearGraficoEdad(data) {
  // Crear grupos de edad
  const dataConGrupo = data.map((d) => ({
    ...d,
    grupoEdad: getGrupoEdad(d.edad),
  }));

  const grupos = ["18-25", "26-35", "36-45", "46-55", "56-65", "66+"];

  // Agrupar datos
  const porGrupo = d3.rollup(
    dataConGrupo,
    (v) => ({
      aprobados: v.filter((d) => d.decision_legacy === "APROBADO").length,
      rechazados: v.filter((d) => d.decision_legacy === "RECHAZADO").length,
    }),
    (d) => d.grupoEdad
  );

  const datos = grupos.map((grupo) => ({
    grupo,
    aprobados: porGrupo.get(grupo)?.aprobados || 0,
    rechazados: porGrupo.get(grupo)?.rechazados || 0,
  }));

  const margin = { top: 20, right: 100, bottom: 60, left: 60 };
  const width = 550 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  const svg = d3
    .select("#chart-edad")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Aplanar datos para barras apiladas
  const stack = d3.stack().keys(["aprobados", "rechazados"]);

  const series = stack(datos);

  const x = d3.scaleBand().domain(grupos).range([0, width]).padding(0.3);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(datos, (d) => d.aprobados + d.rechazados)])
    .range([height, 0]);

  const color = d3
    .scaleOrdinal()
    .domain(["aprobados", "rechazados"])
    .range(["#2ecc71", "#e74c3c"]);

  // Barras apiladas
  svg
    .selectAll("g.layer")
    .data(series)
    .join("g")
    .attr("class", "layer")
    .attr("fill", (d) => color(d.key))
    .selectAll("rect")
    .data((d) => d)
    .join("rect")
    .attr("x", (d) => x(d.data.grupo))
    .attr("y", (d) => y(d[1]))
    .attr("height", (d) => y(d[0]) - y(d[1]))
    .attr("width", x.bandwidth())
    .attr("stroke", "#fff")
    .attr("stroke-width", 2)
    .on("mouseover", function (event, d) {
      d3.select(this).attr("opacity", 0.7);
      mostrarTooltip(
        event,
        `
                        <strong>Grupo ${d.data.grupo} años</strong><br>
                        Aprobados: ${d.data.aprobados}<br>
                        Rechazados: ${d.data.rechazados}<br>
                        Total: ${d.data.aprobados + d.data.rechazados}
                    `
      );
    })
    .on("mouseout", function () {
      d3.select(this).attr("opacity", 1);
      ocultarTooltip();
    });

  // Ejes
  svg
    .append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x));

  svg.append("g").call(d3.axisLeft(y));

  svg
    .append("text")
    .attr("class", "axis-label")
    .attr("x", width / 2)
    .attr("y", height + 45)
    .attr("text-anchor", "middle")
    .text("Grupo Etario");

  svg
    .append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -45)
    .attr("text-anchor", "middle")
    .text("Cantidad de Clientes");

  // Leyenda
  const legend = svg
    .append("g")
    .attr("transform", `translate(${width + 10}, ${height / 2 - 30})`);

  ["aprobados", "rechazados"].forEach((key, i) => {
    const g = legend.append("g").attr("transform", `translate(0, ${i * 25})`);

    g.append("rect")
      .attr("width", 18)
      .attr("height", 18)
      .attr("fill", color(key));

    g.append("text")
      .attr("x", 24)
      .attr("y", 13)
      .attr("font-size", "12px")
      .text(key.charAt(0).toUpperCase() + key.slice(1));
  });
}

// Funciones auxiliares
function getGrupoEdad(edad) {
  if (edad <= 25) return "18-25";
  if (edad <= 35) return "26-35";
  if (edad <= 45) return "36-45";
  if (edad <= 55) return "46-55";
  if (edad <= 65) return "56-65";
  return "66+";
}

function mostrarTooltip(event, html) {
  const tooltip = d3.select("#tooltip");
  tooltip
    .html(html)
    .classed("show", true)
    .style("left", event.pageX + 15 + "px")
    .style("top", event.pageY - 15 + "px");
}

function ocultarTooltip() {
  d3.select("#tooltip").classed("show", false);
}
