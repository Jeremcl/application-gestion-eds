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

// POST Dépôt atelier - photos, accessoires, signature, QR code, fiche DA
router.post('/:id/depot-atelier', async (req, res) => {
  try {
    const { photosDepot, accessoiresDepot, signature } = req.body;
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

    // Sauvegarder la signature
    let signatureUrl = null;
    if (signature) {
      const signatureData = signature.replace(/^data:image\/\w+;base64,/, '');
      const signaturePath = path.join(interventionsDir, 'signature.png');
      await fs.writeFile(signaturePath, signatureData, 'base64');
      signatureUrl = `${apiBaseUrl}/uploads/interventions/${intervention._id}/signature.png`;
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
      accessoires: accessoiresDepot || [],
      signaturePath: signature ? path.join(interventionsDir, 'signature.png') : null
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
    intervention.signatureUrl = signatureUrl;
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

// GET génération d'un fichier .eml pour l'email de confirmation dépôt atelier
router.get('/:id/email-depot', async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const MailComposer = require('nodemailer/lib/mail-composer');

    const intervention = await Intervention.findById(req.params.id).populate('clientId');
    if (!intervention) {
      return res.status(404).json({ message: 'Intervention non trouvée' });
    }
    if (!intervention.dateDepot) {
      return res.status(400).json({ message: 'Aucun dépôt atelier enregistré pour cette intervention' });
    }

    const interventionsDir = path.join(__dirname, '../uploads/interventions', intervention._id.toString());
    const prenomNom = [intervention.clientId?.prenom, intervention.clientId?.nom].filter(Boolean).join(' ') || 'Client';
    const clientEmail = intervention.clientId?.email || '';
    const numero = intervention.numero;

    // Pièces jointes : fiche DA + photos
    const attachments = [];

    const ficheDAPath = path.join(interventionsDir, 'fiche-da.pdf');
    if (fs.existsSync(ficheDAPath)) {
      attachments.push({ filename: `Fiche-Depot-${numero}.pdf`, path: ficheDAPath });
    }

    const photoCount = intervention.photosDepot?.length || 0;
    for (let i = 0; i < photoCount; i++) {
      const photoPath = path.join(interventionsDir, `depot-${i}.jpg`);
      if (fs.existsSync(photoPath)) {
        attachments.push({ filename: `Photo-depot-${i + 1}.jpg`, path: photoPath });
      }
    }

    const textBody = [
      `Bonjour ${prenomNom},`,
      ``,
      `Suite au dépôt de votre appareil dans notre atelier, nous vous confirmons la bonne réception de celui-ci et vous adressons ce mail récapitulatif.`,
      ``,
      `Numéro de suivi : ${numero}`,
      ``,
      `Vous trouverez en pièce jointe :`,
      `- La fiche de dépôt (DA ${numero}) à conserver`,
      `- Les photos prises lors du dépôt`,
      ``,
      `Notre équipe prendra contact avec vous dès que le diagnostic sera effectué pour vous informer de l'état de votre appareil et du devis éventuel.`,
      ``,
      `En cas de question, n'hésitez pas à nous contacter.`,
      ``,
      `Cordialement,`,
      `L'équipe EDS22`,
      `stephanejegou.eds@outlook.fr`
    ].join('\n');

    const htmlBody = `<div style="font-family: Arial, sans-serif; max-width: 600px; color: #333;">
  <div style="background-color: #2D5A3D; padding: 24px; text-align: center;">
    <h1 style="color: #fff; margin: 0; font-size: 20px;">EDS22 - Électroménager Dépannage Services</h1>
  </div>
  <div style="padding: 32px 24px;">
    <p>Bonjour <strong>${prenomNom}</strong>,</p>
    <p>Suite au dépôt de votre appareil dans notre atelier, nous vous confirmons la bonne réception de celui-ci et vous adressons ce mail récapitulatif.</p>
    <div style="background:#f4f7f4; border-left:4px solid #2D5A3D; padding:16px; margin:24px 0; border-radius:4px;">
      <strong>Numéro de suivi :</strong> ${numero}
    </div>
    <p>Vous trouverez en pièce jointe :</p>
    <ul>
      <li>La <strong>fiche de dépôt (DA ${numero})</strong> à conserver</li>
      <li>Les <strong>photos</strong> prises lors du dépôt</li>
    </ul>
    <p>Notre équipe prendra contact avec vous dès que le diagnostic sera effectué pour vous informer de l'état de votre appareil et du devis éventuel.</p>
    <p>En cas de question, n'hésitez pas à nous contacter.</p>
    <p style="margin-top:32px;">Cordialement,<br><strong>L'équipe EDS22</strong><br>
    <a href="mailto:stephanejegou.eds@outlook.fr" style="color:#2D5A3D;">stephanejegou.eds@outlook.fr</a></p>
  </div>
  <div style="background:#f0f0f0; padding:16px; text-align:center; font-size:12px; color:#888;">
    EDS22 - Électroménager Dépannage Services
  </div>
</div>`;

    const mail = new MailComposer({
      from: '"EDS22" <stephanejegou.eds@outlook.fr>',
      to: clientEmail,
      subject: `Confirmation de dépôt atelier - Intervention ${numero}`,
      text: textBody,
      html: htmlBody,
      attachments
    });

    mail.compile().build((err, message) => {
      if (err) {
        console.error('❌ Erreur génération EML:', err);
        return res.status(500).json({ message: 'Erreur génération email', error: err.message });
      }
      res.setHeader('Content-Type', 'message/rfc822');
      res.setHeader('Content-Disposition', `attachment; filename="Confirmation-depot-${numero}.eml"`);
      res.send(message);
    });

  } catch (error) {
    console.error('❌ Erreur email-depot:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;
