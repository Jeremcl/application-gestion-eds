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
    const { genererFicheDepot } = require('../utils/pdfGenerator');

    // Créer les dossiers si nécessaire
    const uploadsDir = path.join(__dirname, '../uploads');
    const interventionsDir = path.join(uploadsDir, 'interventions', intervention._id.toString());
    await fs.mkdir(interventionsDir, { recursive: true });

    // URL de base de l'API pour les fichiers uploadés
    const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:5001';

    // Sauvegarder les photos
    const photoUrls = [];
    for (let i = 0; i < photosDepot.length; i++) {
      const photoData = photosDepot[i].replace(/^data:image\/\w+;base64,/, '');
      const photoPath = path.join(interventionsDir, `depot-${i}.jpg`);
      await fs.writeFile(photoPath, photoData, 'base64');
      photoUrls.push(`${apiBaseUrl}/uploads/interventions/${intervention._id}/depot-${i}.jpg`);
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
    const qrCodeUrl = `${apiBaseUrl}/uploads/interventions/${intervention._id}/qrcode.png`;

    // Générer la fiche DA (PDF) - Utilisation du template DA 1.1
    const ficheDAPath = path.join(interventionsDir, 'fiche-da.pdf');
    const stream = require('fs').createWriteStream(ficheDAPath);

    // Préparer les données pour le template DA 1.1
    const pdfData = {
      numero: intervention.numero,
      client: {
        nom: intervention.clientId?.nom || '',
        prenom: intervention.clientId?.prenom || '',
        telephone: intervention.clientId?.telephone || '',
        email: intervention.clientId?.email || ''
      },
      appareil: {
        type: intervention.appareil?.type || '',
        marque: intervention.appareil?.marque || '',
        modele: intervention.appareil?.modele || '',
        numeroSerie: intervention.appareil?.numeroSerie || ''
      },
      accessoires: accessoiresDepot || []
    };

    // Générer le PDF avec le template DA 1.1
    genererFicheDepot(pdfData, stream);

    // Attendre que le PDF soit créé
    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    const ficheDAUrl = `${apiBaseUrl}/uploads/interventions/${intervention._id}/fiche-da.pdf`;

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
