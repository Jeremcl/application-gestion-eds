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

    // Générer la fiche DA (PDF)
    const PDFDocument = require('pdfkit');
    const ficheDAPath = path.join(interventionsDir, 'fiche-da.pdf');
    const doc = new PDFDocument({ margin: 50 });
    const stream = require('fs').createWriteStream(ficheDAPath);

    doc.pipe(stream);

    // En-tête
    doc.fontSize(20).fillColor('#2D5A3D').text('FICHE DE DÉPÔT ATELIER', { align: 'center' });
    doc.moveDown();

    // Informations intervention
    doc.fontSize(12).fillColor('#000000');
    doc.text(`N° Intervention: ${intervention.numero}`, 50, 120);
    doc.text(`Date de dépôt: ${new Date().toLocaleDateString('fr-FR')}`, 50, 140);
    doc.moveDown();

    // Client
    doc.fontSize(14).fillColor('#2D5A3D').text('CLIENT', 50, 180);
    doc.fontSize(10).fillColor('#000000');
    doc.text(`Nom: ${intervention.clientId?.nom} ${intervention.clientId?.prenom}`, 50, 200);
    doc.text(`Téléphone: ${intervention.clientId?.telephone}`, 50, 215);
    if (intervention.clientId?.email) {
      doc.text(`Email: ${intervention.clientId?.email}`, 50, 230);
    }
    doc.moveDown();

    // Appareil
    doc.fontSize(14).fillColor('#2D5A3D').text('APPAREIL', 50, 260);
    doc.fontSize(10).fillColor('#000000');
    doc.text(`Type: ${intervention.appareil?.type || 'Non spécifié'}`, 50, 280);
    doc.text(`Marque: ${intervention.appareil?.marque || 'Non spécifiée'}`, 50, 295);
    doc.text(`Modèle: ${intervention.appareil?.modele || 'Non spécifié'}`, 50, 310);
    if (intervention.appareil?.numeroSerie) {
      doc.text(`N° Série: ${intervention.appareil.numeroSerie}`, 50, 325);
    }
    doc.moveDown();

    // Problème
    doc.fontSize(14).fillColor('#2D5A3D').text('PROBLÈME SIGNALÉ', 50, 355);
    doc.fontSize(10).fillColor('#000000');
    doc.text(intervention.description || 'Non spécifié', 50, 375, { width: 500 });
    doc.moveDown();

    // Accessoires
    doc.fontSize(14).fillColor('#2D5A3D').text('ACCESSOIRES REMIS', 50, 430);
    doc.fontSize(10).fillColor('#000000');
    if (accessoiresDepot && accessoiresDepot.length > 0) {
      let yPos = 450;
      accessoiresDepot.forEach(accessoire => {
        doc.text(`• ${accessoire}`, 50, yPos);
        yPos += 15;
      });
    } else {
      doc.text('Aucun accessoire remis', 50, 450);
    }

    // QR Code
    doc.fontSize(14).fillColor('#2D5A3D').text('QR CODE', 50, 580);
    doc.fontSize(9).fillColor('#666666').text('Scannez pour accéder à l\'intervention', 50, 600);
    doc.image(qrCodePath, 50, 615, { width: 100 });

    // Signature
    doc.fontSize(10).fillColor('#000000');
    doc.text('Signature client:', 350, 650);
    doc.text('_____________________', 350, 670);

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
