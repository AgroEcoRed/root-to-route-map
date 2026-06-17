const { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, Header, Footer, PageNumber } = require('docx');
const fs = require('fs');

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: "Arial", size: 24 }
      }
    },
    paragraphStyles: [
      {
        id: "Heading1",
        name: "Heading 1",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 28, bold: true, font: "Arial" },
        paragraph: { spacing: { before: 240, after: 120 } }
      }
    ]
  },
  sections: [{
    properties: {
      page: {
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: "Solicitud de Autorización de Uso de Logotipo", italics: true, size: 20, color: "666666" })]
        })]
      })
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "Página ", size: 20 }),
            new TextRun({ children: [PageNumber.CURRENT], size: 20 }),
            new TextRun({ text: " de ", size: 20 }),
            new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 20 })
          ]
        })]
      })
    },
    children: [
      // Encabezado
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { after: 120 },
        children: [new TextRun({ text: "[Ciudad], [Fecha]", size: 22 })]
      }),
      new Paragraph({ spacing: { after: 240 } }),

      // Destinatario
      new Paragraph({
        children: [
          new TextRun({ text: "Señor/a Director/a de Comunicación Institucional", bold: true }),
        ]
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "CONICET – Consejo Nacional de Investigaciones Científicas y Técnicas" }),
        ]
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Godoy Cruz 2370, C1425FQD CABA, Argentina" }),
        ]
      }),
      new Paragraph({ spacing: { after: 240 } }),

      // Referencia
      new Paragraph({
        spacing: { after: 120 },
        children: [
          new TextRun({ text: "Ref.: ", bold: true }),
          new TextRun({ text: "Solicitud de autorización de uso del logotipo institucional – Proyecto FONICS \"AgroEco.Red\"" })
        ]
      }),
      new Paragraph({ spacing: { after: 240 } }),

      // Saludo
      new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun({ text: "De mi mayor consideración:" })]
      }),
      new Paragraph({ spacing: { after: 240 } }),

      // Cuerpo - párrafo 1
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 200 },
        children: [
          new TextRun({ text: "Me dirijo a usted en mi carácter de ", size: 22 }),
          new TextRun({ text: "[nombre y cargo del solicitante]", bold: true, size: 22 }),
          new TextRun({ text: ", adscripto/a a la ", size: 22 }),
          new TextRun({ text: "[Unidad Ejecutora/Instituto/Universidad]", bold: true, size: 22 }),
          new TextRun({ text: ", a fin de solicitar formalmente la ", size: 22 }),
          new TextRun({ text: "autorización para el uso del logotipo institucional del CONICET", bold: true, size: 22 }),
          new TextRun({ text: " en el marco del proyecto de investigación denominado ", size: 22 }),
          new TextRun({ text: "\"AgroEco.Red – Infraestructura digital para sistemas alimentarios agroecológicos\"", italics: true, size: 22 }),
          new TextRun({ text: ", financiado por el Fondo para la Investigación Científica y Tecnológica (FONCyT) del Ministerio de Ciencia, Tecnología e Innovación de la Nación, en el marco de la convocatoria FONICS 2024.", size: 22 })
        ]
      }),

      // Cuerpo - párrafo 2
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 200 },
        children: [
          new TextRun({ text: "El proyecto AgroEco.Red constituye una plataforma digital de investigación-acción orientada a fortalecer la soberanía alimentaria mediante la conexión directa de actores de sistemas alimentarios agroecológicos, la reducción de intermediarios y la generación de insumos para la formulación de políticas públicas. El logotipo del CONICET será utilizado exclusivamente con fines de identificación institucional en los siguientes soportes:", size: 22 })
        ]
      }),

      // Lista
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 80 },
        indent: { left: 720 },
        children: [new TextRun({ text: "•  Sitio web del proyecto (agroeco.red)", size: 22 })]
      }),
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 80 },
        indent: { left: 720 },
        children: [new TextRun({ text: "•  Documentos técnicos, informes de avance y final", size: 22 })]
      }),
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 80 },
        indent: { left: 720 },
        children: [new TextRun({ text: "•  Materiales de difusión académica y científica", size: 22 })]
      }),
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 200 },
        indent: { left: 720 },
        children: [new TextRun({ text: "•  Presentaciones en congresos, seminarios y jornadas institucionales", size: 22 })]
      }),

      // Cuerpo - párrafo 3
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 200 },
        children: [
          new TextRun({ text: "En todos los casos, el uso del logotipo se ajustará estrictamente a las normativas establecidas en el ", size: 22 }),
          new TextRun({ text: "Manual de Marca", bold: true, size: 22 }),
          new TextRun({ text: " del CONICET, preservando sus colores originales, proporciones y zonas de respeto, sin aplicar filtros, efectos de opacidad ni modificaciones de ninguna índole que alteren la identidad visual institucional.", size: 22 })
        ]
      }),

      // Cuerpo - párrafo 4
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 200 },
        children: [
          new TextRun({ text: "Acompaño a la presente la siguiente documentación de respaldo:", size: 22 })
        ]
      }),

      // Lista documentación
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 80 },
        indent: { left: 720 },
        children: [new TextRun({ text: "1. Resumen ejecutivo del proyecto AgroEco.Red.", size: 22 })]
      }),
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 80 },
        indent: { left: 720 },
        children: [new TextRun({ text: "2. Presentación institucional del proyecto FONICS.", size: 22 })]
      }),
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 80 },
        indent: { left: 720 },
        children: [new TextRun({ text: "3. Capturas de pantalla del sitio web donde se visualizará el logotipo.", size: 22 })]
      }),
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 200 },
        indent: { left: 720 },
        children: [new TextRun({ text: "4. Constancia de adscripción institucional del solicitante.", size: 22 })]
      }),

      // Cuerpo - párrafo 5
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 200 },
        children: [
          new TextRun({ text: "Quedo a su entera disposición para ampliar cualquier información que sea requerida y para ajustar la presentación del logotipo según las indicaciones de la Dirección de Comunicación Institucional.", size: 22 })
        ]
      }),

      // Cuerpo - párrafo 6
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 240 },
        children: [
          new TextRun({ text: "Sin otro particular, saludo a usted atentamente.", size: 22 })
        ]
      }),

      // Firma
      new Paragraph({ spacing: { after: 80 } }),
      new Paragraph({ spacing: { after: 80 } }),
      new Paragraph({
        children: [
          new TextRun({ text: "_______________________________", size: 22 })
        ]
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "[Nombre completo]", bold: true, size: 22 })
        ]
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "[Cargo / Titulación]", size: 22 })
        ]
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "[Institución de adscripción]", size: 22 })
        ]
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "DNI: [número]  |  CUIL: [número]", size: 22 })
        ]
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Correo electrónico: [email]", size: 22 })
        ]
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Teléfono: [número]", size: 22 })
        ]
      }),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("/mnt/documents/Carta_CONICET_Autorizacion_Logo.docx", buffer);
  console.log("Documento Word generado exitosamente: Carta_CONICET_Autorizacion_Logo.docx");
});
