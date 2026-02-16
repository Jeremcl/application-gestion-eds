const express = require('express');
const router = express.Router();
const Intervention = require('../models/Intervention');
const Client = require('../models/Client');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// GET toutes les interventions avec filtres
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 30, statut, technicien, dateDebut, dateFin } = req.query;

    let query = {};
    if (statut) query.statut = statut;
    if (technicien) query.technicien = technicien;
    if (dateDebut || dateFin) {
      query.dateCreation = {};
      if (dateDebut) query.dateCreation.$gte = new Date(dateDebut);
      if (dateFin) query.dateCreation.$lte = new Date(dateFin);
    }

    const interventions = await Intervention.find(query)
      .populate('clientId', 'nom prenom telephone')
      .sort({ dateCreation: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Intervention.countDocuments(query);

    res.json({
      interventions,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET une intervention par ID
router.get('/:id', async (req, res) => {
  try {
    const intervention = await Intervention.findById(req.params.id)
      .populate('clientId')
      .populate('piecesUtilisees.pieceId');
    if (!intervention) {
      return res.status(404).json({ message: 'Intervention non trouvée' });
    }
    res.json(intervention);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// POST créer une nouvelle intervention
router.post('/', async (req, res) => {
  try {
    console.log('📝 Création intervention pour client:', req.body.clientId);

    // Nettoyer les champs vides
    if (req.body.appareilId === '' || req.body.appareilId === null) {
      delete req.body.appareilId;
    }
    if (req.body.appareilPretId === '' || req.body.appareilPretId === null) {
      delete req.body.appareilPretId;
    }

    // Si appareilId est fourni, synchroniser les données de l'appareil
    if (req.body.appareilId && req.body.clientId) {
      console.log('🔍 Récupération appareil ID:', req.body.appareilId);
      const client = await Client.findById(req.body.clientId);
      if (client) {
        const appareil = client.appareils.id(req.body.appareilId);
        if (appareil) {
          console.log('✅ Appareil trouvé:', appareil.type, appareil.marque);
          req.body.appareil = {
            type: appareil.type,
            marque: appareil.marque,
            modele: appareil.modele,
            numeroSerie: appareil.numeroSerie
          };
        } else {
          console.log('⚠️  Appareil non trouvé avec ID:', req.body.appareilId);
        }
      }
    } else if (req.body.appareil) {
      console.log('📝 Appareil saisi manuellement:', req.body.appareil.type, req.body.appareil.marque);
    }

    const intervention = new Intervention(req.body);
    await intervention.save();
    await intervention.populate('clientId', 'nom prenom telephone');
    console.log('✅ Intervention créée:', intervention.numero);
    res.status(201).json(intervention);
  } catch (error) {
    console.error('❌ Erreur création intervention:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// PUT mettre à jour une intervention
router.put('/:id', async (req, res) => {
  try {
    // Si appareilId est fourni, synchroniser les données de l'appareil
    if (req.body.appareilId && req.body.clientId) {
      const client = await Client.findById(req.body.clientId);
      if (client) {
        const appareil = client.appareils.id(req.body.appareilId);
        if (appareil) {
          req.body.appareil = {
            type: appareil.type,
            marque: appareil.marque,
            modele: appareil.modele,
            numeroSerie: appareil.numeroSerie
          };
        }
      }
    }

    const intervention = await Intervention.findByIdAndUpdate(
      req.params.id,
      { ...req.body, dateModification: Date.now() },
      { new: true, runValidators: true }
    ).populate('clientId', 'nom prenom telephone');

    if (!intervention) {
      return res.status(404).json({ message: 'Intervention non trouvée' });
    }
    res.json(intervention);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// DELETE supprimer une intervention
router.delete('/:id', async (req, res) => {
  try {
    const intervention = await Intervention.findByIdAndDelete(req.params.id);
    if (!intervention) {
      return res.status(404).json({ message: 'Intervention non trouvée' });
    }
    res.json({ message: 'Intervention supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET statistiques pour le dashboard
router.get('/stats/dashboard', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const stats = {
      interventionsJour: await Intervention.countDocuments({ dateCreation: { $gte: today } }),
      interventionsSemaine: await Intervention.countDocuments({ dateCreation: { $gte: weekAgo } }),
      interventionsMois: await Intervention.countDocuments({ dateCreation: { $gte: monthStart } }),
      parStatut: await Intervention.aggregate([
        { $group: { _id: '$statut', count: { $sum: 1 } } }
      ]),
      caMensuel: await Intervention.aggregate([
        { $match: { dateCreation: { $gte: monthStart }, statut: 'Facturé' } },
        { $group: { _id: null, total: { $sum: '$coutTotal' } } }
      ])
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// POST Dépôt atelier - photos, accessoires, QR code, fiche DA
router.post('/:id/depot-atelier', async (req, res) => {
  try {
    const { photosDepot, accessoiresDepot } = req.body;
    const intervention = await Intervention.findById(req.params.id).populate('clientId');

    if (!intervention) {
      return res.status(404).json({ message: 'Intervention non trouvée' });
    }

    // Vérifier que c'est bien une intervention Atelier Planifiée
    if (intervention.typeIntervention !== 'Atelier' || intervention.statut !== 'Planifié') {
      return res.status(400).json({ message: 'Cette intervention ne peut pas être déposée en atelier' });
    }

    const QRCode = require('qrcode');
    const fs = require('fs').promises;
    const path = require('path');

    // Créer les dossiers si nécessaire
    const uploadsDir = path.join(__dirname, '../uploads');
    const interventionsDir = path.join(uploadsDir, 'interventions', intervention._id.toString());
    await fs.mkdir(interventionsDir, { recursive: true });

    // Sauvegarder les photos
    const photoUrls = [];
    for (let i = 0; i < photosDepot.length; i++) {
      const photoData = photosDepot[i].replace(/^data:image\/\w+;base64,/, '');
      const photoPath = path.join(interventionsDir, `depot-${i}.jpg`);
      await fs.writeFile(photoPath, photoData, 'base64');
      photoUrls.push(`/uploads/interventions/${intervention._id}/depot-${i}.jpg`);
    }

    // Générer le QR code
    const interventionUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/interventions/${intervention._id}`;
    const qrCodePath = path.join(interventionsDir, 'qrcode.png');
    await QRCode.toFile(qrCodePath, interventionUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#2D5A3D',
        light: '#FFFFFF'
      }
    });
    const qrCodeUrl = `/uploads/interventions/${intervention._id}/qrcode.png`;

    // Générer la fiche DA (PDF) - Format professionnel simplifié
    const PDFDocument = require('pdfkit');
    const ficheDAPath = path.join(interventionsDir, 'fiche-da.pdf');
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });
    const stream = require('fs').createWriteStream(ficheDAPath);

    doc.pipe(stream);

    // En-tête avec logo/nom entreprise
    doc.fontSize(24).fillColor('#2D5A3D').font('Helvetica-Bold')
       .text('EDS22', 50, 50);
    doc.fontSize(10).fillColor('#666666').font('Helvetica')
       .text('Électroménager - Dépannage - Service', 50, 80);

    // Ligne de séparation
    doc.moveTo(50, 100).lineTo(545, 100).stroke('#2D5A3D');

    // Titre
    doc.fontSize(18).fillColor('#000000').font('Helvetica-Bold')
       .text('FICHE DE DÉPÔT ATELIER', 0, 120, { align: 'center' });

    // Informations principales en deux colonnes
    let yPos = 160;

    // Colonne gauche - Informations intervention
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#2D5A3D')
       .text('N° INTERVENTION', 50, yPos);
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#000000')
       .text(intervention.numero || 'N/A', 50, yPos + 15);

    doc.fontSize(10).font('Helvetica-Bold').fillColor('#2D5A3D')
       .text('DATE DE DÉPÔT', 50, yPos + 40);
    doc.fontSize(11).font('Helvetica').fillColor('#000000')
       .text(new Date().toLocaleDateString('fr-FR', {
         day: '2-digit',
         month: 'long',
         year: 'numeric'
       }), 50, yPos + 55);

    // Colonne droite - Client
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#2D5A3D')
       .text('CLIENT', 320, yPos);
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#000000')
       .text(`${intervention.clientId?.nom || ''} ${intervention.clientId?.prenom || ''}`, 320, yPos + 15);
    doc.fontSize(10).font('Helvetica').fillColor('#666666')
       .text(intervention.clientId?.telephone || '', 320, yPos + 32);

    yPos += 100;

    // Cadre appareil
    doc.roundedRect(50, yPos, 495, 120, 5).stroke('#CCCCCC');
    yPos += 15;

    doc.fontSize(11).font('Helvetica-Bold').fillColor('#2D5A3D')
       .text('APPAREIL', 65, yPos);
    yPos += 20;

    const appareilInfo = [
      { label: 'Type:', value: intervention.appareil?.type || 'Non spécifié' },
      { label: 'Marque:', value: intervention.appareil?.marque || 'Non spécifiée' },
      { label: 'Modèle:', value: intervention.appareil?.modele || 'Non spécifié' }
    ];

    if (intervention.appareil?.numeroSerie) {
      appareilInfo.push({ label: 'N° Série:', value: intervention.appareil.numeroSerie });
    }

    appareilInfo.forEach((info, index) => {
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000')
         .text(info.label, 65, yPos + (index * 20), { continued: true, width: 80 });
      doc.font('Helvetica').fillColor('#333333')
         .text(info.value, { width: 380 });
    });

    yPos += appareilInfo.length * 20 + 25;

    // Problème signalé
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#2D5A3D')
       .text('PROBLÈME SIGNALÉ', 50, yPos);
    yPos += 20;
    doc.fontSize(10).font('Helvetica').fillColor('#000000')
       .text(intervention.description || 'Non spécifié', 50, yPos, {
         width: 495,
         align: 'justify'
       });

    yPos += Math.max(60, doc.heightOfString(intervention.description || 'Non spécifié', { width: 495 }) + 20);

    // Accessoires remis
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#2D5A3D')
       .text('ACCESSOIRES REMIS', 50, yPos);
    yPos += 20;

    if (accessoiresDepot && accessoiresDepot.length > 0) {
      accessoiresDepot.forEach((accessoire, index) => {
        if (yPos > 700) {
          doc.addPage();
          yPos = 50;
        }
        doc.fontSize(10).font('Helvetica').fillColor('#000000')
           .text(`□  ${accessoire}`, 65, yPos);
        yPos += 18;
      });
    } else {
      doc.fontSize(10).font('Helvetica').fillColor('#666666')
         .text('Aucun accessoire remis', 65, yPos);
      yPos += 18;
    }

    yPos += 30;

    // QR Code et Signature sur la même ligne
    if (yPos > 650) {
      doc.addPage();
      yPos = 50;
    }

    // QR Code à gauche
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#2D5A3D')
       .text('SUIVI EN LIGNE', 50, yPos);
    doc.fontSize(8).font('Helvetica').fillColor('#666666')
       .text('Scannez le QR code', 50, yPos + 15);
    doc.image(qrCodePath, 50, yPos + 30, { width: 80, height: 80 });

    // Signature à droite
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#2D5A3D')
       .text('SIGNATURE CLIENT', 320, yPos);
    doc.fontSize(8).font('Helvetica').fillColor('#666666')
       .text('Je certifie avoir remis l\'appareil', 320, yPos + 15);
    doc.fontSize(8)
       .text('dans l\'état décrit ci-dessus', 320, yPos + 25);

    // Cadre signature
    doc.roundedRect(320, yPos + 45, 200, 60, 3).stroke('#CCCCCC');

    // Pied de page
    doc.fontSize(8).fillColor('#999999').font('Helvetica')
       .text('Document généré automatiquement le ' + new Date().toLocaleString('fr-FR'),
         0, 760, { align: 'center', width: 595 });

    doc.end();

    // Attendre que le PDF soit créé
    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    const ficheDAUrl = `/uploads/interventions/${intervention._id}/fiche-da.pdf`;

    // Mettre à jour l'intervention
    intervention.photosDepot = photoUrls;
    intervention.accessoiresDepot = accessoiresDepot;
    intervention.dateDepot = new Date();
    intervention.qrCodeUrl = qrCodeUrl;
    intervention.ficheDAUrl = ficheDAUrl;
    intervention.statut = 'En cours'; // Changer le statut
    await intervention.save();

    console.log('✅ Dépôt atelier complété:', intervention.numero);

    res.json({
      message: 'Dépôt atelier enregistré avec succès',
      qrCodeUrl,
      ficheDAUrl,
      intervention
    });
  } catch (error) {
    console.error('❌ Erreur dépôt atelier:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;
