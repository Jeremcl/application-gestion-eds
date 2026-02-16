const PDFDocument = require('pdfkit');
const SVGtoPDF = require('svg-to-pdfkit');
const fs = require('fs');
const path = require('path');

// Couleur verte EDS22
const EDS_GREEN = '#2D7A3E';

// Fonction utilitaire pour formater la date
const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR');
};

// Fonction helper pour dessiner un rectangle arrondi
const drawRoundedRect = (doc, x, y, width, height, radius) => {
  doc.roundedRect(x, y, width, height, radius);
};

// Générer fiche de dépôt DA1.1
const genererFicheDepot = (data, stream) => {
  const doc = new PDFDocument({
    margin: 56.69, // 2cm en points
    size: 'A4'
  });
  doc.pipe(stream);

  const pageWidth = doc.page.width;
  const leftMargin = doc.page.margins.left;
  const rightMargin = doc.page.width - doc.page.margins.right;
  const contentWidth = rightMargin - leftMargin;

  // === EN-TÊTE ===

  // Numéro d'intervention en haut à gauche (en vert)
  doc.fontSize(10).font('Helvetica').fillColor(EDS_GREEN);
  doc.text(data.numero || 'N/A', leftMargin, 50, { align: 'left' });

  // "Fiche DA1.1" en haut à droite (en vert)
  doc.fontSize(10).font('Helvetica').fillColor(EDS_GREEN);
  doc.text('Fiche DA1.1', rightMargin - 100, 50, { width: 100, align: 'right' });

  // Titre principal centré en vert
  doc.moveDown(2);
  doc.fontSize(18).font('Helvetica-Bold').fillColor(EDS_GREEN);
  doc.text('Fiche de dépôt d\'appareil', leftMargin, doc.y, {
    width: contentWidth,
    align: 'center'
  });

  doc.moveDown(2);
  doc.fillColor('#000000'); // Retour au noir

  // === SECTION INFORMATIONS (2 COLONNES) ===

  const infoY = doc.y;
  const colWidth = contentWidth / 2 - 10;

  // Colonne gauche - Informations client
  doc.fontSize(10).font('Helvetica');
  const leftColX = leftMargin;
  let currentY = infoY;

  doc.text(`Nom : ${data.client?.nom || ''} ${data.client?.prenom || ''}`, leftColX, currentY);
  currentY += 15;
  doc.text(`Téléphone : ${data.client?.telephone || ''}`, leftColX, currentY);
  currentY += 15;
  doc.text(`Email : ${data.client?.email || ''}`, leftColX, currentY);

  // Colonne droite - Informations appareil
  const rightColX = leftMargin + colWidth + 20;
  currentY = infoY;

  doc.text(`Type d'appareil : ${data.appareil?.type || ''}`, rightColX, currentY);
  currentY += 15;
  doc.text(`Marque : ${data.appareil?.marque || ''}`, rightColX, currentY);

  doc.moveDown(3);

  // === ENCADRÉ 1 - ACCESSOIRES ===

  const accessoiresY = doc.y;
  const accessoiresHeight = 150;

  // Dessiner le rectangle arrondi
  doc.strokeColor(EDS_GREEN).lineWidth(2);
  drawRoundedRect(doc, leftMargin, accessoiresY, contentWidth, accessoiresHeight, 20);
  doc.stroke();

  // Titre de l'encadré
  doc.fontSize(11).font('Helvetica-Bold').fillColor('#000000');
  doc.text('ACCESSOIRES REMIS AVEC L\'APPAREIL', leftMargin, accessoiresY + 15, {
    width: contentWidth,
    align: 'center'
  });

  // Puces pour les accessoires (2 colonnes)
  doc.fontSize(10).font('Helvetica');
  const bulletStartY = accessoiresY + 45;
  const bulletLeftX = leftMargin + 30;
  const bulletRightX = leftMargin + contentWidth / 2 + 10;

  // Si des accessoires sont fournis, les afficher
  const accessoires = data.accessoires || [];
  const maxAccessoires = 6; // Maximum de puces à afficher

  for (let i = 0; i < maxAccessoires; i++) {
    const bulletY = bulletStartY + (Math.floor(i / 2) * 25);
    const isLeftColumn = i % 2 === 0;
    const bulletX = isLeftColumn ? bulletLeftX : bulletRightX;
    const accessoire = accessoires[i] || '';

    // Dessiner la puce
    doc.circle(bulletX, bulletY + 5, 2).fill('#000000');
    doc.text(accessoire, bulletX + 10, bulletY, { width: colWidth - 50 });
  }

  doc.y = accessoiresY + accessoiresHeight + 20;

  // === ENCADRÉ 2 - CONDITIONS DE DÉPÔT ===

  const conditionsY = doc.y;
  const conditionsHeight = 250;

  // Dessiner le rectangle arrondi
  doc.strokeColor(EDS_GREEN).lineWidth(2);
  drawRoundedRect(doc, leftMargin, conditionsY, contentWidth, conditionsHeight, 20);
  doc.stroke();

  // Titre de l'encadré
  doc.fontSize(11).font('Helvetica-Bold').fillColor('#000000');
  doc.text('CONDITIONS DE DÉPÔT', leftMargin, conditionsY + 15, {
    width: contentWidth,
    align: 'center'
  });

  // 2 colonnes de conditions
  const condContentY = conditionsY + 45;
  const condLeftX = leftMargin + 15;
  const condRightX = leftMargin + contentWidth / 2 + 10;
  const condColWidth = contentWidth / 2 - 25;

  // Colonne gauche - LE DÉPÔT INCLUS
  doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000');
  doc.text('LE DÉPÔT INCLUS', condLeftX, condContentY, { width: condColWidth });

  doc.fontSize(9).font('Helvetica');
  doc.text(
    '• la prise en charge de votre appareil dans notre atelier',
    condLeftX,
    condContentY + 18,
    { width: condColWidth, lineGap: 2 }
  );
  doc.text(
    '• les frais de main d\'œuvre pour réaliser un diagnostic',
    condLeftX,
    doc.y + 5,
    { width: condColWidth, lineGap: 2 }
  );

  // Colonne droite - LE FORFAIT N'INCLUT PAS
  doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000');
  doc.text('LE FORFAIT N\'INCLUT PAS :', condRightX, condContentY, { width: condColWidth });

  doc.fontSize(9).font('Helvetica');
  const rightTextStartY = condContentY + 18;
  doc.text(
    '• les frais de main d\'œuvre pour réparer votre appareil et réaliser les tests',
    condRightX,
    rightTextStartY,
    { width: condColWidth, lineGap: 2 }
  );
  doc.text(
    '• le coût des pièces détachées (pièces dispensées par notre fournisseur uniquement)',
    condRightX,
    doc.y + 5,
    { width: condColWidth, lineGap: 2 }
  );
  doc.text(
    '• la relivraison, l\'installation et la mise en route de votre appareil (peut être demandé en supplément)',
    condRightX,
    doc.y + 5,
    { width: condColWidth, lineGap: 2 }
  );

  // Note en bas de l'encadré
  const noteY = conditionsY + conditionsHeight - 60;
  doc.fontSize(8).font('Helvetica').fillColor('#000000');
  doc.text(
    'En cas de refus du devis, si vous souhaitez récupérer votre appareil dans son état remonté, des frais de remontage pourraient vous être demandés. Si le devis est refusé ou en absence de réponse, l\'appareil sera conservé 7 jours au delà de la date de validité. Passé ce délai, l\'appareil sera ferraillé.',
    leftMargin + 15,
    noteY,
    { width: contentWidth - 30, align: 'justify', lineGap: 1 }
  );

  doc.y = conditionsY + conditionsHeight + 20;

  // === SECTION SIGNATURE ===

  doc.fontSize(10).font('Helvetica').fillColor('#000000');
  const dateSignature = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  doc.text(`FAIT À GRÂCES, LE ${dateSignature}`, leftMargin, doc.y, {
    width: contentWidth,
    align: 'left'
  });
  doc.moveDown(1);
  doc.text('Signature du client :', leftMargin, doc.y, { align: 'left' });
  doc.moveDown(0.5);

  // Ajouter la signature si disponible
  if (data.signaturePath && fs.existsSync(data.signaturePath)) {
    try {
      doc.image(data.signaturePath, leftMargin, doc.y, {
        width: 200,
        height: 80,
        fit: [200, 80]
      });
      doc.moveDown(5);
    } catch (error) {
      console.error('Erreur chargement signature:', error);
      doc.moveDown(4); // Espace pour signature manuelle si erreur
    }
  } else {
    doc.moveDown(4); // Espace pour signature manuelle
  }

  // === PIED DE PAGE - SIRET CENTRÉ ===
  const footerY = doc.page.height - doc.page.margins.bottom - 30;
  doc.fontSize(9).font('Helvetica').fillColor(EDS_GREEN);
  doc.text(
    'EDS22 - Électro Dépannage Service - SIRET : 91137432000016',
    leftMargin,
    footerY,
    { width: contentWidth, align: 'center' }
  );

  // === LOGO EN BAS À DROITE (PETIT) ===
  const logoPath = path.join(__dirname, '..', 'assets', 'Logo-eds-vert.svg');
  try {
    if (fs.existsSync(logoPath)) {
      const svgContent = fs.readFileSync(logoPath, 'utf8');
      const logoSize = 50; // Taille réduite du logo
      const logoX = rightMargin - logoSize - 5; // 5px de marge depuis le bord droit
      const logoY = doc.page.height - doc.page.margins.bottom - logoSize - 5; // 5px de marge depuis le bas

      doc.save();
      doc.translate(logoX, logoY);
      SVGtoPDF(doc, svgContent, 0, 0, { width: logoSize, height: logoSize });
      doc.restore();
    }
  } catch (error) {
    console.error('Erreur chargement logo:', error);
  }

  doc.end();
  return doc;
};

// Générer attestation d'enlèvement à domicile AEA1.1
const genererAttestationEnlevement = (data, stream) => {
  const doc = new PDFDocument({
    margin: 56.69, // 2cm en points (1cm = 28.35 points)
    size: 'A4'
  });
  doc.pipe(stream);

  const pageWidth = doc.page.width;
  const leftMargin = doc.page.margins.left;
  const rightMargin = doc.page.width - doc.page.margins.right;
  const contentWidth = rightMargin - leftMargin;

  // === EN-TÊTE ===

  // Logo EDS22 en haut à gauche (si disponible)
  const logoPath = path.join(__dirname, '..', 'assets', 'Logo-eds-vert.svg');
  try {
    if (fs.existsSync(logoPath)) {
      const svgContent = fs.readFileSync(logoPath, 'utf8');
      // Positionner le logo
      doc.save();
      doc.translate(leftMargin, 50);
      SVGtoPDF(doc, svgContent, 0, 0, { width: 60, height: 60 });
      doc.restore();
    }
  } catch (error) {
    console.error('Erreur chargement logo:', error);
  }

  // Référence "FICHE AEA.1 /" en haut à droite
  doc.fontSize(9).font('Helvetica').fillColor('#000000');
  doc.text('FICHE AEA.1 /', rightMargin - 80, 50, { width: 80, align: 'right' });

  // Titre principal centré en vert
  doc.moveDown(3);
  doc.fontSize(18).font('Helvetica-Bold').fillColor(EDS_GREEN);
  doc.text('ATTESTATION ENLÈVEMENT APPAREILS', leftMargin, doc.y, {
    width: contentWidth,
    align: 'center'
  });

  doc.moveDown(2);
  doc.fillColor('#000000'); // Retour au noir pour le contenu

  // === CORPS DU TEXTE ===

  // Déterminer le titre de civilité
  const nomComplet = `${data.client?.nom || ''} ${data.client?.prenom || ''}`.trim();
  const civilite = nomComplet ? `Madame, Monsieur ${nomComplet}` : 'Madame, Monsieur';

  // Préparer la référence de l'appareil
  const marque = data.appareil?.marque || '';
  const modele = data.appareil?.modele || '';
  const type = data.appareil?.type || '';
  let reference = '';
  if (marque && modele) {
    reference = `${marque} ${modele}`;
  } else if (type) {
    reference = type;
  } else {
    reference = '[Référence à compléter]';
  }

  // Date d'enlèvement
  const dateEnlevement = formatDate(data.dateEnlevement || new Date());

  // Paragraphe 1
  doc.fontSize(11).font('Helvetica');
  doc.text(civilite, leftMargin, doc.y, { width: contentWidth, align: 'left' });
  doc.moveDown(1);

  doc.text(
    `Nous tenons à vous informer que nous avons enlevé votre appareil qui a pour marque et référence [${reference}] à la date du [${dateEnlevement}] afin d'effectuer un diagnostic approfondi dans notre atelier. Bien que nous préférions effectuer les réparations à domicile, certaines pannes complexes requièrent un environnement spécifique et des outils spécialisés pour assurer des réparations de qualité.`,
    { width: contentWidth, align: 'justify', lineGap: 3 }
  );
  doc.moveDown(1.5);

  // Paragraphe 2
  doc.text(
    `L'aménagement de notre atelier nous permet de bénéficier d'un environnement optimal pour effectuer des réparations appropriées et des tests rigoureux sur votre appareil.`,
    { width: contentWidth, align: 'justify', lineGap: 3 }
  );
  doc.moveDown(1.5);

  // Paragraphe 3
  doc.text(
    `Une fois les réparations effectuées, nous nous assurerons de procéder à des tests complets pour vérifier le bon fonctionnement de votre appareil.`,
    { width: contentWidth, align: 'justify', lineGap: 3 }
  );
  doc.moveDown(1.5);

  // Paragraphe 4
  doc.text(
    `Nous nous engageons à vous fournir un service de qualité et à rétablir le bon fonctionnement de votre appareil le plus rapidement possible. Nous vous remercions de votre compréhension et de votre confiance.`,
    { width: contentWidth, align: 'justify', lineGap: 3 }
  );
  doc.moveDown(1.5);

  // Paragraphe 5
  doc.text(
    `Si vous avez des questions ou des préoccupations concernant le processus de réparation, n'hésitez pas à nous contacter. Notre équipe est là pour vous aider et vous apporter toutes les informations nécessaires.`,
    { width: contentWidth, align: 'justify', lineGap: 3 }
  );
  doc.moveDown(1.5);

  // Paragraphe 6
  doc.text(
    `Nous vous remercions de votre confiance et de votre collaboration.`,
    { width: contentWidth, align: 'justify', lineGap: 3 }
  );
  doc.moveDown(2);

  // === SECTION OPTIONS (CHECKBOXES) ===
  doc.fontSize(11).font('Helvetica-Bold');
  doc.text(
    `En cas de devis refusé ou de non-réparabilité de l'appareil :`,
    { width: contentWidth, align: 'left' }
  );
  doc.moveDown(1);

  doc.fontSize(10).font('Helvetica');

  // Checkbox 1
  const checkbox1Y = doc.y;
  doc.rect(leftMargin, checkbox1Y, 12, 12).stroke();
  doc.text(
    `J'autorise l'entreprise EDS 22 à s'occuper de la dépollution de mon appareil`,
    leftMargin + 20,
    checkbox1Y,
    { width: contentWidth - 20, align: 'left' }
  );
  doc.moveDown(1);

  // Checkbox 2
  const checkbox2Y = doc.y;
  doc.rect(leftMargin, checkbox2Y, 12, 12).stroke();
  doc.text(
    `Je m'engage à récupérer mon appareil sous 7 jours à compter de la date de refus du devis`,
    leftMargin + 20,
    checkbox2Y,
    { width: contentWidth - 20, align: 'left' }
  );
  doc.moveDown(3);

  // === SECTION SIGNATURE ===
  doc.fontSize(11).font('Helvetica-Bold');
  doc.text('Signature du client :', { width: contentWidth, align: 'left' });
  doc.moveDown(4);

  // === PIED DE PAGE ===
  // Positionner le pied de page en bas de la page
  const footerY = doc.page.height - doc.page.margins.bottom - 30;
  doc.fontSize(9).font('Helvetica').fillColor(EDS_GREEN);
  doc.text(
    'EDS22 - Électro Dépannage Service - SIRET : 91917A3200006',
    leftMargin,
    footerY,
    { width: contentWidth, align: 'center' }
  );

  doc.end();
  return doc;
};

// Générer attestation de prêt AP1.1
const genererAttestationPret = (data, stream) => {
  const doc = new PDFDocument({
    margin: 70.87, // 2.5cm en points
    size: 'A4'
  });
  doc.pipe(stream);

  const pageWidth = doc.page.width;
  const leftMargin = doc.page.margins.left;
  const rightMargin = doc.page.width - doc.page.margins.right;
  const contentWidth = rightMargin - leftMargin;

  // === TITRE PRINCIPAL ===
  doc.fontSize(20).font('Times-Bold').fillColor('#000000');
  doc.text('Attestation de prêt d\'appareil électroménager', leftMargin, 80, {
    width: contentWidth,
    align: 'center'
  });

  doc.moveDown(2);

  // === PARAGRAPHE D'INTRODUCTION ===
  const nomComplet = `${data.client?.nom || ''} ${data.client?.prenom || ''}`.trim();
  const civilite = nomComplet || '[Nom du client]';
  const datePret = formatDate(data.datePret || new Date());

  doc.fontSize(12).font('Times-Roman').fillColor('#000000');
  doc.text(`Madame, Monsieur ${civilite}`, leftMargin, doc.y, {
    width: contentWidth,
    align: 'justify',
    lineGap: 3
  });
  doc.moveDown(1);

  doc.text(
    `Nous attestons par la présente que l'appareil électroménager de prêt mis à votre disposition le ${datePret} est fourni pour vous permettre de continuer à utiliser un service équivalent pendant la réparation de votre propre appareil.`,
    { width: contentWidth, align: 'justify', lineGap: 3 }
  );

  doc.moveDown(2);

  // === SECTION 1 - DÉTAILS DE L'APPAREIL PRÊTÉ ===
  doc.fontSize(12).font('Times-Bold').fillColor('#000000');
  doc.text('Détails de l\'appareil prêté :', leftMargin, doc.y, {
    width: contentWidth,
    align: 'left'
  });
  doc.moveDown(0.5);

  doc.fontSize(12).font('Times-Roman');
  const bulletIndent = 30;

  // Type d'appareil
  const typeY = doc.y;
  doc.circle(leftMargin + 10, typeY + 6, 2).fill('#000000');
  doc.text(
    `Type d'appareil : ${data.appareilPret?.type || '[Type]'}`,
    leftMargin + bulletIndent,
    typeY,
    { width: contentWidth - bulletIndent }
  );
  doc.moveDown(0.5);

  // Marque
  const marqueY = doc.y;
  doc.circle(leftMargin + 10, marqueY + 6, 2).fill('#000000');
  doc.text(
    `Marque : ${data.appareilPret?.marque || '[Marque]'}`,
    leftMargin + bulletIndent,
    marqueY,
    { width: contentWidth - bulletIndent }
  );
  doc.moveDown(0.5);

  // Numéro de série
  const snY = doc.y;
  doc.circle(leftMargin + 10, snY + 6, 2).fill('#000000');
  doc.text(
    `Numéro de série : ${data.appareilPret?.numeroSerie || '[SN]'}`,
    leftMargin + bulletIndent,
    snY,
    { width: contentWidth - bulletIndent }
  );
  doc.moveDown(2);

  // === SECTION 2 - CONDITIONS DE PRÊT ===
  doc.fontSize(12).font('Times-Bold').fillColor('#000000');
  doc.text('Conditions de prêt :', leftMargin, doc.y, {
    width: contentWidth,
    align: 'left'
  });
  doc.moveDown(0.5);

  doc.fontSize(12).font('Times-Roman');

  // Condition 1
  const cond1Y = doc.y;
  doc.circle(leftMargin + 10, cond1Y + 6, 2).fill('#000000');
  doc.text(
    'L\'appareil de prêt est mis à votre disposition sans frais supplémentaires pour la période de réparation.',
    leftMargin + bulletIndent,
    cond1Y,
    { width: contentWidth - bulletIndent, align: 'justify', lineGap: 2 }
  );
  doc.moveDown(0.8);

  // Condition 2
  const cond2Y = doc.y;
  doc.circle(leftMargin + 10, cond2Y + 6, 2).fill('#000000');
  doc.text(
    'Nous vous prions de prendre soin de cet appareil et de le restituer dans le même état que celui dans lequel il vous a été confié.',
    leftMargin + bulletIndent,
    cond2Y,
    { width: contentWidth - bulletIndent, align: 'justify', lineGap: 2 }
  );
  doc.moveDown(0.8);

  // Condition 3
  const cond3Y = doc.y;
  doc.circle(leftMargin + 10, cond3Y + 6, 2).fill('#000000');
  doc.text(
    'Toute casse ou utilisation inappropriée de l\'appareil durant la période de prêt pourrait engager votre responsabilité. Les pannes ou dysfonctionnements qui ne relèvent pas de votre responsabilité seront naturellement pris en charge par nos soins.',
    leftMargin + bulletIndent,
    cond3Y,
    { width: contentWidth - bulletIndent, align: 'justify', lineGap: 2 }
  );
  doc.moveDown(2);

  // === PARAGRAPHE DE CONCLUSION ===
  doc.fontSize(12).font('Times-Roman').fillColor('#000000');
  doc.text(
    'Nous vous remercions pour votre confiance et restons à votre disposition pour toute question concernant le fonctionnement de l\'appareil prêté.',
    leftMargin,
    doc.y,
    { width: contentWidth, align: 'justify', lineGap: 3 }
  );

  doc.moveDown(2);

  // === SIGNATURE ===
  doc.fontSize(12).font('Times-Roman').fillColor('#000000');
  doc.text('Cordialement,', leftMargin, doc.y, { align: 'left' });
  doc.moveDown(0.5);
  doc.text('La société EDS 22', leftMargin, doc.y, { align: 'left' });
  doc.text('07 66 22 69 72', leftMargin, doc.y, { align: 'left' });
  doc.text('stephanejegou.eds@outlook.fr', leftMargin, doc.y, { align: 'left' });

  // === PIED DE PAGE ===

  // Encadré coordonnées à gauche
  const footerY = doc.page.height - doc.page.margins.bottom - 130;
  const boxWidth = 200;
  const boxHeight = 100;

  doc.strokeColor('#000000').lineWidth(1);
  doc.rect(leftMargin, footerY, boxWidth, boxHeight).stroke();

  // Texte dans l'encadré (centré)
  doc.fontSize(10).font('Times-Roman').fillColor('#000000');
  const boxTextX = leftMargin;
  const boxTextY = footerY + 10;
  const boxTextWidth = boxWidth;

  doc.text('EDS 22', boxTextX, boxTextY, { width: boxTextWidth, align: 'center' });
  doc.text('Electro Dépannage Service', boxTextX, doc.y, { width: boxTextWidth, align: 'center' });
  doc.text('26, Route de Gurunhuel', boxTextX, doc.y, { width: boxTextWidth, align: 'center' });
  doc.text('22200 – Grâces', boxTextX, doc.y, { width: boxTextWidth, align: 'center' });
  doc.text('Tel : 06 03 47 88 83   Site : eds22.com', boxTextX, doc.y, { width: boxTextWidth, align: 'center', fontSize: 9 });
  doc.text('SIRET : 91137432000016', boxTextX, doc.y, { width: boxTextWidth, align: 'center' });

  // Logo EDS22 à droite
  const logoPath = path.join(__dirname, '..', 'assets', 'Logo-eds-vert.svg');
  try {
    if (fs.existsSync(logoPath)) {
      const svgContent = fs.readFileSync(logoPath, 'utf8');
      const logoSize = 120;
      const logoX = rightMargin - logoSize;
      const logoY = footerY;

      doc.save();
      doc.translate(logoX, logoY);
      SVGtoPDF(doc, svgContent, 0, 0, { width: logoSize, height: logoSize });
      doc.restore();
    }
  } catch (error) {
    console.error('Erreur chargement logo:', error);
  }

  doc.end();
  return doc;
};

module.exports = {
  genererFicheDepot,
  genererAttestationEnlevement,
  genererAttestationPret
};
