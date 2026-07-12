/**
 * Setup script for "El Código del Guerrero".
 *
 * Run ONCE, from script.google.com, under the NEW dedicated Google account
 * for the business (not a personal or third-party account). It recreates,
 * from scratch, the two Google Forms + their linked response spreadsheets
 * used by the site:
 *
 *   1. "Valoración Física y Nutricional" → sheet "Registro Inicial"
 *   2. "Seguimiento Mensual"              → sheet "Registro de Avances"
 *
 * How to run:
 *   1. Go to https://script.google.com (logged in as the new business account).
 *   2. New project → paste this whole file → Save.
 *   3. Select the function `setupAll` in the toolbar dropdown → Run.
 *   4. Approve the permissions prompt (it needs access to Forms/Sheets in
 *      this same account only).
 *   5. Open "Executions" (or View → Logs) to read the URLs it prints:
 *      form edit URL, spreadsheet URL, and a sample pre-filled form link
 *      (needed for docs/AUTH_AND_AGENDAMIENTO.md — the entry IDs powering
 *      the "prellenado" links from the dashboard).
 *
 * Safe to re-run: each run creates NEW forms/sheets (it does not edit
 * existing ones), so only run this once per environment.
 */

// Lives in its OWN tab, separate from the Forms' auto-generated response
// tabs (Google Forms always APPENDS a new row per submission — it never
// updates an existing one — so payment/booking/guide status, which need to
// be updated in place by the site's backend, cannot safely live on the same
// row a form response creates). Keyed by "Correo".
const ESTADO_CLIENTE_COLUMNS = [
  'Correo',
  'Nombre',
  'Estado de pago',
  'Plan comprado',
  'Fecha de pago',
  'Referencia Wompi',
  'Entrevista agendada (fecha y hora)',
  'Link de guía',
  'Último seguimiento mensual',
];

function setupAll() {
  const valoracion = buildValoracionForm();
  const seguimiento = buildSeguimientoForm();
  const estadoClienteUrl = createEstadoClienteSheet(valoracion.spreadsheetId);

  Logger.log('========================================');
  Logger.log('VALORACIÓN FÍSICA Y NUTRICIONAL');
  Logger.log('Form edit URL: ' + valoracion.form.getEditUrl());
  Logger.log('Form public URL: ' + valoracion.form.getPublishedUrl());
  Logger.log('Sheet URL: ' + valoracion.sheetUrl);
  Logger.log('Sample pre-filled URL (Nombre + Correo): ' + valoracion.sampleUrl);
  Logger.log('========================================');
  Logger.log('SEGUIMIENTO MENSUAL');
  Logger.log('Form edit URL: ' + seguimiento.form.getEditUrl());
  Logger.log('Form public URL: ' + seguimiento.form.getPublishedUrl());
  Logger.log('Sheet URL: ' + seguimiento.sheetUrl);
  Logger.log('Sample pre-filled URL (Nombre + Correo): ' + seguimiento.sampleUrl);
  Logger.log('========================================');
  Logger.log('ESTADO DE CLIENTE (tab dentro de la hoja de Registro Inicial)');
  Logger.log('URL: ' + estadoClienteUrl);
  Logger.log('Spreadsheet ID (para REGISTRO_INICIAL_SHEET_ID): ' + valoracion.spreadsheetId);
  Logger.log('========================================');
  Logger.log('Copy the URLs/IDs above into docs/AUTH_AND_AGENDAMIENTO.md / config.js / Edge Function secrets');
}

// ── Form field builder (data-driven, avoids 90 repetitive calls) ──────────

function addField(form, f) {
  let item;
  switch (f.type) {
    case 'text':
      item = form.addTextItem();
      break;
    case 'number':
      item = form.addTextItem();
      item.setValidation(FormApp.createTextValidation().requireNumber().build());
      break;
    case 'email':
      item = form.addTextItem();
      item.setValidation(FormApp.createTextValidation().requireTextIsEmail().build());
      break;
    case 'paragraph':
      item = form.addParagraphTextItem();
      break;
    case 'choice':
      item = form.addMultipleChoiceItem().setChoiceValues(f.choices);
      break;
    case 'checkbox':
      item = form.addCheckboxItem().setChoiceValues(f.choices);
      break;
    case 'grid':
      item = form.addGridItem().setRows(f.rows).setColumns(f.columns);
      break;
    default:
      throw new Error('Unknown field type: ' + f.type);
  }
  item.setTitle(f.title);
  if (f.required) item.setRequired(true);
  return item;
}

function addPages(form, pages) {
  const fieldItems = {}; // title -> Item, for later lookup (prefill helper)
  pages.forEach((page, index) => {
    if (index > 0) {
      const brk = form.addPageBreakItem().setTitle(page.title);
      if (page.description) brk.setHelpText(page.description);
    } else if (page.description) {
      form.setDescription(form.getDescription() + '\n\n' + page.description);
    }
    page.fields.forEach((f) => {
      fieldItems[f.title] = addField(form, f);
    });
  });
  return fieldItems;
}

// Creates a destination spreadsheet with a friendly tab name and links the
// form to it. Deliberately does NOT add extra tracking columns here — Google
// Forms always APPENDS a new row per submission, so a column meant to be
// updated later (payment status, etc.) can never safely live on a
// form-response row. See createEstadoClienteSheet() for where that lives.
function linkFormToNamedSheet(form, spreadsheetTitle, sheetTabName) {
  const ss = SpreadsheetApp.create(spreadsheetTitle);
  const defaultSheet = ss.getSheets()[0]; // empty "Sheet1", unused once responses land

  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  SpreadsheetApp.flush();

  const responseSheet = ss.getSheets().find((sheet) => sheet.getName().indexOf('Form Responses') === 0);
  if (!responseSheet) throw new Error('Could not find the auto-created form response sheet.');
  responseSheet.setName(sheetTabName);
  ss.deleteSheet(defaultSheet);

  return { url: ss.getUrl(), spreadsheetId: ss.getId() };
}

// Adds the "Estado de Cliente" tab (payment/booking/guide tracking, one row
// per client, keyed by "Correo") to the same spreadsheet as "Registro
// Inicial". This is the only sheet the site's backend ever writes to.
function createEstadoClienteSheet(spreadsheetId) {
  const ss = SpreadsheetApp.openById(spreadsheetId);
  const sheet = ss.insertSheet('Estado de Cliente');
  sheet.getRange(1, 1, 1, ESTADO_CLIENTE_COLUMNS.length).setValues([ESTADO_CLIENTE_COLUMNS]);
  sheet.setFrozenRows(1);
  return ss.getUrl() + '#gid=' + sheet.getSheetId();
}

// Builds a sample pre-filled link using the official FormApp response API
// (avoids guessing entry.<id> numbers by hand).
function samplePrefillUrl(form, fieldItems, nombreValue, correoValue) {
  const response = form.createResponse();
  const nombreItem = fieldItems['Nombre'] || fieldItems['Tu nombre'];
  const correoItem = fieldItems['Correo'];
  if (nombreItem) {
    response.withItemResponse(nombreItem.asTextItem().createResponse(nombreValue));
  }
  if (correoItem) {
    response.withItemResponse(correoItem.asTextItem().createResponse(correoValue));
  }
  return response.toPrefilledUrl();
}

// ── Form 1: Valoración Física y Nutricional ────────────────────────────────

function buildValoracionForm() {
  const form = FormApp.create('Valoración Física y Nutricional - El Código del Guerrero');
  form.setDescription(
    'Esta información es confidencial y nos permite construir tu plan de ' +
    'entrenamiento y nutrición. Sé lo más honesto/a posible: tus respuestas ' +
    'guían el seguimiento y los ajustes de tu proceso.'
  );
  form.setIsQuiz(false);
  form.setCollectEmail(false);

  const medidas = [
    'Cuello (cm)', 'Hombro Izq (cm)', 'Hombro Der (cm)', 'Espalda (cm)', 'Pecho (cm)',
    'Brazo (Bíceps) Izq (cm)', 'Brazo (Bíceps) Der (cm)', 'Antebrazo Izq (cm)', 'Antebrazo Der (cm)',
    'Abdomen (cm)', 'Glúteos (cm)', 'Muslo (Pierna) Izq (cm)', 'Muslo (Pierna) Der (cm)',
    'Gemelos Izq (cm)', 'Gemelos Der (cm)',
  ].map((title) => ({ title, type: 'number' }));

  const condicionesSalud = [
    '¿Sufre de estreñimiento?', '¿Migrañas o jaquecas?', '¿Estrés?', '¿Problemas de circulación?',
    '¿Problemas digestivos?', '¿Cansancio o sueño excesivo?', '¿Artritis o artrosis?', '¿Varices?',
    '¿Osteoporosis?', '¿Diabetes?', '¿Colesterol?', '¿Alergias?', '¿Depresión?', '¿Hipertensión?',
    '¿Anemia?', '¿Asma?', '¿Insomnio?', '¿Dolor premenstrual?', '¿Retención de líquidos?',
    '¿Problemas cardiovasculares?', '¿Problemas de tiroides?', '¿Resequedad en la piel?',
    '¿Piernas cansadas o hinchadas?',
  ].map((title) => ({ title, type: 'choice', choices: ['Sí', 'No'] }));

  const pages = [
    {
      title: 'Datos básicos',
      fields: [
        { title: 'Nombre', type: 'text', required: true },
        { title: 'Edad', type: 'number', required: true },
        { title: 'Sexo', type: 'choice', choices: ['Masculino', 'Femenino', 'Otro'], required: true },
        { title: 'Ocupación', type: 'text' },
        { title: 'Ciudad y dirección', type: 'text' },
        { title: 'Número telefónico', type: 'text', required: true },
        { title: 'Correo', type: 'email', required: true },
        { title: '¿Cuál es tu objetivo?', type: 'paragraph', required: true },
        { title: '¿Por qué quiere conseguir ese objetivo?', type: 'paragraph' },
      ],
    },
    {
      title: 'Medidas corporales',
      description: 'Antes de continuar, revisa la guía de toma de medidas para reportar datos precisos.',
      fields: [
        { title: 'Estatura (cm)', type: 'number', required: true },
        { title: 'Peso (Kilos)', type: 'number', required: true },
        { title: 'Talla en ropa', type: 'choice', choices: ['XS', 'S', 'M', 'L', 'XL'] },
        ...medidas,
      ],
    },
    {
      title: 'Ejercicio y nutrición',
      fields: [
        { title: '¿Ha realizado algún tipo de ejercicio antes?', type: 'choice', choices: ['Sí', 'No'], required: true },
        { title: 'Si su respuesta anterior fue sí, especifique qué tipo de ejercicio (tiempo, fecha y resultados)', type: 'paragraph' },
        { title: '¿Qué tipos de comida consume?', type: 'paragraph' },
        { title: '¿Cuántas comidas realiza al día y en qué horarios?', type: 'paragraph' },
        { title: '¿Cómo está tu nivel de energía?', type: 'choice', choices: ['Bajo', 'Medio', 'Alto'] },
        { title: '¿Cómo considera su nutrición?', type: 'choice', choices: ['Mala', 'Regular', 'Buena', 'Muy buena'] },
        { title: '¿Fuma o bebe?', type: 'text' },
        { title: '¿Le gustan las comidas dulces?', type: 'choice', choices: ['Sí', 'No'] },
        { title: '¿Come frutas y verduras a diario?', type: 'choice', choices: ['Sí', 'No'] },
        { title: '¿Cuánta agua toma diariamente?', type: 'text' },
        { title: '¿Tienes alguna restricción alimentaria?', type: 'paragraph' },
        {
          title: '¿Qué días de la semana deseas entrenar?', type: 'checkbox', required: true,
          choices: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
        },
      ],
    },
    {
      title: 'Antecedentes de salud',
      description: 'Responde Sí o No según corresponda.',
      fields: [
        ...condicionesSalud,
        { title: '¿Cuántas horas al día duerme?', type: 'number' },
      ],
    },
  ];

  const fieldItems = addPages(form, pages);
  const { url: sheetUrl, spreadsheetId } = linkFormToNamedSheet(
    form,
    'Registro Inicial - El Código del Guerrero',
    'Registro Inicial'
  );
  const sampleUrl = samplePrefillUrl(form, fieldItems, 'NOMBRE_DE_PRUEBA', 'correo@ejemplo.com');

  return { form, sheetUrl, spreadsheetId, sampleUrl };
}

// ── Form 2: Seguimiento Mensual ────────────────────────────────────────────

function buildSeguimientoForm() {
  const form = FormApp.create('Seguimiento Mensual - El Código del Guerrero');
  form.setDescription('Seguimiento mensual de tus objetivos y tu progreso.');
  form.setIsQuiz(false);

  const medidas = [
    'Cuello (cm)', 'Hombro Izq (cm)', 'Hombro Der (cm)', 'Espalda (cm)', 'Pecho (cm)',
    'Brazo (Bíceps) Izq (cm)', 'Brazo (Bíceps) Der (cm)', 'Antebrazo Izq (cm)', 'Antebrazo Der (cm)',
    'Abdomen (cm)', 'Glúteos (cm)', 'Muslo (Pierna) Izq (cm)', 'Muslo (Pierna) Der (cm)',
    'Gemelos Izq (cm)', 'Gemelos Der (cm)',
  ].map((title) => ({ title, type: 'number' }));

  const pages = [
    {
      title: 'Tu experiencia',
      fields: [
        { title: 'Tu nombre', type: 'text', required: true },
        { title: 'Correo', type: 'email', required: true },
        {
          title: '¿Cuál ha sido tu experiencia con tu coach?', type: 'choice', required: true,
          choices: ['Excelente', 'Satisfactorio', 'Muy bueno', 'Medio', 'Deficiente', 'Otros'],
        },
        {
          title: 'Califica tu avance', type: 'grid',
          rows: ['Nutrición', 'Rendimiento deportivo', 'Nivel de energía', 'Consumo de agua', 'Manejo del Stress', 'Calidad de sueño'],
          columns: ['Deficiente', 'Regular', 'Bueno', 'Muy bueno', 'Excelente'],
        },
      ],
    },
    {
      title: 'Tu avance',
      fields: [
        { title: 'Peso (Kilos)', type: 'number', required: true },
        ...medidas,
      ],
    },
    {
      title: 'Dieta y rutina',
      fields: [
        { title: '¿Qué se le ha dificultado en la dieta?', type: 'paragraph' },
        { title: '¿Qué se le ha facilitado en la dieta?', type: 'paragraph' },
        { title: '¿Tienes alguna sugerencia o recomendación sobre la dieta?', type: 'paragraph' },
        { title: '¿La dieta le ha ocasionado algún problema digestivo?', type: 'choice', choices: ['Sí', 'No'] },
        { title: '¿Qué se le ha dificultado en la rutina?', type: 'paragraph' },
        { title: '¿Qué se le ha facilitado en la rutina?', type: 'paragraph' },
        { title: '¿Tienes alguna sugerencia o recomendación sobre la rutina?', type: 'paragraph' },
        { title: '¿La rutina le ha ocasionado algún tipo de problema físico?', type: 'choice', choices: ['Sí', 'No'] },
      ],
    },
    {
      title: 'Calificación general',
      fields: [
        { title: '¿Tienes alguna sugerencia?', type: 'paragraph' },
        {
          title: '¿Recomendarías El Código del Guerrero a algún conocido(a)?', type: 'choice',
          choices: ['Sí', 'No', 'Tal vez'],
        },
      ],
    },
  ];

  const fieldItems = addPages(form, pages);

  const { url: sheetUrl } = linkFormToNamedSheet(
    form,
    'Registro de Avances - El Código del Guerrero',
    'Registro de Avances'
  );
  const sampleUrl = samplePrefillUrl(form, fieldItems, 'NOMBRE_DE_PRUEBA', 'correo@ejemplo.com');

  return { form, sheetUrl, sampleUrl };
}
