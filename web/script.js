// Cargar datos y crear visualizaciones
d3.json("datos_consolidados.json").then((data) => {
  console.log("Datos cargados:", data.length, "registros");

  // Actualizar estadísticas generales
  actualizarEstadisticas(data);

  // Poblar filtros
  poblarFiltros(data);

  // Crear visualizaciones
  crearGraficoNacionalidad(data);
  crearScatterPlot(data);
  crearGraficoComunas(data);
  crearGraficoEdad(data);

  // Configurar eventos de filtros
  configurarFiltros(data);
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

function poblarFiltros(data) {
  const nacionalidades = [...new Set(data.map((d) => d.nacionalidad))].sort();
  const select = d3.select("#filter-nacionalidad");

  nacionalidades.forEach((nac) => {
    select.append("option").attr("value", nac).text(nac);
  });
}

function configurarFiltros(data) {
  // Aquí puedes implementar la lógica de filtrado
  // que actualice todas las visualizaciones
}

// VISUALIZACIÓN 1: Sesgo por Nacionalidad
function crearGraficoNacionalidad(data) {
  // Agrupar por nacionalidad y calcular tasa de rechazo
  const porNacionalidad = d3.rollup(
    data,
    (v) => ({
      total: v.length,
      rechazados: v.filter((d) => d.decision_legacy === "RECHAZADO").length,
      tasaRechazo:
        (v.filter((d) => d.decision_legacy === "RECHAZADO").length / v.length) *
        100,
    }),
    (d) => d.nacionalidad
  );

  const datos = Array.from(porNacionalidad, ([nacionalidad, stats]) => ({
    nacionalidad,
    ...stats,
  })).sort((a, b) => b.tasaRechazo - a.tasaRechazo);

  // Dimensiones
  const margin = { top: 20, right: 30, bottom: 80, left: 60 };
  const width = 550 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  // SVG
  const svg = d3
    .select("#chart-nacionalidad")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Escalas
  const x = d3
    .scaleBand()
    .domain(datos.map((d) => d.nacionalidad))
    .range([0, width])
    .padding(0.2);

  const y = d3.scaleLinear().domain([0, 100]).range([height, 0]);

  // Escala de colores (rojo más intenso = mayor rechazo)
  const color = d3
    .scaleSequential()
    .domain([0, 100])
    .interpolator(d3.interpolateReds);

  // Barras
  svg
    .selectAll("rect")
    .data(datos)
    .join("rect")
    .attr("x", (d) => x(d.nacionalidad))
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
                        <strong>${d.nacionalidad}</strong><br>
                        Tasa de Rechazo: <strong>${d.tasaRechazo.toFixed(
                          1
                        )}%</strong><br>
                        Total: ${d.total} clientes<br>
                        Rechazados: ${d.rechazados}
                    `
      );
    })
    .on("mouseout", function () {
      d3.select(this).attr("opacity", 1);
      ocultarTooltip();
    });

  // Etiquetas de porcentaje
  svg
    .selectAll("text.label")
    .data(datos)
    .join("text")
    .attr("class", "label")
    .attr("x", (d) => x(d.nacionalidad) + x.bandwidth() / 2)
    .attr("y", (d) => y(d.tasaRechazo) - 5)
    .attr("text-anchor", "middle")
    .attr("font-size", "12px")
    .attr("font-weight", "bold")
    .attr("fill", "#2c3e50")
    .text((d) => d.tasaRechazo.toFixed(1) + "%");

  // Ejes
  svg
    .append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    .attr("text-anchor", "end")
    .attr("font-size", "11px");

  svg.append("g").call(
    d3
      .axisLeft(y)
      .ticks(10)
      .tickFormat((d) => d + "%")
  );

  // Etiqueta eje Y
  svg
    .append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -45)
    .attr("text-anchor", "middle")
    .text("% de Rechazo");
}

// VISUALIZACIÓN 2: Scatter Plot (Ingreso vs Score)
function crearScatterPlot(data) {
  // Tomar muestra para mejor rendimiento (opcional)
  const muestra = data.filter((d, i) => i % 5 === 0);

  const margin = { top: 20, right: 120, bottom: 60, left: 80 };
  const width = 550 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  const svg = d3
    .select("#chart-scatter")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Escalas
  const x = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.ingresos_mensuales)])
    .range([0, width]);

  const y = d3.scaleLinear().domain([0, 1000]).range([height, 0]);

  // Escala de colores por nacionalidad
  const nacionalidades = [...new Set(data.map((d) => d.nacionalidad))];
  const colorScale = d3
    .scaleOrdinal()
    .domain(nacionalidades)
    .range(d3.schemeSet2);

  // Círculos
  svg
    .selectAll("circle")
    .data(muestra)
    .join("circle")
    .attr("cx", (d) => x(d.ingresos_mensuales))
    .attr("cy", (d) => y(d.score_riesgo))
    .attr("r", 4)
    .attr("fill", (d) => colorScale(d.nacionalidad))
    .attr("opacity", 0.6)
    .attr("stroke", "#fff")
    .attr("stroke-width", 0.5)
    .on("mouseover", function (event, d) {
      d3.select(this).attr("r", 7).attr("opacity", 1);
      mostrarTooltip(
        event,
        `
                        <strong>Cliente #${d.id_cliente}</strong><br>
                        Nacionalidad: ${d.nacionalidad}<br>
                        Ingresos: $${d.ingresos_mensuales.toLocaleString()}<br>
                        Score: ${d.score_riesgo}<br>
                        Decisión: <strong>${d.decision_legacy}</strong>
                    `
      );
    })
    .on("mouseout", function () {
      d3.select(this).attr("r", 4).attr("opacity", 0.6);
      ocultarTooltip();
    });

  // Ejes
  svg
    .append("g")
    .attr("transform", `translate(0,${height})`)
    .call(
      d3
        .axisBottom(x)
        .ticks(5)
        .tickFormat((d) => "$" + (d / 1000).toFixed(0) + "K")
    );

  svg.append("g").call(d3.axisLeft(y));

  // Etiquetas
  svg
    .append("text")
    .attr("class", "axis-label")
    .attr("x", width / 2)
    .attr("y", height + 45)
    .attr("text-anchor", "middle")
    .text("Ingresos Mensuales");

  svg
    .append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -60)
    .attr("text-anchor", "middle")
    .text("Score de Riesgo");

  // Leyenda
  const legend = svg
    .append("g")
    .attr("transform", `translate(${width + 10}, 0)`);

  nacionalidades.forEach((nac, i) => {
    const g = legend.append("g").attr("transform", `translate(0, ${i * 20})`);

    g.append("circle").attr("r", 5).attr("fill", colorScale(nac));

    g.append("text")
      .attr("x", 10)
      .attr("y", 4)
      .attr("font-size", "10px")
      .text(nac);
  });
}

// VISUALIZACIÓN 3: Top Comunas con mayor rechazo
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

  const margin = { top: 20, right: 30, bottom: 100, left: 60 };
  const width = 550 - margin.left - margin.right;
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

// VISUALIZACIÓN 4: Grupos etarios
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
