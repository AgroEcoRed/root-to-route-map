const { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } = require("docx");
const fs = require("fs");

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 24 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Arial", color: "2D5016" },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Arial", color: "4A7C2E" },
        paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 1 } },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    children: [
      // Título principal
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [new TextRun({ text: "RESUMEN EJECUTIVO", bold: true, size: 40, font: "Arial", color: "2D5016" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
        children: [new TextRun({ text: "AgroEco.Red — Infraestructura Digital para Sistemas Alimentarios Agroecológicos", size: 28, font: "Arial", color: "4A7C2E" })]
      }),

      // Línea separadora
      new Paragraph({
        border: { bottom: { style: 1, size: 6, color: "8FBC8F", space: 1 } },
        spacing: { after: 300 },
        children: []
      }),

      // 1. Descripción del proyecto
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("1. Presentación del proyecto")] }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ text: "AgroEco.Red es una plataforma digital integral diseñada para fortalecer los sistemas alimentarios agroecológicos a través de la conexión directa entre actores territoriales. Cada módulo está pensado para reducir intermediarios, fortalecer la soberanía alimentaria y generar datos útiles para la investigación-acción y la formulación de políticas públicas.", size: 24, font: "Arial" })]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ text: "La plataforma opera como una herramienta de investigación-acción participativa, articulando saberes científicos, productivos y comunitarios en un entorno colaborativo que favorece la toma de decisiones informada a nivel territorial.", size: 24, font: "Arial" })]
      }),

      // 2. Contexto y problemática
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("2. Contexto y problemática")] }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ text: "Los sistemas alimentarios convencionales enfrentan crecientes tensiones: concentración de la oferta en grandes intermediarios, pérdida de soberanía alimentaria, dificultades de trazabilidad y escasa visibilidad de los productores agroecológicos. Simultáneamente, las políticas públicas carecen a menudo de datos actualizados y georreferenciados sobre la producción agroecológica a nivel local y regional.", size: 24, font: "Arial" })]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ text: "AgroEco.Red responde a esta brecha proponiendo una infraestructura digital de código abierto que conecta actores, visibiliza la producción agroecológica y genera información estratégica para la planificación territorial y la incidencia política.", size: 24, font: "Arial" })]
      }),

      // 3. Solución y arquitectura
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("3. Solución propuesta")] }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ text: "La plataforma se estructura en módulos interoperables que cubren el ciclo completo de los sistemas alimentarios agroecológicos:", size: 24, font: "Arial" })]
      }),

      // Módulos
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("3.1. Mapa Interactivo de Actores")] }),
      new Paragraph({
        spacing: { after: 160 },
        children: [new TextRun({ text: "Georreferenciación de productores, puntos de comercialización, cocineros de comunidad, centros de acopio y nodos logísticos. Permite filtrar por tipo de actor, rubro productivo y zona geográfica.", size: 24, font: "Arial" })]
      }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("3.2. Mercado Territorial")] }),
      new Paragraph({
        spacing: { after: 160 },
        children: [new TextRun({ text: "Canal de comercialización directa que conecta oferta y demanda de productos agroecológicos, con herramientas de pedido, gestión de stock y trazabilidad de origen.", size: 24, font: "Arial" })]
      }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("3.3. Certificación Participativa (SPG)")] }),
      new Paragraph({
        spacing: { after: 160 },
        children: [new TextRun({ text: "Sistema de Garantía Participativa que permite a los productores obtener reconocimiento comunitario de sus prácticas agroecológicas, con niveles progresivos de certificación basados en evaluación entre pares.", size: 24, font: "Arial" })]
      }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("3.4. Hub de Servicios")] }),
      new Paragraph({
        spacing: { after: 160 },
        children: [new TextRun({ text: "Espacio de articulación para servicios de asistencia técnica, acceso a semillas, herramientas, infraestructura compartida e información climática local.", size: 24, font: "Arial" })]
      }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("3.5. Comunidad y Gestión del Conocimiento")] }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ text: "Foro de discusión, wiki colaborativa y calendario de eventos para el intercambio de saberes, la organización territorial y la construcción colectiva de conocimiento.", size: 24, font: "Arial" })]
      }),

      // 4. Sostenibilidad y financiamiento
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("4. Modelo de sostenibilidad")] }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ text: "AgroEco.Red se postulará a financiamientos en la medida que las necesidades de articulación con actores territoriales y gubernamentales lo requieran. El proyecto prioriza la alineación con demandas concretas de los territorios y la generación de alianzas estratégicas con organismos públicos, universidades y organizaciones de la sociedad civil.", size: 24, font: "Arial" })]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ text: "La sostenibilidad de la plataforma se basa en un modelo de gobernanza participativa, código abierto y replicabilidad, que permite adaptar la infraestructura a distintos contextos territoriales sin dependencia de un único financiamiento.", size: 24, font: "Arial" })]
      }),

      // 5. Impacto esperado
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("5. Impacto esperado")] }),
      new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun({ text: "Se esperan los siguientes resultados a mediano plazo:", size: 24, font: "Arial" })]
      }),
      new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun({ text: "• Reducción de intermediarios en la comercialización de productos agroecológicos.", size: 24, font: "Arial" })]
      }),
      new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun({ text: "• Fortalecimiento de la soberanía alimentaria en territorios priorizados.", size: 24, font: "Arial" })]
      }),
      new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun({ text: "• Generación de datos abiertos para la planificación de políticas públicas.", size: 24, font: "Arial" })]
      }),
      new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun({ text: "• Visibilización y reconocimiento de productores agroecológicos mediante certificación participativa.", size: 24, font: "Arial" })]
      }),
      new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun({ text: "• Articulación entre investigación académica, prácticas productivas y demandas comunitarias.", size: 24, font: "Arial" })]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ text: "• Replicabilidad de la plataforma en otras regiones del país y de Latinoamérica.", size: 24, font: "Arial" })]
      }),

      // 6. Próximos pasos
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("6. Próximos pasos")] }),
      new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun({ text: "• Articulación con organismos gubernamentales para la incorporación de datos oficiales.", size: 24, font: "Arial" })]
      }),
      new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun({ text: "• Pilotaje de la plataforma en territorios priorizados con acompañamiento local.", size: 24, font: "Arial" })]
      }),
      new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun({ text: "• Postulación a fondos de investigación e innovación orientados a la sostenibilidad alimentaria.", size: 24, font: "Arial" })]
      }),
      new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun({ text: "• Consolidación de la comunidad de usuarios y definición de protocolos de gobernanza.", size: 24, font: "Arial" })]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ text: "• Desarrollo de alianzas con redes de agroecología y organizaciones de la sociedad civil.", size: 24, font: "Arial" })]
      }),

      // Cierre
      new Paragraph({
        border: { top: { style: 1, size: 6, color: "8FBC8F", space: 1 } },
        spacing: { before: 300, after: 200 },
        children: [new TextRun({ text: "Contacto", bold: true, size: 24, font: "Arial", color: "2D5016" })]
      }),
      new Paragraph({
        spacing: { after: 80 },
        children: [new TextRun({ text: "Web: https://agroeco.red", size: 24, font: "Arial" })]
      }),
      new Paragraph({
        spacing: { after: 80 },
        children: [new TextRun({ text: "Email: [correo institucional]", size: 24, font: "Arial" })]
      }),
      new Paragraph({
        spacing: { after: 80 },
        children: [new TextRun({ text: "Responsable del proyecto: [Nombre completo]", size: 24, font: "Arial" })]
      }),
      new Paragraph({
        children: [new TextRun({ text: "Institución: [Institución de pertenencia]", size: 24, font: "Arial" })]
      }),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("/mnt/documents/Resumen_Ejecutivo_AgroEcoRed.docx", buffer);
  console.log("Documento generado exitosamente: /mnt/documents/Resumen_Ejecutivo_AgroEcoRed.docx");
});
