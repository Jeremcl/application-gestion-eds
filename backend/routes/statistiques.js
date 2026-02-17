const express = require('express');
const router = express.Router();
const Intervention = require('../models/Intervention');
const Facture = require('../models/Facture');
const Piece = require('../models/Piece');
const Client = require('../models/Client');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/statistiques/dashboard?periode=mois|trimestre|annee
router.get('/dashboard', async (req, res) => {
  try {
    const { periode = 'mois' } = req.query;
    const now = new Date();

    // Calculer la plage de dates selon la période
    let dateDebut;
    if (periode === 'trimestre') {
      dateDebut = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    } else if (periode === 'annee') {
      dateDebut = new Date(now.getFullYear(), 0, 1);
    } else {
      dateDebut = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // 12 derniers mois pour les graphiques
    const date12MoisAvant = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    // ===== KPIs =====
    const interventionsPeriode = await Intervention.find({
      dateCreation: { $gte: dateDebut }
    });

    const facturees = interventionsPeriode.filter(i => i.statut === 'Facturé');
    const caPeriode = facturees.reduce((sum, i) => sum + (i.coutTotal || 0), 0);
    const panierMoyen = facturees.length > 0 ? caPeriode / facturees.length : 0;

    const enCours = await Intervention.countDocuments({
      statut: { $in: ['Demande', 'Planifié', 'En cours', 'Diagnostic', 'Réparation'] }
    });

    // Délai moyen (jours entre création et réalisation)
    const terminees = await Intervention.find({
      dateRealisation: { $exists: true, $ne: null },
      dateCreation: { $gte: dateDebut }
    });
    let delaiMoyen = 0;
    if (terminees.length > 0) {
      const totalJours = terminees.reduce((sum, i) => {
        const diff = (new Date(i.dateRealisation) - new Date(i.dateCreation)) / (1000 * 60 * 60 * 24);
        return sum + diff;
      }, 0);
      delaiMoyen = Math.round(totalJours / terminees.length * 10) / 10;
    }

    // ===== CA par mois (12 derniers mois) =====
    const caParMois = await Intervention.aggregate([
      {
        $match: {
          statut: 'Facturé',
          dateCreation: { $gte: date12MoisAvant }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$dateCreation' },
            month: { $month: '$dateCreation' }
          },
          total: { $sum: '$coutTotal' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Remplir les mois manquants
    const revenusParMois = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const found = caParMois.find(
        m => m._id.year === d.getFullYear() && m._id.month === d.getMonth() + 1
      );
      revenusParMois.push({
        mois: d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
        ca: found ? Math.round(found.total) : 0,
        count: found ? found.count : 0
      });
    }

    // ===== Pipeline par statut =====
    const pipeline = await Intervention.aggregate([
      {
        $group: {
          _id: '$statut',
          count: { $sum: 1 }
        }
      }
    ]);

    // ===== Ventilation revenus (MO / Pièces / Forfait) =====
    const ventilationRevenus = await Intervention.aggregate([
      {
        $match: {
          statut: 'Facturé',
          dateCreation: { $gte: dateDebut }
        }
      },
      {
        $group: {
          _id: null,
          totalMO: { $sum: '$coutMainOeuvre' },
          totalPieces: { $sum: '$coutPieces' },
          totalForfait: { $sum: '$forfaitApplique' }
        }
      }
    ]);

    const revenus = ventilationRevenus[0] || { totalMO: 0, totalPieces: 0, totalForfait: 0 };

    // ===== Répartition Atelier / Domicile =====
    const repartitionType = await Intervention.aggregate([
      {
        $match: { dateCreation: { $gte: dateDebut } }
      },
      {
        $group: {
          _id: '$typeIntervention',
          count: { $sum: 1 }
        }
      }
    ]);

    // ===== Top 5 appareils =====
    const topAppareils = await Intervention.aggregate([
      {
        $group: {
          _id: '$appareil.type',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // ===== Activité créées vs terminées par mois =====
    const activiteCreees = await Intervention.aggregate([
      {
        $match: { dateCreation: { $gte: date12MoisAvant } }
      },
      {
        $group: {
          _id: {
            year: { $year: '$dateCreation' },
            month: { $month: '$dateCreation' }
          },
          count: { $sum: 1 }
        }
      }
    ]);

    const activiteTerminees = await Intervention.aggregate([
      {
        $match: {
          dateRealisation: { $gte: date12MoisAvant, $ne: null }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$dateRealisation' },
            month: { $month: '$dateRealisation' }
          },
          count: { $sum: 1 }
        }
      }
    ]);

    const activiteParMois = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const creees = activiteCreees.find(
        m => m._id.year === d.getFullYear() && m._id.month === d.getMonth() + 1
      );
      const termineesM = activiteTerminees.find(
        m => m._id.year === d.getFullYear() && m._id.month === d.getMonth() + 1
      );
      activiteParMois.push({
        mois: d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
        creees: creees ? creees.count : 0,
        terminees: termineesM ? termineesM.count : 0
      });
    }

    // ===== Factures impayées =====
    const facturesImpayees = await Facture.find({
      type: 'Facture',
      statut: { $in: ['Émis', 'Brouillon'] }
    }).populate('clientId', 'nom prenom');

    const aging = { '0-30': 0, '30-60': 0, '60+': 0 };
    const agingMontant = { '0-30': 0, '30-60': 0, '60+': 0 };

    facturesImpayees.forEach(f => {
      const joursRetard = Math.floor((now - new Date(f.dateEmission)) / (1000 * 60 * 60 * 24));
      if (joursRetard <= 30) {
        aging['0-30']++;
        agingMontant['0-30'] += f.totalTTC || 0;
      } else if (joursRetard <= 60) {
        aging['30-60']++;
        agingMontant['30-60'] += f.totalTTC || 0;
      } else {
        aging['60+']++;
        agingMontant['60+'] += f.totalTTC || 0;
      }
    });

    // ===== Top 5 clients par CA =====
    const topClients = await Intervention.aggregate([
      {
        $match: { statut: 'Facturé' }
      },
      {
        $group: {
          _id: '$clientId',
          totalCA: { $sum: '$coutTotal' },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalCA: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'clients',
          localField: '_id',
          foreignField: '_id',
          as: 'client'
        }
      },
      { $unwind: '$client' },
      {
        $project: {
          nom: { $concat: ['$client.nom', ' ', { $ifNull: ['$client.prenom', ''] }] },
          totalCA: 1,
          count: 1
        }
      }
    ]);

    // ===== Top 5 pièces les plus utilisées =====
    const topPieces = await Intervention.aggregate([
      { $unwind: '$piecesUtilisees' },
      {
        $group: {
          _id: '$piecesUtilisees.nom',
          totalQuantite: { $sum: '$piecesUtilisees.quantite' },
          reference: { $first: '$piecesUtilisees.reference' }
        }
      },
      { $sort: { totalQuantite: -1 } },
      { $limit: 5 }
    ]);

    // ===== Stock critique =====
    const stockCritique = await Piece.find({
      $expr: { $lt: ['$quantiteStock', '$quantiteMinimum'] }
    }).limit(5).select('reference designation quantiteStock quantiteMinimum');

    // ===== Taux de retour garantie =====
    const totalTerminees = await Intervention.countDocuments({
      statut: { $in: ['Terminé', 'Facturé'] }
    });
    // Interventions sur un appareil déjà réparé dans les 3 derniers mois
    const retours = await Intervention.aggregate([
      {
        $match: {
          statut: { $in: ['Demande', 'Planifié', 'En cours', 'Diagnostic', 'Réparation'] }
        }
      },
      {
        $lookup: {
          from: 'interventions',
          let: { appareilId: '$appareilId', clientId: '$clientId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$appareilId', '$$appareilId'] },
                    { $eq: ['$clientId', '$$clientId'] },
                    { $in: ['$statut', ['Terminé', 'Facturé']] },
                    { $ne: ['$garantieJusquau', null] },
                    { $gte: ['$garantieJusquau', new Date()] }
                  ]
                }
              }
            }
          ],
          as: 'precedentes'
        }
      },
      {
        $match: { 'precedentes.0': { $exists: true } }
      },
      {
        $count: 'total'
      }
    ]);

    const tauxRetour = totalTerminees > 0
      ? Math.round(((retours[0]?.total || 0) / totalTerminees) * 100 * 10) / 10
      : 0;

    res.json({
      kpis: {
        caPeriode: Math.round(caPeriode),
        enCours,
        panierMoyen: Math.round(panierMoyen),
        delaiMoyen
      },
      revenusParMois,
      pipeline: pipeline.map(p => ({ statut: p._id, count: p.count })),
      ventilationRevenus: [
        { name: "Main d'oeuvre", value: Math.round(revenus.totalMO) },
        { name: 'Pièces', value: Math.round(revenus.totalPieces) },
        { name: 'Forfait', value: Math.round(revenus.totalForfait) }
      ],
      repartitionType: repartitionType.map(r => ({ name: r._id || 'Atelier', value: r.count })),
      topAppareils: topAppareils.map(a => ({ name: a._id || 'Autre', value: a.count })),
      activiteParMois,
      facturesImpayees: {
        aging: [
          { tranche: '0-30 jours', count: aging['0-30'], montant: Math.round(agingMontant['0-30']) },
          { tranche: '30-60 jours', count: aging['30-60'], montant: Math.round(agingMontant['30-60']) },
          { tranche: '60+ jours', count: aging['60+'], montant: Math.round(agingMontant['60+']) }
        ],
        total: facturesImpayees.length,
        montantTotal: Math.round(facturesImpayees.reduce((s, f) => s + (f.totalTTC || 0), 0))
      },
      topClients,
      qualite: {
        tauxRetour,
        topPieces: topPieces.map(p => ({
          nom: p._id || p.reference || 'Inconnue',
          reference: p.reference,
          quantite: p.totalQuantite
        })),
        stockCritique: stockCritique.map(s => ({
          reference: s.reference,
          designation: s.designation,
          stock: s.quantiteStock,
          minimum: s.quantiteMinimum
        }))
      }
    });
  } catch (error) {
    console.error('Erreur statistiques dashboard:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;
